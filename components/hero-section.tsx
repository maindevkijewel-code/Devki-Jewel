"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getActiveBanners, type HeroBanner } from "@/app/admin/actions/hero-banners"
import { getActiveMobileBanners, type MobileHeroBanner } from "@/app/admin/actions/mobile-banner-actions"

// ─── Static fallback secondary section ────────────────────────────────────────
// (Secondary banners remain hardcoded — not part of the carousel management)

export function HeroSection() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)

  // Fetch desktop banners from DB
  useEffect(() => {
    getActiveBanners().then(data => {
      setBanners(data)
      setIsLoaded(true)
    })
  }, [])

  // Autoplay
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(banners.length, 1))
    }, 5500)
  }, [banners.length])

  useEffect(() => {
    if (banners.length > 1) startAutoPlay()
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current) }
  }, [banners.length, startAutoPlay])

  const goTo = (idx: number) => {
    setCurrentSlide(idx)
    startAutoPlay() // reset timer on manual nav
  }

  const nextSlide = () => goTo((currentSlide + 1) % banners.length)
  const prevSlide = () => goTo((currentSlide - 1 + banners.length) % banners.length)

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) nextSlide()
    else if (diff < -50) prevSlide()
    touchStartX.current = null
  }

  const activeBanner = banners[currentSlide]

  return (
    <section className="bg-white">
      {/* ── Mobile Hero (from mobile_hero_banners table) ── */}
      <div className="md:hidden">
        <MobileHeroCarousel />
      </div>

      {/* ── Desktop Hero (from hero_banners table) ── */}
      <div className="hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-4">
          {!isLoaded ? (
            /* Skeleton */
            <div className="aspect-[21/8] bg-gray-100 rounded-xl animate-pulse" />
          ) : banners.length === 0 ? (
            /* Fallback if no banners configured */
            <div className="relative aspect-[21/8] bg-gradient-to-r from-[#F8F4FF] to-[#EDE6FF] rounded-xl flex items-center justify-center">
              <div className="text-center">
                <p className="font-serif text-3xl text-[#522D6D] italic">Devki Jewels</p>
                <p className="text-gray-500 text-sm mt-2">Configure banners from the admin panel</p>
                <Link
                  href="/jewellery"
                  className="mt-4 inline-block px-6 py-2 bg-[#522D6D] text-white rounded-full text-sm font-medium hover:bg-[#6B3D8A]"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          ) : (
            /* Desktop carousel */
            <div
              className="relative overflow-hidden rounded-xl"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeBanner.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                >
                  <Link
                    href={activeBanner.button_link || "/jewellery"}
                    className="block group"
                    tabIndex={0}
                  >
                    <div className="relative w-full">
                      <div className="aspect-[21/8] relative overflow-hidden rounded-xl bg-gray-100">
                        <Image
                          src={activeBanner.desktop_image}
                          alt={activeBanner.title || "Hero Banner"}
                          fill
                          className="object-cover"
                          priority
                          sizes="100vw"
                        />
                        {/* Dark overlay for text legibility */}
                        {activeBanner.overlay_opacity && activeBanner.overlay_opacity > 0 ? (
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: `rgba(0,0,0,${activeBanner.overlay_opacity})` }}
                          />
                        ) : null}

                        {/* Text Overlay */}
                        {(activeBanner.title || activeBanner.subtitle || activeBanner.button_text) && (
                          <div className="absolute inset-0 flex items-center px-10 lg:px-16 z-10">
                            <motion.div
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2, duration: 0.4 }}
                              className="max-w-md"
                            >
                              {activeBanner.badge_text && (
                                <span className={`inline-block text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3 ${activeBanner.text_color === "light"
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-[#522D6D]/10 text-[#522D6D]"
                                  }`}>
                                  {activeBanner.badge_text}
                                </span>
                              )}
                              {activeBanner.title && (
                                <h2 className={`font-serif text-4xl lg:text-5xl italic leading-tight mb-2 ${activeBanner.text_color === "light" ? "text-white" : "text-gray-900"
                                  }`}>
                                  {activeBanner.title}
                                </h2>
                              )}
                              {activeBanner.subtitle && (
                                <p className={`text-lg mb-5 ${activeBanner.text_color === "light" ? "text-white/80" : "text-gray-600"
                                  }`}>
                                  {activeBanner.subtitle}
                                </p>
                              )}
                              {activeBanner.button_text && (
                                <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md group-hover:shadow-lg ${activeBanner.text_color === "light"
                                  ? "bg-white text-gray-900 hover:bg-gray-100"
                                  : "bg-[#522D6D] text-white hover:bg-[#6B3D8A]"
                                  }`}>
                                  {activeBanner.button_text}
                                </span>
                              )}
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Desktop Nav arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    aria-label="Previous banner"
                    className="flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 hover:bg-white rounded-full items-center justify-center shadow-md transition-all z-20 hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextSlide}
                    aria-label="Next banner"
                    className="flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 hover:bg-white rounded-full items-center justify-center shadow-md transition-all z-20 hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Pagination dots - Minimal luxury style */}
              {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goTo(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className="group p-1"
                    >
                      <div 
                        className={`h-1 rounded-full transition-all duration-500 ease-out ${
                          idx === currentSlide 
                            ? "w-8 bg-white shadow-sm" 
                            : "w-1.5 bg-white/40 group-hover:bg-white/60"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secondary static banners */}
      <SecondaryBanners />
    </section>
  )
}

// ─── Mobile Hero Carousel (from mobile_hero_banners table) ────────────────────
function MobileHeroCarousel() {
  const [banners, setBanners] = useState<MobileHeroBanner[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    getActiveMobileBanners().then(data => {
      setBanners(data)
      setIsLoaded(true)
    })
  }, [])

  // Autoplay
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(banners.length, 1))
    }, 5000)
  }, [banners.length])

  useEffect(() => {
    if (banners.length > 1) startAutoPlay()
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current) }
  }, [banners.length, startAutoPlay])

  const goTo = (idx: number) => {
    setCurrentSlide(idx)
    startAutoPlay()
  }

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) goTo((currentSlide + 1) % banners.length)
    else if (diff < -50) goTo((currentSlide - 1 + banners.length) % banners.length)
    touchStartX.current = null
  }

  // Loading skeleton
  if (!isLoaded) {
    return (
      <div className="px-4 pt-4">
        <div className="aspect-[4/5] bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  // No mobile banners — show a simple fallback
  if (banners.length === 0) {
    return (
      <div className="px-4 pt-4">
        <Link href="/jewellery" className="block">
          <div className="relative aspect-[4/5] bg-gradient-to-br from-[#F8F4FF] via-[#F3EEFF] to-[#EDE6FF] rounded-xl flex items-center justify-center">
            <div className="text-center px-6">
              <p className="font-serif text-3xl text-[#522D6D] italic">Devki Jewels</p>
              <p className="text-gray-500 text-sm mt-2">Discover our latest collection</p>
              <span className="mt-4 inline-block px-6 py-2.5 bg-[#522D6D] text-white rounded-full text-sm font-medium">
                Shop Now
              </span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  const activeBanner = banners[currentSlide]

  return (
    <div className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Link href={activeBanner.cta_link || "/jewellery"} className="block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={activeBanner.image_url}
                  alt={activeBanner.title || "Promo Banner"}
                  fill
                  className="object-cover"
                  priority={currentSlide === 0}
                  sizes="100vw"
                />
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Text overlay at bottom */}
                {(activeBanner.title || activeBanner.subtitle || activeBanner.cta_text) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.35 }}
                    className="absolute bottom-0 left-0 right-0 p-5 z-10"
                  >
                    {activeBanner.title && (
                      <h2 className="font-serif text-2xl italic text-white mb-1 drop-shadow-md">
                        {activeBanner.title}
                      </h2>
                    )}
                    {activeBanner.subtitle && (
                      <p className="text-sm text-white/85 mb-3 drop-shadow-sm">
                        {activeBanner.subtitle}
                      </p>
                    )}
                    {activeBanner.cta_text && (
                      <span className="inline-flex items-center px-6 py-2.5 rounded-xl bg-white text-gray-900 text-sm font-semibold shadow-lg">
                        {activeBanner.cta_text}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Pagination dots - Mobile scrolling style */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to mobile slide ${idx + 1}`}
                className="p-1"
              >
                <div 
                  className={`h-1 rounded-full transition-all duration-500 ease-out ${
                    idx === currentSlide 
                      ? "w-6 bg-white shadow-sm" 
                      : "w-1 bg-white/40"
                  }`} 
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Secondary Banners (static, non-dynamic) ──────────────────────────────────
function SecondaryBanners() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left promo */}
        <Link href="/collections" className="group relative overflow-hidden rounded-xl block">
          <div className="relative aspect-[16/7] bg-gradient-to-r from-[#3D1952] via-[#522D6D] to-[#3D1952]">
            <Image
              src="/images/Rings/whatsapp-image.jpeg"
              alt="Collections"
              fill
              className="object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 flex items-center p-6 md:p-8">
              <div className="text-white">
                <p className="text-lg md:text-xl font-light italic">Silver brilliance.</p>
                <p className="text-lg md:text-xl font-light italic mb-4">Diamond sparkle.</p>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 inline-block mb-4 border border-white/20">
                  <p className="text-xs font-medium mb-1">FLAT</p>
                  <p className="text-2xl font-bold">20<span className="text-sm">%</span> OFF*</p>
                  <p className="text-[10px] opacity-80 mt-1"></p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Shop by price */}
        <div className="bg-gradient-to-br from-[#F8F4FF] via-[#F3EEFF] to-[#EDE6FF] rounded-xl p-6 md:p-8 flex flex-col justify-center">
          <div className="text-center">
            <h3 className="text-[#522D6D] font-semibold text-xl mb-2">Shop by Price Range</h3>
            <p className="text-gray-500 text-sm mb-6">Find the perfect piece within your budget</p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {[
                { label: "Under ₹10K", count: "2,500+", href: "/jewellery?p_max=10000" },
                { label: "₹10K - ₹20K", count: "3,200+", href: "/jewellery?p_min=10000&p_max=20000" },
                { label: "₹20K - ₹50K", count: "4,100+", href: "/jewellery?p_min=20000&p_max=50000" },
                { label: "Above ₹50K", count: "1,800+", href: "/jewellery?p_min=50000" },
              ].map(range => (
                <Link
                  key={range.label}
                  href={range.href}
                  className="group px-4 py-3 bg-white rounded-xl text-sm text-gray-700 hover:bg-[#522D6D] hover:text-white transition-all shadow-sm hover:shadow-md"
                >
                  <span className="font-medium">{range.label}</span>
                  <span className="block text-xs text-gray-400 group-hover:text-white/70 mt-0.5">{range.count} designs</span>
                </Link>
              ))}
            </div>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-[#522D6D] font-semibold text-sm hover:underline"
            >
              View All Collections
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
