'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { supabase, getUserCredits } from '@/lib/supabase'

interface UserCreditsProps {
  userId: string
  onBuyCredits: () => void
}

export default function UserCredits({ userId, onBuyCredits }: UserCreditsProps) {
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCredits = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const userCredits = await getUserCredits(userId)
      setCredits(userCredits)
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchCredits()

    // Subscribe to credit changes for real-time updates
    const channel = supabase
      .channel(`credits-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('Credit change detected:', payload)
          if (payload.new?.credits !== undefined) {
            setCredits(payload.new.credits)
          } else {
            // Fallback: refetch if payload doesn't have credits
            fetchCredits()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchCredits])

  const getCreditText = (count: number) => {
    if (count === 1) return 'analizė'
    if (count >= 10) return 'analizių'
    return 'analizės'
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
        <CreditCard className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {loading ? '...' : `${credits} ${getCreditText(credits)}`}
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