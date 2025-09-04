'use client'

import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts'
import { ArrowRight, Award, BarChart2, Bell, Briefcase, Check, ChevronDown, CreditCard, Filter, Globe2, Layers, Monitor, Shield, Star, Zap } from 'lucide-react'

// Version 4: Modern Financial Service Style
export default function ModernFinancialVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showPricing, setShowPricing] = useState(false)

  // Conversion funnel data
  const funnelData = [
    { value: 12500, name: 'Website Visitors', fill: '#e0e7ff' },
    { value: 8750, name: 'Analysis Started', fill: '#c7d2fe' },
    { value: 5200, name: 'Results Viewed', fill: '#a5b4fc' },
    { value: 2800, name: 'Reports Generated', fill: '#818cf8' },
    { value: 1450, name: 'Paid Customers', fill: '#6366f1' }
  ]

  // Supply and demand data
  const supplyDemand = [
    { month: 'Jan', supply: 3200, demand: 3800 },
    { month: 'Feb', supply: 3400, demand: 4100 },
    { month: 'Mar', supply: 3600, demand: 4300 },
    { month: 'Apr', supply: 3750, demand: 4600 },
    { month: 'May', supply: 3900, demand: 4850 },
    { month: 'Jun', supply: 4100, demand: 5100 }
  ]

  // Investment ROI data
  const roiData = [
    { name: 'Naujamiestis', roi: 7.2, risk: 'Low', potential: 85 },
    { name: 'Žirmūnai', roi: 6.8, risk: 'Low', potential: 78 },
    { name: 'Antakalnis', roi: 5.9, risk: 'Medium', potential: 72 },
    { name: 'Šnipiškės', roi: 8.1, risk: 'Medium', potential: 88 },
    { name: 'Vilkpėdė', roi: 9.2, risk: 'High', potential: 92 }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setLoadingProgress(0)

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 3.33
      })
    }, 1000)

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
        setShowPricing(true)
      }, 30000)
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
        alert('Analysis failed. Please try again.')
      }, 30000)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Minimal Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <span className="text-xl font-medium">TikraKaina</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-sm text-gray-600 hover:text-black">Product</a>
                <a href="#" className="text-sm text-gray-600 hover:text-black">Solutions</a>
                <a href="#" className="text-sm text-gray-600 hover:text-black">Pricing</a>
                <a href="#" className="text-sm text-gray-600 hover:text-black">Resources</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-gray-400" />
              <button className="text-sm text-gray-600 hover:text-black">Sign In</button>
              <button className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
            <Zap className="h-4 w-4 mr-1" />
            Trusted by 12,000+ users
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Property Valuation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional-grade rental price analysis powered by advanced machine learning.
            <br />Save thousands with data-driven insights.
          </p>
          
          <div className="flex justify-center space-x-8 mb-12">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">99.4% Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">30-Second Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">127K+ Properties</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Valuation Tool */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="max-w-2xl mx-auto">
              {!loading && !result && (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property URL
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste your aruodas.lt listing URL here"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors font-medium"
                    >
                      Get Instant Valuation
                    </button>
                    
                    <p className="text-center text-sm text-gray-500">
                      First analysis free • No credit card required
                    </p>
                  </div>
                </form>
              )}

              {loading && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Property</h3>
                    <p className="text-sm text-gray-600">This typically takes 30 seconds</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-black h-2 rounded-full transition-all duration-500"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">127K</div>
                      <div className="text-xs text-gray-500">Comparables</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">47</div>
                      <div className="text-xs text-gray-500">Features</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">99.4%</div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Valuation Complete</h3>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900">€{result.total_price}</div>
                      <div className="text-gray-500">per month</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-sm text-gray-500">Price per m²</div>
                        <div className="text-lg font-semibold">€{result.price_per_m2}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Confidence</div>
                        <div className="text-lg font-semibold">{result.confidence}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {showPricing && (
                    <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
                      <h4 className="font-semibold mb-3">Want More Insights?</h4>
                      <ul className="space-y-2 text-sm mb-4">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          Detailed neighborhood analysis
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          Investment ROI projections
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          PDF report with comparables
                        </li>
                      </ul>
                      <button className="w-full py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100">
                        Unlock Full Report - €0.50
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {setResult(null); setUrl(''); setShowPricing(false)}}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Analyze Another Property
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-16 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Market Intelligence</h2>
            <p className="text-gray-600">Real-time insights from Lithuanian rental market</p>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            {/* Supply vs Demand */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Supply vs Demand</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={supplyDemand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="demand" stackId="1" stroke="#10b981" fill="#86efac" />
                  <Area type="monotone" dataKey="supply" stackId="1" stroke="#3b82f6" fill="#93c5fd" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-1"></div>
                  <span>Demand</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-300 rounded-full mr-1"></div>
                  <span>Supply</span>
                </div>
              </div>
            </div>
            
            {/* ROI by District */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Investment ROI</h3>
              <div className="space-y-3">
                {roiData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.risk} risk</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${item.potential}%` }}
                        />
                      </div>
                      <div className="text-sm font-semibold w-12 text-right">{item.roi}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">User Journey</h3>
              <ResponsiveContainer width="100%" height={200}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" fontSize={11} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <Shield className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">99.4%</div>
              <div className="text-sm text-gray-500">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <Globe2 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">127K+</div>
              <div className="text-sm text-gray-500">Properties Analyzed</div>
            </div>
            <div className="text-center">
              <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">€2.8M</div>
              <div className="text-sm text-gray-500">Saved by Users</div>
            </div>
            <div className="text-center">
              <Star className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-500">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600">Choose the plan that fits your needs</p>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Starter</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">€5<span className="text-sm font-normal text-gray-500">/month</span></div>
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />10 valuations</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Basic reports</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Email support</li>
              </ul>
              <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Get Started
              </button>
            </div>
            
            <div className="bg-black rounded-xl p-6 text-white transform scale-105">
              <h3 className="font-semibold mb-2">Professional</h3>
              <div className="text-3xl font-bold mb-4">€19<span className="text-sm font-normal opacity-75">/month</span></div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2" />100 valuations</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2" />Detailed PDF reports</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2" />Priority support</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2" />API access</li>
              </ul>
              <button className="w-full py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100">
                Get Started
              </button>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">€99<span className="text-sm font-normal text-gray-500">/month</span></div>
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Unlimited valuations</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Custom reports</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Dedicated support</li>
                <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />White label</li>
              </ul>
              <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}