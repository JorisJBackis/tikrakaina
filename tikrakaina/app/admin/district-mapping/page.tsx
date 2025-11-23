'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Import the comprehensive mapping data
import comprehensiveMapping from '@/lib/comprehensive_mapping.json'

type Mapping = {
  osm_name: string
  model_district: string | null
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'guess'
  type: 'model_district' | 'seniunija' | 'quarter' | 'neighborhood'
  notes: string
}

type Override = {
  osm_name: string
  original_district: string | null
  new_district: string
  reason: string
}

const MODEL_DISTRICTS = [
  "Antakalnis", "Bajorai", "Baltupiai", "Fabijoniškės", "Jeruzalė",
  "Justiniškės", "Karoliniškės", "Lazdynai", "Lazdynėliai", "Markučiai",
  "Naujamiestis", "Naujininkai", "Naujoji Vilnia", "Paupys",
  "Pašilaičiai", "Pilaitė", "Santariškės", "Senamiestis", "Užupis",
  "Vilkpėdė", "Viršuliškės", "Šeškinė", "Šiaurės miestelis", "Šnipiškės",
  "Žirmūnai", "Žvėrynas", "Other"
]

export default function DistrictMappingReview() {
  const [mappings, setMappings] = useState<Mapping[]>(comprehensiveMapping.mappings as Mapping[])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')

  // Load overrides from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('district-mapping-overrides')
    if (saved) {
      const loadedOverrides = JSON.parse(saved)
      setOverrides(loadedOverrides)

      // Apply overrides to mappings
      setMappings(prev => prev.map(m => {
        const override = loadedOverrides.find((o: Override) => o.osm_name === m.osm_name)
        if (override) {
          return { ...m, model_district: override.new_district }
        }
        return m
      }))
    }
  }, [])

  const confidenceColors = {
    exact: 'bg-green-100 text-green-800 border-green-300',
    high: 'bg-blue-100 text-blue-800 border-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-orange-100 text-orange-800 border-orange-300',
    guess: 'bg-red-100 text-red-800 border-red-300',
  }

  const typeColors = {
    model_district: 'bg-purple-50 border-purple-200',
    seniunija: 'bg-indigo-50 border-indigo-200',
    quarter: 'bg-cyan-50 border-cyan-200',
    neighborhood: 'bg-teal-50 border-teal-200',
  }

  const filteredMappings = mappings.filter(m => {
    if (filter !== 'all' && m.confidence !== filter) return false
    if (search && !m.osm_name.toLowerCase().includes(search.toLowerCase()) &&
        !m.model_district?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setSelectedDistrict(mappings[index].model_district || '')
  }

  const handleSave = (index: number) => {
    const mapping = mappings[index]

    if (selectedDistrict !== mapping.model_district) {
      const newOverride: Override = {
        osm_name: mapping.osm_name,
        original_district: mapping.model_district,
        new_district: selectedDistrict,
        reason: 'Manual override'
      }

      const newOverrides = [...overrides.filter(o => o.osm_name !== mapping.osm_name), newOverride]
      setOverrides(newOverrides)
      localStorage.setItem('district-mapping-overrides', JSON.stringify(newOverrides))

      // Update mapping
      setMappings(prev => prev.map((m, i) =>
        i === index ? { ...m, model_district: selectedDistrict } : m
      ))
    }

    setEditingIndex(null)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setSelectedDistrict('')
  }

  const handleExport = () => {
    const exportData = {
      mappings: mappings.map(m => ({
        [m.osm_name]: m.model_district
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      overrides: overrides
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'district-mapping-approved.json'
    a.click()
  }

  const stats = {
    total: mappings.length,
    exact: mappings.filter(m => m.confidence === 'exact').length,
    high: mappings.filter(m => m.confidence === 'high').length,
    medium: mappings.filter(m => m.confidence === 'medium').length,
    low: mappings.filter(m => m.confidence === 'low').length,
    overridden: overrides.length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-4xl font-bold text-gray-900">District Mapping Review</h1>
              <p className="text-gray-600 mt-2">Review and approve OSM → Model District mappings</p>
            </div>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md"
            >
              Export Approved Mappings
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm border-2 border-green-200">
              <div className="text-2xl font-bold text-green-700">{stats.exact}</div>
              <div className="text-sm text-green-600">Exact</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{stats.high}</div>
              <div className="text-sm text-blue-600">High</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border-2 border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{stats.medium}</div>
              <div className="text-sm text-yellow-600">Medium</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg shadow-sm border-2 border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{stats.low}</div>
              <div className="text-sm text-orange-600">Low</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm border-2 border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{stats.overridden}</div>
              <div className="text-sm text-purple-600">Overridden</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Confidence</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Confidence Levels</option>
                <option value="exact">Exact Match</option>
                <option value="high">High Confidence</option>
                <option value="medium">Medium Confidence</option>
                <option value="low">Low Confidence</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search OSM name or model district..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Mappings Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    OSM Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Model District
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMappings.map((mapping, index) => {
                  const isOverridden = overrides.some(o => o.osm_name === mapping.osm_name)
                  const isEditing = editingIndex === index

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 transition-colors ${isOverridden ? 'bg-purple-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{mapping.osm_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[mapping.type]}`}>
                          {mapping.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">No mapping</option>
                            {MODEL_DISTRICTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`font-semibold ${mapping.model_district ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {mapping.model_district || 'None'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${confidenceColors[mapping.confidence]}`}>
                          {mapping.confidence.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {mapping.notes}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(index)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(index)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                          >
                            {isOverridden ? 'Edit Override' : 'Override'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overrides Summary */}
        {overrides.length > 0 && (
          <div className="mt-6 bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Manual Overrides ({overrides.length})</h2>
            <div className="space-y-2">
              {overrides.map((override, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">{override.osm_name}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-bold text-purple-700">{override.new_district}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (was: {override.original_district || 'None'})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const newOverrides = overrides.filter(o => o.osm_name !== override.osm_name)
                        setOverrides(newOverrides)
                        localStorage.setItem('district-mapping-overrides', JSON.stringify(newOverrides))

                        // Restore original mapping
                        setMappings(prev => prev.map(m =>
                          m.osm_name === override.osm_name
                            ? { ...m, model_district: override.original_district }
                            : m
                        ))
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {filteredMappings.length} of {mappings.length} mappings
        </div>
      </div>
    </div>
  )
}
