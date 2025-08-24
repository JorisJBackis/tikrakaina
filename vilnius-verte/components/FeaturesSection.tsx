'use client'

export function FeaturesSection() {
  const features = [
    {
      icon: "🧠",
      title: "Dirbtinis Intelektas",
      description: "Pažangiausi neural network modeliai, treniruoti ant 100,000+ Vilniaus NT sandorių duomenų.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🔍",
      title: "Giluminė Analizė", 
      description: "Analizuojame ne tik kainą, bet ir investicijos rizikas, augimo potencialą, likvidumą.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: "📊",
      title: "Profesionali Ataskaita",
      description: "Išsami PDF ataskaita su rekomendacijomis, rinkos palyginimais ir investicijos strategija.",
      color: "from-orange-500 to-red-500"
    }
  ]

  const pricingTiers = [
    {
      name: "Starter",
      price: "€5",
      credits: "12 kreditų",
      pricePerAnalysis: "€0.42",
      features: [
        "Momentinis vertinimas",
        "Bazinė analizė",
        "Rinkos palyginimas",
        "30 dienų istorija"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "€19",
      credits: "100 vertinimų/mėn",
      pricePerAnalysis: "€0.19",
      features: [
        "Prioritetinis apdorojimas",
        "Detalūs PDF raportai",
        "Istorinių kainų tracking",
        "Excel eksportas",
        "Email pranešimai"
      ],
      popular: true
    },
    {
      name: "Enterprise", 
      price: "€99",
      credits: "Neriboti vertinimai",
      pricePerAnalysis: "€0.05",
      features: [
        "API prieiga",
        "Bulk apdorojimas",
        "Pritaikytos ataskaitos",
        "Best deals finder",
        "Prioritetinė pagalba"
      ],
      popular: false
    }
  ]

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        {/* Features showcase */}
        <div className="text-center mb-20">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Kodėl VilniusVertė?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-16">
            Profesionalūs įrankiai, skirti išmintingiems NT investuotojams ir pirkėjams
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50 hover:border-slate-500 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Pasirinkite Planą
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            Pradėkite su mažu biudžetu ir augkite pagal poreikius
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index}
                className={`relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 ${
                  tier.popular 
                    ? 'border-blue-400 shadow-2xl shadow-blue-500/20' 
                    : 'border-slate-600/50 hover:border-slate-500'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold py-2 px-4 rounded-full">
                      Populiariausia
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  
                  <div className="mb-4">
                    <span className="text-3xl lg:text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-slate-400">/mėn</span>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-2">{tier.credits}</p>
                  <p className="text-slate-400 text-xs mb-8">
                    ~{tier.pricePerAnalysis} už vertinimą
                  </p>

                  <ul className="space-y-3 mb-8 text-left">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-3 text-sm text-slate-300">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button 
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Pradėti Dabar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-12 border border-blue-500/20">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Pasiruošęs priimti išmintingus NT sprendimus?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Prisijunkite prie tūkstančių lietuvių, kurie jau sutaupė šimtus eurų naudodami VilniusVertę
          </p>
          
          <button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-8 rounded-xl hover:from-orange-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-xl">
            Pradėti Nemokamai
          </button>
          
          <p className="text-xs text-slate-400 mt-4">
            Pirmas vertinimas nemokamas • Jokių įsipareigojimų • Momentinis rezultatas
          </p>
        </div>
      </div>
    </section>
  )
}