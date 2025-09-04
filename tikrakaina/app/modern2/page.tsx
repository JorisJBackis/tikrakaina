'use client'

import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts'
import { Zap, BarChart3, Clock, Globe, Lock, Cpu, ArrowUpRight, ArrowDownRight, Target, Layers, Grid3x3, Database } from 'lucide-react'

// Version 2: Clean Professional SaaS Style
export default function CleanSaaSVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  // Market data
  const monthlyTrends = [
    { month: 'Jan', rentals: 3200, sales: 890, avgPrice: 680 },
    { month: 'Feb', rentals: 3450, sales: 920, avgPrice: 695 },
    { month: 'Mar', rentals: 3680, sales: 980, avgPrice: 710 },
    { month: 'Apr', rentals: 3890, sales: 1050, avgPrice: 728 },
    { month: 'May', rentals: 4100, sales: 1120, avgPrice: 745 },
    { month: 'Jun', rentals: 4250, sales: 1180, avgPrice: 762 }
  ]

  const districtRadar = [
    { district: 'Location', A: 85, B: 65, fullMark: 100 },
    { district: 'Transport', A: 78, B: 82, fullMark: 100 },
    { district: 'Schools', A: 86, B: 74, fullMark: 100 },
    { district: 'Shopping', A: 92, B: 88, fullMark: 100 },
    { district: 'Parks', A: 68, B: 85, fullMark: 100 },
    { district: 'Safety', A: 89, B: 79, fullMark: 100 }
  ]

  const scatterData = [
    { x: 35, y: 450, z: 1 },
    { x: 45, y: 580, z: 1 },
    { x: 55, y: 690, z: 2 },
    { x: 65, y: 780, z: 2 },
    { x: 75, y: 850, z: 3 },
    { x: 85, y: 920, z: 3 },
    { x: 95, y: 1050, z: 4 },
    { x: 120, y: 1200, z: 4 }
  ]

  const loadingMessages = [
    { progress: 10, message: 'Accessing property database...' },
    { progress: 25, message: 'Extracting 47 property features...' },
    { progress: 40, message: 'Analyzing neighborhood metrics...' },
    { progress: 55, message: 'Processing 127,842 comparables...' },
    { progress: 70, message: 'Running LightGBM model v3.2...' },
    { progress: 85, message: 'Calculating confidence scores...' },
    { progress: 95, message: 'Generating comprehensive report...' },
    { progress: 100, message: 'Analysis complete!' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setLoadingProgress(0)

    // Progressive loading simulation
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += 3.33
      setLoadingProgress(Math.min(currentProgress, 100))
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval)
      }
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
      }, 30000)
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
        alert('Analysis failed. Please try again.')
      }, 30000)
    }
  }

  const getCurrentLoadingMessage = () => {
    const currentMsg = loadingMessages.find(msg => loadingProgress <= msg.progress)
    return currentMsg?.message || 'Processing...'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Clean Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Grid3x3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TikraKaina</h1>
                <p className="text-xs text-gray-500">Intelligent Property Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">System Online</span>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Documentation
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Get API Access
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Valuation Section */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Property Valuation Engine</h2>
            <p className="opacity-90">Advanced ML-powered analysis with 99.4% accuracy</p>
          </div>
          
          <div className="p-6">
            {!loading && !result && (
              <form onSubmit={handleSubmit}>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter property URL from aruodas.lt"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <Globe className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                  >
                    <Zap className="h-5 w-5" />
                    Analyze Now
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      Encrypted
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      30 sec analysis
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="h-4 w-4" />
                      ML Model v3.2
                    </span>
                  </div>
                </div>
              </form>
            )}

            {loading && (
              <div className="space-y-6">
                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Analysis Progress</span>
                    <span className="font-bold text-indigo-600">{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{getCurrentLoadingMessage()}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">127K+</div>
                    <div className="text-xs text-gray-500">Properties Analyzing</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">47</div>
                    <div className="text-xs text-gray-500">Features Processing</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">99.4%</div>
                    <div className="text-xs text-gray-500">Model Accuracy</div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Valuation Results</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">€{result.total_price}</div>
                      <div className="text-sm text-gray-500 mt-1">Monthly Rental Value</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">€{result.price_per_m2}</div>
                      <div className="text-sm text-gray-500 mt-1">Price per m²</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{result.confidence}%</div>
                      <div className="text-sm text-gray-500 mt-1">Confidence Score</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Market Position: <strong>Fair Value</strong></span>
                      <button
                        onClick={() => {setResult(null); setUrl('')}}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        New Analysis →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {['overview', 'trends', 'districts', 'insights'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Market Activity</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgPrice" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Rentals vs Sales Volume</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="rentals" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sales" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {activeTab === 'trends' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Price vs Size Correlation</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="x" name="Size" unit="m²" stroke="#6b7280" fontSize={12} />
                      <YAxis dataKey="y" name="Price" unit="€" stroke="#6b7280" fontSize={12} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Properties" data={scatterData} fill="#6366f1" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700">Market Indicators</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Average Time on Market</span>
                      <span className="text-sm font-semibold">14 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">YoY Price Growth</span>
                      <span className="text-sm font-semibold text-green-600">+8.3%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Inventory Level</span>
                      <span className="text-sm font-semibold">4,250 units</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Absorption Rate</span>
                      <span className="text-sm font-semibold">92%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'districts' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">District Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={districtRadar}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="district" fontSize={12} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
                      <Radar name="Naujamiestis" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <Radar name="Žirmūnai" dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Districts by Demand</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Naujamiestis', demand: 94, price: '€14.8/m²', trend: 'up' },
                      { name: 'Žirmūnai', demand: 87, price: '€12.4/m²', trend: 'up' },
                      { name: 'Šnipiškės', demand: 82, price: '€13.9/m²', trend: 'up' },
                      { name: 'Antakalnis', demand: 76, price: '€11.2/m²', trend: 'down' },
                      { name: 'Senamiestis', demand: 71, price: '€16.2/m²', trend: 'up' }
                    ].map((district) => (
                      <div key={district.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{district.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{district.price}</span>
                              {district.trend === 'up' ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${district.demand}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'insights' && (
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                  <Target className="h-8 w-8 text-indigo-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Best Value Areas</h4>
                  <p className="text-sm text-gray-600">Antakalnis and Vilkpėdė offer best value with growing infrastructure</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                  <Layers className="h-8 w-8 text-green-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Market Trend</h4>
                  <p className="text-sm text-gray-600">Steady 8.3% YoY growth with increased demand for 2-bedroom units</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                  <Database className="h-8 w-8 text-purple-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Data Quality</h4>
                  <p className="text-sm text-gray-600">127,842 verified listings analyzed with 99.4% model accuracy</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}