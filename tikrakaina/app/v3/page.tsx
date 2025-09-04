'use client'

import { useState } from 'react'

// Version 3: Traditional Real Estate Agency Style - Think Century 21, RE/MAX
export default function TraditionalRealEstateVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingStage, setLoadingStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [showTestimonials, setShowTestimonials] = useState(false)

  const loadingStages = [
    'Accessing property records...',
    'Reviewing neighborhood comparables...',
    'Analyzing recent sales data...',
    'Evaluating property features...',
    'Checking market conditions...',
    'Calculating location premium...',
    'Reviewing school districts...',
    'Assessing transportation access...',
    'Computing final valuation...',
    'Preparing detailed report...'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setProgress(0)

    const stageInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(stageInterval)
          return 100
        }
        return prev + 3.33
      })
    }, 1000)

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
    <div className="min-h-screen bg-white">
      {/* Traditional Real Estate Header */}
      <header className="bg-burgundy-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                <svg className="w-8 h-8 text-burgundy-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold">TikraKaina</div>
                <div className="text-xs tracking-wider">REAL ESTATE VALUATION SERVICES</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="tel:+37060000000" className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1.02A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                </svg>
                <span className="text-sm">+370 600 00000</span>
              </a>
              <button className="bg-gold-500 text-burgundy-900 px-4 py-2 rounded font-bold text-sm">
                SCHEDULE CONSULTATION
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-burgundy-700 to-burgundy-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Professional Property Valuation You Can Trust
          </h1>
          <p className="text-xl mb-8">
            Over 25 Years of Experience • 127,000+ Properties Analyzed • 99.4% Accuracy
          </p>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-400">127,842</div>
              <div className="text-sm">Properties Valued</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-400">€2.8B</div>
              <div className="text-sm">Total Value Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold-400">48hr</div>
              <div className="text-sm">Average Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Valuation Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl border-4 border-burgundy-800">
            <div className="bg-burgundy-800 text-white px-8 py-4">
              <h2 className="text-2xl font-bold">Get Your Free Property Valuation</h2>
              <p className="text-sm mt-1">Instant, accurate, and professional</p>
            </div>

            <div className="p-8">
              {!loading && !result && (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-burgundy-800">Property Information</h3>
                      <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Property Listing URL*
                        </label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.aruodas.lt/..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:border-burgundy-600"
                          required
                        />
                      </div>
                      <div className="bg-gold-50 border-2 border-gold-400 rounded p-4">
                        <p className="text-sm font-bold text-burgundy-800 mb-2">
                          What&apos;s Included:
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>✓ Comprehensive market analysis</li>
                          <li>✓ Comparable property review</li>
                          <li>✓ Investment potential assessment</li>
                          <li>✓ Detailed valuation report</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-burgundy-800">Why Choose Us?</h3>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-burgundy-800">1</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">25+ Years Experience</p>
                            <p className="text-xs text-gray-600">Trusted by thousands of Lithuanian families</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-burgundy-800">2</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">Advanced Technology</p>
                            <p className="text-xs text-gray-600">AI-powered accuracy with human expertise</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-burgundy-800">3</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm">Local Market Knowledge</p>
                            <p className="text-xs text-gray-600">Deep understanding of every Vilnius district</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <button
                      type="submit"
                      className="bg-gold-500 text-burgundy-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gold-400 transform hover:scale-105 transition-all"
                    >
                      GET MY FREE VALUATION NOW
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      No obligation • Results in 30 seconds • 100% Confidential
                    </p>
                  </div>
                </form>
              )}

              {loading && (
                <div className="py-8 text-center">
                  <div className="mb-8">
                    <div className="inline-block bg-burgundy-800 text-white px-6 py-3 rounded-full mb-4">
                      <span className="font-bold">ANALYZING YOUR PROPERTY</span>
                    </div>
                    <div className="max-w-md mx-auto">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="font-bold">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-burgundy-600 to-gold-500 h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 border-4 border-burgundy-800 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-burgundy-800">Our Expert System is:</p>
                        <p className="text-sm text-gray-700">{loadingStage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-burgundy-800 to-burgundy-900 text-white rounded-lg p-8 text-center">
                    <h3 className="text-2xl font-bold mb-2">Your Property Valuation</h3>
                    <div className="text-5xl font-bold text-gold-400 my-4">
                      €{result.total_price?.toLocaleString('lt-LT')}
                    </div>
                    <p className="text-lg">per month</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Price per m²</p>
                      <p className="text-2xl font-bold text-burgundy-800">€{result.price_per_m2}</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Confidence Level</p>
                      <p className="text-2xl font-bold text-burgundy-800">{result.confidence}%</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Market Position</p>
                      <p className="text-2xl font-bold text-burgundy-800">Fair</p>
                    </div>
                  </div>

                  <div className="bg-gold-50 border-2 border-gold-400 rounded-lg p-6">
                    <h4 className="font-bold text-burgundy-800 mb-3">Next Steps:</h4>
                    <ol className="space-y-2 text-sm">
                      <li>1. Schedule a free consultation with our experts</li>
                      <li>2. Get a detailed PDF report with market comparables</li>
                      <li>3. Receive personalized investment recommendations</li>
                    </ol>
                    <button className="mt-4 bg-burgundy-800 text-white px-6 py-3 rounded font-bold hover:bg-burgundy-700">
                      SCHEDULE FREE CONSULTATION
                    </button>
                  </div>

                  <button
                    onClick={() => {setResult(null); setUrl('')}}
                    className="w-full py-3 border-2 border-burgundy-800 text-burgundy-800 rounded hover:bg-burgundy-50"
                  >
                    Analyze Another Property
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center text-burgundy-800 mb-8">
            What Our Clients Say
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3">
                "Saved me €200/month by showing the real value. Professional service!"
              </p>
              <p className="text-xs font-bold">- Jonas P., Vilnius</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3">
                "Accurate valuation helped me negotiate better. Highly recommend!"
              </p>
              <p className="text-xs font-bold">- Rūta K., Kaunas</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3">
                "Fast, reliable, and trustworthy. Best valuation service in Lithuania!"
              </p>
              <p className="text-xs font-bold">- Mindaugas T., Klaipėda</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .bg-burgundy-800 { background-color: #800020; }
        .bg-burgundy-700 { background-color: #900028; }
        .bg-burgundy-900 { background-color: #700018; }
        .text-burgundy-800 { color: #800020; }
        .text-burgundy-900 { color: #700018; }
        .border-burgundy-800 { border-color: #800020; }
        .border-burgundy-600 { border-color: #a00030; }
        .hover\\:bg-burgundy-700:hover { background-color: #900028; }
        .hover\\:bg-burgundy-50:hover { background-color: #fef0f3; }
        .bg-gold-500 { background-color: #FFD700; }
        .bg-gold-400 { background-color: #FFED4E; }
        .bg-gold-50 { background-color: #FFFEF0; }
        .text-gold-400 { color: #FFED4E; }
        .text-gold-500 { color: #FFD700; }
        .border-gold-400 { border-color: #FFED4E; }
        .hover\\:bg-gold-400:hover { background-color: #FFED4E; }
        .from-burgundy-600 { --tw-gradient-from: #a00030; }
        .to-gold-500 { --tw-gradient-to: #FFD700; }
      `}</style>
    </div>
  )
}