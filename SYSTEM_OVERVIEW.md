# VilRent.lt - System Overview

## What It Is

VilRent is an AI-powered rental price validation platform for the Lithuanian rental market, specifically focused on Vilnius apartments listed on aruodas.lt (Lithuania's dominant real estate portal, like Zillow for Lithuania).

**Live URL**: vilrent.lt

### The Problem We Solve

When someone in Lithuania is looking to rent an apartment, they browse aruodas.lt and see hundreds of listings. The big question is always: **"Is this price fair, or am I getting ripped off?"**

There's no easy way to know. Rental prices vary wildly based on:
- Location (district, distance to center)
- Apartment size and room count
- Building age and floor level
- Amenities (elevator, balcony, parking)
- Whether it's a broker listing (often inflated) or direct from owner

Renters have to manually compare dozens of listings, guess at fair prices, and hope they're not overpaying. Brokers, on the other hand, have market knowledge that regular people don't.

**VilRent levels the playing field.** We use machine learning trained on thousands of real rental transactions to instantly tell you what any apartment should cost - and whether the asking price is a good deal or overpriced.

---

## How It Works (User Flow)

### Step 1: User Finds a Listing
A user is browsing aruodas.lt and finds an apartment they like. The listing says €650/month for a 2-room apartment in Antakalnis.

### Step 2: User Pastes the URL
They copy the listing URL and paste it into VilRent. Alternatively, if they don't have a specific listing, they can manually enter the apartment details (rooms, area, address, etc.).

### Step 3: AI Analyzes the Listing
Behind the scenes, our system:
1. Scrapes the listing page to extract all property details
2. Geocodes the address to calculate distance to city center
3. Runs the data through our ML model trained on verified rental prices
4. Compares the asking price to the predicted fair market value

### Step 4: User Gets a Verdict
The user sees:
- **Predicted fair price**: What our AI thinks this apartment should rent for (e.g., €720/month)
- **Actual asking price**: What the landlord wants (e.g., €650/month)
- **Deal verdict**: A tier rating explaining if it's a good deal

If the asking price is below our prediction, it's a good deal. If it's way above, the user knows to negotiate or walk away.

### Step 5: Similar Undervalued Listings (New Feature)
After the analysis, we show the user **similar validated deals** in the same area. These are other listings that:
- Are in the same or nearby district
- Have similar room count (±1 room)
- Have similar size (±15 m²)
- Are priced BELOW market value (verified good deals)

This helps users discover opportunities they might have missed. For example: "You're looking at a 2-room in Antakalnis for €650. Here are 4 other 2-room apartments nearby that are even better deals - one is 22% below market value!"

This feature shows 2 preview listings for free. To unlock all similar deals, users need to register (which is free and gives them one more analysis).

### Step 6: SHAP Explanations
We also show users WHY the price is what it is. Using SHAP (explainable AI), we break down which factors push the price up or down:
- "Location in Antakalnis adds +€80/month"
- "Being on floor 5 of 5 (top floor, no elevator) reduces -€40/month"
- "Year built 1970 reduces -€60/month"

This transparency helps users understand the rental market and negotiate better.

---

## Deal Validation Tiers

Every analysis returns one of four verdicts:

| Tier | Lithuanian | What It Means |
|------|-----------|---------------|
| **PATVIRTINTAS** | Verified/Confirmed | Excellent deal - significantly below market. Grab it fast. |
| **GERAS** | Good | Good deal - below market value. Worth considering. |
| **ABEJOTINAS** | Questionable | Fair price - roughly at market value. Not a steal, not a ripoff. |
| **NETIKRAS** | Not Real/Fake | Overpriced or suspicious. Negotiate hard or skip it. |

---

## Who Uses This

### Renters (B2C)
- People moving to Vilnius who don't know local prices
- Students looking for affordable housing
- Expats unfamiliar with the Lithuanian market
- Anyone who wants to avoid overpaying

### Brokers (B2B - Future)
- Real estate agents who want to validate pricing for clients
- Agencies that need to price listings competitively
- Property managers evaluating portfolio pricing

---

## Data Collection & Training

### User-Contributed Data
When users use the manual input mode, they can optionally tell us how much they're currently paying in rent. This real-world rental data is extremely valuable because:

1. **Model Training**: Actual rents paid (not just asking prices) help us calibrate and improve our ML model over time
2. **Market Intelligence**: We're building a unique dataset of verified rental transactions in Lithuania
3. **Data Asset**: This proprietary data could be valuable for market research, sold to real estate companies, or used for industry reports

Every manual submission grows our competitive moat - data that aruodas.lt doesn't have.

---

## Future Vision & Opportunities

We're still exploring how to grow VilRent beyond price validation. Some ideas:

### Become a Listing Platform
Currently, aruodas.lt has a near-monopoly on Lithuanian real estate listings. They charge **~€80 per listing** - which is astronomical for individual landlords.

We could potentially:
- Allow landlords to post listings directly on VilRent for free or much cheaper
- Offer "verified fair price" badges for listings that pass our AI validation
- Build a marketplace where renters trust that prices are fair

### Other Monetization Ideas Being Explored
- **Premium analytics** for landlords/investors (neighborhood trends, optimal pricing)
- **API access** for proptech companies
- **White-label solution** for real estate agencies
- **Lead generation** for brokers (connect them with active searchers)
- **Expansion** to Kaunas, Klaipėda, and eventually other Baltic states

The goal is to solve more problems in the Lithuanian rental market while building a sustainable business.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), uvicorn |
| Database | Supabase (PostgreSQL) |
| ML Models | XGBoost (pickle files) |
| Scraping | Zyte API (proxy/anti-bot), BeautifulSoup |
| Auth | Supabase Auth (magic link, OAuth) |
| Payments | SumUp (credit-based system) |
| Hosting | Vercel (frontend), Railway/local (backend) |
| CI/CD | GitHub Actions (daily scraping) |

