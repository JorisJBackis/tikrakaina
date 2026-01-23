'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface PaymentResult {
  status: 'INIT' | 'REDIRECTED' | 'PAID' | 'CANCELLED' | 'FAILED'
  ref: string
  creditsAdded?: number
}

export default function SumUpCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)

  const ref = searchParams.get('ref')
  const code = searchParams.get('code') // OAuth flow

  useEffect(() => {
    // Handle OAuth callback (has 'code' parameter) - redirect to home
    if (code) {
      router.push('/')
      return
    }

    // Handle payment callback
    if (!ref) {
      router.push('/')
      return
    }

    const fetchStatus = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/payments/sumup/finalize?ref=${ref}`, {
          signal: AbortSignal.timeout(5000)
        })
        const data = await response.json()
        setResult(data)
        setLoading(false)
        return data.status
      } catch (error) {
        console.error('Failed to fetch payment status:', error)
        setResult({ status: 'REDIRECTED', ref })
        setLoading(false)
        return 'REDIRECTED'
      }
    }

    // Initial fetch
    fetchStatus().then(status => {
      // If status is pending, start polling
      if (status === 'REDIRECTED' || status === 'INIT' || status === 'PENDING') {
        const maxPolls = 15
        let polls = 0

        const pollInterval = setInterval(async () => {
          polls++
          setPollCount(polls)

          try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
            const response = await fetch(`${backendUrl}/api/payments/sumup/finalize?ref=${ref}`)
            const data = await response.json()

            if (data.status === 'PAID' || data.status === 'CANCELLED' || data.status === 'FAILED') {
              setResult(data)
              clearInterval(pollInterval)
            } else if (polls >= maxPolls) {
              clearInterval(pollInterval)
            }
          } catch (error) {
            console.error('Polling error:', error)
            if (polls >= maxPolls) {
              clearInterval(pollInterval)
            }
          }
        }, 2000)

        return () => clearInterval(pollInterval)
      }
    })
  }, [ref, code, router])

  // Auto-redirect on success after 3 seconds
  useEffect(() => {
    if (result?.status === 'PAID') {
      const timer = setTimeout(() => {
        router.push('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [result?.status, router])

  const getStatusContent = () => {
    if (loading || !result) {
      return {
        icon: <Loader2 className="h-12 w-12 text-gray-500 animate-spin" />,
        iconBg: 'bg-gray-100',
        title: 'Apdorojama...',
        message: 'Laukiama mokėjimo patvirtinimo...'
      }
    }

    switch (result.status) {
      case 'PAID':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          iconBg: 'bg-green-100',
          title: 'Mokėjimas sėkmingas!',
          message: 'Jūsų analizės pridėtos į paskyrą!'
        }
      case 'CANCELLED':
        return {
          icon: <XCircle className="h-12 w-12 text-yellow-500" />,
          iconBg: 'bg-yellow-100',
          title: 'Mokėjimas atšauktas',
          message: 'Mokėjimas buvo atšauktas.'
        }
      case 'FAILED':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          iconBg: 'bg-red-100',
          title: 'Mokėjimas nepavyko',
          message: 'Mokėjimas nepavyko. Bandykite dar kartą.'
        }
      default:
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          iconBg: 'bg-blue-100',
          title: 'Apdorojama...',
          message: `Laukiama mokėjimo patvirtinimo... (${pollCount}/15)`
        }
    }
  }

  const status = getStatusContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className={`w-20 h-20 ${status.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {status.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {status.title}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {status.message}
        </p>

        {/* Credits Added Badge */}
        {result?.status === 'PAID' && result.creditsAdded && (
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold mb-6">
            +{result.creditsAdded} analizės pridėtos!
          </div>
        )}

        {/* Details */}
        {ref && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Nuoroda:</span>
              <span className="font-mono text-gray-900">{ref.slice(0, 8)}...</span>
            </div>
            {result && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Būsena:</span>
                <span className="font-mono text-gray-900">{result.status}</span>
              </div>
            )}
          </div>
        )}

        {/* Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Grįžti į VilRent
        </button>

        {/* Auto-redirect notice */}
        {result?.status === 'PAID' && (
          <p className="text-sm text-gray-500 mt-4">
            Būsite automatiškai nukreipti po 3 sekundžių...
          </p>
        )}
      </div>
    </div>
  )
}
