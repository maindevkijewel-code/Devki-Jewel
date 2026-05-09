"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag, Check } from "lucide-react"
import { type Product } from "@/lib/mockData"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlist-store"

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay blocked:', e))
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isHovered])

  const isInWishlist = useWishlistStore(s => s.isInWishlist(product.id))
  const addToWishlist = useWishlistStore(s => s.addToWishlist)
  const removeFromWishlist = useWishlistStore(s => s.removeFromWishlist)
  
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const addToCart = useCartStore((s) => s.addToCart)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    setShowAdded(true)
    setTimeout(() => setShowAdded(false), 1800)
  }

  const discount = product.originalPriceNum
    ? Math.round(((product.originalPriceNum - product.priceNum) / product.originalPriceNum) * 100)
    : 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col bg-white rounded-[20px] p-3 border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Wishlist Icon */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (isInWishlist) removeFromWishlist(product.id)
          else addToWishlist(product)
        }}
        className="absolute top-5 right-5 z-20 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Heart className={`w-4 h-4 ${isInWishlist ? "fill-[#522D6D] text-[#522D6D]" : "text-gray-400"}`} />
      </button>

      {/* Image Container - 4:5 Aspect Ratio */}
      <Link href={product.href} className="block relative w-full aspect-[4/5] bg-[#FDFBF9] rounded-xl overflow-hidden mb-4">
        {/* Main Image */}
        <img
          src={product.image.startsWith("http") || product.image.startsWith("/") ? product.image : `/${product.image}`}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isHovered && (product.hover_video_url || product.hoverImage) ? "opacity-0" : "opacity-100"}`}
        />
        {/* Hover Image or Video */}
        {product.hover_video_url ? (
          <video
            ref={videoRef}
            src={product.hover_video_url}
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isHovered ? "opacity-100" : "opacity-0"}`}
            style={{ pointerEvents: "none" }}
          />
        ) : product.hoverImage ? (
          <img
            src={product.hoverImage.startsWith("http") || product.hoverImage.startsWith("/") ? product.hoverImage : `/${product.hoverImage}`}
            alt={`${product.name} alternate`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isHovered ? "opacity-100" : "opacity-0"}`}
          />
        ) : null}
      </Link>

      {/* Product Info */}
      <div className="flex flex-col flex-grow px-1.5 pb-1">
        {/* Name */}
        <Link href={product.href} className="mb-2.5">
          <h3 className="text-[13px] md:text-sm font-medium text-gray-800 line-clamp-2 leading-relaxed group-hover:text-[#522D6D] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price Row */}
        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mb-5 mt-auto">
          <span className="text-[15px] font-bold text-[#1A1A1A]">{product.price}</span>
          {product.originalPrice && (
            <>
              <span className="text-[13px] text-gray-400 line-through decoration-gray-300">
                {product.originalPrice}
              </span>
              {discount > 0 && (
                <span className="text-[11px] font-medium text-[#522D6D] bg-[#522D6D]/5 px-1.5 py-0.5 rounded">
                  Save {discount}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Premium Outline to Fill Button */}
        <button
          onClick={handleAddToCart}
          className="group/btn relative w-full overflow-hidden rounded-full py-2.5 font-medium text-[13px] tracking-wide transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(82,45,109,0.12)] flex items-center justify-center bg-[#FDFBF9] border border-gray-200 text-[#522D6D]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#4A2665] to-[#63368A] translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.4,0,0.2,1]" />
          <span className="relative z-10 flex items-center gap-1.5 group-hover/btn:text-white transition-colors duration-300">
            {showAdded ? (
              <><Check className="w-3.5 h-3.5" /> Added</>
            ) : (
              <><ShoppingBag className="w-3.5 h-3.5 mb-0.5" /> Add to Cart</>
            )}
          </span>
        </button>
      </div>
    </motion.div>
  )
}

export default ProductCard
