'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { supabase, getUserCredits } from '@/lib/supabase'

interface UserCreditsProps {
  userId: string
  onBuyCredits: () => void
}

export default function UserCredits({ userId, onBuyCredits }: UserCreditsProps) {
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCredits()
    
    // Subscribe to credit changes
    const channel = supabase
      .channel('credits-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          setCredits(payload.new.credits)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchCredits = async () => {
    setLoading(true)
    const userCredits = await getUserCredits(userId)
    setCredits(userCredits)
    setLoading(false)
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
        <CreditCard className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {loading ? '...' : credits} kreditų
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