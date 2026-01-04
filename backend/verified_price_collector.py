#!/usr/bin/env python3
"""
Verified Price Collector for Aruodas.lt

Collects high-quality, verified rental prices by tracking listing lifecycles.
Designed for ML model calibration and confidence interval estimation.

Usage:
    python verified_price_collector.py              # Run daily collection
    python verified_price_collector.py --bootstrap  # Initial full scrape
    python verified_price_collector.py --test       # Test mode (5 pages only)
"""

import os
import re
import json
import hashlib
import logging
import argparse
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from base64 import b64decode
import uuid

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

ZYTE_API_KEY = os.getenv("ZYTE_API_KEY")
ZYTE_API_ENDPOINT = "https://api.zyte.com/v1/extract"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY"))

# Aruodas URLs
BASE_LIST_URL = "https://www.aruodas.lt/butu-nuoma/vilniuje/puslapis/{page}/"
BASE_DETAIL_URL = "https://www.aruodas.lt"

# Scraping config
MAX_PAGES = 100  # Safety limit
LISTINGS_PER_PAGE = 25
MISSING_DAYS_THRESHOLD = 3  # Days before marking as ENDED
MAX_LISTING_AGE_DAYS = 40  # Skip listings older than this (stale/overpriced)

# HTML-based broker detection patterns (strong signals only)
BROKER_HTML_PATTERNS = [
    r"vip\s*partneris",           # VIP partner badge (strong broker signal)
    r"nekilnojamojo\s*turto\s*brokeris",  # "Real estate broker" text
    r"top\s*brokeris",            # TOP broker badge
    r"nt\s*brokeris",             # NT broker
    r"agentūra",                  # Agency
    r"šio\s*brokerio\s*skelbimai", # "This broker's listings"
]

# Text patterns that indicate owner (not broker)
OWNER_HTML_PATTERNS = [
    r"savininkas",                # Owner
    r"be\s*tarpininkų",           # Without intermediaries
    r"be\s*agentų",               # Without agents
    r"nuomoju\s*pats",            # Renting myself
]

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class ListingBasic:
    """Basic listing info from list view (cheap to scrape)."""
    listing_id: int
    url: str
    price: Optional[int]
    rooms: Optional[int]
    area_m2: Optional[float]
    floor_info: Optional[str]
    district: Optional[str]
    street: Optional[str]


@dataclass
class ListingFull:
    """Full listing details from detail page."""
    listing_id: int
    url: str
    price: Optional[int]
    price_per_m2: Optional[float]
    area_m2: Optional[float]
    rooms: Optional[int]
    floor_current: Optional[int]
    floor_total: Optional[int]
    year_built: Optional[int]
    district: Optional[str]
    street: Optional[str]

    # Engagement
    views_total: Optional[int]
    views_today: Optional[int]
    saves_count: Optional[int]

    # Dates
    date_posted: Optional[datetime]
    date_edited: Optional[datetime]
    expires_at: Optional[datetime]

    # Broker detection
    is_broker_listing: bool
    broker_score: int
    phone_normalized: Optional[str]

    # Features for ML
    raw_features: Dict[str, Any]

    # Fingerprint
    fingerprint_hash: str


# ============================================================================
# SUPABASE CLIENT
# ============================================================================

def get_supabase() -> Client:
    """Get Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================================
# ZYTE API HELPERS
# ============================================================================

def zyte_fetch(url: str, timeout: int = 30, max_retries: int = 3) -> str:
    """Fetch URL via Zyte API, bypassing Cloudflare. Includes retry logic."""
    if not ZYTE_API_KEY:
        raise RuntimeError("ZYTE_API_KEY not set")

    import time
    last_error = None

    for attempt in range(max_retries):
        try:
            response = requests.post(
                ZYTE_API_ENDPOINT,
                auth=(ZYTE_API_KEY, ""),
                json={
                    "url": url,
                    "httpResponseBody": True,
                    "followRedirect": True,
                },
                timeout=timeout
            )
            response.raise_for_status()

            data = response.json()
            body_b64 = data.get("httpResponseBody", "")

            if not body_b64:
                raise ValueError(f"No HTML content returned for {url}")

            return b64decode(body_b64).decode("utf-8", errors="ignore")

        except requests.exceptions.HTTPError as e:
            last_error = e
            status_code = e.response.status_code if e.response else 0
            # Retry on 421 (rate limit), 429 (too many requests), 5xx (server errors)
            if status_code in [421, 429] or status_code >= 500:
                wait_time = (attempt + 1) * 5  # 5s, 10s, 15s
                logger.warning(f"  ⚠️ Zyte API error {status_code}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
            raise  # Don't retry on 4xx errors (except 421, 429)
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 5
                logger.warning(f"  ⚠️ Zyte API error: {e}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
            raise

    raise last_error or RuntimeError(f"Failed to fetch {url} after {max_retries} attempts")


# ============================================================================
# PARSING HELPERS
# ============================================================================

def parse_number(text: Optional[str]) -> Optional[float]:
    """Extract number from text like '129 m²' or '850 €'."""
    if not text:
        return None
    s = str(text).replace("\u00A0", " ").replace(",", ".").replace(" ", "")
    match = re.search(r"[-+]?\d+(?:\.\d+)?", s)
    return float(match.group(0)) if match else None


def parse_int(text: Optional[str]) -> Optional[int]:
    """Extract integer from text."""
    num = parse_number(text)
    return int(num) if num is not None else None


def extract_listing_id(url: str) -> Optional[int]:
    """Extract listing ID from URL like '...-4-1403809/'."""
    match = re.search(r"-(\d+)/?$", url)
    return int(match.group(1)) if match else None


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalize phone number for comparison."""
    if not phone:
        return None
    # Remove all non-digits
    digits = re.sub(r"\D", "", phone)
    # Remove country code if present
    if digits.startswith("370"):
        digits = digits[3:]
    elif digits.startswith("8") and len(digits) == 9:
        digits = digits[1:]
    return digits if len(digits) >= 8 else None


