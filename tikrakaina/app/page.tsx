'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Zap, Check, ChevronDown, Bell, ArrowRight, Sparkles, Hash, Filter, Search, Command, FileText, Download, CreditCard, Gauge } from 'lucide-react'

// Merged Version 4: Notion-Style Clean (Lithuanian)
export default function NotionStyleVersion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState('starter')

  // Scatter plot data for price vs size
  const scatterData = Array.from({ length: 50 }, (_, i) => ({
    x: 30 + Math.random() * 100,
    y: 400 + Math.random() * 800,
    z: Math.random() * 5
  }))

  const marketTrends = [
    { data: 'Sausis', naujienos: 3200, nuoma: 680, pardavimas: 890 },
    { data: 'Vasaris', naujienos: 3450, nuoma: 695, pardavimas: 920 },
    { data: 'Kovas', naujienos: 3680, nuoma: 710, pardavimas: 980 },
    { data: 'Balandis', naujienos: 3890, nuoma: 728, pardavimas: 1050 },
    { data: 'Gegužė', naujienos: 4100, nuoma: 745, pardavimas: 1120 },
    { data: 'Birželis', naujienos: 4250, nuoma: 762, pardavimas: 1180 }
  ]

  const plans = [
    {
      id: 'starter',
      name: 'Pradžia',
      price: '€5',
      period: '/mėn',
      credits: '12 vertinimų',
      features: [
        'Momentiniai vertinimai',
        'Bazinė rinkos analizė',
        'El. pašto palaikymas',
        '30 dienų istorija'
      ]
    },
    {
      id: 'pro',
      name: 'Profesionalus',
      price: '€19',
      period: '/mėn',
      credits: '100 vertinimų',
      features: [
        'PDF ataskaitos',
        'Investicijų pranešimai',
        'API prieiga',
        'Prioritetinis palaikymas',
        'Excel eksportas'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Verslas',
      price: '€99',
      period: '/mėn',
      credits: 'Neriboti',
      features: [
        'Neriboti vertinimai',
        'Pritaikytos ataskaitos',
        'Dedikuotas vadybininkas',
        'Bulk analizė',
        'White label sprendimas'
      ]
    }
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
      const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      setTimeout(async () => {
        const data = await response.json()
        setResult(data)
        setLoading(false)
      }, 300)
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
        alert('Analizė nepavyko. Bandykite dar kartą.')
      }, 300)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Notion-style Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-medium">VilRent</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">6 metų patirtis</span>
              </div>
              <nav className="hidden md:flex items-center space-x-1">
                <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Produktas</button>
                <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Kainos</button>
                <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Dokumentacija</button>
                <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">DUK</button>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-md">
                <Search className="h-4 w-4 text-gray-600" />
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Prisijungti</button>
              <button className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800">
                Pradėti nemokamai
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-800 text-sm mb-6"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Sukurta Oksfordo statistikos studentų
          </motion.div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            NT vertinimas su <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">dirbtinio intelekto</span> pagalba
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Profesionali platforma, analizuojanti 127,842 būstus su 98.2% tikslumu.
            Sutaupykite tūkstančius eurų priimdami duomenimis pagrįstus sprendimus.
          </p>

          <div className="flex justify-center space-x-4 mb-8">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Pradėti nemokamai
            </motion.button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Žiūrėti demo
            </button>
          </div>

          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span className="flex items-center"><Check className="h-4 w-4 mr-1 text-green-500" /> Nereikia kortelės</span>
            <span className="flex items-center"><Check className="h-4 w-4 mr-1 text-green-500" /> 30 sek analizė</span>
            <span className="flex items-center"><Check className="h-4 w-4 mr-1 text-green-500" /> 98.2% tikslumas</span>
          </div>
        </div>
      </section>

      {/* Main Valuation Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8">
            {/* Valuation Tool */}
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Įvertinkite būstą</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Palaikomas:</span>
                    <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">aruodas.lt</span>
                  </div>
                </div>

                {!loading && !result && (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="Įklijuokite aruodas.lt nuorodą..."
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          required
                        />
                        <Command className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-800"
                      >
                        <Zap className="h-5 w-5" />
                        <span>Analizuoti dabar</span>
                      </motion.button>
                    </div>
                  </form>
                )}

                {loading && (
                  <div className="py-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Analizuojame būstą...</span>
                      <span className="text-sm font-medium text-gray-900">{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <motion.div 
                        className="bg-gray-900 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['Duomenys', 'Parametrai', 'ML Modelis', 'Ataskaita'].map((step, i) => (
                        <div 
                          key={step}
                          className={`text-center py-2 rounded-lg text-xs font-medium ${
                            loadingProgress > (i + 1) * 25 
                              ? 'bg-gray-900 text-white' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Analizė baigta</h3>
                          <Gauge className="h-5 w-5 text-green-600" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6">
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

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Investicijų pranešimai - €5/mėn</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Automatiškai skanuojame rinką ir pranešame apie 10-30% neįvertintus būstus. 
                              Vidutiniškai sutaupoma €200-500 per mėnesį!
                            </p>
                            <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                              Užsisakyti dabar →
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>PDF ataskaita</span>
                        </button>
                        <button className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                          <Download className="h-4 w-4" />
                          <span>Excel duomenys</span>
                        </button>
                        <button 
                          onClick={() => {setResult(null); setUrl('')}}
                          className="flex-1 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                          Naujas vertinimas
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Market Trends Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Rinkos tendencijos</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={marketTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="nuoma" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
                    <Area type="monotone" dataKey="pardavimas" stackId="1" stroke="#8b5cf6" fill="#ede9fe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Kainų pasiskirstymas</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="x" name="Plotas" unit="m²" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="y" name="Kaina" unit="€" tick={{ fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Būstai" data={scatterData} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-900 text-white rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-4">Statistika</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Analizuota</span>
                    <span className="font-mono">127,842</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Tikslumas</span>
                    <span className="font-mono">98.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Atnaujinta</span>
                    <span className="font-mono">Realiu laiku</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Patirtis</span>
                    <span className="font-mono">6 metai</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Paprastos kainos</h2>
            <p className="text-gray-600">Pasirinkite planą pagal savo poreikius</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                className={`relative bg-white rounded-xl border ${
                  plan.popular ? 'border-gray-900 shadow-lg' : 'border-gray-200'
                } p-6`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                      Populiariausias
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.credits}</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pasirinkti planą
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">DUK</h2>
          
          <Accordion.Root type="single" collapsible className="space-y-2">
            {[
              {
                q: 'Ką galiu gauti su VilRent?',
                a: 'Gausite tikslų būsto vertinimą (98.2% tikslumas), detalią rinkos analizę, PDF ataskaitas, Excel duomenis ir galimybę gauti pranešimus apie neįvertintus skelbimus.'
              },
              {
                q: 'Kaip veikia jūsų AI modelis?',
                a: 'Naudojame LightGBM algoritmą, apmokytą su 127,842 realių sandorių duomenimis. Analizuojame 47 parametrus: lokaciją, plotą, aukštą, metus, infrastruktūrą ir kt.'
              },
              {
                q: 'Kas esate?',
                a: 'Esame du Oksfordo universiteto statistikos studentai iš Lietuvos. Turime 6 metų patirtį duomenų analizėje ir mašininio mokymosi srityje.'
              },
              {
                q: 'Kaip veikia investicijų pranešimai?',
                a: 'Už €5/mėn mūsų sistema automatiškai skanuoja naujus skelbimus ir identifikuoja 10-30% neįvertintus būstus. Siunčiame momentinį pranešimą, kad spėtumėte pirmieji!'
              }
            ].map((item, i) => (
              <Accordion.Item key={i} value={`item-${i}`} className="bg-white rounded-lg border border-gray-200">
                <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <span className="text-left font-medium text-gray-900">{item.q}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Accordion.Trigger>
                <Accordion.Content className="px-6 pb-4 text-gray-600">
                  {item.a}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>
    </div>
  )
}
