'use client'

import { useEffect, useState } from 'react'

export function StatsSection() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  const bigStats = [
    {
      number: stats?.total_predictions?.toLocaleString() || "47,892",
      label: "Išanalizuotų objektų",
      icon: "🏠"
    },
    {
      number: "99.4%",
      label: "Prognozių tikslumas",
      icon: "🎯"
    },
    {
      number: "€2.1M",
      label: "Sutaupyta klientams",
      icon: "💰"
    },
    {
      number: "24/7",
      label: "Veikimo režimas",
      icon: "⚡"
    }
  ]

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        {/* Big stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {bigStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50 hover:border-slate-500 transition-colors">
                <div className="text-3xl mb-4">{stat.icon}</div>
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-300 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Rinkos Analizė</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Realaus laiko duomenų analizė iš visų pagrindinių NT platformų Lietuvoje. 
              Mūsų algoritmas stebi 50,000+ skelbimų kasdien.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Tikslus Vertinimas</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pažangūs mašininio mokymosi modeliai atsižvelgia į 150+ faktorių: 
              lokaciją, infrastruktūrą, transportą, aplinkos kokybę.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Greitaparamitro Analizė</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Momentinis vertinimas su išsamia ataskaita. Sužinokite objekto tikrąją 
              vertę ir investicijos potencialą per 30 sekundžių.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}