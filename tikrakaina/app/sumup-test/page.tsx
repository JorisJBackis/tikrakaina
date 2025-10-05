'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, RefreshCw, Info, Coins, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface PaymentAttempt {
  ref: string
  amountCents: number
  currency: string
  status: 'INIT' | 'REDIRECTED' | 'PAID' | 'CANCELLED' | 'FAILED'
  transactionCode?: string
  createdAt: string
  updatedAt: string
}

interface PaymentTier {
  id: string
  credits: number
  price: number
  priceDisplay: string
  popular?: boolean
}

const paymentTiers: PaymentTier[] = [
  { id: 'starter', credits: 1, price: 99, priceDisplay: '€0.99' },
  { id: 'value', credits: 7, price: 499, priceDisplay: '€4.99', popular: true },
  { id: 'pro', credits: 20, price: 999, priceDisplay: '€9.99' }
]

export default function SumUpTestPage() {
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<PaymentTier>(paymentTiers[1])
  const [reviewerCredits, setReviewerCredits] = useState(0)

  // Fetch payment attempts and load reviewer credits
  useEffect(() => {
    fetchAttempts()
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/sumup/total-credits`)
      if (response.ok) {
        const data = await response.json()
        setReviewerCredits(data.totalCredits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  const fetchAttempts = async () => {
    try {
      setLoadingAttempts(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/sumup/attempts?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setAttempts(data)
      }
    } catch (error) {
      console.error('Failed to fetch attempts:', error)
    } finally {
      setLoadingAttempts(false)
    }
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/sumup/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountCents: selectedTier.price
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout')
      }

      const data = await response.json()

      // Redirect to SumUp checkout
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

  const resetCredits = () => {
    // For demo purposes, just reset the display
    // In reality, you would need backend admin access to reset credits
    alert('In production, credits are tracked server-side and cannot be reset from the frontend.')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-yellow-500" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'REDIRECTED':
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'REDIRECTED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleString('lt-LT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  return (
    <>
      {/* SEO Meta tags */}
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to VilRent</span>
              </Link>
              <h1 className="text-xl font-semibold">SumUp Verification Gateway</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">SumUp Integration Review</h2>
                <p className="text-blue-800">
                  Test page for SumUp payment gateway integration. Select a credit package and complete payment
                  through SumUp Hosted Checkout. Payments are verified in real-time via webhooks and the
                  SumUp Transactions API. No account required.
                </p>
              </div>
            </div>
          </div>

          {/* Credit Display */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Coins className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Test Credits Balance</p>
                <p className="text-2xl font-semibold text-gray-900">{reviewerCredits}</p>
              </div>
            </div>
          </div>

          {/* Payment Tiers Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Credit Package</h3>
              <p className="text-gray-600">Select amount of credits to purchase for testing</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {paymentTiers.map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTier.id === tier.id
                      ? 'border-green-600 bg-green-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{tier.credits}</div>
                    <div className="text-sm text-gray-600 mb-3">credits</div>
                    <div className="text-2xl font-bold text-green-600">{tier.priceDisplay}</div>
                    {selectedTier.id === tier.id && (
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mt-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handlePayment}
                disabled={loading}
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 space-x-2 text-lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-6 w-6" />
                    <span>Pay {selectedTier.priceDisplay} for {selectedTier.credits} credits</span>
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4">
                Test payment for SumUp verification
              </p>
            </div>
          </div>

          {/* Recent Attempts Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Payment Attempts</h3>
              <button
                onClick={fetchAttempts}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>

            {loadingAttempts ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : attempts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No payment attempts yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ref
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attempts.map((attempt) => (
                      <tr key={attempt.ref} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {attempt.ref.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{attempt.amountCents ? (attempt.amountCents / 100).toFixed(2) : '0.00'} {attempt.currency || 'EUR'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(attempt.status)}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(attempt.status)}`}>
                              {attempt.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {attempt.transactionCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(attempt.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(attempt.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}