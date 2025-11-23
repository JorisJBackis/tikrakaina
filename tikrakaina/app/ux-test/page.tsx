'use client'

import React, { useState } from 'react'
import { Zap, ArrowRight, FileText, Link as LinkIcon } from 'lucide-react'

export default function UXTestPage() {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">UX Variations Test</h1>
          <p className="text-lg text-gray-600">Pick your favorite design!</p>
          {selectedVersion && (
            <div className="mt-4 inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
              ✓ You selected Version {selectedVersion}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* VERSION 1: Toggle with Helper Text */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Version 1</h2>
                <p className="text-sm text-gray-500 mt-1">Toggle + Helper Text</p>
              </div>
              <button
                onClick={() => setSelectedVersion(1)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedVersion === 1
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {selectedVersion === 1 ? '✓ Selected' : 'Pick This'}
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Įvertinkite būstą</h3>
              <p className="text-sm text-gray-600 mb-6">
                Pasirinkite, kaip norite pradėti vertinimą
              </p>

              <div className="flex justify-center space-x-4 mb-6">
                <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
                  Aruodas.lt nuoroda
                </button>
                <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200">
                  Įvesti duomenis
                </button>
              </div>

              <div className="text-center">
                <input
                  type="text"
                  placeholder="Įklijuokite aruodas.lt nuorodą..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
                />
                <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Analizuoti dabar</span>
                </button>
              </div>
            </div>
          </div>

          {/* VERSION 2: Big Cards Side by Side */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Version 2</h2>
                <p className="text-sm text-gray-500 mt-1">Side-by-side Cards</p>
              </div>
              <button
                onClick={() => setSelectedVersion(2)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedVersion === 2
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {selectedVersion === 2 ? '✓ Selected' : 'Pick This'}
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-6 text-center">Kaip norite pradėti?</h3>

              <div className="grid grid-cols-2 gap-4">
                <button className="border-2 border-gray-900 rounded-xl p-6 hover:bg-gray-50 transition-all text-left group">
                  <LinkIcon className="h-8 w-8 text-gray-900 mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Turiu nuorodą</h4>
                  <p className="text-sm text-gray-600 mb-4">Skelbimas jau įkeltas aruodas.lt</p>
                  <div className="flex items-center text-sm font-medium text-gray-900 group-hover:translate-x-1 transition-transform">
                    Pradėti <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </button>

                <button className="border-2 border-gray-300 rounded-xl p-6 hover:border-gray-900 hover:bg-gray-50 transition-all text-left group">
                  <FileText className="h-8 w-8 text-gray-600 mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Įvesiu pats</h4>
                  <p className="text-sm text-gray-600 mb-4">Neturiu aruodas.lt skelbimo</p>
                  <div className="flex items-center text-sm font-medium text-gray-600 group-hover:text-gray-900 group-hover:translate-x-1 transition-all">
                    Pradėti <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* VERSION 3: Primary → Big Secondary Button */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Version 3</h2>
                <p className="text-sm text-gray-500 mt-1">Primary + Big Fallback</p>
              </div>
              <button
                onClick={() => setSelectedVersion(3)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedVersion === 3
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {selectedVersion === 3 ? '✓ Selected' : 'Pick This'}
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Įvertinkite būstą</h3>
              <p className="text-sm text-gray-600 mb-6">Įklijuokite aruodas.lt nuorodą ir analizuosime už kelių sekundžių</p>

              <input
                type="text"
                placeholder="https://www.aruodas.lt/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              />
              <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center space-x-2 mb-6">
                <Zap className="h-5 w-5" />
                <span>Analizuoti dabar</span>
              </button>

              <div className="border-t border-gray-200 pt-6">
                <button className="w-full py-4 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-lg font-medium hover:bg-blue-100 transition-all flex items-center justify-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Neturite nuorodos? Įveskite duomenis rankiniu būdu</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* VERSION 4: Tabs with Description */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Version 4</h2>
                <p className="text-sm text-gray-500 mt-1">Tabs with Icons</p>
              </div>
              <button
                onClick={() => setSelectedVersion(4)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedVersion === 4
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {selectedVersion === 4 ? '✓ Selected' : 'Pick This'}
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Įvertinkite būstą</h3>
              <p className="text-sm text-gray-600 mb-6">Galite naudoti aruodas.lt nuorodą arba įvesti duomenis rankiniu būdu</p>

              <div className="flex border-b border-gray-200 mb-6">
                <button className="flex-1 py-3 border-b-2 border-gray-900 font-medium text-gray-900 flex items-center justify-center space-x-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Aruodas.lt nuoroda</span>
                </button>
                <button className="flex-1 py-3 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Įvesti duomenis</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Įklijuokite aruodas.lt nuorodą..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              />
              <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Analizuoti dabar</span>
              </button>
            </div>
          </div>

        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-gray-900 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-2">Which version did you pick?</h3>
            {selectedVersion ? (
              <p className="text-lg text-gray-300">
                You selected <span className="text-green-400 font-bold">Version {selectedVersion}</span>
              </p>
            ) : (
              <p className="text-lg text-gray-400">Click "Pick This" on your favorite design above</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