def calculate_fingerprint(
    floor: Optional[int],
    area: Optional[float],
    rooms: Optional[int],
    phone: Optional[str],
    district: Optional[str]
) -> str:
    """Calculate fingerprint hash for repost detection."""
    # Round area to nearest integer
    area_rounded = int(area) if area else 0
    phone_norm = normalize_phone(phone) or "unknown"
    district_norm = (district or "unknown").lower().strip()

    fingerprint_str = f"{floor or 0}|{area_rounded}|{rooms or 0}|{phone_norm}|{district_norm}"
    return hashlib.md5(fingerprint_str.encode()).hexdigest()


def detect_broker_from_html(soup: BeautifulSoup) -> Tuple[bool, int]:
    """
    Detect if listing is from broker based on HTML content.
    Returns (is_broker, score) where score is negative for broker, positive for owner.

    Looks for:
    - VIP partneris badge
    - "Nekilnojamojo turto brokeris" text
    - TOP brokeris badges
    - Company websites
    - Identity verification badges
    """
    # Get full page text for pattern matching
    page_text = soup.get_text(" ", strip=True).lower()

    score = 0
    broker_signals = []
    owner_signals = []

    # Check for broker patterns in page text
    for pattern in BROKER_HTML_PATTERNS:
        if re.search(pattern, page_text, re.IGNORECASE):
            score -= 30
            broker_signals.append(pattern)

    # Check for owner patterns
    for pattern in OWNER_HTML_PATTERNS:
        if re.search(pattern, page_text, re.IGNORECASE):
            score += 25
            owner_signals.append(pattern)

    # Check for VIP partner section (very strong broker signal)
    vip_section = soup.select_one(".vip-partner, [class*='vip-partner'], [class*='vip_partner']")
    if vip_section:
        score -= 50
        broker_signals.append("vip_section_element")

    # Check for broker company links (rebaltic.lt, ntbroker.lt, etc.)
    external_links = soup.find_all("a", href=re.compile(r"https?://(?!www\.aruodas)"))
    for link in external_links:
        href = link.get("href", "").lower()
        if any(kw in href for kw in ["rebaltic", "ntbroker", "realtor", "agentura", "broker"]):
            score -= 40
            broker_signals.append(f"company_link:{href[:50]}")

    # Check for multiple UNIQUE phone numbers (brokers often have office + mobile)
    # Lithuanian mobile: +370 6XX XXXXX or 86XXXXXXX
    # Lithuanian landline: +370 5XX XXXXX or 85XXXXXXX
    phone_pattern = re.compile(r"\+370\s*[56]\d{2}\s*\d{5}|(?<!\d)8[56]\d{7}(?!\d)")
    phone_elements = soup.find_all(string=phone_pattern)
    unique_phones = set()
    for elem in phone_elements:
        matches = phone_pattern.findall(str(elem))
        for match in matches:
            normalized = re.sub(r"\D", "", match)[-8:]  # Last 8 digits
            if len(normalized) == 8:
                unique_phones.add(normalized)
    if len(unique_phones) >= 3:  # 3+ different phone numbers = likely broker/agency
        score -= 25
        broker_signals.append(f"multiple_phones:{len(unique_phones)}")

    is_broker = score < 0

    return is_broker, score


def parse_lithuanian_date(text: str) -> Optional[datetime]:
    """Parse Lithuanian date formats like 'Prieš 5 d.' or '2024-11-20'."""
    if not text:
        return None

    text = text.strip()

    # Try ISO format first
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except:
        pass

    # "Prieš X d." = X days ago
    match = re.search(r"Prieš\s+(\d+)\s*d", text, re.IGNORECASE)
    if match:
        days_ago = int(match.group(1))
        return datetime.now() - timedelta(days=days_ago)

    # "Prieš X val." = X hours ago
    match = re.search(r"Prieš\s+(\d+)\s*val", text, re.IGNORECASE)
    if match:
        hours_ago = int(match.group(1))
        return datetime.now() - timedelta(hours=hours_ago)

    # "Prieš X mėn." = X months ago
    match = re.search(r"Prieš\s+(\d+)\s*mėn", text, re.IGNORECASE)
    if match:
        months_ago = int(match.group(1))
        return datetime.now() - timedelta(days=months_ago * 30)

    return None


def parse_views(text: str) -> Tuple[Optional[int], Optional[int]]:
    """Parse views text like '983/1 (iš viso/šiandien)' -> (983, 1)."""
    if not text:
        return None, None

    # Pattern: "123/45" or "1 234/5"
    match = re.search(r"([\d\s]+)/([\d\s]+)", text)
    if match:
        total = parse_int(match.group(1).replace(" ", ""))
        today = parse_int(match.group(2).replace(" ", ""))
        return total, today

    # Just a number
    total = parse_int(text)
    return total, None


