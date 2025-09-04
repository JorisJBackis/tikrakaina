'use client'

import { useState, useEffect } from 'react'

// Version 4: Bloomberg Terminal / Professional Trading Style
export default function BloombergTerminalVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingStage, setLoadingStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [marketData, setMarketData] = useState({
    listings: 3847,
    avgPrice: 850,
    volatility: 12.3,
    trend: '+2.4%'
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadingStages = [
    '[INIT] Establishing secure connection...',
    '[DATA] Fetching property metadata...',
    '[CALC] Running valuation algorithms...',
    '[ML] Applying neural network model...',
    '[COMP] Analyzing 127,842 comparables...',
    '[GEO] Processing geospatial data...',
    '[RISK] Computing risk metrics...',
    '[STAT] Generating statistical models...',
    '[VAL] Finalizing valuation matrix...',
    '[DONE] Compilation complete.'
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
        alert('SYSTEM ERROR: Analysis failed.')
      }, 30000)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <header className="bg-gray-900 border-b border-green-400">
        <div className="px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-orange-400 font-bold">TIKRAKAINA</span>
              <span className="text-xs">TERMINAL v12.3.1</span>
              <span className="text-xs text-yellow-400">VILNIUS</span>
            </div>
            <div className="flex items-center space-x-6 text-xs">
              <span>{currentTime.toLocaleTimeString('en-GB')}</span>
              <span>{currentTime.toLocaleDateString('en-GB')}</span>
              <span className="text-yellow-400">USER: ANALYST_01</span>
              <span className="text-red-400">● LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex h-[calc(100vh-40px)]">
        {/* Left Panel - Market Data */}
        <div className="w-1/4 border-r border-green-400 p-2">
          <div className="border border-green-400 mb-2">
            <div className="bg-green-400 text-black px-2 py-1 text-xs font-bold">
              MARKET OVERVIEW
            </div>
            <div className="p-2 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>ACTIVE LISTINGS</span>
                <span className="text-white">{marketData.listings}</span>
              </div>
              <div className="flex justify-between">
                <span>AVG RENTAL</span>
                <span className="text-white">€{marketData.avgPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>VOLATILITY</span>
                <span className="text-yellow-400">{marketData.volatility}%</span>
              </div>
              <div className="flex justify-between">
                <span>30D TREND</span>
                <span className="text-green-400">{marketData.trend}</span>
              </div>
            </div>
          </div>

          <div className="border border-green-400 mb-2">
            <div className="bg-green-400 text-black px-2 py-1 text-xs font-bold">
              TOP DISTRICTS
            </div>
            <div className="p-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>NAUJAMIESTIS</span>
                <span className="text-white">€14.8/m²</span>
              </div>
              <div className="flex justify-between">
                <span>ŽIRMŪNAI</span>
                <span className="text-white">€12.4/m²</span>
              </div>
              <div className="flex justify-between">
                <span>ANTAKALNIS</span>
                <span className="text-white">€11.2/m²</span>
              </div>
              <div className="flex justify-between">
                <span>ŠNIPIŠKĖS</span>
                <span className="text-white">€13.9/m²</span>
              </div>
            </div>
          </div>

          <div className="border border-green-400">
            <div className="bg-green-400 text-black px-2 py-1 text-xs font-bold">
              SYSTEM STATUS
            </div>
            <div className="p-2 space-y-1 text-xs">
              <div>CPU: <span className="text-white">23%</span></div>
              <div>MEM: <span className="text-white">4.2GB/16GB</span></div>
              <div>QUEUE: <span className="text-white">0</span></div>
              <div>UPTIME: <span className="text-white">47d 13h 22m</span></div>
            </div>
          </div>
        </div>

        {/* Center Panel - Main Interface */}
        <div className="flex-1 p-4">
          <div className="border border-green-400 h-full flex flex-col">
            <div className="bg-green-400 text-black px-2 py-1 text-xs font-bold flex justify-between">
              <span>VALUATION ENGINE</span>
              <span>MODEL: LIGHTGBM_V3.2</span>
            </div>
            
            <div className="flex-1 p-4">
              {!loading && !result && (
                <div>
                  <div className="mb-4">
                    <div className="text-xs mb-2">ENTER PROPERTY URL FOR ANALYSIS:</div>
                    <form onSubmit={handleSubmit} className="flex space-x-2">
                      <span className="text-orange-400">&gt;</span>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.aruodas.lt/..."
                        className="flex-1 bg-transparent border-b border-green-400 outline-none text-white"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-1 border border-green-400 hover:bg-green-400 hover:text-black transition-colors text-xs"
                      >
                        EXECUTE
                      </button>
                    </form>
                  </div>

                  <div className="text-xs space-y-1 opacity-50">
                    <div>COMMANDS:</div>
                    <div>  /analyze [url] - Run valuation analysis</div>
                    <div>  /stats - View market statistics</div>
                    <div>  /export - Export results to CSV</div>
                    <div>  /help - Show all commands</div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  <div className="text-xs">
                    <div className="mb-2">PROCESSING REQUEST...</div>
                    <div className="flex space-x-4">
                      <div className="w-24">PROGRESS:</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-800 h-2">
                            {[...Array(50)].map((_, i) => (
                              <span
                                key={i}
                                className={`inline-block w-[2%] h-full ${
                                  i < progress / 2 ? 'bg-green-400' : ''
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-white">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-3 text-xs">
                    <div className="space-y-1">
                      {loadingStage && (
                        <div className="text-white">
                          <span className="text-green-400">$</span> {loadingStage}
                        </div>
                      )}
                      <div className="animate-pulse">_</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="border border-gray-700 p-2">
                      <div className="text-gray-500 mb-1">SAMPLES PROCESSED</div>
                      <div className="text-white text-lg">
                        {Math.floor(progress * 1278.42)}
                      </div>
                    </div>
                    <div className="border border-gray-700 p-2">
                      <div className="text-gray-500 mb-1">CONFIDENCE BUILD</div>
                      <div className="text-white text-lg">
                        {Math.min(99.4, progress * 0.994).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="border border-green-400 p-4">
                    <div className="text-xs mb-3 text-gray-500">
                      ANALYSIS COMPLETE - {new Date().toISOString()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">PREDICTED VALUE</div>
                        <div className="text-3xl text-white font-bold">
                          €{result.total_price}
                        </div>
                        <div className="text-xs text-gray-500">PER MONTH</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">PRICE/M²</div>
                        <div className="text-3xl text-white font-bold">
                          €{result.price_per_m2}
                        </div>
                        <div className="text-xs text-gray-500">SQUARE METER</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">CONFIDENCE</div>
                        <div className="text-white">{result.confidence}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">DEVIATION</div>
                        <div className="text-white">±€42.3</div>
                      </div>
                      <div>
                        <div className="text-gray-500">PERCENTILE</div>
                        <div className="text-white">P47</div>
                      </div>
                      <div>
                        <div className="text-gray-500">RATING</div>
                        <div className="text-yellow-400">FAIR</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {setResult(null); setUrl('')}}
                      className="px-4 py-1 border border-green-400 hover:bg-green-400 hover:text-black transition-colors text-xs"
                    >
                      NEW ANALYSIS
                    </button>
                    <button className="px-4 py-1 border border-green-400 hover:bg-green-400 hover:text-black transition-colors text-xs">
                      EXPORT CSV
                    </button>
                    <button className="px-4 py-1 border border-green-400 hover:bg-green-400 hover:text-black transition-colors text-xs">
                      GENERATE REPORT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Live Feed */}
        <div className="w-1/4 border-l border-green-400 p-2">
          <div className="border border-green-400 mb-2">
            <div className="bg-green-400 text-black px-2 py-1 text-xs font-bold">
              LIVE FEED
            </div>
            <div className="p-2 space-y-1 text-xs h-48 overflow-y-auto">
              <div className="text-gray-500">[14:23:45] New listing: Žirmūnai 2BR €750</div>
              <div className="text-gray-500">[14:23:12] Price drop: Naujamiestis -5%</div>
              <div className="text-gray-500">[14:22:58] Analysis completed: ID#4821</div>
              <div className="text-gray-500">[14:22:31] New listing: Antakalnis 3BR €920</div>
              <div className="text-gray-500">[14:22:05] Market alert: High demand Šnipiškės</div>
              <div className="text-gray-500">[14:21:44] Price increase: Senamiestis +3%</div>
              <div className="text-gray-500">[14:21:22] Analysis completed: ID#4820</div>
              <div className="text-gray-500">[14:20:55] New listing: Pašilaičiai 1BR €450</div>
            </div>
          </div>

          <div className="border border-green-400">
            <div className="bg-green-400 text-black px-2 py-1 text-xs font-bold">
              QUICK STATS
            </div>
            <div className="p-2 space-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>24H ANALYSES</span>
                  <span className="text-white">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span>AVG RESPONSE</span>
                  <span className="text-white">28.3s</span>
                </div>
                <div className="flex justify-between">
                  <span>ACCURACY</span>
                  <span className="text-white">99.4%</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="text-gray-500 mb-1">MARKET HEAT</div>
                <div className="flex space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 w-full ${
                        i < 7 ? 'bg-green-400' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-right text-white mt-1">70%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}