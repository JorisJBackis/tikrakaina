'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Check } from 'lucide-react'
import { supabase, addCredits } from '@/lib/supabase'

interface BuyCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

const creditPackages = [
  {
    id: 'starter',
    credits: 12,
    price: 5,
    pricePerCredit: 0.42,
    popular: false
  },
  {
    id: 'pro',
    credits: 30,
    price: 10,
    pricePerCredit: 0.33,
    popular: true,
    savings: '20%'
  },
  {
    id: 'enterprise',
    credits: 100,
    price: 25,
    pricePerCredit: 0.25,
    popular: false,
    savings: '40%'
  }
]

export default function BuyCreditsModal({ isOpen, onClose, userId }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePurchase = async () => {
    setLoading(true)
    
    try {
      // In production, integrate with Stripe here
      // For now, we'll just add credits directly
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add credits to user account
      const added = await addCredits(userId, selectedPackage.credits)
      
      if (added) {
        // Save purchase record
        await supabase
          .from('credit_purchases')
          .insert({
            user_id: userId,
            credits_amount: selectedPackage.credits,
            price_paid: selectedPackage.price,
            payment_method: 'demo' // In production: 'stripe'
          })
        
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Įvyko klaida. Bandykite dar kartą.')
    } finally {
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
            <h2 className="text-2xl font-bold text-gray-900">Pirkti kreditus</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {!success ? (
            <>
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
                      <div className="text-sm text-gray-500 mb-3">kreditų</div>
                      
                      <div className="text-2xl font-bold text-gray-900">
                        €{pkg.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        €{pkg.pricePerCredit.toFixed(2)}/kreditas
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
                      {selectedPackage.credits} kreditų už €{selectedPackage.price}
                    </p>
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>{loading ? 'Apdorojama...' : 'Pirkti dabar'}</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  * Demo režimas - mokėjimas simuliuojamas. Produkcijoje bus integruota Stripe.
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mokėjimas sėkmingas!
              </h3>
              <p className="text-gray-600">
                {selectedPackage.credits} kreditai pridėti į jūsų paskyrą.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}