# ============================================================================
# LIST VIEW SCRAPER
# ============================================================================

def scrape_list_page(page: int) -> List[ListingBasic]:
    """Scrape a single list page and extract basic listing info."""
    url = BASE_LIST_URL.format(page=page)
    logger.info(f"Scraping list page {page}: {url}")

    try:
        html = zyte_fetch(url)
        soup = BeautifulSoup(html, "html.parser")

        listings = []
        seen_ids = set()

        # Find all listing links - pattern: butu-nuoma-vilniuje-...-4-{listing_id}/
        # Links appear in search results with ?search_pos= parameter
        links = soup.find_all("a", href=re.compile(r"butu-nuoma-vilniuje.*-4-\d+"))

        for link in links:
            href = link.get("href", "")

            # Extract listing ID (last number after -4-)
            match = re.search(r"-4-(\d+)", href)
            if not match:
                continue

            listing_id = int(match.group(1))

            # Skip duplicates
            if listing_id in seen_ids:
                continue
            seen_ids.add(listing_id)

            # Clean URL (remove search_pos parameter)
            clean_url = re.sub(r"\?.*$", "", href)
            if not clean_url.startswith("http"):
                clean_url = BASE_DETAIL_URL + clean_url
            if not clean_url.endswith("/"):
                clean_url += "/"

            # Try to extract price from list view for price change detection
            price = None

            # Find the parent row container first (list-row-v2 class)
            # This is important because the price is in a sibling section, not an ancestor
            row_container = None
            for ancestor in link.parents:
                if ancestor.name == 'div' and ancestor.get('class'):
                    classes = ancestor.get('class', [])
                    if 'list-row-v2' in classes or 'object-row' in classes:
                        row_container = ancestor
                        break
                if ancestor.name in ['body', 'main', 'section']:
                    break

            # Look for price within the row container
            if row_container:
                # Method 1: Look for the specific price class (list-item-price-v2)
                price_elem = row_container.find(class_='list-item-price-v2')
                if price_elem:
                    price_text = price_elem.get_text(" ", strip=True)
                    price_match = re.search(r'(\d[\d\s\xa0]*)(?:\s*)€', price_text)
                    if price_match:
                        price_str = re.sub(r'[\s\xa0]', '', price_match.group(1))
                        price = parse_int(price_str)
                        if not (price and 100 <= price <= 10000):
                            price = None

                # Method 2: Fallback to generic price class
                if not price:
                    price_elem = row_container.find(class_=re.compile(r'list-item-price|item-price', re.I))
                    if price_elem:
                        price_text = price_elem.get_text(" ", strip=True)
                        price_match = re.search(r'(\d[\d\s\xa0]*)(?:\s*)€', price_text)
                        if price_match:
                            price_str = re.sub(r'[\s\xa0]', '', price_match.group(1))
                            price = parse_int(price_str)
                            if not (price and 100 <= price <= 10000):
                                price = None

            listings.append(ListingBasic(
                listing_id=listing_id,
                url=clean_url,
                price=price,
                rooms=None,
                area_m2=None,
                floor_info=None,
                district=None,
                street=None
            ))

        logger.info(f"  Found {len(listings)} unique listings")
        return listings

    except Exception as e:
        logger.error(f"Error scraping list page {page}: {e}")
        return []


def scrape_all_list_pages(max_pages: int = MAX_PAGES) -> List[ListingBasic]:
    """Scrape all list pages until empty or max reached."""
    all_listings = []

    for page in range(1, max_pages + 1):
        listings = scrape_list_page(page)

        if not listings:
            logger.info(f"No more listings found after page {page - 1}")
            break

        all_listings.extend(listings)

        # Small delay to be nice
        import time
        time.sleep(0.5)

    # Log price extraction stats
    with_price = sum(1 for l in all_listings if l.price is not None)
    without_price = [l for l in all_listings if l.price is None]
    logger.info(f"Total listings found: {len(all_listings)} ({with_price} with prices from list view)")

    # Log first few listings without prices for debugging
    if without_price and len(without_price) <= 10:
        logger.warning(f"  Listings without prices: {[l.listing_id for l in without_price]}")

    return all_listings


# ============================================================================
# DETAIL PAGE SCRAPER
# ============================================================================

def parse_dl_block(dl) -> Dict[str, List[str]]:
    """Extract <dt>/<dd> pairs from a <dl> block."""
    out = {}
    if not dl:
        return out

    for dt in dl.find_all("dt"):
        key = dt.get_text(strip=True).rstrip(":")
        dd = dt.find_next_sibling("dd")
        if not dd:
            continue

        spans = [s.get_text(strip=True) for s in dd.find_all("span") if s.get_text(strip=True)]
        if spans:
            out[key] = spans
        else:
            text = dd.get_text(strip=True)
            out[key] = [text] if text else []

    return out


