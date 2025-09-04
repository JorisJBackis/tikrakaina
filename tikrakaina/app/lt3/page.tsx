'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Zap, TrendingUp, Shield, Globe, ChevronDown, Bell, Cpu, DollarSign, Users, Target, ArrowUpRight, Database, Layers, Activity } from 'lucide-react'

// Merged Version 3: Bento Grid Layout (Lithuanian)
export default function BentoGridVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Data for various charts
  const roomTypes = [
    { name: '1 kamb.', value: 28, kaina: 450 },
    { name: '2 kamb.', value: 42, kaina: 650 },
    { name: '3 kamb.', value: 22, kaina: 850 },
    { name: '4+ kamb.', value: 8, kaina: 1200 }
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

  const investmentData = [
    { rajonas: 'Naujamiestis', roi: 7.2, rizika: 2 },
    { rajonas: 'Žirmūnai', roi: 6.8, rizika: 2 },
    { rajonas: 'Antakalnis', roi: 5.9, rizika: 3 },
    { rajonas: 'Šnipiškės', roi: 8.1, rizika: 3 },
    { rajonas: 'Vilkpėdė', roi: 9.2, rizika: 4 }
  ]

  const dailyActivity = [
    { val: 'Pr', skelbimai: 45, perziuros: 1200 },
    { val: 'An', skelbimai: 52, perziuros: 1450 },
    { val: 'Tr', skelbimai: 48, perziuros: 1380 },
    { val: 'Kt', skelbimai: 61, perziuros: 1680 },
    { val: 'Pn', skelbimai: 72, perziuros: 1920 },
    { val: 'Šš', skelbimai: 58, perziuros: 1560 },
    { val: 'Sk', skelbimai: 41, perziuros: 980 }
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
        alert('Analizė nepavyko. Bandykite dar kartą.')
      }, 30000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">TikraKaina</span>
                <span className="text-xs text-gray-500 block">6 metų patirtis • Oksfordo studentai</span>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-sm text-gray-600 hover:text-black">Sprendimai</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black">Kainos</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black">API</a>
              <button className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-900">
                Pradėti
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4 auto-rows-[200px]">
          
          {/* Main Valuation Tool - Large */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-2 row-span-2 bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Būsto vertinimas</h2>
            
            {!loading && !result && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Aruodas.lt nuoroda
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.aruodas.lt/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-3 bg-black text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-900"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Analizuoti dabar</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                    <div>
                      <Shield className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                      99.4% tikslumas
                    </div>
                    <div>
                      <Cpu className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                      AI modelis
                    </div>
                    <div>
                      <Activity className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                      30 sek analizė
                    </div>
                  </div>
                </div>
              </form>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  <motion.div 
                    className="absolute inset-0 border-4 border-black rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-gray-600 mb-2">Analizuojame...</p>
                <p className="text-2xl font-bold">{Math.round(loadingProgress)}%</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">€{result.total_price}</div>
                      <div className="text-xs text-gray-500">per mėnesį</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">€{result.price_per_m2}</div>
                      <div className="text-xs text-gray-500">už m²</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{result.confidence}%</div>
                      <div className="text-xs text-gray-500">tikslumas</div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {setResult(null); setUrl('')}}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Naujas vertinimas
                </button>
              </div>
            )}
          </motion.div>

          {/* Live Stats - Tall */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 row-span-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-sm"
          >
            <h3 className="text-lg font-bold mb-4">Realaus laiko statistika</h3>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold">4,287</div>
                <div className="text-sm opacity-80">Aktyvūs skelbimai</div>
              </div>
              <div>
                <div className="text-3xl font-bold">€785</div>
                <div className="text-sm opacity-80">Vidutinė kaina</div>
              </div>
              <div>
                <div className="text-3xl font-bold flex items-center">
                  +2.3%
                  <ArrowUpRight className="h-5 w-5 ml-1" />
                </div>
                <div className="text-sm opacity-80">Pokytis per mėnesį</div>
              </div>
              <div>
                <div className="text-3xl font-bold">127K+</div>
                <div className="text-sm opacity-80">Analizuota būstų</div>
              </div>
            </div>
          </motion.div>

          {/* Room Distribution - Wide */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-1 row-span-1 bg-white rounded-2xl p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold mb-2">Būstų tipai</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={roomTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {roomTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Daily Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-2 row-span-1 bg-white rounded-2xl p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold mb-2">Savaitės aktyvumas</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="val" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="skelbimai" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Investment ROI */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1 row-span-1 bg-white rounded-2xl p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold mb-3">Investicijų grąža</h3>
            <div className="space-y-2">
              {investmentData.slice(0, 3).map((item) => (
                <div key={item.rajonas} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{item.rajonas}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${item.roi * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">{item.roi}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Notification Signup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="col-span-2 row-span-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Investicijų pranešimai</h3>
                <p className="text-sm opacity-90">Gaukite pranešimus apie neįvertintus skelbimus!</p>
                <p className="text-xs opacity-80 mt-1">Sutaupykite iki €500/mėn • Tik €5/mėn</p>
              </div>
              <div className="flex items-center space-x-2">
                <Bell className="h-8 w-8" />
                <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 text-sm font-medium">
                  Užsakyti
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="col-span-1 row-span-1 bg-black rounded-2xl p-4 text-white shadow-sm"
          >
            <h3 className="text-sm font-bold mb-3">Greiti veiksmai</h3>
            <div className="space-y-2">
              <button className="w-full py-2 bg-white/10 rounded-lg hover:bg-white/20 text-xs text-left px-3">
                PDF ataskaita
              </button>
              <button className="w-full py-2 bg-white/10 rounded-lg hover:bg-white/20 text-xs text-left px-3">
                API dokumentacija
              </button>
              <button className="w-full py-2 bg-white/10 rounded-lg hover:bg-white/20 text-xs text-left px-3">
                Bulk analizė
              </button>
            </div>
          </motion.div>

          {/* Trust Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="col-span-1 row-span-1 bg-gray-900 rounded-2xl p-4 text-white shadow-sm flex flex-col justify-center items-center text-center"
          >
            <Target className="h-8 w-8 mb-2" />
            <div className="text-2xl font-bold">99.4%</div>
            <div className="text-xs opacity-80">Tikslumas</div>
            <div className="text-xs opacity-60 mt-1">6 metų patirtis</div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Dažniausi klausimai</h2>
          
          <div className="max-w-3xl mx-auto">
            <Accordion.Root type="single" collapsible className="space-y-3">
              {[
                {
                  q: 'Ką galiu gauti su TikraKaina?',
                  a: 'Tikslų būsto vertinimą, rinkos analizę, investicijų rekomendacijas, PDF ataskaitas ir pranešimus apie neįvertintus skelbimus.'
                },
                {
                  q: 'Kokia jūsų formulė?',
                  a: 'LightGBM AI modelis, apmokytas su 127,842 sandorių. Analizuojame 47 parametrus su 99.4% tikslumu (R² = 0.994).'
                },
                {
                  q: 'Kas esate?',
                  a: 'Du Oksfordo universiteto statistikos studentai iš Lietuvos. 6 metų patirtis duomenų analizėje ir mašininio mokymosi srityje.'
                },
                {
                  q: 'Kaip veikia pranešimai?',
                  a: 'Už €5/mėn skanuojame naujus skelbimus ir siunčiame pranešimus apie 10-30% neįvertintus būstus. Sutaupykite iki €500/mėn!'
                }
              ].map((item, i) => (
                <Accordion.Item key={i} value={`item-${i}`} className="bg-white rounded-xl p-1">
                  <Accordion.Trigger className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg">
                    <span className="text-left font-medium text-gray-900">{item.q}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Accordion.Trigger>
                  <Accordion.Content className="px-5 pb-3 text-gray-600 text-sm">
                    {item.a}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </section>
      </div>
    </div>
  )
}