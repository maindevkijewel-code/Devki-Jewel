"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, ChevronRight, Loader2, Search } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { ProductCard } from "@/components/ProductCard"
import { usePathname } from "next/navigation"

const STEPS = {
  OCCASION: 1,
  STYLE: 2,
  BUDGET: 3,
  RESULTS: 4
}

export function GuidedAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true) // Default true to avoid flash
  const [currentStep, setCurrentStep] = useState(STEPS.OCCASION)

  const [selections, setSelections] = useState({
    occasion: "",
    style: "",
    budget: ""
  })

  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize and handle auto-popup
  useEffect(() => {
    // Check if dismissed in session
    const dismissed = sessionStorage.getItem("devki_assistant_dismissed") === "true"
    setIsDismissed(dismissed)

    if (!dismissed) {
      const timer = setTimeout(() => {
        // Only open if they haven't explicitly closed it and aren't already interacting
        setIsOpen((prev) => {
          if (!prev) return true
          return prev
        })
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Hide on admin or login routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return null
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsDismissed(true)
    sessionStorage.setItem("devki_assistant_dismissed", "true")
  }

  const handleRestart = () => {
    setCurrentStep(STEPS.OCCASION)
    setSelections({ occasion: "", style: "", budget: "" })
    setResults([])
  }

  const handleSelect = (key: keyof typeof selections, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }))

    if (currentStep === STEPS.BUDGET) {
      fetchResults({ ...selections, [key]: value })
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const fetchResults = async (finalSelections: typeof selections) => {
    setCurrentStep(STEPS.RESULTS)
    setIsLoading(true)

    const supabase = getSupabaseBrowserClient()
    let query = supabase.from('products').select('*').eq('is_active', true)

    if (finalSelections.occasion) {
      const o = finalSelections.occasion
      query = query.or(`occasion.ilike.%${o}%,search_keywords.ilike.%${o}%,category.ilike.%${o}%`)
    }

    if (finalSelections.style) {
      const s = finalSelections.style
      query = query.or(`style.ilike.%${s}%,search_keywords.ilike.%${s}%`)
    }

    if (finalSelections.budget === "Under ₹10K") {
      query = query.lte('price', 10000)
    } else if (finalSelections.budget === "₹10K – ₹30K") {
      query = query.gte('price', 10000).lte('price', 30000)
    } else if (finalSelections.budget === "Premium") {
      query = query.gte('price', 30000)
    }

    const { data, error } = await query.limit(10)

    if (data && !error) {
      const mapped = data.map((d: any) => ({
        ...d,
        price: `₹${d.price.toLocaleString("en-IN")}`,
        priceNum: d.price,
        originalPrice: d.original_price ? `₹${d.original_price.toLocaleString("en-IN")}` : null,
        originalPriceNum: d.original_price,
        hoverImage: d.hover_image,
        isLatest: d.is_latest,
        href: `/product/${d.slug || d.id}`
      }))
      setResults(mapped)
    } else {
      setResults([])
    }

    setIsLoading(false)
  }

  if (isDismissed && !isOpen) return null

  return (
    <>
      <AnimatePresence>
        {!isOpen && !isDismissed && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#522D6D] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#6B3D8A] transition-colors z-50 group"
          >
            <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute inset-0 rounded-full bg-[#522D6D] animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[380px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[200] flex flex-col safe-area-bottom"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#522D6D] via-[#7B4397] to-[#522D6D] p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-serif italic text-base">Jewellery Stylist</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] opacity-70 font-bold">Personalized for you</p>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto mobile-scroll">
              <AnimatePresence mode="wait">
                {currentStep === STEPS.OCCASION && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h4 className="text-xl font-serif text-gray-900">Let&apos;s find your match</h4>
                      <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">What is the special occasion?</p>
                    </div>
                    <div className="grid gap-3">
                      {["Daily Wear", "Wedding / Bridal", "Party", "Anniversary Gift"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelect("occasion", opt)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:border-[#522D6D] hover:bg-purple-50 text-left transition-all group active:scale-[0.98]"
                        >
                          <span className="text-sm font-bold text-gray-700 group-hover:text-[#522D6D]">{opt}</span>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#522D6D] group-hover:text-white transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === STEPS.STYLE && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h4 className="text-xl font-serif text-gray-900">Define your style</h4>
                      <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">Refining for {selections.occasion}</p>
                    </div>
                    <div className="grid gap-3">
                      {["Minimalist", "Elegant & Classic", "Statement / Bold"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelect("style", opt)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:border-[#522D6D] hover:bg-purple-50 text-left transition-all group active:scale-[0.98]"
                        >
                          <span className="text-sm font-bold text-gray-700 group-hover:text-[#522D6D]">{opt}</span>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#522D6D] group-hover:text-white transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === STEPS.BUDGET && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h4 className="text-xl font-serif text-gray-900">Budget preference</h4>
                      <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">Tailoring to your comfort</p>
                    </div>
                    <div className="grid gap-3">
                      {["Under ₹10K", "₹10K – ₹30K", "Premium Collection"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelect("budget", opt)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:border-[#522D6D] hover:bg-purple-50 text-left transition-all group active:scale-[0.98]"
                        >
                          <span className="text-sm font-bold text-gray-700 group-hover:text-[#522D6D]">{opt}</span>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#522D6D] group-hover:text-white transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === STEPS.RESULTS && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="relative">
                          <Loader2 className="w-10 h-10 text-[#522D6D] animate-spin" />
                          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                        </div>
                        <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">Curating for you...</p>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h4 className="text-xl font-serif text-gray-900">Your curated edit ✨</h4>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider bg-yellow-50 px-2 py-0.5 rounded">
                              {selections.occasion}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">|</span>
                            <span className="text-[10px] font-bold text-[#B8860B] uppercase tracking-wider bg-yellow-50 px-2 py-0.5 rounded">
                              {selections.style}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pb-2">
                          {results.slice(0, 4).map((product, idx) => (
                            <div key={product.id} className="scale-[1.0] origin-top">
                              <ProductCard product={product} index={idx} />
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                          <button
                            onClick={() => window.location.href = `/jewellery?search=${encodeURIComponent(`${selections.occasion} ${selections.style}`)}`}
                            className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#522D6D] transition-all shadow-lg active:scale-95"
                          >
                            Explore All Matches
                          </button>
                          <button
                            onClick={handleRestart}
                            className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-gray-900 tracking-[0.1em] uppercase transition-colors"
                          >
                            Redefine Style
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-gray-200">
                          <Search className="w-6 h-6 text-gray-300" />
                        </div>
                        <h4 className="text-base font-serif text-gray-900">No matches found</h4>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">Try a different style or budget to see our current collections.</p>
                        <button
                          onClick={handleRestart}
                          className="mt-4 px-8 py-3 bg-gray-900 text-white rounded-full text-[11px] font-bold tracking-widest uppercase active:scale-95 transition-all"
                        >
                          Restart Stylist
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