def scrape_detail_page(url: str) -> Optional[ListingFull]:
    """Scrape full listing details from detail page."""
    listing_id = extract_listing_id(url)
    if not listing_id:
        logger.warning(f"Could not extract listing ID from {url}")
        return None

    logger.info(f"Scraping detail page: {url}")

    try:
        html = zyte_fetch(url)
        soup = BeautifulSoup(html, "html.parser")

        # Parse main details block
        details = parse_dl_block(soup.find("dl", class_="obj-details"))

        # Parse stats block
        stats_div = soup.find("div", class_="obj-stats")
        if stats_div:
            stats = parse_dl_block(stats_div.find("dl"))
            details.update(stats)

        # Extract location from title
        h1 = soup.select_one("h1.obj-header-text")
        district, street = None, None
        if h1:
            txt = h1.get_text(" ", strip=True)
            parts = [p.strip(" ,") for p in txt.split(",") if p.strip(" ,")]
            if len(parts) >= 2:
                district = parts[1]
            if len(parts) >= 3:
                street = parts[2]

        # Helper to get first value
        def first(key: str) -> Optional[str]:
            vals = details.get(key, [])
            return vals[0] if vals else None

        # Parse fields
        price = parse_int(first("Kaina mėn.") or first("Kaina"))
        area_m2 = parse_number(first("Plotas"))
        rooms = parse_int(first("Kambarių sk."))
        floor_current = parse_int(first("Aukštas"))
        floor_total = parse_int(first("Aukštų sk."))

        year_str = first("Metai")
        year_built = None
        if year_str:
            match = re.search(r"(\d{4})", year_str)
            year_built = int(match.group(1)) if match else None

        # Calculate price per m2
        price_per_m2 = None
        if price and area_m2 and area_m2 > 0:
            price_per_m2 = round(price / area_m2, 2)

        # Parse dates
        date_posted = parse_lithuanian_date(first("Įdėtas"))
        date_edited = parse_lithuanian_date(first("Redaguotas"))
        expires_at = parse_lithuanian_date(first("Aktyvus iki"))

        # Parse views
        views_text = first("Peržiūrėjo")
        views_total, views_today = parse_views(views_text)

        # Parse saves
        saves_text = first("Įsiminė")
        saves_count = parse_int(saves_text) if saves_text else None

        # Extract phone
        phone_elem = soup.select_one(".phone-show, .phone-nr, [class*='phone']")
        phone = phone_elem.get_text(strip=True) if phone_elem else None
        phone_normalized = normalize_phone(phone)

        # Broker detection from HTML content
        is_broker, broker_score = detect_broker_from_html(soup)

        # Build raw features for ML
        raw_features = {
            "area_m2": area_m2,
            "rooms": rooms,
            "floor_current": floor_current,
            "floor_total": floor_total,
            "year_built": year_built,
            "district": district,
            "street": street,
            "heating": details.get("Šildymas", []),
            "features": details.get("Ypatybės", []),
            "additional_rooms": details.get("Papildomos patalpos", []),
            "building_type": first("Pastato tipas"),
            "condition": first("Įrengimas"),
        }

        # Calculate fingerprint
        fingerprint = calculate_fingerprint(
            floor_current, area_m2, rooms, phone_normalized, district
        )

        return ListingFull(
            listing_id=listing_id,
            url=url,
            price=price,
            price_per_m2=price_per_m2,
            area_m2=area_m2,
            rooms=rooms,
            floor_current=floor_current,
            floor_total=floor_total,
            year_built=year_built,
            district=district,
            street=street,
            views_total=views_total,
            views_today=views_today,
            saves_count=saves_count,
            date_posted=date_posted,
            date_edited=date_edited,
            expires_at=expires_at,
            is_broker_listing=is_broker,
            broker_score=broker_score,
            phone_normalized=phone_normalized,
            raw_features=raw_features,
            fingerprint_hash=fingerprint,
        )

    except Exception as e:
        logger.error(f"Error scraping detail page {url}: {e}")
        return None


# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def paginated_query(supabase: Client, table: str, select: str, filters: dict = None, page_size: int = 1000) -> list:
    """Fetch all rows with pagination to bypass Supabase 1000-row limit."""
    all_data = []
    offset = 0

    while True:
        query = supabase.table(table).select(select)

        # Apply filters
        if filters:
            for key, value in filters.items():
                if key == "eq":
                    for col, val in value.items():
                        query = query.eq(col, val)
                elif key == "not_null":
                    for col in value:
                        query = query.not_.is_(col, "null")

        query = query.range(offset, offset + page_size - 1)
        result = query.execute()

        if not result.data:
            break

        all_data.extend(result.data)

        # If we got fewer rows than page_size, we've reached the end
        if len(result.data) < page_size:
            break

        offset += page_size

    return all_data


def get_active_listing_ids(supabase: Client) -> set:
    """Get all currently active listing IDs from database."""
    data = paginated_query(
        supabase,
        "listing_lifecycle",
        "listing_id",
        filters={"eq": {"status": "ACTIVE"}}
    )
    return {row["listing_id"] for row in data}


def get_all_listing_ids(supabase: Client) -> set:
    """Get ALL listing IDs from database (any status)."""
    data = paginated_query(supabase, "listing_lifecycle", "listing_id")
    return {row["listing_id"] for row in data}


def get_listing_prices(supabase: Client) -> Dict[int, int]:
    """Get last known prices for active listings."""
    data = paginated_query(
        supabase,
        "listing_lifecycle",
        "listing_id, last_price",
        filters={"eq": {"status": "ACTIVE"}}
    )
    return {row["listing_id"]: row["last_price"] for row in data}


