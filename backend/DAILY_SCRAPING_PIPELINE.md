# Daily Scraping Pipeline Documentation

## Overview

The daily scraping pipeline collects rental listing data from aruodas.lt and tracks listing lifecycles to build high-quality training data for the ML model.

**Key Insight**: Listings that get rented quickly (disappear from the site) have market-validated prices. These are the best training data because the market "approved" the price.

---

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY SCRAPING JOB                           │
│              (verified_price_collector.py)                      │
│              Runs daily at 6 AM UTC via GitHub Actions          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Scrape aruodas.lt list pages                           │
│  - Fetch up to 70 pages (daily) or 100 pages (bootstrap)        │
│  - Extract: listing_id, price, rooms, area, district, street    │
│  - Uses Zyte API to bypass bot protection                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Compare with database                                  │
│  - NEW: Never seen before → scrape details, create lifecycle    │
│  - EXISTING: Still active → update last_seen, check price       │
│  - MISSING: Was active, now gone → increment missing counter    │
│  - REAPPEARED: Was ended, back on site → reactivate             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Process NEW listings                                   │
│  - Scrape detail page for full features                         │
│  - Detect broker vs owner (HTML patterns, phone analysis)       │
│  - Calculate fingerprint hash (detect reposts)                  │
│  - Skip listings older than 40 days (stale/overpriced)          │
│  - Save to: listing_snapshots + listing_lifecycle               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Process MISSING listings                               │
│  - Calculate calendar days since last_seen_at                   │
│  - If missing >= 2 calendar days → mark as ENDED                │
│  - Set outcome = "RENTED_INFERRED"                              │
│  - Attempt promotion to verified_prices                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Promote to verified_prices                             │
│  - Calculate confidence score based on signals                  │
│  - Assign tier: GOLD, SILVER, BRONZE, or REJECTED               │
│  - GOLD + SILVER → eligible_for_training = true                 │
│  - BRONZE + REJECTED → excluded from training                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Tables

### 1. listing_snapshots
Raw scraped data from aruodas.lt.

| Column | Type | Description |
|--------|------|-------------|
| listing_id | bigint | Unique listing ID from aruodas |
| price | int | Asking rent (EUR/month) |
| area_m2 | float | Apartment size |
| rooms | int | Number of rooms |
| district | text | Vilnius district |
| street | text | Street name |
| floor_current/total | int | Floor info |
| year_built | int | Construction year |
| is_broker_listing | bool | Broker or owner |
| broker_score | int | Negative = broker, positive = owner |
| raw_features | jsonb | Full extracted features |
| scraped_at | timestamp | When scraped |

### 2. listing_lifecycle
Tracks each listing's journey from appearance to removal.

| Column | Type | Description |
|--------|------|-------------|
| listing_id | bigint | FK to listing_snapshots |
| status | text | ACTIVE or ENDED |
| first_seen_at | timestamp | When first scraped |
| last_seen_at | timestamp | Last time seen on site |
| ended_at | timestamp | When marked as ended |
| days_on_market | int | Total days active |
| removal_speed | text | FAST (≤7d), MEDIUM (8-30d), SLOW (>30d) |
| outcome | text | RENTED_INFERRED, REPOSTED, EXPIRED |
| consecutive_missing_days | int | Days missing from site |
| price_changes | int | Number of price changes |
| initial_price | int | First seen price |
| last_price | int | Final price |
| broker_score | int | Copied from snapshot |
| engagement_score | float | Views + saves metric |
| is_repost | bool | Detected as repost of earlier listing |

### 3. verified_prices
High-quality training data - listings with market-validated prices.

| Column | Type | Description |
|--------|------|-------------|
| listing_id | bigint | FK to listing_lifecycle |
| verified_price | int | Final asking price (market accepted) |
| verified_price_per_m2 | float | Price per square meter |
| confidence_score | float | 0.0 to 1.0 |
| confidence_tier | text | GOLD, SILVER, BRONZE |
| verification_signals | jsonb | What contributed to score |
| features | jsonb | ML features snapshot |
| days_on_market | int | How long until rented |
| removal_speed | text | FAST, MEDIUM, SLOW |
| outcome | text | RENTED_INFERRED |
| eligible_for_training | bool | GOLD/SILVER = true |
| exclusion_reason | text | Why excluded (if applicable) |

---

