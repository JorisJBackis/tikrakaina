# Seniūnija to Model District Mapping

Complete mapping of all 21 Vilnius Seniūnijos (Admin Level 10) to the 26 Model Districts.

---

## ✅ DIRECT MAPPINGS (9 Seniūnijos)

These seniūnijos map 1:1 to model districts:

| # | Seniūnija | Model District | Status |
|---|-----------|----------------|---------|
| 1 | Antakalnio seniūnija | **Antakalnis** | ✅ Mapped |
| 2 | Lazdynų seniūnija | **Lazdynai** | ✅ Mapped |
| 3 | Naujamiesčio seniūnija | **Naujamiestis** | ✅ Mapped |
| 4 | Naujininkų seniūnija | **Naujininkai** | ✅ Mapped |
| 5 | Naujosios Vilnios seniūnija | **Naujoji Vilnia** | ✅ Mapped |
| 6 | Pilaitės seniūnija | **Pilaitė** | ✅ Mapped |
| 7 | Senamiesčio seniūnija | **Senamiestis** | ✅ Mapped |
| 8 | Vilkpėdės seniūnija | **Vilkpėdė** | ✅ Mapped |
| 9 | Šeškinės seniūnija | **Šeškinė** | ✅ Mapped |

---

## ⚠️ MULTI-DISTRICT SENIŪNIJOS (2 Seniūnijos)

These seniūnijos contain multiple model districts:

### Rasų seniūnija
**Contains 3 model districts:**
- **Markučiai** (primary)
- Užupis
- Senamiestis (partial overlap)

**Recommended mapping:** `Rasų seniūnija → Markučiai`

### Verkių seniūnija
**Contains 3 model districts:**
- **Baltupiai** (primary)
- Jeruzalė
- Antakalnis (partial overlap)

**Recommended mapping:** `Verkių seniūnija → Baltupiai`

---

## 🔍 MISSING MAPPINGS (10 Seniūnijos)

These seniūnijos need to be mapped to model districts based on geographic analysis:

| # | Seniūnija | Likely Contains | Status |
|---|-----------|----------------|---------|
| 1 | Fabijoniškių seniūnija | **Fabijoniškės**, Bajorai | ⚠️ Needs mapping |
| 2 | Justiniškių seniūnija | **Justiniškės** | ⚠️ Needs mapping |
| 3 | Karoliniškių seniūnija | **Karoliniškės** | ⚠️ Needs mapping |
| 4 | Pašilaičių seniūnija | **Pašilaičiai** | ⚠️ Needs mapping |
| 5 | Viršuliškių seniūnija | **Viršuliškės** | ⚠️ Needs mapping |
| 6 | Šnipiškių seniūnija | **Šnipiškės** | ⚠️ Needs mapping |
| 7 | Žirmūnų seniūnija | **Žirmūnai** | ⚠️ Needs mapping |
| 8 | Žvėryno seniūnija | **Žvėrynas** | ⚠️ Needs mapping |
| 9 | Grigiškių seniūnija | _(Outside main Vilnius)_ | ❌ No model district |
| 10 | Panerių seniūnija | _(Outside main Vilnius)_ | ❌ No model district |

**Note:** The "Likely Contains" column shows which model districts are probably within each seniūnija based on name similarity and known geography.

---

## 📊 MODEL DISTRICTS COVERAGE

### ✅ Covered by Seniūnijos (11 out of 26)

Model districts that have clear seniūnija mappings:

1. Antakalnis ← Antakalnio seniūnija
2. Baltupiai ← Verkių seniūnija
3. Lazdynai ← Lazdynų seniūnija
4. Markučiai ← Rasų seniūnija
5. Naujamiestis ← Naujamiesčio seniūnija
6. Naujininkai ← Naujininkų seniūnija
7. Naujoji Vilnia ← Naujosios Vilnios seniūnija
8. Pilaitė ← Pilaitės seniūnija
9. Senamiestis ← Senamiesčio seniūnija
10. Vilkpėdė ← Vilkpėdės seniūnija
11. Šeškinė ← Šeškinės seniūnija

