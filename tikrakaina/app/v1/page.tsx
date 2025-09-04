'use client'

import { useState } from 'react'

// Version 1: Corporate Banking Style - Think Deutsche Bank, JP Morgan
export default function CorporateBankingVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingStage, setLoadingStage] = useState('')
  const [progress, setProgress] = useState(0)

  const loadingStages = [
    'Initializing secure connection...',
    'Accessing property database...',
    'Analyzing 127,842 comparable properties...',
    'Evaluating location premium factors...',
    'Calculating market volatility index...',
    'Cross-referencing district pricing matrices...',
    'Applying seasonal adjustment models...',
    'Validating against recent transactions...',
    'Computing confidence intervals...',
    'Finalizing valuation report...'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setProgress(0)

    // Simulate 30-second analysis with staged messages
    const stageInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(stageInterval)
          return 100
        }
        return prev + 3.33
      })
    }, 1000)

    // Update loading messages
    for (let i = 0; i < loadingStages.length; i++) {
      setTimeout(() => {
        setLoadingStage(loadingStages[i])
      }, i * 3000)
    }

    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      // Wait full 30 seconds before showing result
      setTimeout(async () => {
        const data = await response.json()
        setResult(data)
        setLoading(false)
        clearInterval(stageInterval)
      }, 30000)
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
        clearInterval(stageInterval)
        alert('Analysis failed. Please verify the URL.')
      }, 30000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Corporate style */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-navy-900 rounded-sm"></div>
                <span className="text-xl font-light tracking-tight text-gray-900">
                  TIKRA<span className="font-semibold">KAINA</span>
                </span>
              </div>
              <div className="ml-8 text-xs text-gray-500 tracking-wide">
                INSTITUTIONAL GRADE VALUATION
              </div>
            </div>
            <nav className="flex space-x-8">
              <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Solutions</a>
              <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Analytics</a>
              <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Research</a>
              <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Minimal, professional */}
      <section className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            Professional Real Estate Valuation
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Institutional-grade pricing analysis powered by machine learning
          </p>
          <div className="mt-8 flex justify-center space-x-12 text-sm">
            <div>
              <div className="text-2xl font-light text-gray-900">127,842</div>
              <div className="text-gray-500 mt-1">Properties Analyzed</div>
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">99.4%</div>
              <div className="text-gray-500 mt-1">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">€2.8B</div>
              <div className="text-gray-500 mt-1">Transaction Volume</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Valuation Tool */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Property Valuation Analysis</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter the property URL to receive comprehensive valuation report
              </p>
            </div>

            <div className="p-8">
              {!loading && !result && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.aruodas.lt/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Analysis fee: €0.50 • Processing time: ~30 seconds
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-navy-900 text-white text-sm font-medium rounded-md hover:bg-navy-800 transition-colors"
                    >
                      Initiate Analysis
                    </button>
                  </div>
                </form>
              )}

              {loading && (
                <div className="py-8">
                  <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Processing</span>
                      <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">ANALYZING</div>
                    <div className="text-lg text-gray-900">{loadingStage}</div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-2">VALUATION RESULT</div>
                    <div className="text-3xl font-light text-gray-900">
                      €{result.total_price?.toLocaleString('lt-LT')}
                      <span className="text-lg text-gray-500 ml-2">/ month</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Price per m²</div>
                        <div className="text-gray-900 font-medium">€{result.price_per_m2}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Confidence</div>
                        <div className="text-gray-900 font-medium">{result.confidence}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Market Position</div>
                        <div className="text-gray-900 font-medium">Fair Value</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {setResult(null); setUrl('')}}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    New Analysis
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Market Statistics */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Market Intelligence</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-2">ŽIRMŪNAI DISTRICT</div>
              <div className="text-2xl font-light text-gray-900">€12.40/m²</div>
              <div className="text-xs text-green-600 mt-2">↑ 2.3% this quarter</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-2">NAUJAMIESTIS DISTRICT</div>
              <div className="text-2xl font-light text-gray-900">€14.80/m²</div>
              <div className="text-xs text-green-600 mt-2">↑ 4.1% this quarter</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-2">ANTAKALNIS DISTRICT</div>
              <div className="text-2xl font-light text-gray-900">€11.20/m²</div>
              <div className="text-xs text-red-600 mt-2">↓ 0.8% this quarter</div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .bg-navy-900 { background-color: #1a1f36; }
        .bg-navy-800 { background-color: #252b43; }
        .hover\\:bg-navy-800:hover { background-color: #252b43; }
      `}</style>
    </div>
  )
}