## Confidence Scoring Algorithm

When a listing ends (disappears from site for 3+ days), we calculate a confidence score to determine if it's good training data.

### Scoring Formula

```
Base score: 0.5

POSITIVE signals:
  + 0.40  Rented badge seen (explicit confirmation)
  + 0.25  Quick removal (≤7 days on market)
  + 0.15  Medium-fast removal (8-14 days)
  + 0.05  Normal removal (15-30 days)
  + 0.10  Broker listing (professional pricing)
  + 0.10  Price stable (no price changes)
  + 0.10  High engagement (>50 views/saves)
  + 0.05  Medium engagement (30-50)

NEGATIVE signals:
  - 0.10  Slow removal (>30 days)
  - 0.15  Price changed (unstable)
  - 0.50  Detected as repost (poison!)
```

### Confidence Tiers

| Tier | Score Range | Training Eligible | Meaning |
|------|-------------|-------------------|---------|
| GOLD | ≥ 0.80 | Yes | Best data - fast removal, stable price |
| SILVER | 0.60 - 0.79 | Yes | Good data - reliable signals |
| BRONZE | 0.40 - 0.59 | No | Uncertain - too risky for training |
| REJECTED | < 0.40 | No | Bad data - likely repost or overpriced |

---

## Key Logic Decisions

### Why "quick removal = good data"?
If a listing disappears quickly (≤7 days), the market validated that price. Someone was willing to pay it. This is a strong signal that the price was fair or undervalued.

### Why "broker = bonus"?
Brokers price professionally. They know the market and price to sell/rent quickly. Their listings are more likely to be accurately priced.

### Why "repost = poison"?
Reposts indicate the listing didn't rent the first time. The owner deleted and reposted (resetting "days on market"). This means the price was probably too high - bad training data.

### Why "price change = penalty"?
Price drops indicate the original price was too high. The market rejected it. We want stable-priced listings that rented at their initial price.

---

## Scrape Failure Protection

The pipeline has safeguards against bad scrapes:

```python
# If we find <50% of expected listings, something went wrong
if len(current_ids) < len(db_active_ids) * 0.5:
    # Don't mark everything as MISSING
    scrape_failed = True

# If we find 0 listings, abort entirely
if len(current_ids) == 0:
    raise RuntimeError("Scrape failed")
```

This prevents a Zyte API outage from incorrectly marking all listings as "ended".

---

## GitHub Actions Schedule

**File**: `.github/workflows/daily-scrape.yml`

```yaml
schedule:
  - cron: '0 6 * * *'  # 6 AM UTC = 9 AM Lithuania
```

**Modes**:
- `daily` (default): Scrape 70 pages, process diffs
- `bootstrap`: Scrape 100 pages, initial population
- `test`: Scrape 5 pages, for debugging

---

## Current Stats (as of last run)

| Table | Rows | Description |
|-------|------|-------------|
| listing_snapshots | 2,423 | All scraped listings |
| listing_lifecycle | 2,410 | Tracked lifecycles |
| verified_prices | 449 | Market-validated prices |

### Verified Prices Breakdown

| Tier | Count | Avg Days on Market | Eligible for Training |
|------|-------|-------------------|----------------------|
| GOLD | 166 | 8.4 days | Yes |
| SILVER | 224 | 18.4 days | Yes |
| BRONZE | 59 | 15.2 days | No |

**Total training-eligible: 390 listings**

---

## How to Run Manually

```bash
cd backend

# Test mode (5 pages)
python verified_price_collector.py --test

# Daily mode (70 pages)
python verified_price_collector.py

# Bootstrap mode (100 pages, for initial setup)
python verified_price_collector.py --bootstrap
```

Or trigger via GitHub Actions:
```bash
gh workflow run "Daily Listing Scrape" --field mode=daily
```

---

## What This Pipeline Does NOT Do

- **deal_analysis**: Separate pipeline for validating "good deals" with AI
- **Model training**: This just collects data; training is separate
- **Price prediction**: The API uses trained models, not this pipeline

---

## Success Criteria

The pipeline is working correctly when:

1. Daily scrapes complete without errors
2. New listings are being added to listing_snapshots
3. Ended listings are being promoted to verified_prices
4. GOLD tier has mostly quick-removal listings (≤7 days)
5. No mass "ENDED" events (would indicate scrape failure)
