"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useCartStore } from "@/store/cartStore"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore()
  const isMobile = useIsMobile()

  const totalPrice = getTotalPrice()
  const formattedTotal = `₹${totalPrice.toLocaleString("en-IN")}`

  // Shared cart items renderer
  const CartItems = () => (
    <AnimatePresence>
      {items.map((item) => {
        const discount = item.product.originalPriceNum
          ? Math.round(
            ((item.product.originalPriceNum - item.product.priceNum) /
              item.product.originalPriceNum) *
            100
          )
          : 0

        return (
          <motion.div
            key={item.product.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-100 p-4 md:p-6 flex gap-4 md:gap-6 hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <Link
              href={item.product.href || `/product/${item.product.slug || item.product.id}`}
              className="relative w-20 h-20 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-50 shrink-0"
            >
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 80px, 128px"
              />
            </Link>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <Link href={item.product.href || `/product/${item.product.slug || item.product.id}`}>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 hover:text-[#522D6D] transition-colors line-clamp-1 mb-1">
                  {item.product.name}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 mb-2">{item.product.material}</p>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-base md:text-lg font-bold text-gray-900">{item.product.price}</span>
                {item.product.originalPrice && (
                  <span className="text-xs md:text-sm text-gray-400 line-through">
                    {item.product.originalPrice}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-semibold text-[#E91E63]">
                    {discount}% off
                  </span>
                )}
              </div>

              {/* Quantity & Remove */}
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-[44px] h-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="w-10 h-9 flex items-center justify-center text-sm font-semibold border-x border-gray-200">
                    {item.quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-[44px] h-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-gray-400 hover:text-[#E91E63] transition-colors p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </AnimatePresence>
  )

  // Mobile view — full-screen bottom sheet style
  if (isMobile) {
    return (
      <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col bg-white rounded-t-3xl -mt-1 relative" style={{ minHeight: "calc(95vh - 120px)" }}>
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h1 className="text-xl font-semibold text-[#522D6D]">Your Cart ({items.length})</h1>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-[#E91E63] flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-5">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6 text-sm">Browse our collections to find something you love.</p>
                <Link
                  href="/jewellery"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#522D6D] text-white rounded-xl font-medium min-h-[44px] w-full"
                >
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <CartItems />
              </div>

              {/* Summary + Checkout — sticky bottom */}
              <div className="shrink-0 border-t border-gray-100 bg-white px-5 pt-4 pb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formattedTotal}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total</span>
                  <span className="text-[#522D6D]">{formattedTotal}</span>
                </div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/checkout"
                    className="block w-full text-center bg-[#522D6D] text-white py-4 rounded-xl font-semibold text-base shadow-lg min-h-[52px] flex items-center justify-center"
                  >
                    Proceed to Checkout
                  </Link>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </main>
    )
  }

  // Desktop view — completely untouched
  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <div className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-6 py-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-semibold text-[#522D6D]">Your Cart</h1>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-[#E91E63] transition-colors flex items-center justify-center gap-1 min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty Cart */
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added any jewellery yet. Browse our collections to find something you love.
              </p>
              <Link
                href="/jewellery"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] transition-colors min-h-[44px]"
              >
                Start Shopping
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Cart Items */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                <CartItems />
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-36">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="text-gray-900 font-medium shrink-0">
                          ₹{(item.product.priceNum * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formattedTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>Total</span>
                    <span className="text-[#522D6D]">{formattedTotal}</span>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full text-center bg-[#522D6D] text-white py-4 rounded-xl font-semibold text-base hover:bg-[#6B3D8A] transition-colors shadow-lg shadow-[#522D6D]/20 active:scale-[0.98] min-h-[44px] flex items-center justify-center"
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    href="/jewellery"
                    className="flex items-center justify-center w-full text-center text-sm text-[#522D6D] font-medium mt-4 hover:underline min-h-[44px]"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  )
}
