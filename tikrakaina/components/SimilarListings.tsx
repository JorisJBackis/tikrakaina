'use client'

import { useState, useEffect } from 'react'
import { Home, Check, Lock, Star, ArrowRight, BadgeCheck, ShieldCheck } from 'lucide-react'

interface ValidatedListing {
  listing_id: number
  district: string
  street: string | null
  rooms: number
  area_m2: number
  actual_price: number
  validation_tier: string
  validation_confidence: number
  validation_summary: string
  url: string
  image_url: string | null
  similarity_score?: number
}

interface SimilarListingsProps {
  district: string
  rooms: number
  area_m2: number
  price: number
  onRegister: () => void
  isAuthenticated: boolean
}

export function SimilarListings({
  district,
  rooms,
  area_m2,
  price,
  onRegister,
  isAuthenticated
}: SimilarListingsProps) {
  const [listings, setListings] = useState<ValidatedListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSimilarListings() {
      try {
        setLoading(true)
        const response = await fetch('/api/similar-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ district, rooms, area_m2, price })
        })

        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()
        if (data.success && data.listings) {
          setListings(data.listings)
        }
      } catch (err) {
        console.error('Error fetching similar listings:', err)
        setError('Nepavyko gauti panašių pasiūlymų')
      } finally {
        setLoading(false)
      }
    }

    if (district && rooms && area_m2 && price) {
      fetchSimilarListings()
    }
  }, [district, rooms, area_m2, price])

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-white text-center">
          Ieškome panašių patvirtintų pasiūlymų...
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/5 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || listings.length === 0) {
    return null
  }

  const getTierBadge = (tier: string) => {
    if (tier === 'PATVIRTINTAS') {
      return (
        <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          PATVIRTINTAS
        </span>
      )
    }
    return (
      <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
        <BadgeCheck className="w-3 h-3" />
        GERAS
      </span>
    )
  }

  const visibleCount = isAuthenticated ? 4 : 2

  return (
    <div className="mt-8 space-y-4">
      {/* Section Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
          Panašūs patvirtinti pasiūlymai
        </h3>
        <p className="text-white/60 text-sm">
          Mūsų ekspertų patikrinti skelbimai pagal jūsų paiešką
        </p>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-2 gap-3">
        {listings.slice(0, 4).map((listing, index) => {
          const isLocked = index >= visibleCount

          return (
            <div
              key={listing.listing_id}
              className={`relative bg-white/5 rounded-xl overflow-hidden transition-all hover:bg-white/10 ${
                isLocked ? 'cursor-pointer' : ''
              }`}
              onClick={isLocked ? onRegister : undefined}
            >
              {/* Image Container */}
              <div className="relative h-28 bg-gradient-to-br from-white/10 to-white/5">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={`${listing.district} nuoma`}
                    className={`w-full h-full object-cover ${isLocked ? 'blur-md' : ''}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <Home className="w-8 h-8" />
                  </div>
                )}

                {/* Tier Badge (only visible ones) */}
                {!isLocked && getTierBadge(listing.validation_tier)}

                {/* Locked Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Lock className="w-5 h-5 text-white/80 mb-1" />
                    <span className="text-white text-xs font-medium">+{listings.length - visibleCount} pasiūlymai</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`p-3 space-y-1 ${isLocked ? 'blur-sm' : ''}`}>
                {/* Location */}
                <div className="text-white font-medium text-sm truncate">
                  {listing.district}
                  {listing.street && <span className="text-white/60">, {listing.street}</span>}
                </div>

                {/* Details */}
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <span>{listing.rooms}k</span>
                  <span className="text-white/40">•</span>
                  <span>{listing.area_m2}m²</span>
                </div>

                {/* Price */}
                <div className="text-green-400 font-bold">
                  €{listing.actual_price}/mėn
                </div>

                {/* Confidence Score */}
                {!isLocked && (
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{listing.validation_confidence}% patikimumas</span>
                  </div>
                )}
              </div>

              {/* View Button (only visible ones) */}
              {!isLocked && listing.url && (
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 mx-3 mb-3 bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded-lg transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  Žiūrėti skelbimą
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA for non-authenticated users */}
      {!isAuthenticated && listings.length > 2 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 text-center space-y-3">
          <div className="space-y-1">
            <p className="text-white font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Prisijunk ir pamatyk visus {listings.length} patvirtintus sandorius
            </p>
            <p className="text-white/60 text-sm">
              Mūsų ekspertų patikrinti ir įvertinti butai
            </p>
          </div>
          <button
            onClick={onRegister}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Registruotis nemokamai
          </button>
        </div>
      )}

      {/* Summary for authenticated users */}
      {isAuthenticated && (
        <div className="text-center text-white/50 text-xs">
          Rasta {listings.length} panašūs patvirtinti pasiūlymai
        </div>
      )}
    </div>
  )
}
