"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"
import { useWishlistStore } from "@/store/wishlist-store"
import { useCartStore } from "@/store/cartStore"
import { toast } from "sonner"

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addToCart)

  const handleMoveToCart = (product: any) => {
    addToCart(product)
    removeFromWishlist(product.id)
    toast.success(`${product.name} moved to cart`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Wishlist</h2>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-[#E91E63]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Save your favourite pieces here and never miss out on designs you love.
          </p>
          <Link
            href="/jewellery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Jewellery
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden group"
              >
                <Link href={product.href} className="block relative aspect-square bg-gray-50 p-4">
                  <Image src={product.image} alt={product.name} fill className="object-contain" sizes="(max-width: 640px) 100vw, 33vw" />
                </Link>
                <div className="p-4">
                  <Link href={product.href}>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-[#522D6D] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-1 mb-3">
                    <span className="text-base font-semibold text-gray-900">{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">{product.originalPrice}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#522D6D] text-white rounded-lg text-xs font-medium hover:bg-[#6B3D8A] transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Move to Cart
                    </button>
                    <button
                      onClick={() => {
                        removeFromWishlist(product.id)
                        toast.success("Removed from wishlist")
                      }}
                      className="p-2.5 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
