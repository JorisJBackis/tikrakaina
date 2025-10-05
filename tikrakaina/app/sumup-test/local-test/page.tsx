'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Info } from 'lucide-react'
import Link from 'next/link'

export default function LocalTestPage() {
  const [ref, setRef] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [status, setStatus] = useState('PAID')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFinalize = async () => {
    if (!ref) {
      alert('Please enter a payment reference')
      return
    }

    try {
      setLoading(true)
      const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/sumup/finalize`)
      url.searchParams.set('ref', ref)
      if (transactionId) {
        url.searchParams.set('transaction_id', transactionId)
      }
      url.searchParams.set('status', status)

      const response = await fetch(url.toString())
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to finalize payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/sumup-test" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to SumUp Test</span>
              </Link>
              <h1 className="text-xl font-semibold">Local Testing Helper</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Local Testing Instructions</h2>
                <ol className="text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Click "Pay €1 with SumUp" on the main test page</li>
                  <li>Copy the payment reference (ref) from the console logs</li>
                  <li>Complete the payment on SumUp</li>
                  <li>After SumUp redirects to production, come back here</li>
                  <li>Paste the ref below and click "Finalize Payment"</li>
                </ol>
                <p className="mt-3 text-sm text-blue-700">
                  This simulates the callback that would normally happen automatically in production.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-xl font-semibold mb-6">Manual Payment Finalization</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (ref) *
                </label>
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g., f8185d24-0b7b-4b0c-9f0e-1dfab1a2486e"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Check console logs after clicking payment button</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g., XUEAYFL90G"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PAID">PAID (Success)</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <button
                onClick={handleFinalize}
                disabled={loading || !ref}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
              >
                {loading ? 'Processing...' : 'Finalize Payment'}
              </button>
            </div>

            {result && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  {result.status === 'PAID' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <h4 className="text-lg font-semibold">Payment Result</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Status:</span> {result.status}
                  </div>
                  <div>
                    <span className="font-medium">Transaction Code:</span> {result.transactionCode || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">SumUp Status:</span> {result.sumupStatus || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Verified:</span> {result.verified ? 'Yes' : 'No'}
                  </div>
                  {result.message && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded">
                      {result.message}
                    </div>
                  )}
                </div>

                <Link href="/sumup-test" className="inline-block mt-6 text-blue-600 hover:text-blue-800">
                  ← Back to main test page
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}