'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/supabase'

export default function VilniusMap() {
  const [isExpanded, setIsExpanded] = useState(false)

  const MapIframe = ({ height }: { height: string }) => (
    <iframe
      src="/vilnius_rent_ppm2_by_eldership.html"
      style={{
        height,
        width: '100%',
        border: 'none',
        display: 'block'
      }}
      title="Vilnius Rent Price Map"
    />
  )

  return (
    <>
      <div className="h-[300px] w-full rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <MapIframe height="100%" />
        </div>

        {/* Expand button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsExpanded(true)

            // 📊 Track map expansion
            trackEvent('map_expanded')
          }}
          className="absolute top-2 right-2 bg-white hover:bg-gray-50 p-2 rounded-lg shadow-lg z-[1000] transition-colors pointer-events-auto"
          style={{ position: 'absolute', zIndex: 1000 }}
          aria-label="Išplėsti žemėlapį"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

      </div>

      {/* Expanded modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsExpanded(false)
            }
          }}
        >
          <div
            className="bg-white rounded-xl w-[90%] h-[85vh] relative overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsExpanded(false)
              }}
              className="absolute top-4 right-4 bg-white hover:bg-gray-100 p-3 rounded-lg shadow-xl z-[10000] transition-colors border border-gray-200"
              style={{ position: 'absolute', zIndex: 10000 }}
              aria-label="Uždaryti"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="absolute inset-0">
              <MapIframe height="100%" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
