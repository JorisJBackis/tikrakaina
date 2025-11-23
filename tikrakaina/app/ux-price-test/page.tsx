'use client'

import React, { useState } from 'react'
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle, Info, Lightbulb, Euro, ArrowDown, ArrowUp, BadgeCheck, BadgeAlert, Zap, Clock } from 'lucide-react'

export default function PriceComparisonTest() {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  const data = {
    overpriced: {
      predicted: 1018,
      listing: 1150,
      diffMonthly: -132,
      diffYearly: -1584,
      percent: -11.5
    },
    goodDeal: {
      predicted: 850,
      listing: 750,
      diffMonthly: 100,
      diffYearly: 1200,
      percent: 13.3
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Price Comparison UI Test</h1>
          <p className="text-lg text-gray-600">Pick your favorite! (10 ultra-modern designs)</p>
          {selectedVersion && (
            <div className="mt-4 inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
              ✓ You selected Version {selectedVersion}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* VERSION 2: Side-by-Side Price Comparison (KEEP) */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 2</h2>
                <p className="text-xs text-gray-500">Price Comparison</p>
              </div>
              <button
                onClick={() => setSelectedVersion(2)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 2 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 font-medium mb-1">TIKRA VERTĖ</div>
                  <div className="text-xl font-bold text-blue-900">€1,018</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-600 font-medium mb-1">SKELBIAMA</div>
                  <div className="text-xl font-bold text-gray-900">€1,150</div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <span className="font-bold text-red-700">€132 brangiau</span>
                  <span className="text-red-600 text-sm">(11.5%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* VERSION 3: Alert Style (KEEP) */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 3</h2>
                <p className="text-xs text-gray-500">Alert Style</p>
              </div>
              <button
                onClick={() => setSelectedVersion(3)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 3 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 3 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-red-900 mb-1 text-sm">Pervertinta kaina</div>
                  <div className="text-xs text-red-700 space-y-1">
                    <div>Skelbiama: <span className="font-bold">€1,150/mėn</span></div>
                    <div>Tikra: <span className="font-bold">€1,018/mėn</span></div>
                    <div className="pt-1 border-t border-red-200 mt-2">
                      <span className="inline-block bg-red-100 px-2 py-1 rounded font-bold text-xs">
                        11.5% brangiau
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 italic flex items-start space-x-1">
              <Lightbulb className="h-3 w-3 mt-0.5" />
              <span>Derėkitės dėl kainos</span>
            </div>
          </div>

          {/* VERSION 4: Big Banner with Yearly Impact */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 4</h2>
                <p className="text-xs text-gray-500">Yearly Banner</p>
              </div>
              <button
                onClick={() => setSelectedVersion(4)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 4 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 4 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6 text-center">
              <div className="text-xs uppercase tracking-wide text-red-600 font-bold mb-2">PERVERTINTA</div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ArrowUp className="h-6 w-6 text-red-600" />
                <div className="text-4xl font-black text-red-700">€1,584</div>
              </div>
              <div className="text-sm font-medium text-red-800">per metus brangiau</div>
              <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-700">
                €132/mėn × 12 mėnesių
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span>Galite sutaupyti €1,584 per metus!</span>
            </div>
          </div>

          {/* VERSION 5: Split Card Design */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 5</h2>
                <p className="text-xs text-gray-500">Split Card</p>
              </div>
              <button
                onClick={() => setSelectedVersion(5)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 5 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 5 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
                  <div className="text-xs opacity-80 mb-1">Tikra vertė</div>
                  <div className="text-2xl font-bold">€1,018</div>
                  <div className="text-xs opacity-70 mt-1">per mėnesį</div>
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg p-4 text-center">
                  <div className="text-xs opacity-80 mb-1">Skelbiama</div>
                  <div className="text-2xl font-bold">€1,150</div>
                  <div className="text-xs opacity-70 mt-1">per mėnesį</div>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-3 border-4 border-white shadow-lg">
                <div className="text-xs font-bold">+11.5%</div>
              </div>
            </div>
            <div className="mt-4 bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">€1,584</div>
              <div className="text-xs text-red-600">brangiau per metus</div>
            </div>
          </div>

          {/* VERSION 6: Minimalist Badge Style */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 6</h2>
                <p className="text-xs text-gray-500">Badge Minimal</p>
              </div>
              <button
                onClick={() => setSelectedVersion(6)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 6 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 6 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center border-4 border-red-300">
                  <div className="text-center">
                    <div className="text-3xl font-black text-red-700">-€1.6k</div>
                    <div className="text-xs text-red-600 font-medium">per metus</div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-2">
                  <BadgeAlert className="h-5 w-5" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold">
                  Pervertinta 11.5%
                </div>
                <div className="text-xs text-gray-600">€132/mėn × 12 = €1,584</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center italic flex items-center justify-center space-x-1">
              <Lightbulb className="h-3 w-3" />
              <span>Ieškokite geresnės kainos</span>
            </div>
          </div>

          {/* VERSION 7: Card with Progress Bar */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 7</h2>
                <p className="text-xs text-gray-500">Progress Visual</p>
              </div>
              <button
                onClick={() => setSelectedVersion(7)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 7 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 7 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tikra vertė</span>
                <span className="text-lg font-bold text-blue-600">€1,018</span>
              </div>
              <div className="relative">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '88.5%' }}></div>
                </div>
                <div className="absolute -right-1 -top-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                  +11.5%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Skelbiama</span>
                <span className="text-lg font-bold text-gray-900">€1,150</span>
              </div>
              <div className="mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 text-center">
                <div className="text-sm opacity-90 mb-1">Permokate per metus</div>
                <div className="text-3xl font-black">€1,584</div>
              </div>
            </div>
            <div className="mt-3 flex items-start space-x-2 text-xs text-gray-600">
              <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Derėkitės - galite sutaupyti €132/mėn</span>
            </div>
          </div>

          {/* VERSION 8: Dashboard Style */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 8</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
              <button
                onClick={() => setSelectedVersion(8)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 8 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 8 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="space-y-2">
              <div className="bg-red-500 text-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs opacity-80">Permokate</div>
                  <div className="text-2xl font-bold">€1,584</div>
                  <div className="text-xs opacity-80">per metus</div>
                </div>
                <BadgeAlert className="h-10 w-10 opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="text-xs text-blue-600">Tikra vertė</div>
                  <div className="text-lg font-bold text-blue-900">€1,018</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-600">Skelbiama</div>
                  <div className="text-lg font-bold text-gray-900">€1,150</div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                <div className="text-xs text-red-600">Skirtumas</div>
                <div className="text-lg font-bold text-red-700">€132/mėn</div>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-1 text-xs text-gray-600">
              <Info className="h-3 w-3" />
              <span>11.5% aukštesnė kaina nei rinkos</span>
            </div>
          </div>

          {/* VERSION 9: Timeline Style */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 9</h2>
                <p className="text-xs text-gray-500">Timeline</p>
              </div>
              <button
                onClick={() => setSelectedVersion(9)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 9 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 9 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-red-300"></div>
              <div className="space-y-4 relative">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                    €1018
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-900 mb-1">Tikra būsto vertė</div>
                    <div className="text-xs text-blue-700">Mūsų AI vertinimas pagal rinką</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                    €1150
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-900 mb-1">Prašoma kaina</div>
                    <div className="text-xs text-gray-700">Skelbiama aruodas.lt</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white z-10">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                    <div className="text-xs font-bold text-red-900 mb-1">Pervertinta €1,584/metus</div>
                    <div className="text-xs text-red-700">11.5% aukštesnė kaina</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VERSION 10: Compact Info Card */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 10</h2>
                <p className="text-xs text-gray-500">Compact Info</p>
              </div>
              <button
                onClick={() => setSelectedVersion(10)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 10 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 10 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="bg-gradient-to-br from-red-50 via-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-red-500 text-white rounded-full p-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-red-600">Pervertinta</div>
                  <div className="text-2xl font-black text-red-700">€1,584</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Skelbiama:</span>
                  <span className="font-bold text-gray-900">€1,150/mėn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tikra vertė:</span>
                  <span className="font-bold text-blue-700">€1,018/mėn</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-200">
                  <span className="text-red-600 font-medium">Skirtumas per metus:</span>
                  <span className="font-black text-red-700">€1,584</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-yellow-800">Derėkitės - galite sumažinti kainą</span>
            </div>
          </div>

          {/* VERSION 11: Neon Accent Card */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Version 11</h2>
                <p className="text-xs text-gray-500">Neon Modern</p>
              </div>
              <button
                onClick={() => setSelectedVersion(11)}
                className={`px-3 py-1 text-sm rounded-lg font-medium ${selectedVersion === 11 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {selectedVersion === 11 ? '✓' : 'Pick'}
              </button>
            </div>
            <div className="relative bg-black rounded-xl p-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="bg-red-500 rounded p-1">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Alert</span>
                </div>
                <div className="text-4xl font-black text-white mb-2 tracking-tight">€1,584</div>
                <div className="text-red-400 text-sm font-medium mb-4">permokate per metus</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/10 backdrop-blur rounded p-2">
                    <div className="text-gray-400">Tikra</div>
                    <div className="text-white font-bold">€1,018</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded p-2">
                    <div className="text-gray-400">Skelbiama</div>
                    <div className="text-white font-bold">€1,150</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Kaina 11.5% aukštesnė nei rinkos vidurkis</span>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-gray-900 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-2">Which version is clearest?</h3>
            {selectedVersion ? (
              <p className="text-lg text-gray-300">
                You selected <span className="text-green-400 font-bold">Version {selectedVersion}</span>
              </p>
            ) : (
              <p className="text-lg text-gray-400">Click &quot;Pick&quot; on your favorite design above</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
