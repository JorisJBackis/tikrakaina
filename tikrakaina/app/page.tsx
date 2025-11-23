'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Zap, Check, ChevronDown, Bell, Sparkles, Command, FileText, Download, Gauge, LogOut, RefreshCw, Link as LinkIcon, ArrowRight, BadgeAlert, BadgeCheck, Info } from 'lucide-react'
import { supabase, getUserCredits, deductCredits, savePrediction, saveRentalTrainingData, saveNewsletterSignup, trackEvent } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import BuyCreditsModal from '@/components/BuyCreditsModal'
import UserCredits from '@/components/UserCredits'
import Footer from '@/components/Footer'
import VilniusMap from '@/components/VilniusMap'
import { extractDistrictWithOverrides, type DistrictExtractionResult } from '@/lib/districtExtractor'

// Merged Version 4: Notion-Style Clean (Lithuanian)
export default function NotionStyleVersion() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [isRenting, setIsRenting] = useState<boolean | null>(false)
  const [inputMethod, setInputMethod] = useState<'url' | 'manual'>('url')
  const [manualData, setManualData] = useState({
    rooms: '',
    area_m2: '',
    floor_current: '',
    floor_total: '',
    year_built: '', // Store actual year (e.g., 2010)
    address: '', // Store address for geocoding
    district: '', // Store district for model prediction
    year_centered: '', // Calculated: year_built - 2000
    dist_to_center_km: '', // Calculated from address
    has_lift: false,
    has_balcony_terrace: false,
    has_parking_spot: false,
    heat_Centrinis: false,
    heat_Dujinis: false,
    heat_Elektra: false
  })
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [selectedAddressData, setSelectedAddressData] = useState<any>(null)
  const [addressSearchLoading, setAddressSearchLoading] = useState(false)
  const [districtExtraction, setDistrictExtraction] = useState<DistrictExtractionResult | null>(null)
  const [actualRentPrice, setActualRentPrice] = useState('')
  const [manualRentNotYetRented, setManualRentNotYetRented] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [urlInputHighlight, setUrlInputHighlight] = useState(false)

  // Authentication states
  const [user, setUser] = useState<any>(null)
  const [userCredits, setUserCredits] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Ref for URL input
  const urlInputRef = React.useRef<HTMLInputElement>(null)

  // Vilnius city center coordinates (same as backend)
  const CITY_CENTER = { lat: 54.6872, lon: 25.2797 }

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Debounce timer ref
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Search for address suggestions using Nominatim (with debounce)
  const searchAddresses = (query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 3) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      setAddressSearchLoading(false)
      return
    }

    setAddressSearchLoading(true)

    // Debounce: wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      console.log('🔍 Searching for:', query)

      try {
        // Use our Next.js API route to avoid CORS issues
        const url = `/api/geocode?q=${encodeURIComponent(query)}`

        console.log('📡 API URL:', url)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ Got results:', data.length, 'addresses')
        console.log('First result:', data[0])

        setAddressSuggestions(data)
        setShowAddressSuggestions(data.length > 0)
        setAddressSearchLoading(false)
      } catch (error) {
        console.error('❌ Address search error:', error)
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
        setAddressSearchLoading(false)
      }
    }, 500)
  }

  // District mapping: OSM names → Model districts
  const districtMapping: Record<string, string> = {
    "Antakalnis": "Antakalnis", "Antakalnio seniūnija": "Antakalnis",
    "Bajorai": "Bajorai", "Baltupiai": "Baltupiai",
    "Fabijoniškės": "Fabijoniškės", "Fabijoniškių seniūnija": "Fabijoniškės",
    "Jeruzalė": "Jeruzalė",
    "Justiniškės": "Justiniškės", "Justiniškių seniūnija": "Justiniškės",
    "Karoliniškės": "Karoliniškės", "Karoliniškių seniūnija": "Karoliniškės",
    "Lazdynai": "Lazdynai", "Lazdynų seniūnija": "Lazdynai",
    "Lazdynėliai": "Lazdynėliai", "Markučiai": "Markučiai",
    "Naujamiestis": "Naujamiestis", "Naujamiesčio seniūnija": "Naujamiestis",
    "Naujininkai": "Naujininkai", "Naujininkų seniūnija": "Naujininkai",
    "Naujoji Vilnia": "Naujoji Vilnia", "Naujosios Vilnios seniūnija": "Naujoji Vilnia",
    "Paupys": "Paupys",
    "Pašilaičiai": "Pašilaičiai", "Pašilaičių seniūnija": "Pašilaičiai",
    "Pilaitė": "Pilaitė", "Pilaitės seniūnija": "Pilaitė",
    "Rasų seniūnija": "Markučiai",
    "Santariškės": "Santariškės",
    "Senamiestis": "Senamiestis", "Senamiesčio seniūnija": "Senamiestis",
    "Užupis": "Užupis", "Verkių seniūnija": "Baltupiai",
    "Vilkpėdė": "Vilkpėdė", "Vilkpėdės seniūnija": "Vilkpėdė",
    "Viršuliškės": "Viršuliškės", "Viršuliškių seniūnija": "Viršuliškės",
    "Šeškinė": "Šeškinė", "Šeškinės seniūnija": "Šeškinė",
    "Šiaurės miestelis": "Šiaurės miestelis",
    "Šnipiškės": "Šnipiškės", "Šnipiškių seniūnija": "Šnipiškės",
    "Žirmūnai": "Žirmūnai", "Žirmūnų seniūnija": "Žirmūnai",
    "Žvėrynas": "Žvėrynas", "Žvėryno seniūnija": "Žvėrynas"
  }

  // Handle address selection from suggestions
  const selectAddress = (suggestion: any) => {
    const address = suggestion.display_name
    const lat = parseFloat(suggestion.lat)
    const lon = parseFloat(suggestion.lon)

    // 🎯 Use smart district extraction with 76-entry mapping table!
    const extraction = extractDistrictWithOverrides(suggestion.address)

    console.log('🏘️ District Extraction:', extraction)

    // Calculate distance
    const distance = calculateDistance(lat, lon, CITY_CENTER.lat, CITY_CENTER.lon)

    // Update manual data
    setManualData({
      ...manualData,
      address: address,
      district: extraction.district,
      dist_to_center_km: String(distance.toFixed(2))
    })

    // Store extraction result for UI display
    setDistrictExtraction(extraction)

    // Store FULL Nominatim response for debugging
    setSelectedAddressData({
      lat,
      lon,
      district: extraction.district,
      fullAddress: address,
      nominatimResponse: suggestion  // Store complete Nominatim response
    })

    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  // Scatter plot data for price vs size - realistic Vilnius rental data with outliers
  const scatterData = [
    { x: 25, y: 482 }, { x: 27, y: 450 }, { x: 29, y: 559 }, { x: 31, y: 501 },
    { x: 33, y: 465 }, { x: 35, y: 380 }, { x: 36, y: 621 }, { x: 38, y: 523 },
    { x: 40, y: 588 }, { x: 41, y: 649 }, { x: 43, y: 551 }, { x: 45, y: 648 },
    { x: 47, y: 612 }, { x: 48, y: 820 }, { x: 50, y: 740 }, { x: 52, y: 703 },
    { x: 54, y: 711 }, { x: 55, y: 788 }, { x: 57, y: 715 }, { x: 59, y: 829 },
    { x: 61, y: 774 }, { x: 62, y: 761 }, { x: 63, y: 520 }, { x: 64, y: 801 },
    { x: 66, y: 881 }, { x: 68, y: 833 }, { x: 70, y: 850 }, { x: 71, y: 944 },
    { x: 73, y: 845 }, { x: 75, y: 911 }, { x: 76, y: 1100 }, { x: 77, y: 930 },
    { x: 79, y: 904 }, { x: 81, y: 997 }, { x: 83, y: 1017 }, { x: 84, y: 932 },
    { x: 86, y: 948 }, { x: 88, y: 1010 }, { x: 89, y: 750 }, { x: 90, y: 1002 },
    { x: 91, y: 1088 }, { x: 93, y: 1045 }, { x: 95, y: 1101 }, { x: 97, y: 1029 },
    { x: 98, y: 1148 }, { x: 100, y: 1021 }, { x: 101, y: 1150 }, { x: 102, y: 1125 },
    { x: 103, y: 1059 }, { x: 104, y: 1131 }, { x: 106, y: 1083 }, { x: 107, y: 1119 },
    { x: 108, y: 1141 }, { x: 109, y: 1150 }, { x: 110, y: 1129 }
  ]


  const checkAuth = async () => {
    try {
      console.log('Checking auth...')

      // CRITICAL: Use getUser(), not getSession()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        // Handle AuthSessionMissingError gracefully (user is logged out)
        if (error.message?.includes('Auth session missing')) {
          console.log('No active session')
        } else {
          console.error('Auth error:', error)
        }
        setUser(null)
        setUserCredits(0)
        setCheckingAuth(false)
        return
      }

      setUser(user)

      if (user) {
        console.log('User authenticated:', user.id)
        // Fetch credits only after user is confirmed
        const credits = await getUserCredits(user.id)
        console.log('Credits loaded:', credits)
        setUserCredits(credits)
      } else {
        setUserCredits(0)
      }
    } catch (err: any) {
      // Gracefully handle auth session missing error
      if (err?.message?.includes('Auth session missing')) {
        console.log('No active session')
      } else {
        console.error('Auth check failed:', err)
      }
      setUser(null)
      setUserCredits(0)
    } finally {
      setCheckingAuth(false)
    }
  }

  // Check authentication on mount
  useEffect(() => {
    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          // Fetch credits after sign in
          const credits = await getUserCredits(session.user.id)
          setUserCredits(credits)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserCredits(0)
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refreshed, ensure user is still set
          if (session?.user) {
            setUser(session.user)
          }
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    console.log('Logging out...')

    try {
      // Sign out from Supabase client-side
      await supabase.auth.signOut()

      // Call API route to properly clear cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      // Clear local state
      setUser(null)
      setUserCredits(0)

      // Redirect and refresh
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, try to clear state and redirect
      setUser(null)
      setUserCredits(0)
      window.location.href = '/'
    }
  }

  const handleNewsletterSignup = async () => {
    // Validate email
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error')
      setNewsletterMessage('Prašome įvesti teisingą el. pašto adresą')
      return
    }

    setNewsletterStatus('loading')
    setNewsletterMessage('')

    const result = await saveNewsletterSignup(newsletterEmail)

    if (result.success) {
      setNewsletterStatus('success')
      setNewsletterMessage('Sėkmingai užsiprenumeravote! 🎉')
      setNewsletterEmail('')

      // 📊 Track newsletter signup
      trackEvent('newsletter_signup', {
        source: 'results_page'
      }, user?.id)
    } else {
      setNewsletterStatus('error')
      if (result.error === 'Email already subscribed') {
        setNewsletterMessage('Šis el. paštas jau užsiprenumeruotas')
      } else {
        setNewsletterMessage('Klaida. Bandykite dar kartą.')
      }
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      setNewsletterStatus('idle')
      setNewsletterMessage('')
    }, 3000)
  }

  const marketTrends = [
    { data: 'Birželis', naujienos: 4100, nuoma: 980, pardavimas: 820 },
    { data: 'Liepa', naujienos: 3600, nuoma: 1050, pardavimas: 650 },
    { data: 'Rugpjūtis', naujienos: 3850, nuoma: 1180, pardavimas: 690 },
    { data: 'Rugsėjis', naujienos: 4500, nuoma: 1240, pardavimas: 880 },
    { data: 'Spalis', naujienos: 4350, nuoma: 1080, pardavimas: 920 },
    { data: 'Lapkritis', naujienos: 3700, nuoma: 950, pardavimas: 750 }
  ]

  const neighborhoodPrices = [
    { name: 'Senamiestis', avgPrice: 850, pricePerM2: 14.2, color: '#ef4444' },
    { name: 'Naujamiestis', avgPrice: 780, pricePerM2: 13.5, color: '#f97316' },
    { name: 'Žvėrynas', avgPrice: 920, pricePerM2: 15.8, color: '#dc2626' },
    { name: 'Antakalnis', avgPrice: 650, pricePerM2: 11.2, color: '#eab308' },
    { name: 'Šnipiškės', avgPrice: 720, pricePerM2: 12.8, color: '#f59e0b' },
    { name: 'Fabijoniškės', avgPrice: 480, pricePerM2: 8.9, color: '#84cc16' },
    { name: 'Justiniškės', avgPrice: 520, pricePerM2: 9.4, color: '#22c55e' },
    { name: 'Pašilaičiai', avgPrice: 510, pricePerM2: 9.1, color: '#22c55e' },
    { name: 'Lazdynai', avgPrice: 580, pricePerM2: 10.3, color: '#84cc16' },
    { name: 'Pilaitė', avgPrice: 490, pricePerM2: 8.7, color: '#22c55e' }
  ]

  const plans = [
    {
      id: 'starter',
      name: '1 analizė',
      price: '€0.99',
      period: '',
      credits: '1 analizė',
      pricePerAnalysis: '€0.99 / analizė',
      features: []
    },
    {
      id: 'pro',
      name: '7 analizės',
      price: '€4.99',
      period: '',
      credits: '7 analizės',
      pricePerAnalysis: '€0.71 / analizė',
      savings: 'Sutaupote 28%',
      features: [],
      popular: true
    },
    {
      id: 'enterprise',
      name: '20 analizių',
      price: '€9.99',
      period: '',
      credits: '20 analizių',
      pricePerAnalysis: '€0.50 / analizė',
      savings: 'Sutaupote 50% ',
      features: []
    }
  ]

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Auth / credits gates - TEMPORARILY DISABLED FOR FREE LAUNCH
  // if (!user) {
  //   setShowAuthModal(true);
  //   return;
  // }
  // if (userCredits < 1) {
  //   setShowBuyCreditsModal(true);
  //   return;
  // }

  setLoading(true);
  setResult(null);

  // 📊 Track analysis start
  trackEvent('analysis_started', {
    input_method: inputMethod,
    is_renting: isRenting
  }, user?.id);

  // For manual input, calculate year_centered (distance already calculated when address selected)
  const processedManualData = { ...manualData };
  if (inputMethod === "manual") {
    // Calculate year_centered from actual year
    if (manualData.year_built) {
      processedManualData.year_centered = String(parseInt(manualData.year_built) - 2000);
    }

    // Check that address was selected and distance calculated
    if (!manualData.dist_to_center_km) {
      alert('Prašome pasirinkti adresą iš pasiūlymų sąrašo.');
      setLoading(false);
      return;
    }
  }

  // Build API base + endpoint safely (client-side env must be NEXT_PUBLIC_*)
  const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
  const endpoint = inputMethod === "url" ? "/api/predict" : "/api/predict-manual";

  // Build request body
  const requestBody =
    inputMethod === "url"
      ? { url }
      : {
          manual_data: {
            ...processedManualData,
            is_rental: isRenting
          }
        };

  // Optional: hard timeout so UI never hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `Request failed with ${res.status}`);
    }

    // IMPORTANT: Credit deduction and save - TEMPORARILY DISABLED FOR FREE LAUNCH
    // if (user) {
    //   console.log('🚨 STARTING CREDIT DEDUCTION FOR USER:', user.id);

    //   // Deduct credits first
    //   const creditDeducted = await deductCredits(user.id, 1);

    //   console.log('🚨 CREDIT DEDUCTION RESULT:', creditDeducted);

    //   if (!creditDeducted) {
    //     console.error('❌ Failed to deduct credits');
    //     alert('CRITICAL: Credit deduction failed! Check console.');
    //   } else {
    //     console.log('✅ Credit successfully deducted');
    //   }

    //   // Save prediction to history
    //   await savePrediction(
    //     user.id,
    //     inputMethod === "url" ? url : null,
    //     inputMethod === "manual" ? manualData : null,
    //     data,
    //     Boolean(isRenting)
    //   );

    //   // If renting & manual, log training data
    //   if (isRenting === true && inputMethod === "manual") {
    //     const rentPrice = actualRentPrice ? parseFloat(actualRentPrice) : undefined;
    //     await saveRentalTrainingData(
    //       user.id,
    //       manualData,
    //       rentPrice,
    //       url || undefined,
    //       undefined,
    //       rentPrice ? `User confirmed rent: €${rentPrice}/month` : "User is renting but did not provide price"
    //     );
    //   }

    //   // Force refresh credits after deduction
    //   const newCredits = await getUserCredits(user.id);
    //   console.log('💰 Fetched new credits:', newCredits);
    //   setUserCredits(newCredits);

    //   // Force a small delay to ensure state updates
    //   await new Promise(resolve => setTimeout(resolve, 100));

    //   console.log('✅ All async operations complete. Showing results now.');
    // }

    // For manual mode with actual rent price, add comparison fields
    if (inputMethod === 'manual' && actualRentPrice && parseFloat(actualRentPrice) > 0) {
      const listingPrice = parseFloat(actualRentPrice);
      const predictedPrice = data.total_price;

      // Match backend logic EXACTLY:
      // difference = predicted_price - listing_price
      // difference_percent = (difference / listing_price * 100)
      const difference = predictedPrice - listingPrice;
      const differencePercent = listingPrice > 0 ? (difference / listingPrice * 100) : 0;

      // Determine deal rating (EXACT backend logic)
      let dealRating = 'FAIR_PRICE';
      if (differencePercent > 5) {  // Our prediction is 5%+ higher = good deal
        dealRating = 'GOOD_DEAL';
      } else if (differencePercent < -1) {  // Our prediction is 1%+ lower = overpriced
        dealRating = 'OVERPRICED';
      }

      // Add comparison fields to data
      data.listing_price = listingPrice;
      data.price_difference = difference;
      data.price_difference_percent = parseFloat(differencePercent.toFixed(1));
      data.deal_rating = dealRating;

      // Save to rental training data
      console.log('💾 Saving rental training data...');
      await saveRentalTrainingData(
        user?.id || null,
        processedManualData,
        listingPrice,
        undefined,
        `Manual entry - Deal rating: ${dealRating}, Difference: ${differencePercent.toFixed(1)}%`
      );
    }

    // Show results ONLY after all async operations are done
    setResult(data);

    // 📊 Track analysis completion
    trackEvent('analysis_completed', {
      input_method: inputMethod,
      price: data.total_price,
      price_per_m2: data.price_per_m2,
      confidence: data.confidence
    }, user?.id);

  } catch (err) {
    console.error(err);
    alert("Analizė nepavyko. Bandykite dar kartą.");
  } finally {
    clearTimeout(timeoutId);
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-white">
      {/* Notion-style Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 md:space-x-6">
              <a
                href="https://vilrent.lt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 md:space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img src="/logo.png" alt="VilRent Logo" className="h-8 md:h-10 w-auto object-contain" />
                <span className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", letterSpacing: '-0.02em' }}>VilRent</span>
                <span className="hidden md:inline text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium">8 metų patirtis</span>
              </a>
              <nav className="hidden lg:flex items-center space-x-1">
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Kainos
                </button>
                <button
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  DUK
                </button>
                <div className="flex items-center space-x-5 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>+370 630 52110</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Vytenio g. 50-3</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>support@vilrent.lt</span>
                  </div>
                </div>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <UserCredits
                    key={userCredits}
                    userId={user.id}
                    onBuyCredits={() => setShowBuyCreditsModal(true)}
                  />
                  <button
                    onClick={handleLogout}
                    className="px-2 md:px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Atsijungti</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-2 md:px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    Prisijungti
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="hidden md:inline-block px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
                  >
                    Pradėti nemokamai
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
<motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-800 text-xs md:text-sm mb-4 md:mb-6"
          >
            <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span className="hidden md:inline">Išvenk permokėjimo • Sužinok savo būsto tikrą kainą!</span>
            <span className="md:hidden">Išvenk permokėjimo • Sužinok būsto tikrą kainą!</span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
            NT vertinimas su <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">dirbtinio intelekto</span> pagalba
          </h1>

          <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
            40 000+ būstų analizė. 2% paklaida. Sutaupyk tūkstančius.
          </p>

<div className="flex justify-center mb-6 md:mb-8 px-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const element = document.getElementById('valuation-section')
                if (element) {
                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                  const offsetPosition = elementPosition - 100 // Scroll 100px above the section
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  })
                }
              }}
              className="w-full sm:w-auto px-8 md:px-12 py-3 md:py-4 bg-gray-900 text-white text-base md:text-lg rounded-lg hover:bg-gray-800 font-medium"
            >
              Pradėti nemokamai
            </motion.button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:gap-8 text-xs md:text-sm text-gray-500 px-2">
            <span className="flex items-center"><Check className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-500" /> Be prisijungimo</span>
            <span className="flex items-center"><Check className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-500" /> 30 sek analizė</span>
            <span className="flex items-center"><Check className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-500" /> 2% paklaida</span>
          </div>
        </div>
      </section>

      {/* Main Valuation Section */}
      <section id="valuation-section" className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Valuation Tool */}
            <div className="lg:col-span-2 order-1">
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-8">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold">Įvertinkite būstą</h2>
                  {result && (
                    <button
                      onClick={() => {setResult(null); setUrl('')}}
                      className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title="Naujas vertinimas"
                    >
                      <RefreshCw className="h-4 w-4" />

                    </button>
                  )}
                </div>

                {!loading && !result && (
                  <div className="space-y-4 md:space-y-6">
                    {/* Input Method Selection */}
                    <div>
                        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-center">Kaip norite pradėti?</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                          <button
                            onClick={() => {
                              setInputMethod('url')
                              // Trigger animation and focus
                              setTimeout(() => {
                                urlInputRef.current?.focus()
                                setUrlInputHighlight(true)
                                setTimeout(() => setUrlInputHighlight(false), 1500)
                              }, 100)
                            }}
                            className={`border-2 rounded-xl p-4 md:p-6 transition-all text-left group ${
                              inputMethod === 'url'
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <LinkIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-900 mb-2 md:mb-3" />
                            <h4 className="font-bold text-gray-900 mb-1 md:mb-2 text-base md:text-base">Turiu nuorodą</h4>
                            <p className="text-sm md:text-sm text-gray-600 mb-3 md:mb-4">Skelbimas jau įkeltas aruodas.lt</p>
                            <div className="flex items-center text-sm md:text-sm font-medium text-gray-900 group-hover:translate-x-1 transition-transform">
                              Pradėti <ArrowRight className="h-4 w-4 md:h-4 md:w-4 ml-1" />
                            </div>
                          </button>

                          <button
                            onClick={() => setInputMethod('manual')}
                            className={`border-2 rounded-xl p-4 md:p-6 transition-all text-left group ${
                              inputMethod === 'manual'
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <FileText className="h-6 w-6 md:h-8 md:w-8 text-gray-600 mb-2 md:mb-3" />
                            <h4 className="font-bold text-gray-900 mb-1 md:mb-2 text-base md:text-base">Įvesiu duomenis pats</h4>
                            <p className="text-sm md:text-sm text-gray-600 mb-3 md:mb-4">Neturiu aruodas.lt skelbimo</p>
                            <div className="flex items-center text-sm md:text-sm font-medium text-gray-600 group-hover:text-gray-900 group-hover:translate-x-1 transition-all">
                              Pradėti <ArrowRight className="h-4 w-4 md:h-4 md:w-4 ml-1" />
                            </div>
                          </button>
                        </div>

                        {inputMethod === 'url' ? (
                          <form onSubmit={handleSubmit}>
                            <div className="space-y-3 md:space-y-4">
                              <motion.div
                                className="relative"
                                animate={urlInputHighlight ? {
                                  scale: [1, 1.05, 1],
                                  boxShadow: [
                                    "0 0 0 0px rgba(0,0,0,0)",
                                    "0 0 0 4px rgba(59, 130, 246, 0.3)",
                                    "0 0 0 0px rgba(0,0,0,0)"
                                  ]
                                } : {}}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                              >
                                <input
                                  ref={urlInputRef}
                                  type="url"
                                  value={url}
                                  onChange={(e) => setUrl(e.target.value)}
                                  placeholder="Įklijuokite aruodas.lt nuorodą..."
                                  className="w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-sm md:text-base"
                                  required
                                />
                                <Command className="absolute right-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                              </motion.div>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full py-2.5 md:py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-800 text-sm md:text-base"
                              >
                                <Zap className="h-4 w-4 md:h-5 md:w-5" />
                                <span>Analizuoti dabar</span>
                              </motion.button>
                            </div>
                          </form>
                        ) : (
                          <form onSubmit={handleSubmit}>
                            <div className="space-y-4 md:space-y-6">
                              {/* Basic Property Info */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Būsto informacija</h4>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                  <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Kambarių skaičius</label>
                                    <input
                                      type="number"
                                      value={manualData.rooms}
                                      onChange={(e) => setManualData({...manualData, rooms: e.target.value})}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 text-sm md:text-base"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Plotas (m²)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={manualData.area_m2}
                                      onChange={(e) => setManualData({...manualData, area_m2: e.target.value})}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 text-sm md:text-base"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Aukštas</label>
                                    <input
                                      type="number"
                                      value={manualData.floor_current}
                                      onChange={(e) => setManualData({...manualData, floor_current: e.target.value})}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 text-sm md:text-base"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Iš viso aukštų</label>
                                    <input
                                      type="number"
                                      value={manualData.floor_total}
                                      onChange={(e) => setManualData({...manualData, floor_total: e.target.value})}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 text-sm md:text-base"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Building & Location */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Pastato ir lokacijos duomenys</h4>
                                <div className="space-y-3 md:space-y-4">
                                  <div className="relative">
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Adresas</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={manualData.address}
                                        onChange={(e) => {
                                          setManualData({...manualData, address: e.target.value, district: '', dist_to_center_km: ''})
                                          setSelectedAddressData(null)
                                          searchAddresses(e.target.value)
                                        }}
                                        onFocus={() => {
                                          if (manualData.address.length >= 3 && addressSuggestions.length > 0) {
                                            setShowAddressSuggestions(true)
                                          }
                                        }}
                                        className="w-full px-2 md:px-3 py-1.5 md:py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 text-sm md:text-base"

                                        autoComplete="off"
                                      />
                                      {addressSearchLoading && (
                                        <div className="absolute right-3 top-3">
                                          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-900 rounded-full"></div>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {selectedAddressData?.district
                                        ? `✓ ${selectedAddressData.district} • ${manualData.dist_to_center_km} km nuo centro`
                                        : addressSearchLoading
                                        ? 'Ieškoma...'
                                        : ' '}
                                    </p>

                                    {/* Address suggestions dropdown */}
                                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-900 rounded-md shadow-xl max-h-60 overflow-y-auto">
                                        {addressSuggestions.map((suggestion, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => selectAddress(suggestion)}
                                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition-colors"
                                          >
                                            <div className="font-medium text-sm text-gray-900">
                                              {suggestion.address?.road || suggestion.address?.neighbourhood || suggestion.name || 'Adresas'}
                                              {suggestion.address?.house_number && ` ${suggestion.address.house_number}`}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-0.5">
                                              {suggestion.address?.suburb || suggestion.address?.quarter || suggestion.address?.neighbourhood || 'Vilnius'}, Vilnius
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Statybos metai</label>
                                    <input
                                      type="number"
                                      value={manualData.year_built}
                                      onChange={(e) => setManualData({...manualData, year_built: e.target.value})}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 text-sm md:text-base"
                                      placeholder="pvz. 2010"
                                      min="1900"
                                      max="2025"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Amenities */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Patogumai</h4>
                                <div className="space-y-1.5 md:space-y-2">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={manualData.has_lift}
                                      onChange={(e) => setManualData({...manualData, has_lift: e.target.checked})}
                                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-xs md:text-sm text-gray-700">Yra liftas</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={manualData.has_balcony_terrace}
                                      onChange={(e) => setManualData({...manualData, has_balcony_terrace: e.target.checked})}
                                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-xs md:text-sm text-gray-700">Balkonas / terasa</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={manualData.has_parking_spot}
                                      onChange={(e) => setManualData({...manualData, has_parking_spot: e.target.checked})}
                                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-xs md:text-sm text-gray-700">Parkavimo vieta</span>
                                  </label>
                                </div>
                              </div>

                              {/* Heating */}
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Šildymas</h4>
                                <div className="space-y-1.5 md:space-y-2">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="heating"
                                      checked={manualData.heat_Centrinis}
                                      onChange={(e) => setManualData({...manualData, heat_Centrinis: true, heat_Dujinis: false, heat_Elektra: false})}
                                      className="text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Centrinis šildymas</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="heating"
                                      checked={manualData.heat_Dujinis}
                                      onChange={(e) => setManualData({...manualData, heat_Centrinis: false, heat_Dujinis: true, heat_Elektra: false})}
                                      className="text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Dujinis šildymas</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="heating"
                                      checked={manualData.heat_Elektra}
                                      onChange={(e) => setManualData({...manualData, heat_Centrinis: false, heat_Dujinis: false, heat_Elektra: true})}
                                      className="text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Elektrinis šildymas</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="heating"
                                      checked={!manualData.heat_Centrinis && !manualData.heat_Dujinis && !manualData.heat_Elektra}
                                      onChange={(e) => setManualData({...manualData, heat_Centrinis: false, heat_Dujinis: false, heat_Elektra: false})}
                                      className="text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Kita</span>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Current Rent Price (Optional) */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-900 mb-3">
                                Už kiek šis butas dabar nuomojamas?
                                <span className="text-sm font-normal text-gray-500"> (jei nenuomuojama - praleiskite)</span>
                              </h4>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={actualRentPrice}
                                  onChange={(e) => setActualRentPrice(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900"
                                  placeholder="Įveskite nuomos kainą (€/mėn)"
                                />
                                <p className="text-xs text-gray-500 mt-1">Jei įvesite, pamatysite palyginimą su rinkos kaina</p>
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-800 mt-6"
                            >
                              <Zap className="h-5 w-5" />
                              <span>Analizuoti duomenis</span>
                            </motion.button>
                          </form>
                        )}
                      </div>
                  </div>
                )}

                {loading && (
                  <div className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                    <p className="text-sm font-medium text-gray-700">Analizuojame būstą...</p>
                  </div>
                )}

                {result && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className={`${
                        result.deal_rating === 'GOOD_DEAL' ? 'bg-green-50 border-green-200' :
                        result.deal_rating === 'OVERPRICED' ? 'bg-red-50 border-red-200' :
                        'bg-white border-gray-200'
                      } border rounded-lg p-4 md:p-6`}>
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base">Analizė baigta</h3>
                          <Gauge className={`h-4 w-4 md:h-5 md:w-5 ${
                            result.deal_rating === 'GOOD_DEAL' ? 'text-green-600' :
                            result.deal_rating === 'OVERPRICED' ? 'text-red-600' :
                            'text-gray-600'
                          }`} />
                        </div>

                        {result.deal_rating ? (
                          /* V8 Dashboard Style - Price Comparison */
                          <div className="space-y-2 md:space-y-3">
                            <div className={`${
                              result.deal_rating === 'GOOD_DEAL' ? 'bg-green-500' :
                              result.deal_rating === 'OVERPRICED' ? 'bg-red-500' :
                              'bg-gray-500'
                            } text-white rounded-lg p-3 md:p-4 flex items-center justify-between`}>
                              <div>
                                <div className="text-[10px] md:text-xs opacity-90">
                                  {inputMethod === 'manual' ? (
                                    result.deal_rating === 'GOOD_DEAL' ? 'Sutaupote' :
                                    result.deal_rating === 'OVERPRICED' ? 'Permokate' :
                                    result.price_difference > 0 ? 'Sutaupote' : 'Permokate'
                                  ) : (
                                    result.deal_rating === 'GOOD_DEAL' ? 'Sutaupytumėte' :
                                    result.deal_rating === 'OVERPRICED' ? 'Permokėtumėte' :
                                    result.price_difference > 0 ? 'Sutaupytumėte' : 'Permokėtumėte'
                                  )}
                                </div>
                                <div className="text-2xl md:text-3xl font-bold">
                                  €{Math.round(Math.abs(result.price_difference * 12)).toLocaleString()}
                                </div>
                                <div className="text-[10px] md:text-xs opacity-90">per metus</div>
                              </div>
                              {result.deal_rating === 'GOOD_DEAL' ? (
                                <BadgeCheck className="h-8 w-8 md:h-12 md:w-12 opacity-50" />
                              ) : result.deal_rating === 'OVERPRICED' ? (
                                <BadgeAlert className="h-8 w-8 md:h-12 md:w-12 opacity-50" />
                              ) : (
                                <Info className="h-8 w-8 md:h-12 md:w-12 opacity-50" />
                              )}
                            </div>
                            <div className="relative grid grid-cols-2 gap-2 md:gap-3">
                              <div className="border-2 border-blue-300 rounded-lg p-2 md:p-4 text-center bg-white">
                                <div className="text-[10px] md:text-xs font-medium text-blue-700 mb-1">Tikra vertė</div>
                                <div className="text-lg md:text-2xl font-bold text-gray-900">€{Math.round(result.total_price)}</div>
                                <div className="text-[10px] md:text-xs text-blue-600 mt-1">€{result.price_per_m2}/m²</div>
                              </div>

                              {/* Floating Price Difference Badge */}
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className={`${
                                  result.deal_rating === 'GOOD_DEAL' ? 'bg-green-600' :
                                  result.deal_rating === 'OVERPRICED' ? 'bg-red-600' :
                                  'bg-gray-600'
                                } text-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg shadow-md text-center`}>
                                  <div className="text-[8px] md:text-[10px] font-medium opacity-80">Skirtumas</div>
                                  <div className="font-bold text-[10px] md:text-xs leading-tight">
                                    {result.price_difference > 0 ? '+' : ''}€{Math.round(Math.abs(result.price_difference))}/mėn
                                  </div>
                                </div>
                              </div>

                              <div className="border-2 border-gray-300 rounded-lg p-2 md:p-4 text-center bg-white">
                                <div className="text-[10px] md:text-xs font-medium text-gray-600 mb-1">
                                  {inputMethod === 'manual' ? 'Dabartinė kaina' : 'Skelbime'}
                                </div>
                                <div className="text-lg md:text-2xl font-bold text-gray-900">€{Math.round(result.listing_price)}</div>
                                <div className="text-[10px] md:text-xs text-gray-500 mt-1">per mėnesį</div>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 text-xs md:text-sm text-gray-700 border border-gray-200 rounded-lg p-2 md:p-3 bg-white">
                              <Info className={`h-3 w-3 md:h-4 md:w-4 mt-0.5 flex-shrink-0 ${
                                result.deal_rating === 'GOOD_DEAL' ? 'text-green-600' :
                                result.deal_rating === 'OVERPRICED' ? 'text-red-600' :
                                'text-gray-500'
                              }`} />
                              <span>
                                {result.deal_rating === 'GOOD_DEAL' ?
                                  `${Math.abs(result.price_difference_percent)}% pigiau nei rinkos vertė` :
                                  result.deal_rating === 'OVERPRICED' ?
                                  `${Math.abs(result.price_difference_percent)}% aukštesnė kaina nei rinkos vertė` :
                                  'Kaina atitinka rinkos vidurkį'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Sleek result display for manual entry without price comparison */
                          <div className="space-y-3 md:space-y-4">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 md:p-6">
                              <div className="text-xs md:text-sm font-medium text-gray-600 mb-2">Nuomos kaina</div>
                              <div className="text-3xl md:text-4xl font-bold text-gray-900">€{Math.round(result.total_price)}</div>
                              <div className="text-xs md:text-sm text-gray-500 mt-1">per mėnesį</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                              <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-white">
                                <div className="text-[10px] md:text-xs font-medium text-gray-600 mb-1">Kaina už m²</div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">€{result.price_per_m2}</div>
                              </div>
                              <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-white">
                                <div className="text-[10px] md:text-xs font-medium text-gray-600 mb-1">Plotas</div>
                                <div className="text-xl md:text-2xl font-bold text-gray-900">{result.area_m2 || '--'} m²</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                        <div className="flex items-start space-x-2 md:space-x-3">
                          <Bell className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-base md:text-base">Geriausių pasiūlymų pranešimai</h4>
                            <p className="text-sm md:text-sm text-gray-600 mt-1">
                              Automatiškai skenuojame naujausius skelbimus su geriausiais kainų pasiūlymais.
                              Nedelsdami jus informuosime. Tai vidutiniškai sutaupo mūsų naudotojams 1050 eurų per metus!
                            </p>
                            <div className="mt-2 md:mt-3 space-y-2">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="email"
                                  value={newsletterEmail}
                                  onChange={(e) => setNewsletterEmail(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleNewsletterSignup()}
                                  placeholder="Jūsų el. paštas"
                                  disabled={newsletterStatus === 'loading'}
                                  className="flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                                <button
                                  onClick={handleNewsletterSignup}
                                  disabled={newsletterStatus === 'loading'}
                                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {newsletterStatus === 'loading' ? 'Siunčiama...' : 'Užsisakyti'}
                                </button>
                              </div>
                              {newsletterMessage && (
                                <p className={`text-xs ${newsletterStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                  {newsletterMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => {setResult(null); setUrl('')}}
                          className="w-full px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                          Naujas vertinimas
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Market Trends Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-4 md:mt-6 hidden lg:block">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Rinkos tendencijos</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={marketTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="nuoma" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
                    <Area type="monotone" dataKey="pardavimas" stackId="1" stroke="#8b5cf6" fill="#ede9fe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sidebar - Stats hidden on mobile */}
            <div className="hidden lg:block space-y-4 md:space-y-6 order-2">
              {/* Neighborhood Prices Map */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4">Rajonų vidutinės kainos (50m² naujos statybos buto) </h3>
                <VilniusMap />
                <p className="text-[10px] md:text-xs text-gray-500 mt-2 md:mt-3 text-center">
                  Užveskite pelytę ant rajono  žemėlapyje, kad matytumėte kainas
                </p>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-900 text-white rounded-xl p-4 md:p-6">
                <h3 className="text-xs md:text-sm font-semibold mb-3 md:mb-4">Statistika</h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs md:text-sm">Paklaida</span>
                    <span className="font-mono text-xs md:text-sm">2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs md:text-sm">Modelio versija</span>
                    <span className="font-mono text-xs md:text-sm">v2.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs md:text-sm">Aprėptis</span>
                    <span className="font-mono text-xs md:text-sm">Vilnius + 15km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhood Map - Mobile Only (above pricing) */}
      <section className="lg:hidden py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">Rajonų vidutinės kainos (50m² naujos statybos buto)</h3>
            <VilniusMap />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Užveskite pelytę ant rajono žemėlapyje, kad matytumėte kainas
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Paprastos kainos</h2>
            <p className="text-sm md:text-base text-gray-600">Pasirinkite planą pagal savo poreikius</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                className={`relative bg-white rounded-xl border ${
                  plan.popular ? 'border-gray-900 shadow-lg' : 'border-gray-200'
                } p-4 md:p-6`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                      Populiariausias
                    </span>
                  </div>
                )}

                <div className="text-center mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-xs md:text-sm font-normal text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">{plan.pricePerAnalysis}</p>
                  {plan.savings && (
                    <p className="text-[10px] md:text-xs text-green-600 font-medium mt-1">{plan.savings}</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => {
                    if (!user) {
                      setShowAuthModal(true)
                    } else {
                      setShowBuyCreditsModal(true)
                    }
                  }}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pirkti
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-3xl font-bold text-center text-gray-900 mb-6 md:mb-8">DUK</h2>
          
          <Accordion.Root type="single" collapsible className="space-y-2">
            {[
              {
                q: 'Ką galiu gauti su VilRent?',
                a: 'Gaunate tikslų būsto kainos vertinimą per 30 sekundžių. Įkeliate aruodas.lt nuorodą arba įvedate duomenis rankiniu būdu, o mūsų AI modelis išanalizuoja ir pateikia rekomendaciją – ar kaina sąžininga, ar būstas pervertintas/per mažai įvertintas.'
              },
              {
                q: 'Kaip veikia jūsų AI modelis?',
                a: 'Modelis mokosi iš dešimčių tūkstančių realių sandorių. Kai įvedate būsto duomenis, sistema palygina jį su panašiais būstais – panašiame rajone, panašaus ploto, panašių metų statybos – ir apskaičiuoja teisingą kainą. Tai veikia kaip automatizuotas NT vertintojas, tik greičiau ir be subjektyvumo.'
              },
              {
                q: 'Kaip veikia geriausių pasiūlymų pranešimai?',
                a: 'Sistema veikia 24/7 ir analizuoja visus naujus skelbimus. Kai pamatome būstą, kuris įkainotas žemiau rinkos kainos (geras sandoris), jums iškart siunčiame pranešimą. Taip sutaupote laiką – nereikia patiems naršyti šimtų skelbimų. Matote tik tuos, kurie tikrai verti dėmesio.'
              },
              {
                q: 'Kas esate?',
                a: 'Esame duomenų mokslo specialistai su patirtimi finansų analizėje ir mašininiu mokymusi. Komanda turi stiprų statistikos išsilavinimą ir praktinę patirtį NT rinkos analizėje Vilniuje. VilRent – mūsų projektas, skirtas padaryti NT vertinimą prieinamą visiems.'
              },
              {
                q: 'Kokius duomenis naudojate analizei?',
                a: 'Modelis treniruotas su 40,000+ skelbimų duomenimis. Pagrindiniai kintamieji: plotas (m²), kambarių sk., aukštas, pastato aukštų sk., statybų metai, atstumas iki centro (km), infrastruktūra (liftas, balkonas, parkavimas), šildymo tipas, ir rajonas. Taip pat atsižvelgiame į skelbimo sezonališkumą ir rinkos tendencijas.'
              },
              {
                q: 'Ar galiu analizuoti būstus, kurių nėra skelbimuose?',
                a: 'Žinoma. Turite du pasirinkimus: įklijuoti aruodas.lt nuorodą ARBA pasirinkti "Įvesti duomenis" ir įrašyti visus parametrus patiems. Tai naudinga, jei vertinate savo būstą prieš parduodant, arba žiūrite būstą, kuris dar nepaskelbtas.'
              },
              {
                q: 'Kokius miestus apimate?',
                a: 'Šiuo metu modelis geriausiai veikia Vilniuje ir artimuose priemiesčiuose, nes būtent su šiais duomenimis jis buvo treniruotas. Kiti Lietuvos miestai (Kaunas, Klaipėda) teoriškai gali veikti, bet tikslumas bus mažesnis. Ateityje planuojame išplėsti geografinę aprėptį.'
              }
            ].map((item, i) => (
              <Accordion.Item key={i} value={`item-${i}`} className="bg-white rounded-lg border border-gray-200">
                <Accordion.Trigger className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-gray-50">
                  <span className="text-left font-medium text-gray-900 text-sm md:text-base pr-2">{item.q}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                </Accordion.Trigger>
                <Accordion.Content className="px-4 md:px-6 pb-3 md:pb-4 text-gray-600 text-sm md:text-base">
                  {item.a}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          checkAuth()
          setShowAuthModal(false)
        }}
      />

      {/* Buy Credits Modal */}
      {user && (
        <BuyCreditsModal
          isOpen={showBuyCreditsModal}
          onClose={() => setShowBuyCreditsModal(false)}
          userId={user.id}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
