"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, Loader2, CheckCircle2, X, Sparkles, ChevronRight, Gift } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { validateCoupon, getActiveCoupons, type Coupon } from "@/app/admin/actions/coupons"
import { toast } from "sonner"
import Confetti from "react-confetti"

export function CouponSection() {
  const { appliedCoupon, setCoupon, getTotalPrice, getDiscountAmount } = useCartStore()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [showOffers, setShowOffers] = useState(false)

  const cartTotal = getTotalPrice()
  const discountAmount = getDiscountAmount()

  useEffect(() => {
    // Check if applied coupon is still valid for current cart total
    if (appliedCoupon && appliedCoupon.min_order_amount && cartTotal < appliedCoupon.min_order_amount) {
      setCoupon(null)
      toast.info(`Coupon ${appliedCoupon.code} removed because cart total fell below ₹${appliedCoupon.min_order_amount.toLocaleString("en-IN")}.`)
    }
    
    // Fetch active coupons for "Available Offers"
    getActiveCoupons().then(setAvailableCoupons)
  }, [cartTotal, appliedCoupon, setCoupon])

  const handleApply = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code.")
      return
    }

    setIsLoading(true)
    setError(null)

    const res = await validateCoupon(couponCode, cartTotal)
    setIsLoading(false)

    if (res.success && res.data) {
      setCoupon(res.data)
      setCode("")
      setShowOffers(false)
      setShowConfetti(true)
      toast.success("Coupon applied successfully!")
      setTimeout(() => setShowConfetti(false), 4000)
    } else {
      setError(res.error || "Invalid coupon.")
    }
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-2xl">
          <Confetti width={500} height={300} recycle={false} numberOfPieces={200} colors={['#D4AF37', '#522D6D', '#E91E63', '#4CAF50']} />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-[#522D6D]" />
        <h3 className="text-base font-semibold text-gray-900 tracking-wide">Have a Coupon Code?</h3>
      </div>

      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
          >
            {/* Success Glow */}
            <div className="absolute inset-0 bg-emerald-400/10 opacity-50 pointer-events-none animate-pulse" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800 tracking-wide font-mono">{appliedCoupon.code}</p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">
                  Savings: <span className="font-bold">₹{discountAmount.toLocaleString("en-IN")}</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={() => { setCoupon(null); setError(null) }}
              className="relative z-10 p-2 text-emerald-600 hover:bg-emerald-200/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter Coupon"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null) }}
                className={`w-full pl-4 pr-24 py-3.5 bg-gray-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 transition-all font-mono tracking-wide ${
                  error ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-[#522D6D]"
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleApply(code)}
              />
              <button
                onClick={() => handleApply(code)}
                disabled={isLoading || !code.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-[#522D6D] text-white rounded-lg text-sm font-semibold hover:bg-[#6B3D8A] disabled:opacity-50 disabled:hover:bg-[#522D6D] transition-all flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-red-500 mt-2 font-medium px-1">
                {error}
              </motion.p>
            )}

            {/* Available Offers Button */}
            {availableCoupons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowOffers(!showOffers)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-[#522D6D] transition-colors"
                >
                  <span className="flex items-center gap-2"><Gift className="w-4 h-4 text-[#D4AF37]" /> View Available Offers</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showOffers ? "rotate-90" : ""}`} />
                </button>

                <AnimatePresence>
                  {showOffers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-2"
                    >
                      {availableCoupons.map((c) => {
                        const isValid = !c.min_order_amount || cartTotal >= c.min_order_amount
                        return (
                          <div key={c.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${isValid ? "bg-[#FDFBF9] border-[#D4AF37]/30 hover:border-[#D4AF37]" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-[#522D6D]">{c.code}</span>
                                {c.discount_type === 'percentage' 
                                  ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#522D6D]/10 text-[#522D6D]">{c.discount_value}% OFF</span>
                                  : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#522D6D]/10 text-[#522D6D]">FLAT ₹{c.discount_value} OFF</span>
                                }
                              </div>
                              {c.description && <p className="text-xs text-gray-500 mt-1">{c.description}</p>}
                              {c.min_order_amount && !isValid && (
                                <p className="text-[10px] text-red-500 mt-1">Add ₹{(c.min_order_amount - cartTotal).toLocaleString("en-IN")} more to unlock</p>
                              )}
                            </div>
                            <button
                              onClick={() => isValid && handleApply(c.code)}
                              disabled={!isValid || isLoading}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isValid ? "bg-white border border-gray-200 text-[#522D6D] hover:bg-[#522D6D] hover:text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                            >
                              Apply
                            </button>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
