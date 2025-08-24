'use client'

interface PredictionResultProps {
  prediction: any
  onBack: () => void
}

export function PredictionResult({ prediction, onBack }: PredictionResultProps) {
  if (!prediction?.success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">❌</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Analizės klaida</h3>
          <p className="text-white/70 text-sm">
            {prediction?.error || 'Nepavyko apdoroti skelbimo. Bandykite dar kartą.'}
          </p>
        </div>

        <button
          onClick={onBack}
          className="w-full bg-white/10 text-white py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
        >
          Bandyti dar kartą
        </button>
      </div>
    )
  }

  const { price_per_m2, total_price, confidence, analysis } = prediction

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
      case 'ABOVE_AVERAGE': return 'AUKŠČIAU VIDURKIO'
      case 'PREMIUM': return 'PREMIUM'
      default: return rating
    }
  }

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">✅</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white">Analizė baigta!</h3>
        
        {/* Main price display */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-2xl p-6 space-y-2">
          <div className="text-3xl lg:text-4xl font-bold">
            €{total_price?.toLocaleString() || 'N/A'}<span className="text-lg">/mėn</span>
          </div>
          <div className="text-green-100">
            €{price_per_m2?.toFixed(2)}/m² • {confidence}% tikslumas
          </div>
        </div>
      </div>

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
          Gauti detalią PDF ataskaitą (+€2)
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-white/10 text-white py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
        >
          Analizuoti kitą objektą
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-white/50 text-center space-y-1">
        <p>* Vertinimas yra orientacinis ir negali pakeisti profesionalaus turto vertintojo išvados</p>
        <p>Tikslumas: {confidence}% | Duomenys atnaujinti: {new Date().toLocaleDateString('lt-LT')}</p>
      </div>
    </div>
  )
}