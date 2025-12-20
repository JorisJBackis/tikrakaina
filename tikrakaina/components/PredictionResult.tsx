'use client'

import { useState } from 'react'

interface WaterfallItem {
  label: string
  label_en: string
  value: number
  cumulative: number
  display_value?: string
  type: 'base' | 'positive' | 'negative' | 'other' | 'total'
}

interface Contribution {
  feature: string
  feature_name_lt: string
  value: any
  display_value: string
  shap_value: number
  impact_eur_m2: number
  direction: 'positive' | 'negative' | 'neutral'
}

interface ShapExplanation {
  base_value: number
  predicted_value: number
  total_shap: number
  contributions: Contribution[]
  top_positive: Contribution[]
  top_negative: Contribution[]
  waterfall: WaterfallItem[]
  summary: string
  summary_lt: string
  area_m2?: number
}

interface PredictionResultProps {
  prediction: any
  onBack: () => void
}

export function PredictionResult({ prediction, onBack }: PredictionResultProps) {
  const [showExplanation, setShowExplanation] = useState(true)

  if (!prediction?.success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">&#10060;</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Analizes klaida</h3>
          <p className="text-white/70 text-sm">
            {prediction?.error || 'Nepavyko apdoroti skelbimo. Bandykite dar karta.'}
          </p>
        </div>

        <button
          onClick={onBack}
          className="w-full bg-white/10 text-white py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
        >
          Bandyti dar karta
        </button>
      </div>
    )
  }

  const { price_per_m2, total_price, confidence, analysis, shap_explanation, listing_price, deal_rating, price_difference_percent } = prediction

  const getValueRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-green-400'
      case 'GOOD': return 'text-blue-400'
      case 'FAIR': return 'text-yellow-400'
      case 'ABOVE_AVERAGE': return 'text-orange-400'
      case 'PREMIUM': return 'text-purple-400'
      default: return 'text-white'
    }
  }

  const getValueRatingText = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'PUIKUS'
      case 'GOOD': return 'GERAS'
      case 'FAIR': return 'VIDUTINIS'
      case 'ABOVE_AVERAGE': return 'AUKSČIAU VIDURKIO'
      case 'PREMIUM': return 'PREMIUM'
      default: return rating
    }
  }

  const getDealRatingInfo = (rating: string) => {
    switch (rating) {
      case 'GOOD_DEAL': return { text: 'GERAS PASIULYMAS', color: 'text-green-400', bg: 'bg-green-500/20', icon: '&#9989;' }
      case 'FAIR_PRICE': return { text: 'TEISINGA KAINA', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '&#128077;' }
      case 'OVERPRICED': return { text: 'PER BRANGU', color: 'text-red-400', bg: 'bg-red-500/20', icon: '&#9888;' }
      default: return null
    }
  }

  const dealInfo = deal_rating ? getDealRatingInfo(deal_rating) : null

  // Calculate max bar width for waterfall visualization
  const getBarWidth = (value: number, maxValue: number) => {
    const absValue = Math.abs(value)
    const percentage = (absValue / maxValue) * 100
    return Math.min(percentage, 100)
  }

  const shapData = shap_explanation as ShapExplanation | undefined
  const maxShapValue = shapData?.contributions
    ? Math.max(...shapData.contributions.map(c => Math.abs(c.shap_value)))
    : 1

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">&#9989;</span>
        </div>

        <h3 className="text-2xl font-bold text-white">Analize baigta!</h3>

        {/* Main price display */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-2xl p-6 space-y-2">
          <div className="text-3xl lg:text-4xl font-bold">
            &euro;{total_price?.toLocaleString() || 'N/A'}<span className="text-lg">/men</span>
          </div>
          <div className="text-green-100">
            &euro;{price_per_m2?.toFixed(2)}/m&sup2; &bull; {confidence}% tikslumas
          </div>
        </div>
      </div>

      {/* Deal Rating (if we have listing price) */}
      {dealInfo && listing_price && (
        <div className={`${dealInfo.bg} rounded-xl p-4 text-center`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl" dangerouslySetInnerHTML={{ __html: dealInfo.icon }} />
            <span className={`font-bold ${dealInfo.color}`}>{dealInfo.text}</span>
          </div>
          <div className="text-white/80 text-sm">
            Skelbimo kaina: <span className="font-semibold">&euro;{listing_price}</span> |
            Musu vertinimas: <span className="font-semibold">&euro;{total_price?.toLocaleString()}</span>
            {price_difference_percent && (
              <span className={price_difference_percent > 0 ? 'text-green-400' : 'text-red-400'}>
                {' '}({price_difference_percent > 0 ? '+' : ''}{price_difference_percent.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* SHAP Explanation - The Transparency Section */}
      {shapData && (
        <div className="bg-white/5 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">&#128200;</span>
              <span className="font-semibold text-white">Kaip gavome sia kaina?</span>
            </div>
            <span className="text-white/60 text-xl">
              {showExplanation ? '&#9650;' : '&#9660;'}
            </span>
          </button>

          {showExplanation && (
            <div className="px-4 pb-4 space-y-4">
              {/* Summary text */}
              <p className="text-white/80 text-sm italic border-l-2 border-blue-400 pl-3">
                {shapData.summary_lt}
              </p>

              {/* Waterfall visualization */}
              <div className="space-y-2">
                {shapData.waterfall.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {/* Label */}
                    <div className="w-32 text-xs text-white/70 text-right truncate">
                      {item.label}
                      {item.display_value && (
                        <span className="text-white/50 ml-1">({item.display_value})</span>
                      )}
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-6 relative">
                      {item.type === 'base' && (
                        <div className="h-full bg-blue-500/60 rounded flex items-center justify-end pr-2">
                          <span className="text-xs text-white font-medium">
                            &euro;{item.value.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {item.type === 'total' && (
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-end pr-2">
                          <span className="text-xs text-white font-bold">
                            &euro;{item.value.toFixed(2)}/m&sup2;
                          </span>
                        </div>
                      )}
                      {item.type === 'positive' && (
                        <div
                          className="h-full bg-green-500/70 rounded flex items-center px-2"
                          style={{ width: `${Math.max(getBarWidth(item.value, maxShapValue * 1.5), 20)}%` }}
                        >
                          <span className="text-xs text-white font-medium whitespace-nowrap">
                            +&euro;{item.value.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {item.type === 'negative' && (
                        <div
                          className="h-full bg-red-500/70 rounded flex items-center px-2"
                          style={{ width: `${Math.max(getBarWidth(item.value, maxShapValue * 1.5), 20)}%` }}
                        >
                          <span className="text-xs text-white font-medium whitespace-nowrap">
                            &euro;{item.value.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {item.type === 'other' && (
                        <div
                          className="h-full bg-gray-500/50 rounded flex items-center px-2"
                          style={{ width: '30%' }}
                        >
                          <span className="text-xs text-white/80 font-medium whitespace-nowrap">
                            {item.value > 0 ? '+' : ''}&euro;{item.value.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cumulative value */}
                    <div className="w-16 text-xs text-white/60 text-right">
                      {item.type !== 'base' && item.type !== 'total' && (
                        <span>= &euro;{item.cumulative.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top factors summary */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Positive factors */}
                <div className="bg-green-500/10 rounded-lg p-3">
                  <div className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1">
                    <span>&#9650;</span> Didina kaina
                  </div>
                  <div className="space-y-1">
                    {shapData.top_positive.slice(0, 3).map((c, i) => (
                      <div key={i} className="text-xs text-white/80 flex justify-between">
                        <span className="truncate">{c.feature_name_lt}</span>
                        <span className="text-green-400 font-medium ml-2">+&euro;{c.shap_value.toFixed(2)}</span>
                      </div>
                    ))}
                    {shapData.top_positive.length === 0 && (
                      <div className="text-xs text-white/50">Nera teigaimu faktoriu</div>
                    )}
                  </div>
                </div>

                {/* Negative factors */}
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                    <span>&#9660;</span> Mazina kaina
                  </div>
                  <div className="space-y-1">
                    {shapData.top_negative.slice(0, 3).map((c, i) => (
                      <div key={i} className="text-xs text-white/80 flex justify-between">
                        <span className="truncate">{c.feature_name_lt}</span>
                        <span className="text-red-400 font-medium ml-2">&euro;{c.shap_value.toFixed(2)}</span>
                      </div>
                    ))}
                    {shapData.top_negative.length === 0 && (
                      <div className="text-xs text-white/50">Nera neigiamu faktoriu</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Base value explanation */}
              <div className="text-xs text-white/50 text-center pt-2 border-t border-white/10">
                Bazine kaina (&euro;{shapData.base_value.toFixed(2)}/m&sup2;) = Vilniaus vidurkis pagal musu duomenu baze
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis?.value_rating && (
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-lg font-semibold text-white mb-1">Vertinimas</div>
            <div className={`text-sm font-bold ${getValueRatingColor(analysis.value_rating)}`}>
              {getValueRatingText(analysis.value_rating)}
            </div>
            <div className="text-xs text-white/70 mt-1">
              {analysis.value_description}
            </div>
          </div>
        )}

        {analysis?.location_rating && (
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-lg font-semibold text-white mb-1">Lokacija</div>
            <div className={`text-sm font-bold ${getValueRatingColor(analysis.location_rating)}`}>
              {getValueRatingText(analysis.location_rating)}
            </div>
            <div className="text-xs text-white/70 mt-1">
              {analysis.location_insight}
            </div>
          </div>
        )}

        {analysis?.amenities_rating && (
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-lg font-semibold text-white mb-1">Patogumai</div>
            <div className={`text-sm font-bold ${getValueRatingColor(analysis.amenities_rating)}`}>
              {getValueRatingText(analysis.amenities_rating)}
            </div>
            <div className="text-xs text-white/70 mt-1">
              {analysis.amenities_description}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          Gauti detalia PDF ataskaita (+&euro;2)
        </button>

        <button
          onClick={onBack}
          className="w-full bg-white/10 text-white py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
        >
          Analizuoti kita objekta
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-white/50 text-center space-y-1">
        <p>* Vertinimas yra orientacinis ir negali pakeisti profesionalaus turto vertintojo isvados</p>
        <p>Tikslumas: {confidence}% | Duomenys atnaujinti: {new Date().toLocaleDateString('lt-LT')}</p>
      </div>
    </div>
  )
}
