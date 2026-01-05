import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Nearby districts mapping for similarity scoring
const NEARBY_DISTRICTS: Record<string, string[]> = {
  'Senamiestis': ['Naujamiestis', 'Užupis', 'Šnipiškės'],
  'Naujamiestis': ['Senamiestis', 'Šnipiškės', 'Žvėrynas'],
  'Šnipiškės': ['Senamiestis', 'Naujamiestis', 'Žirmūnai'],
  'Žvėrynas': ['Naujamiestis', 'Karoliniškės', 'Viršuliškės'],
  'Antakalnis': ['Žirmūnai', 'Verkiai', 'Naujamiestis'],
  'Žirmūnai': ['Šnipiškės', 'Antakalnis', 'Fabijoniškės'],
  'Karoliniškės': ['Žvėrynas', 'Viršuliškės', 'Lazdynai'],
  'Lazdynai': ['Karoliniškės', 'Pilaitė', 'Viršuliškės'],
  'Pilaitė': ['Lazdynai', 'Grigiškės'],
  'Fabijoniškės': ['Žirmūnai', 'Pašilaičiai', 'Baltupiai'],
  'Pašilaičiai': ['Fabijoniškės', 'Tarandė'],
  'Baltupiai': ['Fabijoniškės', 'Verkiai', 'Jeruzalė'],
  'Verkiai': ['Baltupiai', 'Antakalnis', 'Jeruzalė'],
  'Justiniškės': ['Viršuliškės', 'Pašilaičiai'],
  'Viršuliškės': ['Karoliniškės', 'Justiniškės', 'Žvėrynas'],
  'Užupis': ['Senamiestis', 'Antakalnis'],
  'Naujininkai': ['Naujamiestis', 'Rasos'],
  'Rasos': ['Naujininkai', 'Naujoji Vilnia'],
  'Šeškinė': ['Fabijoniškės', 'Žirmūnai', 'Viršuliškės'],
  'Jeruzalė': ['Baltupiai', 'Verkiai', 'Santariškės'],
  'Santariškės': ['Jeruzalė', 'Verkiai'],
  'Naujoji Vilnia': ['Rasos', 'Naujininkai'],
}

interface SimilarityInput {
  district: string
  rooms: number
  area_m2: number
  price: number
}

interface ValidatedListing {
  listing_id: number
  district: string
  street: string | null
  rooms: number
  area_m2: number
  actual_price: number
  predicted_price: number | null
  validation_tier: string
  validation_confidence: number
  validation_summary: string
  url: string
  image_url: string | null
  similarity_score?: number
}

function calculateSimilarityScore(input: SimilarityInput, listing: ValidatedListing): number {
  // Price similarity (50% weight) - most important
  const priceDiffPercent = Math.abs(input.price - listing.actual_price) / input.price * 100
  const priceSimilarity = Math.max(0, 1 - priceDiffPercent / 100)

  // District similarity (30% weight)
  let districtSimilarity = 0
  if (input.district === listing.district) {
    districtSimilarity = 1
  } else if (NEARBY_DISTRICTS[input.district]?.includes(listing.district)) {
    districtSimilarity = 0.3
  }

  // Rooms similarity (10% weight)
  const roomsDiff = Math.abs(input.rooms - listing.rooms)
  let roomsSimilarity = 0
  if (roomsDiff === 0) roomsSimilarity = 1
  else if (roomsDiff === 1) roomsSimilarity = 0.5

  // Area similarity (10% weight)
  const areaDiffPercent = Math.abs(input.area_m2 - listing.area_m2) / input.area_m2 * 100
  const areaSimilarity = Math.max(0, 1 - areaDiffPercent / 50)

  // Weighted score
  const score =
    (50 * priceSimilarity) +
    (30 * districtSimilarity) +
    (10 * roomsSimilarity) +
    (10 * areaSimilarity)

  return Math.round(score * 10) / 10 // Round to 1 decimal
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { district, rooms, area_m2, price } = body

    // Validate required fields
    if (!district || !rooms || !area_m2 || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: district, rooms, area_m2, price' },
        { status: 400 }
      )
    }

    const input: SimilarityInput = {
      district,
      rooms: Number(rooms),
      area_m2: Number(area_m2),
      price: Number(price)
    }

    const supabase = await createClient()

    // Query validated listings with images
    const { data: listings, error } = await supabase
      .rpc('get_validated_listings_with_images')

    if (error) {
      // Fallback to direct query if RPC doesn't exist
      const { data: fallbackListings, error: fallbackError } = await supabase
        .from('deal_analysis')
        .select(`
          listing_id,
          district,
          street,
          rooms,
          area_m2,
          actual_price,
          predicted_price,
          validation_tier,
          validation_confidence,
          validation_summary,
          url
        `)
        .in('validation_tier', ['GERAS', 'PATVIRTINTAS'])
        .not('validation_summary', 'is', null)

      if (fallbackError) {
        console.error('Error fetching listings:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to fetch listings' },
          { status: 500 }
        )
      }

      // Get image URLs from listing_snapshots
      const listingIds = fallbackListings?.map(l => l.listing_id) || []

      const { data: snapshots } = await supabase
        .from('listing_snapshots')
        .select('listing_id, raw_features')
        .in('listing_id', listingIds)

      // Map images to listings
      const listingsWithImages: ValidatedListing[] = (fallbackListings || []).map(listing => {
        const snapshot = snapshots?.find(s => s.listing_id === listing.listing_id)
        const imageUrls = snapshot?.raw_features?.image_urls || []
        const firstImage = imageUrls[0]
          ? imageUrls[0].replace('object_63_', 'object_62_')
          : null

        return {
          ...listing,
          image_url: firstImage
        }
      })

      // Calculate similarity scores and sort
      const scoredListings = listingsWithImages
        .map(listing => ({
          ...listing,
          similarity_score: calculateSimilarityScore(input, listing)
        }))
        .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
        .slice(0, 4) // Top 4

      return NextResponse.json({
        success: true,
        listings: scoredListings,
        input_used: input
      })
    }

    // If RPC exists, use it (we'll create this later if needed)
    return NextResponse.json({
      success: true,
      listings: listings || [],
      input_used: input
    })

  } catch (error) {
    console.error('Similar listings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