def get_fingerprints(supabase: Client) -> Dict[str, int]:
    """Get fingerprint -> listing_id mapping for repost detection."""
    data = paginated_query(
        supabase,
        "listing_lifecycle",
        "listing_id, fingerprint_hash",
        filters={"not_null": ["fingerprint_hash"]}
    )
    return {row["fingerprint_hash"]: row["listing_id"] for row in data}


def get_phone_counts(supabase: Client) -> Dict[str, int]:
    """Get phone number -> count of active listings."""
    data = paginated_query(
        supabase,
        "listing_lifecycle",
        "phone_normalized",
        filters={"eq": {"status": "ACTIVE"}, "not_null": ["phone_normalized"]}
    )

    counts = {}
    for row in data:
        phone = row["phone_normalized"]
        counts[phone] = counts.get(phone, 0) + 1

    return counts


def insert_snapshot(supabase: Client, listing: ListingFull) -> None:
    """Insert a snapshot record."""
    data = {
        "listing_id": listing.listing_id,
        "snapshot_date": date.today().isoformat(),
        "url": listing.url,
        "price": listing.price,
        "price_per_m2": float(listing.price_per_m2) if listing.price_per_m2 else None,
        "area_m2": float(listing.area_m2) if listing.area_m2 else None,
        "rooms": listing.rooms,
        "floor_current": listing.floor_current,
        "floor_total": listing.floor_total,
        "year_built": listing.year_built,
        "district": listing.district,
        "street": listing.street,
        "is_broker_listing": listing.is_broker_listing,
        "broker_score": listing.broker_score,
        "phone_normalized": listing.phone_normalized,
        "views_total": listing.views_total,
        "views_today": listing.views_today,
        "saves_count": listing.saves_count,
        "date_posted": listing.date_posted.isoformat() if listing.date_posted else None,
        "date_edited": listing.date_edited.isoformat() if listing.date_edited else None,
        "expires_at": listing.expires_at.isoformat() if listing.expires_at else None,
        "fingerprint_hash": listing.fingerprint_hash,
        "raw_features": listing.raw_features,
    }

    # Upsert (update if exists for same date)
    supabase.table("listing_snapshots").upsert(
        data,
        on_conflict="listing_id,snapshot_date"
    ).execute()


def create_lifecycle(supabase: Client, listing: ListingFull, is_multi_listing: bool = False) -> None:
    """Create new lifecycle record."""
    data = {
        "listing_id": listing.listing_id,
        "url": listing.url,
        "first_seen_at": datetime.now().isoformat(),
        "last_seen_at": datetime.now().isoformat(),
        "status": "ACTIVE",
        "initial_price": listing.price,
        "last_price": listing.price,
        "price_changes": 0,
        "price_history": json.dumps([{"date": date.today().isoformat(), "price": listing.price}]),
        "broker_score": listing.broker_score,
        "phone_normalized": listing.phone_normalized,
        "is_multi_listing_phone": is_multi_listing,
        "fingerprint_hash": listing.fingerprint_hash,
        "area_m2": float(listing.area_m2) if listing.area_m2 else None,
        "rooms": listing.rooms,
        "district": listing.district,
        "floor_current": listing.floor_current,
        "floor_total": listing.floor_total,
        "year_built": listing.year_built,
        "max_views": listing.views_total or 0,
        "max_saves": listing.saves_count or 0,
    }

    supabase.table("listing_lifecycle").insert(data).execute()


def update_lifecycle_seen(
    supabase: Client,
    listing_id: int,
    price: Optional[int] = None,
    views: Optional[int] = None,
    saves: Optional[int] = None
) -> None:
    """Update lifecycle: mark as seen today, optionally update price."""
    updates = {
        "last_seen_at": datetime.now().isoformat(),
        "consecutive_missing_days": 0,
    }

    if views:
        # Use raw SQL for GREATEST
        pass  # Will handle in main logic

    supabase.table("listing_lifecycle").update(updates).eq("listing_id", listing_id).execute()


def update_lifecycle_price_change(
    supabase: Client,
    listing_id: int,
    old_price: int,
    new_price: int
) -> None:
    """Record a price change."""
    # Get current price history
    result = supabase.table("listing_lifecycle") \
        .select("price_history, price_changes") \
        .eq("listing_id", listing_id) \
        .execute()

    if not result.data:
        return

    row = result.data[0]
    history = json.loads(row["price_history"]) if row["price_history"] else []
    history.append({"date": date.today().isoformat(), "price": new_price})

    supabase.table("listing_lifecycle").update({
        "last_price": new_price,
        "price_changes": row["price_changes"] + 1,
        "price_history": json.dumps(history),
        "last_seen_at": datetime.now().isoformat(),
        "consecutive_missing_days": 0,
    }).eq("listing_id", listing_id).execute()


def mark_lifecycle_missing(supabase: Client, listing_id: int) -> int:
    """Increment missing days counter, return new count."""
    result = supabase.table("listing_lifecycle") \
        .select("consecutive_missing_days") \
        .eq("listing_id", listing_id) \
        .execute()

    if not result.data:
        return 0

    new_count = result.data[0]["consecutive_missing_days"] + 1

    supabase.table("listing_lifecycle").update({
        "consecutive_missing_days": new_count,
    }).eq("listing_id", listing_id).execute()

    return new_count


