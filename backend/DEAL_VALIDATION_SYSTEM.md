# Deal Validation System / Sandorių Tikrinimo Sistema

## Overview / Apžvalga

This system validates whether "good deals" (listings priced below predicted market value) are genuinely good or have hidden issues that explain the low price.

Ši sistema tikrina, ar "geri sandoriai" (skelbimai, kurių kaina žemesnė nei prognozuojama rinkos vertė) yra tikrai geri, ar turi paslėptų problemų, paaiškinančių žemą kainą.

---

## Full Pipeline / Pilnas Procesas

### Step 0: Run best_deals.py (REQUIRED FIRST)

Before validation, you must run the deal scoring pipeline to populate/update the `deal_analysis` table:

```bash
cd backend
python best_deals.py [limit] [days]

# Examples:
python best_deals.py 2000 12    # Analyze up to 2000 active listings from last 12 days
python best_deals.py 500 7      # Analyze up to 500 active listings from last 7 days
```

**What best_deals.py does:**
1. Queries `listing_lifecycle` for ACTIVE listings from last N days
2. Fetches snapshot data from `listing_snapshots` for each listing
3. Runs the ML price prediction model (same as production website)
4. Calculates deal_score: `(predicted_price - actual_price) / predicted_price * 100`
5. Saves results to `deal_analysis` table and `best_deals_results.json`

**Output:**
- Shows progress: `[1/991] 1447321 (Antakalnis)... €500 vs €442 (+13.1%)`
- Positive % = underpriced (good deal), Negative % = overpriced
- Top 5% and 10% deals are printed at the end
- Results saved with run_id timestamp (e.g., `20260114_105017`)

### Step 1: Validate Top Deals (Manual via Claude Code)

After running best_deals.py, validate the top-scoring deals to filter out fakes/problematic listings. See "Validation Process" section below.

---

## System Components / Sistemos Komponentai

### 1. Data Sources / Duomenų Šaltiniai

| Source | What We Extract | Table |
|--------|-----------------|-------|
| `deal_analysis` | Deal score, prices, location | Main deals table |
| `listing_snapshots.raw_features` | Description, image URLs | Full listing data |
| Full-size images | Visual analysis | `object_62_*` URLs |

### 2. Database Schema / Duomenų Bazės Schema

```sql
-- Add validation columns to deal_analysis table
ALTER TABLE deal_analysis ADD COLUMN IF NOT EXISTS
  validation_confidence INTEGER,           -- 0-100 score
  validation_tier VARCHAR(20),             -- PATVIRTINTAS/GERAS/ABEJOTINAS/NETIKRAS
  validation_red_flags JSONB,              -- Array of red flags
  validation_green_flags JSONB,            -- Array of green flags
  validation_summary TEXT,                 -- Lithuanian summary
  validation_notes TEXT,                   -- Detailed AI analysis
  validated_at TIMESTAMPTZ;
```

### 3. Validation Tiers / Tikrinimo Lygiai

| Tier (EN) | Tier (LT) | Score Range | Meaning |
|-----------|-----------|-------------|---------|
| VERIFIED | PATVIRTINTAS | 80-100 | Tikrai geras sandoris, rekomenduojama |
| GOOD | GERAS | 60-79 | Geras sandoris su nedidelėmis pastabomis |
| QUESTIONABLE | ABEJOTINAS | 40-59 | Reikia atidžiai peržiūrėti |
| FAKE | NETIKRAS | 0-39 | Netikras sandoris, nerekomenduojama |

---

## Red Flags / Raudonos Vėliavos

### Critical / Kritinės (-40 taškų)

| Flag ID | Lithuanian | Detection |
|---------|------------|-----------|
| `sodo_pastatas` | Sodo pastatas / Sodininkų bendrija | Document, description keywords |
| `rusys_auksts` | Rūsio/pusrūsio aukštas | Description: "cokolinis", "rūsys", "pusrūsis" |
| `nera_vandens` | Nėra vandens tiekimo | Document, description |
| `nera_kanalizacijos` | Nėra kanalizacijos | Document, description |
| `nelegali_statyba` | Nelegali statyba/konversija | Document analysis |

### High Severity / Aukštas (-20 taškų)

| Flag ID | Lithuanian | Detection |
|---------|------------|-----------|
| `kambarys_bute` | Tik kambarys bute (ne visas butas) | Description: "kambarys X k. bute", "bendras" |
| `be_sildymo` | Be šildymo sistemos | Document, description |
| `reikalingas_remontas` | Reikalingas kapitalinis remontas | Images, description |
| `asbestas` | Asbestinė stogo danga | Document: "asbestcementis" |
| `labai_mazas` | Labai mažas plotas (<20m² butui) | Data analysis |

### Medium Severity / Vidutinis (-10 taškų)

| Flag ID | Lithuanian | Detection |
|---------|------------|-----------|
| `tik_studentams` | Tik studentams | Description keywords |
| `trumpalaike_nuoma` | Tik trumpalaikė nuoma | Description keywords |
| `sena_iranga` | Sena/pasenusi įranga | Image analysis |
| `blogas_isplanavimas` | Blogas išplanavimas | Image analysis |
| `triuksmingas` | Triukšminga vieta | Description, location |

---

## Green Flags / Žalios Vėliavos

