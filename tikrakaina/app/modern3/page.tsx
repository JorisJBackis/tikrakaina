'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, RadialBarChart, RadialBar, Legend } from 'recharts'
import { Calculator, ChevronRight, FileText, Gauge, Hash, Info, Landmark, LineChart as LineChartIcon, PieChart, Search, Settings, Shield, TrendingUp } from 'lucide-react'

// Version 3: Data-Driven Business Intelligence Tool
export default function DataDrivenBusinessVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedMetric, setSelectedMetric] = useState('price')

  // Heat map data for districts
  const heatMapData = [
    { district: 'Naujamiestis', mon: 12, tue: 14, wed: 15, thu: 16, fri: 18, sat: 14, sun: 11 },
    { district: 'Žirmūnai', mon: 10, tue: 11, wed: 13, thu: 12, fri: 14, sat: 12, sun: 9 },
    { district: 'Antakalnis', mon: 9, tue: 10, wed: 11, thu: 11, fri: 12, sat: 10, sun: 8 },
    { district: 'Šnipiškės', mon: 11, tue: 13, wed: 14, thu: 14, fri: 15, sat: 13, sun: 10 },
    { district: 'Senamiestis', mon: 14, tue: 16, wed: 17, thu: 17, fri: 19, sat: 16, sun: 13 }
  ]

  const performanceMetrics = [
    { name: 'Q1', actual: 680, predicted: 675, accuracy: 98.5 },
    { name: 'Q2', actual: 720, predicted: 715, accuracy: 98.9 },
    { name: 'Q3', actual: 760, predicted: 758, accuracy: 99.2 },
    { name: 'Q4', actual: 810, predicted: 808, accuracy: 99.4 }
  ]

  const radialData = [
    { name: 'Location Score', value: 88, fill: '#4f46e5' },
    { name: 'Value Score', value: 92, fill: '#06b6d4' },
    { name: 'Demand Score', value: 78, fill: '#10b981' },
    { name: 'Growth Score', value: 85, fill: '#f59e0b' }
  ]

  const marketSegments = [
    { segment: 'Students', percentage: 28, avgBudget: 450, growth: 12 },
    { segment: 'Young Professionals', percentage: 35, avgBudget: 750, growth: 8 },
    { segment: 'Families', percentage: 22, avgBudget: 950, growth: 5 },
    { segment: 'Expats', percentage: 15, avgBudget: 1200, growth: 15 }
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
      }, 30000)
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
        alert('Analysis failed. Please try again.')
      }, 30000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Landmark className="h-6 w-6 text-slate-700" />
                <span className="text-lg font-semibold text-slate-900">TikraKaina Analytics</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">Dashboard</button>
                <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">Markets</button>
                <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">Research</button>
                <button className="text-sm text-slate-600 hover:text-slate-900 font-medium">Reports</button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Search className="h-5 w-5 text-slate-400" />
              <Settings className="h-5 w-5 text-slate-400" />
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Market Cap</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">€2.8B</div>
            <div className="text-xs text-green-600 mt-1">+12.3% YTD</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Listings</span>
              <Hash className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">4,287</div>
            <div className="text-xs text-slate-500 mt-1">Updated hourly</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Price/m²</span>
              <Gauge className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">€12.8</div>
            <div className="text-xs text-amber-600 mt-1">+0.3% MoM</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Model Score</span>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">99.4%</div>
            <div className="text-xs text-slate-500 mt-1">R² = 0.994</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Valuation Tool */}
          <div className="col-span-2 space-y-6">
            {/* Valuation Card */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Instant Valuation</h2>
                  <span className="text-xs text-slate-500">Powered by LightGBM v3.2</span>
                </div>
              </div>
              
              <div className="p-6">
                {!loading && !result && (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Property URL
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.aruodas.lt/..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>Processing: ~30 seconds</span>
                          <span>•</span>
                          <span>127,842 comparables</span>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 transition-colors"
                        >
                          Run Analysis
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {loading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Processing valuation model...</span>
                      <span className="font-mono text-slate-900">{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-slate-900 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {['Data Extract', 'Feature Eng.', 'ML Process', 'Validation'].map((step, idx) => (
                        <div 
                          key={step}
                          className={`text-center py-2 rounded text-xs font-medium ${
                            loadingProgress > (idx + 1) * 25 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Valuation</div>
                          <div className="text-xl font-bold text-slate-900">€{result.total_price}/mo</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Per m²</div>
                          <div className="text-xl font-bold text-slate-900">€{result.price_per_m2}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Confidence</div>
                          <div className="text-xl font-bold text-slate-900">{result.confidence}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50">
                        <FileText className="h-4 w-4 inline mr-2" />
                        Export Report
                      </button>
                      <button
                        onClick={() => {setResult(null); setUrl('')}}
                        className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50"
                      >
                        New Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Model Performance</h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="actual" fill="#475569" />
                    <Bar yAxisId="left" dataKey="predicted" fill="#94a3b8" />
                    <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Segments */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Market Segments</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {marketSegments.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-32">
                          <div className="text-sm font-medium text-slate-900">{segment.segment}</div>
                          <div className="text-xs text-slate-500">€{segment.avgBudget} avg</div>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-slate-100 rounded-full h-6">
                            <div 
                              className="bg-gradient-to-r from-slate-600 to-slate-400 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${segment.percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">{segment.percentage}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${segment.growth > 10 ? 'text-green-600' : 'text-slate-600'}`}>
                            +{segment.growth}%
                          </div>
                          <div className="text-xs text-slate-500">growth</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Analytics */}
          <div className="space-y-6">
            {/* Scoring Radial */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Market Scores</h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={radialData}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {radialData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.fill }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-md transition-colors">
                  <div className="flex items-center">
                    <Calculator className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-sm text-slate-700">Bulk Valuation</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-md transition-colors">
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-sm text-slate-700">Market Report</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-md transition-colors">
                  <div className="flex items-center">
                    <LineChartIcon className="h-4 w-4 text-slate-400 mr-3" />
                    <span className="text-sm text-slate-700">Price Forecast</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">Data Quality</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Our model analyzes 47 features from 127,842 verified property transactions, 
                    achieving 99.4% accuracy with continuous learning updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}