def end_lifecycle(supabase: Client, listing_id: int, outcome: str) -> None:
    """Mark lifecycle as ended with outcome."""
    # Get lifecycle data
    result = supabase.table("listing_lifecycle") \
        .select("first_seen_at, last_price, initial_price, max_views, max_saves") \
        .eq("listing_id", listing_id) \
        .execute()

    if not result.data:
        return

    row = result.data[0]
    first_seen = datetime.fromisoformat(row["first_seen_at"].replace("Z", "+00:00"))
    days_on_market = (datetime.now() - first_seen.replace(tzinfo=None)).days

    # Determine removal speed
    if days_on_market <= 7:
        removal_speed = "FAST"
    elif days_on_market <= 30:
        removal_speed = "MEDIUM"
    else:
        removal_speed = "SLOW"

    # Calculate engagement score
    engagement = 0
    if row["max_views"]:
        engagement += min(row["max_views"] / 100, 50)  # Max 50 points from views
    if row["max_saves"]:
        engagement += min(row["max_saves"] * 2, 30)  # Max 30 points from saves

    supabase.table("listing_lifecycle").update({
        "status": "ENDED",
        "ended_at": datetime.now().isoformat(),
        "outcome": outcome,
        "days_on_market": days_on_market,
        "removal_speed": removal_speed,
        "engagement_score": round(engagement, 2),
    }).eq("listing_id", listing_id).execute()


def check_repost(supabase: Client, fingerprint: str, listing_id: int) -> Optional[int]:
    """Check if this is a repost of an existing listing."""
    result = supabase.table("listing_lifecycle") \
        .select("listing_id, repost_chain_id") \
        .eq("fingerprint_hash", fingerprint) \
        .neq("listing_id", listing_id) \
        .execute()

    if result.data:
        return result.data[0]["listing_id"]
    return None


def link_repost(supabase: Client, new_listing_id: int, original_listing_id: int) -> None:
    """Link a repost to original listing."""
    # Get or create chain ID
    result = supabase.table("listing_lifecycle") \
        .select("repost_chain_id") \
        .eq("listing_id", original_listing_id) \
        .execute()

    if result.data and result.data[0]["repost_chain_id"]:
        chain_id = result.data[0]["repost_chain_id"]
    else:
        chain_id = str(uuid.uuid4())
        supabase.table("listing_lifecycle").update({
            "repost_chain_id": chain_id,
        }).eq("listing_id", original_listing_id).execute()

    # Link new listing
    supabase.table("listing_lifecycle").update({
        "repost_chain_id": chain_id,
        "is_repost": True,
        "original_listing_id": original_listing_id,
    }).eq("listing_id", new_listing_id).execute()

    # Mark original as reposted (not rented)
    supabase.table("listing_lifecycle").update({
        "outcome": "REPOSTED",
    }).eq("listing_id", original_listing_id).eq("status", "ENDED").execute()


# ============================================================================
# CONFIDENCE SCORING & VERIFICATION
# ============================================================================

def calculate_confidence(
    days_on_market: int,
    is_broker: bool,
    price_stable: bool,
    engagement_score: float,
    is_repost: bool,
    rented_badge: bool = False
) -> Tuple[float, str, Dict]:
    """
    Calculate confidence score and tier.
    Returns (score, tier, signals).
    """
    signals = {
        "days_on_market": days_on_market,
        "quick_removal": days_on_market <= 7,
        "is_broker": is_broker,
        "price_stable": price_stable,
        "high_engagement": engagement_score > 30,
        "is_repost": is_repost,
        "rented_badge_seen": rented_badge,
    }

    # Start with base score
    score = 0.5

    # Rented badge = highest confidence
    if rented_badge:
        score += 0.4

    # Quick removal = strong signal
    if days_on_market <= 7:
        score += 0.25
    elif days_on_market <= 14:
        score += 0.15
    elif days_on_market <= 30:
        score += 0.05
    else:
        score -= 0.1

    # Broker = professional pricing
    if is_broker:
        score += 0.1

    # Price stability
    if price_stable:
        score += 0.1
    else:
        score -= 0.15

    # Engagement
    if engagement_score > 50:
        score += 0.1
    elif engagement_score > 30:
        score += 0.05

    # Repost = poison
    if is_repost:
        score -= 0.5

    # Clamp to [0, 1]
    score = max(0, min(1, score))

    # Determine tier
    if score >= 0.8:
        tier = "GOLD"
    elif score >= 0.6:
        tier = "SILVER"
    elif score >= 0.4:
        tier = "BRONZE"
    else:
        tier = "REJECTED"

    return round(score, 3), tier, signals


