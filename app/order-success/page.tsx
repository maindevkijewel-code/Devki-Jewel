"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

function OrderSuccessInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get("order")

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    if (!orderNumber) {
      router.replace("/")
    }
  }, [orderNumber, router])

  if (!mounted || !orderNumber) return null

  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 max-w-lg w-full text-center shadow-xl shadow-purple-900/5 relative overflow-hidden"
        >
          {/* Decorative background circle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-10" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 border border-green-200 rounded-full"
            />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 mb-6">
            Thank you for your purchase. We&apos;ve received your order and are getting it ready for shipment.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Order Number</p>
            <p className="font-mono text-lg font-bold text-[#522D6D]">{orderNumber}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/profile/orders`}
              className="flex-1 px-6 py-3.5 border border-[#522D6D] text-[#522D6D] rounded-xl font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              View Order
            </Link>
            <Link
              href="/jewellery"
              className="flex-1 px-6 py-3.5 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#522D6D]" /></div>}>
      <OrderSuccessInner />
    </Suspense>
  )
}

