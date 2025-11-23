'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Check, RefreshCw } from 'lucide-react'

interface BuyCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

const creditPackages = [
  {
    id: 'starter',
    credits: 1,
    price: 99, // cents
    priceDisplay: '€0.99',
    pricePerCredit: 0.99,
    popular: false
  },
  {
    id: 'pro',
    credits: 7,
    price: 499, // cents
    priceDisplay: '€4.99',
    pricePerCredit: 0.71,
    popular: true,
    savings: '28%'
  },
  {
    id: 'enterprise',
    credits: 20,
    price: 999, // cents
    priceDisplay: '€9.99',
    pricePerCredit: 0.50,
    popular: false,
    savings: '50%'
  }
]

// Lithuanian grammar for "analizė"
const getAnalizeWord = (count: number) => {
  if (count === 1) return 'analizė'
  if (count >= 2 && count <= 9) return 'analizės'
  return 'analizių'
}

export default function BuyCreditsModal({ isOpen, onClose, userId }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/sumup/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountCents: selectedPackage.price,
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout')
      }

      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-2xl w-full p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pirkti analizes</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  selectedPackage.id === pkg.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      Populiariausias
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {pkg.credits}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">{getAnalizeWord(pkg.credits)}</div>

                  <div className="text-2xl font-bold text-gray-900">
                    {pkg.priceDisplay}
                  </div>
                  <div className="text-xs text-gray-500">
                    €{pkg.pricePerCredit.toFixed(2)}/analizė
                  </div>

                  {pkg.savings && (
                    <div className="mt-2 text-xs font-medium text-green-600">
                      Sutaupote {pkg.savings}
                    </div>
                  )}
                </div>

                {selectedPackage.id === pkg.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Pasirinkta:</p>
                <p className="font-medium text-gray-900">
                  {selectedPackage.credits} {getAnalizeWord(selectedPackage.credits)} už {selectedPackage.priceDisplay}
                </p>
              </div>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Apdorojama...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pirkti dabar</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Saugus mokėjimas per SumUp
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
