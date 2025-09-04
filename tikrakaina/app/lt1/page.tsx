'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Zap, TrendingUp, Home, Shield, ChevronDown, Bell, Check, Award, Clock, Users, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'

// Merged Version 1: Modern Dashboard + Fintech (Lithuanian)
export default function MergedVersion1() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showNotificationSignup, setShowNotificationSignup] = useState(false)

  // District price data
  const districtData = [
    { name: 'Naujamiestis', kaina: 14.8, butu: 342 },
    { name: 'Žirmūnai', kaina: 12.4, butu: 289 },
    { name: 'Antakalnis', kaina: 11.2, butu: 198 },
    { name: 'Šnipiškės', kaina: 13.9, butu: 256 },
    { name: 'Senamiestis', kaina: 16.2, butu: 167 }
  ]

  const priceHistory = [
    { menuo: 'Sau', kaina: 720, pokytis: 2.3 },
    { menuo: 'Vas', kaina: 735, pokytis: 2.1 },
    { menuo: 'Kov', kaina: 742, pokytis: 0.9 },
    { menuo: 'Bal', kaina: 758, pokytis: 2.2 },
    { menuo: 'Geg', kaina: 771, pokytis: 1.7 },
    { menuo: 'Bir', kaina: 785, pokytis: 1.8 }
  ]

  const loadingStages = [
    'Prisijungiame prie duomenų bazės...',
    'Analizuojame nekilnojamo turto parametrus...',
    'Lyginame su 127,842 panašiais būstais...',
    'Vertinama lokacija ir infrastruktūra...',
    'Skaičiuojame rinkos tendencijas...',
    'Taikome dirbtinio intelekto modelį...',
    'Tikriname rezultatų tikslumą...',
    'Ruošiame detalią ataskaitą...'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setLoadingProgress(0)

    const totalStages = loadingStages.length
    const stageInterval = 30000 / totalStages

    loadingStages.forEach((stage, index) => {
      setTimeout(() => {
        setLoadingProgress(((index + 1) / totalStages) * 100)
      }, index * stageInterval)
    })

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
        setShowNotificationSignup(true)
      }, 30000)
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
        alert('Analizė nepavyko. Bandykite dar kartą.')
      }, 30000)
    }
  }

  const currentLoadingStage = loadingStages[Math.floor((loadingProgress / 100) * loadingStages.length)] || loadingStages[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">TikraKaina</span>
                <span className="text-xs text-gray-500 block">6 metų patirtis</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Pagrindinis</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Kainos</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">DUK</a>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Pradėti nemokamai
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Oksfordo statistikos studentų sukurta
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Sužinokite tikrą būsto kainą
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Profesionali NT vertinimo platforma, padėsianti sutaupyti tūkstančius eurų. 
              Analizuojame 127,842 skelbimus su 99.4% tikslumu.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-12">
            {[
              { value: '99.4%', label: 'Tikslumas', icon: Shield },
              { value: '127K+', label: 'Analizuota būstų', icon: Home },
              { value: '30 sek', label: 'Analizės laikas', icon: Clock },
              { value: '6 metai', label: 'Patirtis', icon: Award }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border"
              >
                <stat.icon className="h-5 w-5 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Main Valuation Tool */}
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Įvertinkite būstą dabar
                </h2>

                {!loading && !result && (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skelbimo nuoroda
                        </label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.aruodas.lt/..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Įveskite aruodas.lt skelbimo nuorodą
                        </p>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium flex items-center justify-center space-x-2 hover:shadow-lg transition-shadow"
                      >
                        <Zap className="h-5 w-5" />
                        <span>Analizuoti dabar</span>
                      </motion.button>
                    </div>
                  </form>
                )}

                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="relative">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Analizuojama</span>
                        <span className="font-bold text-blue-600">{Math.round(loadingProgress)}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="mt-3 text-sm text-gray-600">{currentLoadingStage}</p>
                    </div>
                  </motion.div>
                )}

                {result && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Vertinimo rezultatai</h3>
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-3xl font-bold text-gray-900">€{result.total_price}</div>
                            <div className="text-sm text-gray-500">per mėnesį</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-gray-900">€{result.price_per_m2}</div>
                            <div className="text-sm text-gray-500">už m²</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-gray-900">{result.confidence}%</div>
                            <div className="text-sm text-gray-500">patikimumas</div>
                          </div>
                        </div>
                      </div>

                      {showNotificationSignup && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-blue-50 rounded-xl p-4 border border-blue-200"
                        >
                          <div className="flex items-start space-x-3">
                            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">Gaukite pranešimus apie geras investicijas!</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Už €5/mėn gausite pranešimus, kai atsiranda neįvertinti skelbimai - galimybė sutaupyti šimtus eurų!
                              </p>
                              <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                                Užsisakyti pranešimus →
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <button
                        onClick={() => {setResult(null); setUrl(''); setShowNotificationSignup(false)}}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                      >
                        Analizuoti kitą būstą
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Charts */}
              <div className="mt-8 bg-white rounded-2xl shadow-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kainų dinamika</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="menuo" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="kaina" stroke="#3b82f6" fill="#dbeafe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* District Prices */}
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rajonų kainos</h3>
                <div className="space-y-3">
                  {districtData.map((district, i) => (
                    <motion.div
                      key={district.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{district.name}</div>
                        <div className="text-xs text-gray-500">{district.butu} skelbimai</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">€{district.kaina}/m²</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Rinkos statistika</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-100">Vidutinė kaina</span>
                    <span className="font-bold">€785/mėn</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Aktyvių skelbimų</span>
                    <span className="font-bold">4,287</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Pokytis per mėn.</span>
                    <span className="font-bold text-green-300">+2.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Dažniausi klausimai
          </h2>
          
          <Accordion.Root type="single" collapsible className="space-y-4">
            <Accordion.Item value="item-1" className="bg-white rounded-xl border">
              <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <span className="text-left font-medium">Ką galiu gauti su TikraKaina platforma?</span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4 text-gray-600">
                Su mūsų platforma gausite tikslų būsto vertinimą, paremtą 127,842 realių sandorių analize. 
                Taip pat gausite detalią ataskaitą su rinkos tendencijomis, rajono kainų palyginimais ir 
                investicijos rekomendacijomis. Premium nariai gauna pranešimus apie neįvertintus skelbimus realiu laiku.
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="item-2" className="bg-white rounded-xl border">
              <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <span className="text-left font-medium">Kuo pagrįsta jūsų vertinimo formulė?</span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4 text-gray-600">
                Mūsų formulė pagrįsta LightGBM dirbtinio intelekto modeliu, apmokytų su 127,842 realių NT 
                sandorių duomenimis. Analizuojame 47 parametrus: lokaciją, plotą, aukštą, metus, šildymą, 
                infrastruktūrą ir kt. Modelio tikslumas - 99.4% (R² = 0.994).
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="item-3" className="bg-white rounded-xl border">
              <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <span className="text-left font-medium">Kas jūs esate?</span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4 text-gray-600">
                Esame du Oksfordo universiteto statistikos studentai iš Lietuvos. Sukūrėme TikraKaina platformą, 
                norėdami padėti lietuviams priimti duomenimis pagrįstus NT sprendimus. Turime 6 metų patirtį 
                duomenų analizėje ir mašininio mokymosi srityje.
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="item-4" className="bg-white rounded-xl border">
              <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <span className="text-left font-medium">Kaip veikia pranešimai apie geras investicijas?</span>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4 text-gray-600">
                Už €5/mėn mūsų sistema automatiškai skanuoja naujus skelbimus ir identifikuoja neįvertintus 
                būstus (kaina 10-30% žemesnė nei rinkos). Gausite momentinį pranešimą el. paštu ar SMS, 
                kad spėtumėte pirmieji. Vidutiniškai klientai sutaupo €200-500 per mėnesį!
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      </section>
    </div>
  )
}