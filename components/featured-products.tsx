"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useWishlistStore } from "@/store/wishlist-store"

const easing = [0.25, 0.1, 0.25, 1] as const

// ─── Single luxury card ─────────────────────────────────────────────────────
function LuxuryCard({ product, index }: { product: any; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const [isHovered, setIsHovered] = useState(false)

  const isInWishlist = useWishlistStore(s => s.isInWishlist(product.id))
  const addToWishlist = useWishlistStore(s => s.addToWishlist)
  const removeFromWishlist = useWishlistStore(s => s.removeFromWishlist)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: easing }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wishlist — floating with safe tap area */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (isInWishlist) removeFromWishlist(product.id)
          else addToWishlist(product)
        }}
        className="absolute top-2.5 right-2.5 z-20 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform md:w-8 md:h-8"
      >
        <Heart className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isInWishlist ? "fill-[#522D6D] text-[#522D6D]" : "text-gray-400"}`} />
      </button>

      <Link href={product.href} className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-white rounded-2xl overflow-hidden mb-3 md:mb-4 shadow-sm border border-gray-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-1000 ease-out md:group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Hover image (Desktop only for performance) */}
          {product.hoverImage && (
            <div className="hidden md:block">
              <Image
                src={product.hoverImage}
                alt=""
                fill
                className={`object-cover transition-opacity duration-700 ${isHovered ? "opacity-100" : "opacity-0"}`}
                sizes="25vw"
              />
            </div>
          )}
          {/* Subtle bottom vignette */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </div>

        {/* Text */}
        <div className="px-1.5">
          <h3 className="text-[12px] md:text-sm font-medium text-gray-800 line-clamp-1 md:line-clamp-2 leading-relaxed group-hover:text-[#522D6D] transition-colors mb-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-base font-bold text-[#1A1A1A]">{product.price}</span>
            {product.originalPrice && (
              <span className="text-[11px] md:text-xs text-gray-400 line-through opacity-70">{product.originalPrice}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main Section ────────────────────────────────────────────────────────────
export function FeaturedProducts() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" })

  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true)
      const supabase = getSupabaseBrowserClient()

      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8)

      const { data } = await query

      if (data && data.length > 0) {
        setProducts(data.map((d: any) => ({
          ...d,
          price: `₹${d.price.toLocaleString("en-IN")}`,
          priceNum: d.price,
          originalPrice: d.original_price ? `₹${d.original_price.toLocaleString("en-IN")}` : null,
          originalPriceNum: d.original_price,
          hoverImage: d.hover_image || d.image_urls?.[1],
          hover_video_url: d.hover_video_url,
          isLatest: d.is_latest,
          image: d.image_urls?.[0] || d.image,
          href: `/product/${d.slug || d.id}`,
        })))
      } else {
        setProducts([])
      }
      setIsLoading(false)
    }
    fetchProducts()
  }, [])

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* ── Section Header ────────────────────────── */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: easing }}
          className="text-center mb-10 md:mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.4em] text-[#B8860B] uppercase">
              Curated Selection
            </span>
            <div className="w-10 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>

          <h2 className="text-2xl md:text-4xl font-serif text-[#1A1A1A] mb-4">
            Trending Masterpieces
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Discover our most coveted designs, each telling a story of heritage and artisanal excellence.
          </p>
        </motion.div>

        {/* ── Product Grid ──────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-50 rounded-2xl mb-4" />
                <div className="h-3 bg-gray-50 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product, index) => (
              <LuxuryCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-6">
              <span className="text-2xl text-[#522D6D]/30">✦</span>
            </div>
            <h3 className="text-lg font-serif italic text-gray-800 mb-2">Artisanship in Progress</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">We are currently curating new pieces for this collection. Please check back soon.</p>
          </div>
        )}

        {/* ── Explore CTA ───────────────────────────── */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12 md:mt-20"
          >
            <Link
              href="/jewellery"
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#1A1A1A] text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-[#522D6D] transition-all duration-500 group shadow-xl active:scale-95"
            >
              View Full Collection
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
