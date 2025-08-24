import { HeroSection } from '@/components/HeroSection'
import { StatsSection } from '@/components/StatsSection'
import { ChartsSection } from '@/components/ChartsSection'
import { FeaturesSection } from '@/components/FeaturesSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900">
      <HeroSection />
      <StatsSection />
      <ChartsSection />
      <FeaturesSection />
    </main>
  )
}
