'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserCreditsProps {
  userId: string
  onBuyCredits: () => void
}

export default function UserCredits({ userId, onBuyCredits }: UserCreditsProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCredits = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    console.log('UserCredits: Fetching for', userId)

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching credits:', error)
        setCredits(0)
      } else {
        setCredits(data?.credits || 0)
      }
    } catch (error) {
      console.error('Credits fetch exception:', error)
      setCredits(0)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchCredits()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log('Credits updated:', payload)
          if (payload.new?.credits !== undefined) {
            setCredits(payload.new.credits)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchCredits])

  const getCreditText = (count: number) => {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    // Numbers ending in 1 (except 11): analizė
    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return 'analizė'
    }

    // Numbers 10-20: analizių
    if (lastTwoDigits >= 10 && lastTwoDigits <= 20) {
      return 'analizių'
    }

    // Numbers ending in 0: analizių
    if (lastDigit === 0) {
      return 'analizių'
    }

    // Numbers ending in 2-9: analizės
    return 'analizės'
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
        <CreditCard className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {loading || credits === null ? '...' : `${credits} ${getCreditText(credits)}`}
        </span>
      </div>
      <button
        onClick={onBuyCredits}
        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        <span>Pirkti</span>
      </button>
    </div>
  )
}