---

## Core User Flow

```
User Input (URL or Manual)
         ↓
   Backend API (/api/predict)
         ↓
┌────────────────────────┐
│  1. Scrape listing     │  (if URL provided)
│     via Zyte API       │
│  2. Extract features   │
│  3. Geocode address    │
│  4. Run ML prediction  │
│  5. Calculate deal     │
│     score & tier       │
└────────────────────────┘
         ↓
   Return: predicted_price, actual_price,
           deal_score, validation_tier,
           SHAP explanations
```

---

## Input Methods

### 1. URL Mode
User pastes an aruodas.lt listing URL:
- `www.aruodas.lt/butu-nuoma/...`
- `m.aruodas.lt/...` (mobile)
- `en.aruodas.lt/...` (English)
- `m.en.aruodas.lt/...` (mobile English)

All variants are normalized to `www.aruodas.lt` before processing.

### 2. Manual Mode
User enters property details:
- Rooms, Area (m2)
- Floor (current/total)
- Year built
- Address (autocompleted via Nominatim API)
- Amenities: lift, balcony, parking
- Heating type: Centrinis, Dujinis, Elektra

---

## Backend Architecture

### Main Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, prediction endpoint, URL normalization |
| `model_utils.py` | Scraping (Zyte), feature extraction, geocoding |
| `ab_testing.py` | Dual model prediction (old vs new), feature engineering |
| `best_deals.py` | Batch processing to find best deals in database |
| `verified_price_collector.py` | Daily scraper for training data |
| `shap_explainer.py` | SHAP explanations for predictions |
| `database.py` | Supabase client, payment models |
| `sumup_routes.py` | Payment processing |
| `auth_routes.py` | Authentication endpoints |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/predict` | POST | Main prediction from URL |
| `/predict-manual` | POST | Prediction from manual input |
| `/explain` | POST | SHAP explanation for features |
| `/ab-test/stats` | GET | A/B testing statistics |
| `/auth/*` | Various | Authentication routes |
| `/sumup/*` | Various | Payment routes |

---

## ML Models

### Current Setup: A/B Testing
Two models run simultaneously on every prediction:

| Model | File | Training Data | Features |
|-------|------|---------------|----------|
| Old Model | `model.pkl` | Historical scraped data | Basic features |
| New Model | `model_new.pkl` | Verified rental prices | Enhanced features |

### Feature Set (New Model)
```
- rooms (int)
- area_m2 (float)
- floor_current (int)
- floor_total (int)
- year_centered (year_built - 2000)
- dist_to_center_km (geodesic distance to Vilnius center)
- has_lift (bool)
- has_balcony_terrace (bool)
- has_parking_spot (bool)
- heat_Centrinis (bool)
- heat_Dujinis (bool)
- heat_Elektra (bool)
- district_* (one-hot encoded, ~25 districts)
```

### Prediction Output
```python
{
    "predicted_price": 650,      # EUR/month
    "actual_price": 580,         # From listing
    "deal_score": 0.89,          # 0-1 scale
    "validation_tier": "PATVIRTINTAS",
    "price_difference": -70,     # Negative = below market
    "percentage_diff": -10.7,    # % below predicted
}
```

---

## Deal Validation Tiers

| Tier | Lithuanian | Deal Score | Meaning |
|------|-----------|------------|---------|
| PATVIRTINTAS | Verified | > 0.8 | Excellent deal, significantly below market |
| GERAS | Good | 0.6 - 0.8 | Good deal, below market |
| ABEJOTINAS | Questionable | 0.4 - 0.6 | Fair price, near market value |
| NETIKRAS | Not Real | < 0.4 | Overpriced or suspicious |

---

## Data Collection Pipeline

### Daily Automated Scraping
GitHub Action runs at 6 AM UTC (9 AM Lithuania):

```
verified_price_collector.py
         ↓
1. Scrape aruodas.lt listing pages (up to 100 pages)
2. Extract basic info: price, rooms, area, district
3. Track listing lifecycle (new → active → ended)
4. Store in Supabase tables:
   - listing_snapshots (raw data)
   - price_history (price changes)
   - deal_analysis (computed scores)
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `listing_snapshots` | Raw scraped listing data with features |
| `price_history` | Track price changes over time |
| `deal_analysis` | Pre-computed deal scores and tiers |
| `predictions` | User prediction history |
| `user_credits` | Credit balance per user |
| `payment_attempts` | SumUp payment records |
| `newsletter_signups` | Email subscriptions |
| `anonymous_analytics` | Non-logged-in usage tracking |

---

## Scraping Infrastructure

### Zyte API Integration
- Handles anti-bot protection on aruodas.lt
- Extracts HTML via cloud proxy
- Costs ~$0.001 per request

### Data Extraction
From listing pages, we extract:
```
- listing_id (from URL)
- price (EUR/month)
- rooms
- area_m2
- floor_current, floor_total
- year_built
- district, street, house_number
- heating_type
- amenities (lift, balcony, parking)
- broker vs owner detection
- image URLs
```

---

## Authentication & Credits

### Auth Flow (Supabase)
1. User clicks "Register/Login"
2. Magic link sent to email
3. User clicks link → redirected to `/auth/callback`
4. Session stored in Supabase

### Credit System & Pricing

**Free Tier:**
- 1 free analysis without registering (tracked by device fingerprint)
- 1 additional free analysis after signing up (email registration)
- Total: 2 free analyses per user

**Paid Tier:**
- After free analyses used up, users must buy credits
- €1 = 1 analysis credit
- Payment processed via SumUp checkout
- Credits never expire

---

## Frontend Components

### Key Components
| Component | Purpose |
|-----------|---------|
| `page.tsx` | Main page with URL/manual input forms |
| `SimilarListings.tsx` | Shows similar validated deals |
| `VilniusMap.tsx` | Interactive map with district highlighting |
| `AuthModal.tsx` | Login/register modal |
| `BuyCreditsModal.tsx` | Credit purchase flow |
| `UserCredits.tsx` | Credit balance display |

### Similar Listings Feature
After prediction, shows related validated deals:
- Filters by: district, rooms (±1), area (±15m2)
- Sorted by similarity score
- Shows discount vs market price
- Locked cards for non-authenticated users (upsell)

---

## Environment Variables

### Backend (.env)
```
ZYTE_API_KEY=xxx           # Web scraping API
SUPABASE_URL=xxx           # Database URL
SUPABASE_SERVICE_ROLE_KEY=xxx  # Admin key
SUPABASE_ANON_KEY=xxx      # Public key
SUMUP_API_KEY=xxx          # Payments
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running Locally

### Backend
```bash
cd backend
source .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## Key Algorithms

### Geocoding Chain
```python
# Fallback order for address resolution:
1. "Vilnius, {district}, {street} {house_number}"
2. "Vilnius, {district}, {street}"
3. "Vilnius, {street} {house_number}"
4. "Vilnius, {street}"
5. "Vilnius, {district}"
```

### Deal Score Calculation
```python
deal_score = 1 - (actual_price / predicted_price)
# Clamped to [0, 1]
# Higher = better deal (actual < predicted)
```

### Similar Listings Scoring
```python
similarity = (
    price_similarity * 0.5 +      # 50% weight
    district_match * 0.3 +        # 30% weight
    rooms_match * 0.1 +           # 10% weight
    area_similarity * 0.1         # 10% weight
)
```

---

## Limitations & Known Issues

1. **Bot Detection**: Aruodas.lt has aggressive anti-bot measures. Zyte API helps but some requests fail.
2. **Expired Listings**: Some cached listings may be 404.
3. **Geocoding Accuracy**: Address matching can fail for unusual addresses.
4. **Model Drift**: Models need periodic retraining as market changes.

---

## Future Roadmap

1. **B2B Features**: Broker-focused tools, batch analysis
2. **Market Alerts**: Notifications for good deals
3. **Price History**: Track how prices change over time
4. **Expanded Coverage**: Kaunas, Klaipeda markets
5. **Mobile App**: Native iOS/Android

---

*Document generated: January 2026*
