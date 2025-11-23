/**
 * Smart District Extraction Logic
 *
 * Extracts model district from Nominatim address data using:
 * 1. Comprehensive mapping table (76 OSM names → 26 model districts)
 * 2. Smart fallback chain: quarter → neighbourhood → suburb
 * 3. Direct model district check
 * 4. Fallback to "Other"
 */

import districtMappingLookup from './district_mapping_lookup.json'

// 26 Model Districts that the ML model expects
const MODEL_DISTRICTS = [
  "Antakalnis", "Bajorai", "Baltupiai", "Fabijoniškės", "Jeruzalė",
  "Justiniškės", "Karoliniškės", "Lazdynai", "Lazdynėliai", "Markučiai",
  "Naujamiestis", "Naujininkai", "Naujoji Vilnia", "Paupys",
  "Pašilaičiai", "Pilaitė", "Santariškės", "Senamiestis", "Užupis",
  "Vilkpėdė", "Viršuliškės", "Šeškinė", "Šiaurės miestelis", "Šnipiškės",
  "Žirmūnai", "Žvėrynas"
]

export type NominatimAddress = {
  quarter?: string
  neighbourhood?: string
  suburb?: string
  city?: string
  [key: string]: any
}

export type DistrictExtractionResult = {
  district: string
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'fallback'
  source: 'quarter' | 'neighbourhood' | 'suburb' | 'none'
  rawValue: string
  notes: string
}

/**
 * Extract model district from Nominatim address
 *
 * Priority order:
 * 1. Try quarter field with mapping
 * 2. Try neighbourhood field with mapping
 * 3. Try suburb field with mapping
 * 4. Check if any field is already a model district
 * 5. Fallback to "Other"
 */
export function extractDistrict(address: NominatimAddress): DistrictExtractionResult {
  const quarter = address.quarter || ''
  const neighbourhood = address.neighbourhood || ''
  const suburb = address.suburb || ''

  // Strategy 1: Try quarter first (most specific, but only 30% populated)
  if (quarter) {
    // Check mapping table
    if (districtMappingLookup[quarter as keyof typeof districtMappingLookup]) {
      const mapped = districtMappingLookup[quarter as keyof typeof districtMappingLookup]
      return {
        district: mapped,
        confidence: 'high',
        source: 'quarter',
        rawValue: quarter,
        notes: `Mapped from quarter: ${quarter} → ${mapped}`
      }
    }

    // Check if quarter is already a model district
    if (MODEL_DISTRICTS.includes(quarter)) {
      return {
        district: quarter,
        confidence: 'exact',
        source: 'quarter',
        rawValue: quarter,
        notes: 'Quarter is an exact model district match'
      }
    }
  }

  // Strategy 2: Try neighbourhood field
  if (neighbourhood) {
    // Check mapping table
    if (districtMappingLookup[neighbourhood as keyof typeof districtMappingLookup]) {
      const mapped = districtMappingLookup[neighbourhood as keyof typeof districtMappingLookup]
      return {
        district: mapped,
        confidence: 'high',
        source: 'neighbourhood',
        rawValue: neighbourhood,
        notes: `Mapped from neighbourhood: ${neighbourhood} → ${mapped}`
      }
    }

    // Check if neighbourhood is already a model district
    if (MODEL_DISTRICTS.includes(neighbourhood)) {
      return {
        district: neighbourhood,
        confidence: 'exact',
        source: 'neighbourhood',
        rawValue: neighbourhood,
        notes: 'Neighbourhood is an exact model district match'
      }
    }
  }

  // Strategy 3: Try suburb (100% populated, but less precise)
  if (suburb) {
    // Check mapping table
    if (districtMappingLookup[suburb as keyof typeof districtMappingLookup]) {
      const mapped = districtMappingLookup[suburb as keyof typeof districtMappingLookup]

      // If suburb is a seniūnija, confidence is medium (could be imprecise)
      const isSeniunija = suburb.includes('seniūnija')
      const confidence = isSeniunija ? 'medium' : 'high'

      return {
        district: mapped,
        confidence,
        source: 'suburb',
        rawValue: suburb,
        notes: isSeniunija
          ? `Mapped from seniūnija (may be imprecise): ${suburb} → ${mapped}`
          : `Mapped from suburb: ${suburb} → ${mapped}`
      }
    }

    // Check if suburb is already a model district
    if (MODEL_DISTRICTS.includes(suburb)) {
      return {
        district: suburb,
        confidence: 'exact',
        source: 'suburb',
        rawValue: suburb,
        notes: 'Suburb is an exact model district match'
      }
    }
  }

  // Strategy 4: Fallback to "Other"
  return {
    district: 'Other',
    confidence: 'fallback',
    source: 'none',
    rawValue: `quarter=${quarter}, neighbourhood=${neighbourhood}, suburb=${suburb}`,
    notes: 'No mapping found - using "Other" as fallback'
  }
}

/**
 * Get all model districts for dropdown/selection
 */
export function getModelDistricts(): string[] {
  return [...MODEL_DISTRICTS, 'Other']
}

/**
 * Check if a district name is valid
 */
export function isValidDistrict(district: string): boolean {
  return MODEL_DISTRICTS.includes(district) || district === 'Other'
}

/**
 * Load user overrides from localStorage and apply them
 */
export function loadDistrictOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const saved = localStorage.getItem('district-mapping-overrides')
  if (!saved) return {}

  try {
    const overrides = JSON.parse(saved)
    const mapping: Record<string, string> = {}

    for (const override of overrides) {
      mapping[override.osm_name] = override.new_district
    }

    return mapping
  } catch (e) {
    console.error('Failed to load district overrides:', e)
    return {}
  }
}

/**
 * Extract district with user overrides applied
 */
export function extractDistrictWithOverrides(address: NominatimAddress): DistrictExtractionResult {
  const result = extractDistrict(address)
  const overrides = loadDistrictOverrides()

  // Check if there's an override for the raw value
  if (result.rawValue && overrides[result.rawValue]) {
    return {
      ...result,
      district: overrides[result.rawValue],
      confidence: 'exact',
      notes: `User override applied: ${result.rawValue} → ${overrides[result.rawValue]}`
    }
  }

  return result
}
