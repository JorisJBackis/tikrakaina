#!/usr/bin/env python3
"""
Lithuanian Apartment Rental Price Predictor
Scrapes aruodas.lt listings and predicts rental prices using a trained model.
"""

import requests
import random
import re
import json
from bs4 import BeautifulSoup
import pandas as pd
import pickle
import numpy as np
from datetime import datetime
import ast
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import warnings

warnings.filterwarnings("ignore", message="Could not find the number of physical cores")

# Load the trained model
print("Loading trained model...")
with open("model.pkl", "rb") as f:
    model = pickle.load(f)
print("Model loaded successfully!")

# Configuration
BASE = "https://www.aruodas.lt/butu-nuoma/vilniuje/puslapis/{page}/"
CITY_CENTER = (54.6872, 25.2797)  # Vilnius center coordinates

# Browser simulation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
]

COMMON_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.aruodas.lt/",
    "Connection": "keep-alive",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Dest": "document",
}

# Geocoding setup
_geocoder = Nominatim(user_agent="rent_model_geocoder", timeout=10)
_GEOCODE_CACHE = {}


def make_session():
    """Create a web scraping session with proper headers."""
    sess = requests.Session()
    sess.headers.update(COMMON_HEADERS)
    # Prime cookies or JS challenges
    sess.get("https://www.aruodas.lt/butu-nuoma/vilniuje/", timeout=5)
    return sess


def _parse_dl_block(dl):
    """Extract <dt>/<dd> pairs from a <dl> block. Returns a dict of {key: [values]}."""
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


def _extract_location_from_title(soup):
    """Parse <h1 class="obj-header-text"> to extract city, district, street."""
    h1 = soup.select_one("h1.obj-header-text")
    if not h1:
        return None, None, None

    txt = h1.get_text(" ", strip=True)
    head = re.split(r"\b(buto|būsto)\s+nuoma\b", txt, flags=re.IGNORECASE)[0]
    parts = [p.strip(" ,") for p in head.split(",") if p.strip(" ,")]

    city = parts[0] if len(parts) >= 1 else None
    district = parts[1] if len(parts) >= 2 else None
    street = parts[2] if len(parts) >= 3 else None
    return city, district, street


