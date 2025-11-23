'use client'

import React, { useState } from 'react'
import { BadgeAlert, BadgeCheck, Info, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'

export default function ResultStyleTest() {
  const [selected, setSelected] = useState<number | null>(null)

  // Mock overpriced data
  const data = {
    predicted: 865,
    listing: 999,
    diffMonthly: -134,
    diffYearly: -1608,
    percent: -13.4,
    pricePerM2: 12.36
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Results Display - 4 Versions</h1>
          <p className="text-lg text-gray-600">Pick your favorite sleek design!</p>
          {selected && (
            <div className="mt-4 inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
              ✓ You selected Version {selected}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* VERSION 1: Soft Gradient */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-blue-400 transition-all">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Version 1</h2>
              <button
                onClick={() => setSelected(1)}
                className={`px-4 py-2 rounded-lg font-medium ${selected === 1 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selected === 1 ? '✓ Selected' : 'Pick'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Top Banner - Soft Gradient */}
              <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-700 mb-1">Permokate</div>
                    <div className="text-4xl font-bold text-red-800">€1,608</div>
                    <div className="text-sm text-red-600 mt-1">per metus</div>
                  </div>
                  <div className="bg-red-100 rounded-full p-3">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Price Boxes - Subtle Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-xs font-medium text-blue-700 mb-1">Tikra vertė</div>
                  <div className="text-2xl font-bold text-blue-900">€865</div>
                  <div className="text-xs text-blue-600 mt-1">€12.36/m²</div>
                </div>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
                  <div className="text-xs font-medium text-gray-600 mb-1">Skelbiama</div>
                  <div className="text-2xl font-bold text-gray-900">€999</div>
                  <div className="text-xs text-gray-500 mt-1">per mėnesį</div>
                </div>
              </div>

              {/* Difference - Subtle */}
              <div className="bg-red-50/50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-xs text-red-600 font-medium">Skirtumas</div>
                <div className="text-xl font-bold text-red-700">€134/mėn</div>
              </div>

              {/* Info */}
              <div className="flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>13.4% aukštesnė kaina nei rinkos vidurkis</span>
              </div>
            </div>
          </div>

          {/* VERSION 2: Minimalist Neutral */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-blue-400 transition-all">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Version 2</h2>
              <button
                onClick={() => setSelected(2)}
                className={`px-4 py-2 rounded-lg font-medium ${selected === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selected === 2 ? '✓ Selected' : 'Pick'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Top Banner - Dark Subtle */}
              <div className="relative overflow-hidden rounded-xl p-6 bg-gray-900 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-300 mb-1">Permokate</div>
                    <div className="text-4xl font-bold">€1,608</div>
                    <div className="text-sm text-gray-300 mt-1">per metus</div>
                  </div>
                  <div className="bg-red-500/20 rounded-full p-3">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                </div>
              </div>

              {/* Price Boxes - Clean Borders */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-blue-300 rounded-lg p-4 text-center bg-white">
                  <div className="text-xs font-medium text-blue-700 mb-1">Tikra vertė</div>
                  <div className="text-2xl font-bold text-gray-900">€865</div>
                  <div className="text-xs text-blue-600 mt-1">€12.36/m²</div>
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-4 text-center bg-white">
                  <div className="text-xs font-medium text-gray-600 mb-1">Skelbiama</div>
                  <div className="text-2xl font-bold text-gray-900">€999</div>
                  <div className="text-xs text-gray-500 mt-1">per mėnesį</div>
                </div>
              </div>

              {/* Difference - Simple */}
              <div className="border-2 border-red-300 rounded-lg p-3 text-center bg-white">
                <div className="text-xs text-red-600 font-medium">Skirtumas</div>
                <div className="text-xl font-bold text-red-700">€134/mėn</div>
              </div>

              {/* Info */}
              <div className="flex items-start space-x-2 text-sm text-gray-600 border border-gray-200 rounded-lg p-3">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>13.4% aukštesnė kaina nei rinkos vidurkis</span>
              </div>
            </div>
          </div>

          {/* VERSION 3: Warm Earth Tones */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-blue-400 transition-all">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Version 3</h2>
              <button
                onClick={() => setSelected(3)}
                className={`px-4 py-2 rounded-lg font-medium ${selected === 3 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selected === 3 ? '✓ Selected' : 'Pick'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Top Banner - Warm Amber */}
              <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-amber-700 mb-1">Permokate</div>
                    <div className="text-4xl font-bold text-amber-900">€1,608</div>
                    <div className="text-sm text-amber-700 mt-1">per metus</div>
                  </div>
                  <div className="bg-amber-200 rounded-full p-3">
                    <TrendingUp className="h-8 w-8 text-amber-700" />
                  </div>
                </div>
              </div>

              {/* Price Boxes - Soft Indigo & Warm Gray */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                  <div className="text-xs font-medium text-indigo-700 mb-1">Tikra vertė</div>
                  <div className="text-2xl font-bold text-indigo-900">€865</div>
                  <div className="text-xs text-indigo-600 mt-1">€12.36/m²</div>
                </div>
                <div className="bg-stone-50 border border-stone-300 rounded-lg p-4 text-center">
                  <div className="text-xs font-medium text-stone-600 mb-1">Skelbiama</div>
                  <div className="text-2xl font-bold text-stone-900">€999</div>
                  <div className="text-xs text-stone-500 mt-1">per mėnesį</div>
                </div>
              </div>

              {/* Difference - Warm */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <div className="text-xs text-orange-700 font-medium">Skirtumas</div>
                <div className="text-xl font-bold text-orange-800">€134/mėn</div>
              </div>

              {/* Info */}
              <div className="flex items-start space-x-2 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <span>13.4% aukštesnė kaina nei rinkos vidurkis</span>
              </div>
            </div>
          </div>

          {/* VERSION 4: Cool Blue-Gray Professional */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:border-blue-400 transition-all">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Version 4</h2>
              <button
                onClick={() => setSelected(4)}
                className={`px-4 py-2 rounded-lg font-medium ${selected === 4 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selected === 4 ? '✓ Selected' : 'Pick'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Top Banner - Slate Gradient */}
              <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-300 mb-1">Permokate</div>
                    <div className="text-4xl font-bold">€1,608</div>
                    <div className="text-sm text-slate-300 mt-1">per metus</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-full p-3">
                    <AlertTriangle className="h-8 w-8 text-red-300" />
                  </div>
                </div>
              </div>

              {/* Price Boxes - Professional Blue-Gray */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-center">
                  <div className="text-xs font-medium text-cyan-700 mb-1">Tikra vertė</div>
                  <div className="text-2xl font-bold text-cyan-900">€865</div>
                  <div className="text-xs text-cyan-600 mt-1">€12.36/m²</div>
                </div>
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 text-center">
                  <div className="text-xs font-medium text-slate-600 mb-1">Skelbiama</div>
                  <div className="text-2xl font-bold text-slate-900">€999</div>
                  <div className="text-xs text-slate-500 mt-1">per mėnesį</div>
                </div>
              </div>

              {/* Difference - Muted Red */}
              <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-center">
                <div className="text-xs text-rose-700 font-medium">Skirtumas</div>
                <div className="text-xl font-bold text-rose-800">€134/mėn</div>
              </div>

              {/* Info */}
              <div className="flex items-start space-x-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-500" />
                <span>13.4% aukštesnė kaina nei rinkos vidurkis</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-gray-900 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-2">Which version looks best?</h3>
            {selected ? (
              <p className="text-lg text-gray-300">
                You selected <span className="text-green-400 font-bold">Version {selected}</span>
              </p>
            ) : (
              <p className="text-lg text-gray-400">Click &quot;Pick&quot; on your favorite design</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