### ⚠️ Likely Covered but Not Confirmed (8 out of 26)

Based on naming patterns, these probably map to similarly-named seniūnijos:

12. Fabijoniškės ← Fabijoniškių seniūnija (likely)
13. Justiniškės ← Justiniškių seniūnija (likely)
14. Karoliniškės ← Karoliniškių seniūnija (likely)
15. Pašilaičiai ← Pašilaičių seniūnija (likely)
16. Viršuliškės ← Viršuliškių seniūnija (likely)
17. Šnipiškės ← Šnipiškių seniūnija (likely)
18. Žirmūnai ← Žirmūnų seniūnija (likely)
19. Žvėrynas ← Žvėryno seniūnija (likely)

### ❓ Unclear Seniūnija Assignment (7 out of 26)

These model districts don't have obvious seniūnija mappings and may be contained within larger seniūnijos:

20. **Bajorai** - Possibly in Fabijoniškių or Verkių seniūnija
21. **Jeruzalė** - Likely in Verkių seniūnija
22. **Lazdynėliai** - Possibly in Lazdynų seniūnija (smaller neighborhood)
23. **Paupys** - Likely in Rasų or Senamiesčio seniūnija
24. **Santariškės** - Unknown seniūnija
25. **Užupis** - Likely in Rasų seniūnija
26. **Šiaurės miestelis** - Unknown seniūnija

---

## 🎯 RECOMMENDED ACTIONS

### 1. Add Missing Mappings to Frontend

Update `district_mapping.json` with these likely correct mappings:

```json
{
  "Fabijoniškių seniūnija": "Fabijoniškės",
  "Justiniškių seniūnija": "Justiniškės",
  "Karoliniškių seniūnija": "Karoliniškės",
  "Pašilaičių seniūnija": "Pašilaičiai",
  "Viršuliškių seniūnija": "Viršuliškės",
  "Šnipiškių seniūnija": "Šnipiškės",
  "Žirmūnų seniūnija": "Žirmūnai",
  "Žvėryno seniūnija": "Žvėrynas"
}
```

### 2. Handle Edge Cases

For districts without clear seniūnija mappings:
- **Prioritize `address.quarter`** over `address.suburb` in Nominatim
- Quarter/neighbourhood will give: "Bajorai", "Lazdynėliai", "Paupys", etc.
- Suburb will give seniūnija: "Fabijoniškių seniūnija", etc.

### 3. Test Geocoding

Test addresses in unclear districts to see what Nominatim returns:
- Bajorai area → Check if quarter field has "Bajorai"
- Santariškės area → Check both quarter and suburb fields
- Šiaurės miestelis → Check quarter field

---

## 📈 SUMMARY

| Category | Count | Percentage |
|----------|-------|------------|
| **Direct 1:1 mappings** | 9 | 43% |
| **Multi-district seniūnijos** | 2 | 10% |
| **Likely mappings (to confirm)** | 8 | 38% |
| **No mapping (outside Vilnius)** | 2 | 10% |
| **Total Seniūnijos** | **21** | **100%** |

| Category | Count | Percentage |
|----------|-------|------------|
| **Confirmed seniūnija mapping** | 11 | 42% |
| **Likely seniūnija mapping** | 8 | 31% |
| **Unclear/smaller neighborhoods** | 7 | 27% |
| **Total Model Districts** | **26** | **100%** |

---

## ✅ CONCLUSION

**Current state:**
- 9/21 seniūnijos have direct 1:1 mappings ✅
- 8/21 seniūnijos need to be added to mapping table ⚠️
- 2/21 seniūnijos cover multiple model districts ⚠️
- 2/21 seniūnijos are outside main Vilnius ❌

**Recommendation:**
Add the 8 missing seniūnija mappings to the district mapping table. The current strategy of prioritizing `address.quarter` over `address.suburb` is correct and will handle most cases properly.

---

_Analysis based on OpenStreetMap admin boundaries and district naming patterns_