def promote_to_verified(supabase: Client, listing_id: int) -> bool:
    """Check if ended listing qualifies for verified_prices table."""
    # Get lifecycle data
    result = supabase.table("listing_lifecycle") \
        .select("*") \
        .eq("listing_id", listing_id) \
        .execute()

    if not result.data:
        return False

    row = result.data[0]

    # Skip if not ended
    if row["status"] != "ENDED":
        return False

    # Skip if outcome is bad
    if row["outcome"] in ["REPOSTED", "EXPIRED"]:
        return False

    # Calculate confidence
    price_stable = row["price_changes"] == 0

    score, tier, signals = calculate_confidence(
        days_on_market=row["days_on_market"] or 999,
        is_broker=row["broker_score"] < 0,
        price_stable=price_stable,
        engagement_score=row["engagement_score"] or 0,
        is_repost=row["is_repost"] or False,
    )

    # Skip rejected
    if tier == "REJECTED":
        return False

    # Build features
    features = {
        "area_m2": row["area_m2"],
        "rooms": row["rooms"],
        "floor_current": row["floor_current"],
        "floor_total": row["floor_total"],
        "year_built": row["year_built"],
        "district": row["district"],
    }

    # Calculate price per m2
    price_per_m2 = None
    if row["last_price"] and row["area_m2"] and row["area_m2"] > 0:
        price_per_m2 = round(row["last_price"] / row["area_m2"], 2)

    # Insert into verified_prices
    data = {
        "listing_id": listing_id,
        "verified_price": row["last_price"],
        "verified_price_per_m2": price_per_m2,
        "confidence_score": score,
        "confidence_tier": tier,
        "verification_signals": signals,
        "features": features,
        "days_on_market": row["days_on_market"],
        "removal_speed": row["removal_speed"],
        "outcome": row["outcome"],
        "eligible_for_training": tier in ["GOLD", "SILVER"],
    }

    try:
        supabase.table("verified_prices").upsert(
            data,
            on_conflict="listing_id"
        ).execute()
        logger.info(f"  ✅ Promoted listing {listing_id} to verified ({tier}, score={score})")
        return True
    except Exception as e:
        logger.error(f"  ❌ Failed to promote listing {listing_id}: {e}")
        return False


# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

