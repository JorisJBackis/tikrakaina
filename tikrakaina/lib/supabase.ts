import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
// You need to add these to your .env.local file:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for credits
export async function getUserCredits(userId: string) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching credits:', error)
    return 0
  }
  
  return data?.credits || 0
}

export async function deductCredits(userId: string, creditsToUse: number = 1) {
  console.log('🔵 Attempting to deduct credits:', { userId, creditsToUse })

  // First, check current credits
  const { data: currentData, error: fetchError } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    console.error('❌ Error fetching current credits:', fetchError)
    return false
  }

  console.log('📊 Current credits:', currentData?.credits)

  if (!currentData || currentData.credits < creditsToUse) {
    console.error('❌ Insufficient credits')
    return false
  }

  // Try using RPC function first
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('use_credits', {
      user_id_input: userId,
      credits_to_use: creditsToUse
    })

  if (rpcError) {
    console.error('⚠️ RPC function error, falling back to direct update:', rpcError)

    // Fallback: Direct update if RPC fails
    const newCredits = currentData.credits - creditsToUse
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Direct update also failed:', updateError)
      return false
    }

    console.log('✅ Credits deducted via direct update. New balance:', newCredits)
    return true
  }

  console.log('✅ Credits deducted via RPC. Result:', rpcData)
  return rpcData
}

export async function addCredits(userId: string, creditsToAdd: number) {
  const { data: currentCredits } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()
  
  const newCredits = (currentCredits?.credits || 0) + creditsToAdd
  
  const { data: currentData } = await supabase
    .from('user_credits')
    .select('total_purchased')
    .eq('user_id', userId)
    .single()

  const { error } = await supabase
    .from('user_credits')
    .update({
      credits: newCredits,
      total_purchased: (currentData?.total_purchased || 0) + creditsToAdd
    })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error adding credits:', error)
    return false
  }
  
  return true
}

export async function savePrediction(
  userId: string,
  url: string | null,
  manualData: any,
  result: any,
  isRental: boolean
) {
  const { error } = await supabase
    .from('predictions')
    .insert({
      user_id: userId,
      url,
      manual_data: manualData,
      result,
      is_rental: isRental,
      credits_used: 1
    })
  
  if (error) {
    console.error('Error saving prediction:', error)
    return false
  }
  
  return true
}

// Save rental training data when users say they're renting
export async function saveRentalTrainingData(
  userId: string | null,
  manualData: any,
  actualRentPrice?: number,
  url?: string,
  district?: string,
  notes?: string
) {
  const trainingData = {
    user_id: userId,
    rooms: parseInt(manualData.rooms),
    area_m2: parseFloat(manualData.area_m2),
    floor_current: parseInt(manualData.floor_current),
    floor_total: parseInt(manualData.floor_total),
    year_centered: parseInt(manualData.year_centered),
    dist_to_center_km: parseFloat(manualData.dist_to_center_km),
    has_lift: manualData.has_lift,
    has_balcony_terrace: manualData.has_balcony_terrace,
    has_parking_spot: manualData.has_parking_spot,
    heat_centrinis: manualData.heat_Centrinis,
    heat_dujinis: manualData.heat_Dujinis,
    heat_elektra: manualData.heat_Elektra,
    actual_rent_price: actualRentPrice,
    listing_url: url,
    district: district || manualData.district,
    notes: notes,
    is_verified: true, // True because user confirmed they're renting
    confidence_level: 100,
    source: 'user_renting'
  }
  
  const { data, error } = await supabase
    .from('rental_training_data')
    .insert(trainingData)
    .select()
  
  if (error) {
    console.error('Error saving rental training data:', error)
    return null
  }
  
  console.log('Rental training data saved:', data)
  return data
}

// Get training data statistics
export async function getTrainingDataStats() {
  const { data, error } = await supabase
    .rpc('get_training_data_stats')
  
  if (error) {
    console.error('Error fetching training stats:', error)
    return null
  }
  
  return data?.[0] || null
}