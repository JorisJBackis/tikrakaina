'use client'

import { useState, useEffect } from 'react'
import { Home, Lock, ArrowRight, Check } from 'lucide-react'

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

  const getTierBadge = () => {
    return (
      <span className="absolute top-2 left-2 bg-green-500 text-white p-1.5 rounded-full" title="Patikrintas skelbimas">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    )
  }

  const visibleCount = isAuthenticated ? 4 : 2

  return (
    <div className="mt-4 space-y-3">
      {/* Section Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">
          Panašūs geriausi pasiūlymai
        </h3>
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
                {!isLocked && getTierBadge()}

                {/* Locked Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white/80" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`p-3 space-y-1 ${isLocked ? 'blur-sm' : ''}`}>
                {/* Location */}
                <div className="text-white font-medium text-sm">
                  <div>{listing.district}</div>
                  {listing.street && <div className="text-white/60 text-xs truncate">{listing.street}</div>}
                </div>

                {/* Details */}
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <span>{listing.rooms} kamb.</span>
                  <span className="text-white/40">•</span>
                  <span>{listing.area_m2}m²</span>
                </div>

                {/* Price */}
                <div className="text-green-400 font-bold">
                  €{listing.actual_price}/mėn
                </div>

                {/* Discount from market value */}
                {!isLocked && listing.predicted_price && listing.predicted_price > listing.actual_price && (
                  <div className="text-xs text-green-400">
                    {Math.round((1 - listing.actual_price / listing.predicted_price) * 100)}% pigiau nei rinkos vertė
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
          <p className="text-white font-medium flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Prisijunk ir pamatyk visus geriausius sandorius
          </p>
          <button
            onClick={onRegister}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2.5 px-8 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Registruotis nemokamai
          </button>
        </div>
      )}

      {/* Summary for authenticated users */}
      {isAuthenticated && (
        <div className="text-center text-white/50 text-xs">
          Rasti {listings.length} panašūs patvirtinti pasiūlymai
        </div>
      )}
    </div>
  )
}
