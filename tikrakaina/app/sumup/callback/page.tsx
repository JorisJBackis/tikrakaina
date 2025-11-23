'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SumUpCallback() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const authCode = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(`Authorization failed: ${error}`)
      return
    }

    if (authCode) {
      setCode(authCode)
      exchangeCode(authCode)
    } else {
      setStatus('error')
      setMessage('No authorization code received')
    }
  }, [searchParams])

  const exchangeCode = async (authCode: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/sumup/exchange-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage('Tokens saved successfully! Your payment system is now configured.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to exchange code for tokens')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Network error: Could not connect to backend')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Processing Authorization...</h1>
            <p className="text-gray-600">Exchanging code for tokens</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">Success!</h1>
            <p className="text-lg text-gray-700 mb-6">{message}</p>
            {code && (
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">Authorization Code:</p>
                <code className="text-xs text-gray-800 break-all">{code}</code>
              </div>
            )}
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Return to Home
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-lg text-gray-700 mb-6">{message}</p>
            {code && (
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">Authorization Code (use manually):</p>
                <code className="text-xs text-gray-800 break-all select-all cursor-pointer">{code}</code>
                <p className="text-xs text-gray-500 mt-2">Copy this code and run the exchange script manually</p>
              </div>
            )}
            <a
              href="/"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Return to Home
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
