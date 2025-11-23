'use client'

import { createClient } from './supabase/client'

// Create client instance
export const supabase = createClient()

// Helper functions for credits
export async function getUserCredits(userId: string): Promise<number> {
  if (!userId) {
    console.error('getUserCredits: No userId provided')
    return 0
  }

  console.log('Fetching credits for user:', userId)

  try {
    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Credit fetch timeout')), 5000)
    )

    const fetchPromise = supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

    if (error) {
      console.error('Error fetching credits:', error)
      return 0
    }

    console.log('Credits fetched:', data?.credits)
    return data?.credits || 0
  } catch (err) {
    console.error('Credits fetch failed:', err)
    return 0
  }
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

// Save rental training data when users enter manual data with price
export async function saveRentalTrainingData(
  userId: string | null,
  manualData: any,
  actualRentPrice?: number,
  url?: string,
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
    district: manualData.district,
    address: manualData.address, // Include address field
    notes: notes,
    is_verified: actualRentPrice ? true : false, // Verified if user provided price
    confidence_level: actualRentPrice ? 100 : 50,
    source: actualRentPrice ? 'user_with_price' : 'user_no_price'
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

// Save newsletter signup
export async function saveNewsletterSignup(email: string) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )

    const insertPromise = supabase
      .from('newsletter_signups')
      .insert({
        email: email.toLowerCase().trim(),
        source: 'results_page'
      })

    const { error } = await Promise.race([insertPromise, timeoutPromise]) as any

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return { success: false, error: 'Email already subscribed' }
      }
      console.error('Error saving newsletter signup:', error)
      return { success: false, error: 'Failed to subscribe' }
    }

    console.log('Newsletter signup saved successfully')
    return { success: true }
  } catch (err: any) {
    console.error('Newsletter signup exception:', err)
    if (err.message === 'Request timeout') {
      return { success: false, error: 'Request timeout - please try again' }
    }
    return { success: false, error: 'Failed to subscribe' }
  }
}

// ============================================
// ANALYTICS EVENT TRACKING
// ============================================

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  const storageKey = 'analytics_session_id'
  let sessionId = sessionStorage.getItem(storageKey)

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(storageKey, sessionId)
  }

  return sessionId
}

// Track custom analytics event
export async function trackEvent(
  eventName: string,
  eventData?: Record<string, any>,
  userId?: string | null
) {
  // Don't track events server-side
  if (typeof window === 'undefined') return

  const sessionId = getSessionId()
  const userAgent = navigator.userAgent
  const pageUrl = window.location.href

  const event = {
    event_name: eventName,
    user_id: userId || null,
    session_id: sessionId,
    event_data: eventData || {},
    user_agent: userAgent,
    page_url: pageUrl
  }

  // Fire and forget - don't await
  supabase
    .from('analytics_events')
    .insert(event)
    .then(({ error }) => {
      if (error) {
        console.error('Analytics tracking error:', error)
      } else {
        console.log('📊 Event tracked:', eventName, eventData)
      }
    })
}

// Get analytics stats (admin only)
export async function getAnalyticsStats(startDate?: string, endDate?: string) {
  const query = supabase
    .from('analytics_events')
    .select('event_name, created_at, user_id, event_data')
    .order('created_at', { ascending: false })

  if (startDate) {
    query.gte('created_at', startDate)
  }

  if (endDate) {
    query.lte('created_at', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching analytics:', error)
    return null
  }

  return data
}