| Flag ID | Lithuanian | Points |
|---------|------------|--------|
| `gera_vieta` | Gera vieta, šalia centro | +5 |
| `naujai_irengtas` | Naujai įrengtas | +10 |
| `su_baldais` | Su visais baldais ir technika | +5 |
| `geros_nuotraukos` | Profesionalios nuotraukos | +5 |
| `skaidrus_savininkas` | Skaidrus savininkas (ne brokeris) | +5 |

---

## Validation Process / Tikrinimo Procesas

### Step 1: Gather Data / Surinkti Duomenis
```python
# Get listing data
listing = get_listing_from_db(listing_id)
description = listing['raw_features']['description']
image_urls = listing['raw_features']['image_urls']

# Convert to full-size URLs
full_size_urls = [url.replace('object_63_', 'object_62_') for url in image_urls]
```

### Step 2: Download Images / Atsisiųsti Nuotraukas
```python
# Download first 6 images for analysis
images = download_images(full_size_urls[:6])
```

### Step 3: AI Analysis / AI Analizė
```
Analyze:
1. Document images (registry extracts) - check property type, infrastructure
2. Interior photos - check condition, size, amenities
3. Description text - check for red flag keywords
4. Listing data - check area, rooms, price logic
```

### Step 4: Calculate Score / Apskaičiuoti Balą
```python
score = 100
for flag in red_flags:
    if flag.severity == 'critical': score -= 40
    elif flag.severity == 'high': score -= 20
    elif flag.severity == 'medium': score -= 10

for flag in green_flags:
    score += flag.points

score = max(0, min(100, score))  # Clamp to 0-100
```

### Step 5: Determine Tier / Nustatyti Lygį
```python
if score >= 80: tier = "PATVIRTINTAS"
elif score >= 60: tier = "GERAS"
elif score >= 40: tier = "ABEJOTINAS"
else: tier = "NETIKRAS"
```

### Step 6: Generate Summary / Sugeneruoti Santrauką
```
Write Lithuanian summary explaining:
- Why this is/isn't a good deal
- Main red flags found
- Recommendation
```

### Step 7: Store Results / Išsaugoti Rezultatus
```python
update_deal_analysis(listing_id, {
    'validation_confidence': score,
    'validation_tier': tier,
    'validation_red_flags': red_flags,
    'validation_green_flags': green_flags,
    'validation_summary': summary_lt,
    'validation_notes': detailed_notes,
    'validated_at': datetime.now()
})
```

---

## Example Output / Pavyzdinis Rezultatas

```json
{
  "listing_id": 1447321,
  "validation_confidence": 15,
  "validation_tier": "NETIKRAS",
  "validation_red_flags": [
    {
      "flag_id": "sodo_pastatas",
      "label_lt": "Sodo pastatas",
      "severity": "critical",
      "description_lt": "Tai nėra butas - tai sodo namelis sodininkų bendrijoje"
    },
    {
      "flag_id": "nera_vandens",
      "label_lt": "Nėra vandens tiekimo",
      "severity": "critical",
      "description_lt": "Pagal registro dokumentą nėra vandens tiekimo"
    },
    {
      "flag_id": "asbestas",
      "label_lt": "Asbestinė stogo danga",
      "severity": "high",
      "description_lt": "Stogas dengtas asbestcemenčiu - pavojinga sveikatai"
    }
  ],
  "validation_green_flags": [
    {
      "flag_id": "gera_vieta",
      "label_lt": "Gera vieta",
      "description_lt": "Antakalnis - prestižinis rajonas"
    }
  ],
  "validation_summary": "NETIKRAS SANDORIS. Tai nėra tikras butas, o sodo namelis sodininkų bendrijoje be vandens ir kanalizacijos. Stogo danga iš asbesto. Nerekomenduojama.",
  "validation_notes": "Detailed AI analysis of images and documents..."
}
```

---

## Running Validation / Tikrinimo Vykdymas

### Manual (via Claude Code):
```
1. Get top N deals from deal_analysis table
2. For each deal:
   - Download full-size images
   - Read images with Claude
   - Analyze description
   - Generate validation JSON
   - Update database
```

### Query Validated Deals:
```sql
-- Get verified good deals
SELECT * FROM deal_analysis
WHERE validation_tier IN ('PATVIRTINTAS', 'GERAS')
ORDER BY deal_score DESC;

-- Get deals needing review
SELECT * FROM deal_analysis
WHERE validation_tier = 'ABEJOTINAS';
```

---

## Keywords to Detect / Raktažodžiai

### Red Flag Keywords (Lithuanian):
- `sodininkų bendrija`, `sodo namelis`, `sodo pastatas`
- `kambarys X k. bute`, `bendras butas`
- `rūsys`, `pusrūsis`, `cokolinis`, `cokolis`
- `be sutarties`, `be registracijos`
- `tik studentams`, `tik moterims/vyrams`
- `reikia remonto`, `reikalingas remontas`

### Green Flag Keywords (Lithuanian):
- `naujai įrengtas`, `po remonto`, `renovuotas`
- `su visais baldais`, `pilnai įrengtas`
- `centrinis šildymas`, `autonominis šildymas`
- `yra liftas`, `stovėjimo vieta`

---

## Notes / Pastabos

1. Image URLs: Use `object_62_` prefix for full-size, `object_63_` for thumbnails
2. Always check first image - often contains registry document
3. Description analysis should be in Lithuanian
4. Store both raw flags and human-readable summaries
5. Re-validate periodically as listings may change

---

*Last updated: 2026-01-04*
