'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Zap, Shield, Activity, BarChart3, ChevronDown, Bell, Sparkles, Layers, Target, Clock, TrendingUp, AlertCircle } from 'lucide-react'

// Merged Version 2: Glassmorphism Style (Lithuanian)
export default function GlassmorphismVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [email, setEmail] = useState('')

  // Radar data for district comparison
  const radarData = [
    { feature: 'Lokacija', A: 88, B: 72, fullMark: 100 },
    { feature: 'Transportas', A: 92, B: 85, fullMark: 100 },
    { feature: 'Infrastruktūra', A: 78, B: 90, fullMark: 100 },
    { feature: 'Mokyklos', A: 85, B: 65, fullMark: 100 },
    { feature: 'Parkai', A: 70, B: 88, fullMark: 100 },
    { feature: 'Kaina/Vertė', A: 95, B: 75, fullMark: 100 }
  ]

  const trendData = [
    { laikotarpis: 'Q1 2023', naujamiestis: 13.2, zirmunai: 11.8, antakalnis: 10.5 },
    { laikotarpis: 'Q2 2023', naujamiestis: 13.5, zirmunai: 12.0, antakalnis: 10.8 },
    { laikotarpis: 'Q3 2023', naujamiestis: 14.0, zirmunai: 12.2, antakalnis: 11.0 },
    { laikotarpis: 'Q4 2023', naujamiestis: 14.3, zirmunai: 12.3, antakalnis: 11.1 },
    { laikotarpis: 'Q1 2024', naujamiestis: 14.8, zirmunai: 12.4, antakalnis: 11.2 }
  ]

  const loadingMessages = [
    { text: 'Krauname duomenų bazę...', icon: '🔄' },
    { text: 'Analizuojame 47 parametrus...', icon: '📊' },
    { text: 'Lyginame su 127,842 būstais...', icon: '🏠' },
    { text: 'Skaičiuojame tikslią vertę...', icon: '💰' },
    { text: 'Generuojame ataskaitą...', icon: '📈' }
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

  const currentMessage = loadingMessages[Math.min(Math.floor((loadingProgress / 100) * loadingMessages.length), loadingMessages.length - 1)]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Glass Header */}
      <header className="relative z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center"
              >
                <Layers className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <span className="text-xl font-bold text-white">TikraKaina</span>
                <span className="text-xs text-white/70 block">6 metų patirtis • Oksfordo studentai</span>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-white/80 hover:text-white text-sm">Pradžia</a>
              <a href="#" className="text-white/80 hover:text-white text-sm">Kainos</a>
              <a href="#" className="text-white/80 hover:text-white text-sm">DUK</a>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-lg border border-white/30 hover:bg-white/30"
              >
                Prisijungti
              </motion.button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 backdrop-blur-xl bg-white/20 rounded-full text-white text-sm mb-6 border border-white/30">
            <Sparkles className="h-4 w-4 mr-2" />
            99.4% tikslumas • 127K+ analizuotų būstų
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Profesionalus NT vertinimas
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Sutaupykite tūkstančius eurų su dirbtinio intelekto pagalba
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Valuation Card */}
          <div className="col-span-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Būsto vertinimas</h2>

              {!loading && !result && (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Aruodas.lt skelbimo nuoroda
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.aruodas.lt/..."
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white placeholder-white/50 focus:border-white/50 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center space-x-2 hover:shadow-2xl transition-shadow"
                    >
                      <Zap className="h-5 w-5" />
                      <span>Analizuoti dabar</span>
                    </motion.button>

                    <div className="flex items-center justify-center space-x-6 text-sm text-white/60">
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Saugu
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        30 sek
                      </span>
                      <span className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        AI modelis
                      </span>
                    </div>
                  </div>
                </form>
              )}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center py-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-white/20 border-t-white"
                    />
                    <div className="text-3xl mb-2">{currentMessage.icon}</div>
                    <p className="text-white/80">{currentMessage.text}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Progresas</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="backdrop-blur-xl bg-white/20 rounded-xl p-6 border border-white/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Vertinimo rezultatai</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">€{result.total_price}</div>
                        <div className="text-sm text-white/60">per mėnesį</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">€{result.price_per_m2}</div>
                        <div className="text-sm text-white/60">už m²</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{result.confidence}%</div>
                        <div className="text-sm text-white/60">tikslumas</div>
                      </div>
                    </div>

                    <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-white/20">
                      <div className="flex items-start space-x-3">
                        <Bell className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white mb-1">Pranešimai apie geras investicijas</h4>
                          <p className="text-sm text-white/70 mb-3">
                            Gaukite pranešimus apie neįvertintus skelbimus ir sutaupykite!
                          </p>
                          <div className="flex space-x-2">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="jusu@email.lt"
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 text-sm"
                            />
                            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium">
                              Užsakyti (€5/mėn)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {setResult(null); setUrl('')}}
                    className="w-full py-3 backdrop-blur-xl bg-white/10 border border-white/30 text-white rounded-xl hover:bg-white/20"
                  >
                    Analizuoti kitą būstą
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Charts */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Rajonų palyginimas</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="feature" tick={{ fill: 'white', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'white', fontSize: 10 }} />
                  <Radar name="Jūsų rajonas" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                  <Radar name="Vidurkis" dataKey="B" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Greita statistika</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Vidutinė kaina</span>
                  <span className="text-white font-bold">€785/mėn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Aktyvūs skelbimai</span>
                  <span className="text-white font-bold">4,287</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Pokytis (mėn)</span>
                  <span className="text-green-400 font-bold">+2.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Tikslumas</span>
                  <span className="text-white font-bold">99.4%</span>
                </div>
              </div>
            </motion.div>

            {/* Trend Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Kainų tendencijos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="laikotarpis" tick={{ fill: 'white', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'white', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Line type="monotone" dataKey="naujamiestis" stroke="#a855f7" strokeWidth={2} />
                  <Line type="monotone" dataKey="zirmunai" stroke="#ec4899" strokeWidth={2} />
                  <Line type="monotone" dataKey="antakalnis" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* CTA */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl p-6 border border-white/20"
            >
              <Target className="h-8 w-8 text-white mb-3" />
              <h4 className="text-white font-semibold mb-2">Premium funkcijos</h4>
              <ul className="text-sm text-white/70 space-y-1 mb-4">
                <li>• Neriboti vertinimai</li>
                <li>• PDF ataskaitos</li>
                <li>• Investicijų pranešimai</li>
                <li>• API prieiga</li>
              </ul>
              <button className="w-full py-2 bg-white/20 backdrop-blur-xl text-white rounded-lg border border-white/30 hover:bg-white/30 text-sm font-medium">
                Išbandyti nemokamai
              </button>
            </motion.div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Dažniausi klausimai</h2>
          
          <div className="max-w-3xl mx-auto">
            <Accordion.Root type="single" collapsible className="space-y-4">
              {[
                {
                  q: 'Ką galiu gauti su TikraKaina?',
                  a: 'Tikslų būsto vertinimą (99.4% tikslumas), detalią rinkos analizę, investicijų rekomendacijas ir pranešimus apie neįvertintus skelbimus realiu laiku.'
                },
                {
                  q: 'Kaip veikia jūsų formulė?',
                  a: 'Naudojame LightGBM AI modelį, apmokytą su 127,842 realių sandorių. Analizuojame 47 parametrus: lokaciją, plotą, infrastruktūrą ir kt.'
                },
                {
                  q: 'Kas jūs esate?',
                  a: 'Du Oksfordo universiteto statistikos studentai iš Lietuvos su 6 metų patirtimi duomenų analizėje ir mašininio mokymosi srityje.'
                },
                {
                  q: 'Kaip veikia investicijų pranešimai?',
                  a: 'Už €5/mėn automatiškai skanuojame naujus skelbimus ir siunčiame pranešimus apie 10-30% neįvertintus būstus. Klientai sutaupo vidutiniškai €200-500/mėn!'
                }
              ].map((item, i) => (
                <Accordion.Item key={i} value={`item-${i}`} className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20">
                  <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-white/5">
                    <span className="text-left font-medium">{item.q}</span>
                    <ChevronDown className="h-5 w-5" />
                  </Accordion.Trigger>
                  <Accordion.Content className="px-6 pb-4 text-white/70">
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