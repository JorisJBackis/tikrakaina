'use client'

import { useEffect, useState } from 'react'

export function ChartsSection() {
  const [trends, setTrends] = useState<any>(null)
  const [districts, setDistricts] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsResponse, districtsResponse] = await Promise.all([
          fetch('http://localhost:8000/api/trends'),
          fetch('http://localhost:8000/api/districts')
        ])
        
        const trendsData = await trendsResponse.json()
        const districtsData = await districtsResponse.json()
        
        setTrends(trendsData)
        setDistricts(districtsData)
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
      }
    }

    fetchData()
  }, [])

  const mockTrends = [
    { month: "2024-01", avg_price: 1450 },
    { month: "2024-02", avg_price: 1520 },
    { month: "2024-03", avg_price: 1480 },
    { month: "2024-04", avg_price: 1610 },
    { month: "2024-05", avg_price: 1680 },
    { month: "2024-06", avg_price: 1750 },
    { month: "2024-07", avg_price: 1820 },
    { month: "2024-08", avg_price: 1890 },
  ]

  const mockDistricts = [
    { district: "Senamiestis", avg_price: 2100, listings: 342 },
    { district: "Žirmūnai", avg_price: 1580, listings: 456 },
    { district: "Antakalnis", avg_price: 1750, listings: 289 },
    { district: "Šnipiškės", avg_price: 1820, listings: 198 },
    { district: "Užupis", avg_price: 1950, listings: 176 },
  ]

  const trendData = trends?.trends || mockTrends
  const districtData = districts?.districts || mockDistricts

  const maxPrice = Math.max(...trendData.map((t: any) => t.avg_price))
  const minPrice = Math.min(...trendData.map((t: any) => t.avg_price))

  return (
    <section className="py-20 bg-slate-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Vilniaus NT Rinkos Analitika
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Realaus laiko duomenys ir tendencijos, padedančios priimti išmintingus sprendimus
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Price trends chart */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl p-8 border border-slate-500/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">📊</span>
              Kainų Dinamika (2024)
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-300 mb-4">
                <span>Vidutinė kaina (EUR/m²)</span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-400 rounded"></span>
                  Tendencija
                </span>
              </div>
              
              {/* Simple SVG chart */}
              <div className="h-48 relative">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="url(#grid)" />
                  
                  {/* Price line */}
                  <polyline
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="3"
                    points={trendData.map((item: any, index: number) => {
                      const x = (index / (trendData.length - 1)) * 380 + 10
                      const y = 180 - ((item.avg_price - minPrice) / (maxPrice - minPrice)) * 160
                      return `${x},${y}`
                    }).join(' ')}
                  />
                  
                  {/* Data points */}
                  {trendData.map((item: any, index: number) => {
                    const x = (index / (trendData.length - 1)) * 380 + 10
                    const y = 180 - ((item.avg_price - minPrice) / (maxPrice - minPrice)) * 160
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#60a5fa"
                        className="hover:r-6 transition-all cursor-pointer"
                      />
                    )
                  })}
                </svg>
              </div>
              
              {/* Month labels */}
              <div className="flex justify-between text-xs text-slate-400">
                {trendData.map((item: any) => (
                  <span key={item.month}>
                    {new Date(item.month).toLocaleDateString('lt-LT', { month: 'short' })}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Districts ranking */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl p-8 border border-slate-500/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">🏘️</span>
              TOP Rajonai
            </h3>
            
            <div className="space-y-4">
              {districtData.slice(0, 5).map((district: any, index: number) => {
                const maxDistrictPrice = Math.max(...districtData.map((d: any) => d.avg_price))
                const percentage = (district.avg_price / maxDistrictPrice) * 100
                
                return (
                  <div key={district.district} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-slate-300">
                          #{index + 1} {district.district}
                        </span>
                        <span className="text-sm text-slate-400">
                          ({district.listings} skelbimai)
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            index === 0 ? 'bg-yellow-400' :
                            index === 1 ? 'bg-blue-400' :
                            index === 2 ? 'bg-green-400' :
                            index === 3 ? 'bg-purple-400' : 'bg-pink-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-white">
                        €{district.avg_price}
                      </div>
                      <div className="text-xs text-slate-400">
                        per m²
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Market insights */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-8 border border-blue-500/20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl mb-2">📈</div>
              <div className="text-lg font-bold text-white">+8.2%</div>
              <div className="text-sm text-slate-300">Augimas per metus</div>
            </div>
            
            <div>
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-lg font-bold text-white">15 dienų</div>
              <div className="text-sm text-slate-300">Vidutinis pardavimo laikas</div>
            </div>
            
            <div>
              <div className="text-2xl mb-2">💡</div>
              <div className="text-lg font-bold text-white">€1,750</div>
              <div className="text-sm text-slate-300">Vidutinė kaina per m²</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}