def scrape_listing(url, session=None):
    """Scrape apartment listing data from aruodas.lt URL."""
    if session is None:
        session = make_session()
    
    session.headers['User-Agent'] = random.choice(USER_AGENTS)
    resp = session.get(url, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Parse apartment details
    details = _parse_dl_block(soup.find("dl", class_="obj-details"))
    stats = _parse_dl_block(soup.find("div", class_="obj-stats").find("dl")) if soup.find("div", class_="obj-stats") else {}
    details.update(stats)

    # Extract location from header
    city, district, street = _extract_location_from_title(soup)
    if city:
        details["city"] = [city]
    if district:
        details["district"] = [district]
    if street:
        details["street"] = [street]

    result = {"url": url}
    result.update(details)
    return result


def _geocode_addr(addr: str):
    """Geocode address with caching."""
    if not addr:
        return None, None
    if addr in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[addr]
    
    try:
        loc = _geocoder.geocode(addr)
        if loc:
            _GEOCODE_CACHE[addr] = (loc.latitude, loc.longitude)
            return loc.latitude, loc.longitude
    except Exception:
        pass
    
    _GEOCODE_CACHE[addr] = (None, None)
    return None, None


def add_primary_heating_dummies(df, source_col="Šildymas"):
    """Add heating type dummy variables."""
    def get_primary(s):
        if pd.isna(s):
            return "Kita"
        
        if isinstance(s, (list, tuple, set)):
            items = list(s)
        else:
            try:
                items = json.loads(s)
            except Exception:
                try:
                    items = ast.literal_eval(str(s))
                except Exception:
                    return "Kita"
        
        if not items:
            return "Kita"
        
        first = str(items[0])
        m = re.match(r"^([^ ,]+)", first)
        return m.group(1) if m else "Kita"

    prim = df[source_col].map(get_primary).astype("category")
    
    df = df.copy()
    df["heat_Centrinis"] = (prim == "Centrinis").astype(int)
    df["heat_Dujinis"] = (prim == "Dujinis").astype(int)
    df["heat_Elektra"] = (prim == "Elektra").astype(int)
    
    return df


def _first_value(d, col):
    """Return the first value for column (handles list/tuple/str)."""
    v = d.get(col, pd.Series([None])).iloc[0]
    if isinstance(v, (list, tuple, set)):
        v = list(v)[0] if len(v) else None
    return v


def _parse_number(text):
    """Return float from text like '129 m²' or '45,5 m²'; NaN if none."""
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return np.nan
    
    s = str(text).replace("\u00A0", " ").replace(",", ".")
    m = re.search(r"[-+]?\d+(?:\.\d+)?", s)
    return float(m.group(0)) if m else np.nan


def featurise(raw_dict):
    """Transform scraped listing into model-ready features."""
    df = pd.DataFrame([raw_dict])

    # Ensure required columns exist
    listlike_defaults = {
        "Šildymas": [],
        "Ypatybės": [],
        "Papildomos patalpos": [],
    }
    
    for col, default in listlike_defaults.items():
        if col not in df.columns:
            df[col] = [json.dumps(default)]
        else:
            if isinstance(df.at[df.index[0], col], (list, tuple, set)):
                df[col] = df[col].map(lambda v: json.dumps(list(v), ensure_ascii=False))

    # Process building year
    df['Metai'] = (
        df.get('Metai', pd.Series([None]))
          .astype(str).str.extract(r'(\d{4})', expand=False).astype(float)
    )
    df['year_centered'] = df['Metai'] - 2000

    # Add heating dummies
    df = add_primary_heating_dummies(df)

    # Add amenity features
    df['has_lift'] = (
        df['Ypatybės']
          .map(lambda s: 'Yra liftas' in (json.loads(s) if pd.notnull(s) else []))
          .astype(int)
    )

    df['has_balcony_terrace'] = (
        df['Papildomos patalpos']
          .map(lambda s: any(x in {'Balkonas', 'Terasa'} for x in (json.loads(s) if pd.notnull(s) else [])))
          .astype(int)
    )

    df['has_parking_spot'] = (
        df['Papildomos patalpos']
          .map(lambda s: 'Vieta automobiliui' in (json.loads(s) if pd.notnull(s) else []))
          .astype(int)
    )

    # Process location and calculate distance
    city = _first_value(df, "city") or "Vilnius"
    district = _first_value(df, "district")
    street = _first_value(df, "street")
    house = _first_value(df, "Namo numeris")

    lat = df.get('latitude', pd.Series([None])).iloc[0]
    lon = df.get('longitude', pd.Series([None])).iloc[0]

    # Geocode if coordinates missing
    if pd.isna(lat) or pd.isna(lon):
        # Try with district first
        parts_with = [p for p in [city, district, street] if p]
        base_with = ", ".join(parts_with)
        addr_with = f"{base_with} {house}" if (base_with and house) else base_with

        lat, lon = _geocode_addr(addr_with)
        if (lat is None or lon is None) and house:
            lat, lon = _geocode_addr(base_with)

        # Retry without district if still no results
        if (lat is None or lon is None):
            parts_no = [p for p in [city, street] if p]
            base_no = ", ".join(parts_no)
            addr_no = f"{base_no} {house}" if (base_no and house) else base_no

            lat, lon = _geocode_addr(addr_no)
            if (lat is None or lon is None) and house:
                lat, lon = _geocode_addr(base_no)

    df["latitude"] = lat
    df["longitude"] = lon
    df["dist_to_center_km"] = (
        geodesic((lat, lon), CITY_CENTER).km
        if pd.notnull(lat) and pd.notnull(lon) else np.nan
    )

    # Process posting age
    posted_txt = _first_value(df, "Įdėtas")
    try:
        posted_date = pd.to_datetime(str(posted_txt), errors="coerce")
        if pd.notnull(posted_date):
            today = pd.to_datetime(datetime.today().date())
            df["age_days"] = (today - posted_date).days
        else:
            df["age_days"] = np.nan
    except Exception:
        df["age_days"] = np.nan

    # Parse numerical features
    df["area_m2"] = _parse_number(_first_value(df, "Plotas"))
    df["floor_total"] = _parse_number(_first_value(df, "Aukštų sk."))
    df["floor_current"] = _parse_number(_first_value(df, "Aukštas"))
    df["rooms"] = _parse_number(_first_value(df, "Kambarių sk."))

    # Final feature selection
    numeric_feats = [
        'rooms', 'floor_current', 'floor_total', 'age_days', 'area_m2',
        'year_centered', 'dist_to_center_km',
        'heat_Centrinis', 'heat_Dujinis', 'heat_Elektra',
        'has_lift', 'has_balcony_terrace', 'has_parking_spot'
    ]

    # Ensure all features exist
    for col in numeric_feats:
        if col not in df.columns:
            df[col] = np.nan

    print("\n=== APARTMENT FEATURES ===")
    feature_data = df[numeric_feats].iloc[0]
    for feature, value in feature_data.items():
        if pd.isna(value):
            print(f"{feature}: Missing")
        else:
            print(f"{feature}: {value:.2f}")
    print("=" * 27)

    return df[numeric_feats]


def predict_from_url(url, model, session=None):
    """Main function: scrape URL and predict rental price."""
    print(f"Scraping: {url}")
    raw = scrape_listing(url, session=session)
    
    print("Processing apartment features...")
    feats = featurise(raw)
    
    print("Making prediction...")
    pred_pm2 = model.predict(feats)[0]
    
    area = feats["area_m2"].iloc[0]
    total_price = pred_pm2 * area if pd.notnull(area) else None
    
    return pred_pm2, total_price


def main():
    """Example usage of the prediction system."""
    # Example URLs
    test_urls = [
        "https://www.aruodas.lt/butu-nuoma-vilniuje-zirmunuose-olimpieciu-g-ypatingai-patogioje-vietoje-karaliaus-4-1304811/?search_pos=3",
        "https://www.aruodas.lt/butu-nuoma-vilniuje-baltupiuose-baltupio-g-isnuomojamas-sviesus-ir-siltas-ju-kambariu-4-1275570/?search_pos=12"
    ]
    
    for url in test_urls:
        try:
            pred_price_pm2, total_price = predict_from_url(url, model)
            print(f"\n🏠 PREDICTION RESULTS:")
            print(f"   Price per m²: {pred_price_pm2:.2f} EUR/m²")
            if total_price:
                print(f"   Total monthly rent: {total_price:.0f} EUR")
            else:
                print(f"   Total monthly rent: Cannot calculate (missing area)")
            print("-" * 50)
        except Exception as e:
            print(f"Error processing {url}: {e}")


if __name__ == "__main__":
    main()