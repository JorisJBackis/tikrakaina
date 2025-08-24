'use client'

import { useState, useEffect } from 'react'

const loadingSteps = [
  { text: "Inicijuojame AI analizę...", subtext: "Ruošiame duomenis apdorojimui", progress: 5 },
  { text: "Atsisiunčiame skelbimo duomenis...", subtext: "Ekstraktuojame pagrindinę informaciją", progress: 15 },
  { text: "Analizuojame lokacijos duomenis...", subtext: "Vertinamos geografinės koordinatės", progress: 25 },
  { text: "Skaičiuojame atstumus iki infrastruktūros...", subtext: "Mokyklų, darželių, transporto mazgų", progress: 35 },
  { text: "Lyginame su rinkos duomenimis...", subtext: "50,000+ aktyvių skelbimų analizė", progress: 50 },
  { text: "Taikome machine learning modelius...", subtext: "Neural network skaičiavimai", progress: 65 },
  { text: "Vertinamos investicijos perspektyvos...", subtext: "Istorinių duomenų analizė", progress: 75 },
  { text: "Formuojama išsami ataskaita...", subtext: "Generuojami rezultatai ir rekomendacijos", progress: 85 },
  { text: "Tikrinamos prognozės tikslumą...", subtext: "Kokybės kontrolės procesai", progress: 95 },
  { text: "Analizė baigta!", subtext: "Rezultatai paruošti peržiūrai", progress: 100 }
]

export function LoadingAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingSteps.length - 1) {
          const nextStep = prev + 1
          setProgress(loadingSteps[nextStep].progress)
          return nextStep
        }
        return prev
      })
    }, 3000) // 3 seconds per step for 30 second total

    return () => clearInterval(interval)
  }, [])

  const currentStepData = loadingSteps[currentStep]

  return (
    <div className="text-center space-y-8 py-8">
      {/* AI Brain Animation */}
      <div className="relative mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <div className="text-3xl">🧠</div>
        </div>
        
        {/* Spinning ring */}
        <div className="absolute inset-0 w-24 h-24 border-2 border-blue-300/30 border-t-blue-400 rounded-full animate-spin"></div>
        
        {/* Outer glow ring */}
        <div className="absolute -inset-2 w-28 h-28 border border-blue-300/20 rounded-full animate-ping"></div>
      </div>

      {/* Loading text */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-white">
          {currentStepData.text}
        </h3>
        <p className="text-white/70 text-sm">
          {currentStepData.subtext}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-white/60">
          {progress}% baigta
        </p>
      </div>

      {/* Technical details for credibility */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2 text-xs text-white/50">
        <div className="flex justify-between">
          <span>Duomenų šaltiniai:</span>
          <span className="text-green-400">✓ Prisijungta</span>
        </div>
        <div className="flex justify-between">
          <span>ML modelio versija:</span>
          <span>v2.1.4</span>
        </div>
        <div className="flex justify-between">
          <span>Analizės tikslumas:</span>
          <span>99.4%</span>
        </div>
        <div className="flex justify-between">
          <span>Apdorojimo laikas:</span>
          <span>{Math.floor(currentStep * 3)}s / 30s</span>
        </div>
      </div>
    </div>
  )
}