'use client'

import { useState } from 'react'
import { LoadingAnimation } from './LoadingAnimation'
import { PredictionResult } from './PredictionResult'

interface PredictionFormProps {
  onSubmit: (url: string) => Promise<void>
  isLoading: boolean
  prediction: any
}

export function PredictionForm({ onSubmit, isLoading, prediction }: PredictionFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!url.trim()) {
      setError('Prašome įvesti aruodas.lt nuorodą')
      return
    }

    if (!url.includes('aruodas.lt')) {
      setError('Prašome įvesti galiojančią aruodas.lt nuorodą')
      return
    }

    await onSubmit(url)
  }

  if (isLoading) {
    return <LoadingAnimation />
  }

  if (prediction) {
    return <PredictionResult prediction={prediction} onBack={() => window.location.reload()} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-white/90 mb-2">
          Aruodas.lt skelbimo nuoroda:
        </label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.aruodas.lt/butu-nuoma-vilniuje-..."
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
        />
        {error && (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-pink-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          Pradėti Ekspertizę
        </span>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </button>

      <p className="text-xs text-white/70 text-center">
        Saugus mokėjimas • Momentinis rezultatas • 30 dienų pinigų grąžinimo garantija
      </p>
    </form>
  )
}