def run_daily_collection(test_mode: bool = False, bootstrap: bool = False):
    """
    Main daily collection job.

    Steps:
    1. Scrape list view to get all current listing IDs
    2. Compare with database: find NEW, MISSING, CHANGED
    3. For NEW: scrape detail page, create lifecycle
    4. For MISSING: increment counter, maybe mark as ENDED
    5. For CHANGED (price): scrape detail page, update
    6. Promote ended listings to verified_prices
    """
    logger.info("=" * 60)
    logger.info("VERIFIED PRICE COLLECTOR - Daily Run")
    logger.info(f"Mode: {'TEST' if test_mode else 'BOOTSTRAP' if bootstrap else 'DAILY'}")
    logger.info("=" * 60)

    supabase = get_supabase()

    # Step 1: Scrape list view
    max_pages = 5 if test_mode else (MAX_PAGES if bootstrap else 70)
    logger.info(f"\n📋 Step 1: Scraping list view (max {max_pages} pages)")

    current_listings = scrape_all_list_pages(max_pages)
    current_ids = {l.listing_id for l in current_listings}
    current_by_id = {l.listing_id: l for l in current_listings}

    logger.info(f"  Found {len(current_ids)} listings on aruodas")

    # Step 2: Get database state
    logger.info("\n🗃️ Step 2: Loading database state")
    db_all_ids = get_all_listing_ids(supabase)  # ALL listings ever tracked
    db_active_ids = get_active_listing_ids(supabase)  # Only ACTIVE ones
    db_prices = get_listing_prices(supabase)
    phone_counts = get_phone_counts(supabase)

    logger.info(f"  Total in DB: {len(db_all_ids)}")
    logger.info(f"  Active in DB: {len(db_active_ids)}")

    # SCRAPE FAILURE PROTECTION
    # If we found very few listings compared to what we expect, the scrape likely failed
    # Don't mark everything as MISSING in this case
    scrape_failed = False
    if len(db_active_ids) > 100 and len(current_ids) < len(db_active_ids) * 0.5:
        logger.error(f"⚠️ SCRAPE FAILURE DETECTED: Found only {len(current_ids)} listings but expected ~{len(db_active_ids)}")
        logger.error("  Skipping MISSING processing to prevent false positives")
        scrape_failed = True
    elif len(current_ids) == 0 and len(db_active_ids) > 0:
        logger.error("⚠️ SCRAPE FAILURE DETECTED: Found 0 listings - Zyte API likely failed")
        logger.error("  Aborting to prevent data corruption")
        raise RuntimeError("Scrape failed: 0 listings found. Check Zyte API status.")

    # Step 3: Calculate diffs
    # NEW = listings we've NEVER seen before (not in db_all_ids)
    # MISSING = was ACTIVE but no longer on site
    # EXISTING = still on site and was ACTIVE
    # REAPPEARED = was in DB (not active) but back on site
    new_ids = current_ids - db_all_ids  # Truly new (never tracked)
    missing_ids = db_active_ids - current_ids
    existing_ids = current_ids & db_active_ids
    reappeared_ids = (current_ids & db_all_ids) - db_active_ids  # Was tracked, not active, but back

    logger.info(f"\n📊 Step 3: Diff results")
    logger.info(f"  NEW: {len(new_ids)}")
    logger.info(f"  MISSING: {len(missing_ids)}")
    logger.info(f"  EXISTING: {len(existing_ids)}")
    logger.info(f"  REAPPEARED: {len(reappeared_ids)}")

    # Step 4: Process NEW listings
    logger.info(f"\n🆕 Step 4: Processing {len(new_ids)} new listings")
    new_count = 0

    skipped_old = 0
    for listing_id in new_ids:
        basic = current_by_id[listing_id]

        # Scrape detail page
        full = scrape_detail_page(basic.url)
        if not full:
            continue

        # Filter out old listings (stale/overpriced)
        if full.date_posted:
            age_days = (datetime.now() - full.date_posted).days
            if age_days > MAX_LISTING_AGE_DAYS:
                skipped_old += 1
                logger.debug(f"  ⏭️ Skipping old listing {listing_id}: {age_days} days old")
                continue

        # Check for repost
        if full.fingerprint_hash:
            original = check_repost(supabase, full.fingerprint_hash, listing_id)
            if original:
                logger.info(f"  🔄 Detected repost: {listing_id} is repost of {original}")

        # Check if multi-listing phone
        is_multi = False
        if full.phone_normalized:
            count = phone_counts.get(full.phone_normalized, 0)
            is_multi = count >= 3
            phone_counts[full.phone_normalized] = count + 1

        # Insert snapshot
        insert_snapshot(supabase, full)

        # Create lifecycle
        create_lifecycle(supabase, full, is_multi)

        # Link repost if detected
        if full.fingerprint_hash:
            original = check_repost(supabase, full.fingerprint_hash, listing_id)
            if original:
                link_repost(supabase, listing_id, original)

        new_count += 1

        if new_count % 10 == 0:
            logger.info(f"  Processed {new_count}/{len(new_ids)} new listings")

    logger.info(f"  ✅ Added {new_count} new listings (skipped {skipped_old} old listings >40 days)")

    # Step 4b: Reactivate REAPPEARED listings
    if reappeared_ids:
        logger.info(f"\n🔄 Step 4b: Reactivating {len(reappeared_ids)} reappeared listings")
        reactivated = 0
        for listing_id in reappeared_ids:
            try:
                supabase.table("listing_lifecycle").update({
                    "status": "ACTIVE",
                    "consecutive_missing_days": 0,
                    "last_seen_at": datetime.now().isoformat(),
                    "ended_at": None
                }).eq("listing_id", listing_id).execute()
                reactivated += 1
            except Exception as e:
                logger.warning(f"  Failed to reactivate {listing_id}: {e}")
        logger.info(f"  ✅ Reactivated {reactivated} listings")

    # Step 5: Process MISSING listings
    ended_count = 0
    if scrape_failed:
        logger.info(f"\n❓ Step 5: SKIPPED - Scrape failure detected, not marking {len(missing_ids)} listings as missing")
    else:
        logger.info(f"\n❓ Step 5: Processing {len(missing_ids)} missing listings")

        for listing_id in missing_ids:
            missing_days = mark_lifecycle_missing(supabase, listing_id)

            if missing_days >= MISSING_DAYS_THRESHOLD:
                # Mark as ended
                end_lifecycle(supabase, listing_id, "RENTED_INFERRED")

                # Try to promote to verified
                if promote_to_verified(supabase, listing_id):
                    ended_count += 1

        logger.info(f"  ✅ Ended {ended_count} listings, promoted to verified")

    # Step 6: Check for price changes in EXISTING
    logger.info(f"\n💰 Step 6: Checking price changes in {len(existing_ids)} existing listings")
    changed_count = 0
    skipped_no_list_price = 0
    skipped_no_db_price = 0

    for listing_id in existing_ids:
        basic = current_by_id[listing_id]
        old_price = db_prices.get(listing_id)

        # Skip if no price info
        if basic.price is None:
            skipped_no_list_price += 1
            update_lifecycle_seen(supabase, listing_id)
            continue
        if old_price is None:
            skipped_no_db_price += 1
            update_lifecycle_seen(supabase, listing_id)
            continue

        # Check for price change
        if basic.price != old_price:
            logger.info(f"  💸 Price change: {listing_id} €{old_price} → €{basic.price}")
            update_lifecycle_price_change(supabase, listing_id, old_price, basic.price)
            changed_count += 1
        else:
            update_lifecycle_seen(supabase, listing_id)

    logger.info(f"  ✅ Found {changed_count} price changes")
    if skipped_no_list_price > 0:
        logger.warning(f"  ⚠️ Skipped {skipped_no_list_price} listings (no price in list view)")
    if skipped_no_db_price > 0:
        logger.warning(f"  ⚠️ Skipped {skipped_no_db_price} listings (no price in database)")

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📈 DAILY RUN COMPLETE")
    logger.info("=" * 60)
    logger.info(f"  New listings added: {new_count}")
    logger.info(f"  Listings ended: {ended_count}")
    logger.info(f"  Price changes: {changed_count}")

    # Get verified counts
    result = supabase.table("verified_prices") \
        .select("confidence_tier", count="exact") \
        .eq("eligible_for_training", True) \
        .execute()

    logger.info(f"  Total verified prices: {result.count or 0}")


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Verified Price Collector")
    parser.add_argument("--test", action="store_true", help="Test mode (5 pages only)")
    parser.add_argument("--bootstrap", action="store_true", help="Bootstrap mode (full initial scrape)")
    args = parser.parse_args()

    run_daily_collection(test_mode=args.test, bootstrap=args.bootstrap)


if __name__ == "__main__":
    main()
