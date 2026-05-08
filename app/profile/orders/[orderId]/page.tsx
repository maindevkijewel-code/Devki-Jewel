"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronRight, Package, Truck, CheckCircle2, Clock, XCircle, RotateCcw, Download, ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
]

const statusIndex: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
  returned: -1,
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const { user } = useAuthStore()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      if (!user) return
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single()

      if (data) setOrder(data)
      setIsLoading(false)
    }
    fetchOrder()
  }, [user, orderId])

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
    if (error) {
      toast.error("Failed to cancel order")
    } else {
      setOrder({ ...order, status: "cancelled" })
      toast.success("Order cancelled successfully")
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Order not found</h3>
        <Link href="/profile/orders" className="text-[#522D6D] font-medium hover:underline">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  const currentStep = statusIndex[order.status] ?? 0

  return (
    <div className="space-y-6">
      <Link href="/profile/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#522D6D]">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            {(order.status === "pending" || order.status === "confirmed") && (
              <button
                onClick={handleCancelOrder}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
            {order.status === "delivered" && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#522D6D] border border-[#522D6D] rounded-lg hover:bg-[#522D6D] hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
                Return / Exchange
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Invoice
            </button>
          </div>
        </div>

        {/* Timeline */}
        {order.status !== "cancelled" && order.status !== "returned" && (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
              <div className="absolute top-5 left-0 h-0.5 bg-[#522D6D] transition-all duration-500" style={{ width: `${(currentStep / 3) * 100}%` }} />
              {statusSteps.map((step, idx) => (
                <div key={step.key} className="relative flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idx <= currentStep ? "bg-[#522D6D] text-white" : "bg-gray-100 text-gray-400"}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${idx <= currentStep ? "text-[#522D6D]" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="mb-8 p-4 bg-red-50 rounded-xl text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">This order has been cancelled</p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Items in this order</h3>
          {(order.order_items || []).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0">
                <Image src={item.product_image || "/placeholder.jpg"} alt={item.product_name || "Product"} fill className="object-contain p-1" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h3>
              <p className="text-sm text-gray-600">{order.shipping_address || "Address on file"}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment</h3>
              <p className="text-sm text-gray-600">
                {order.payment_method || "Online Payment"}
                {order.razorpay_payment_id && (
                  <span className="block text-xs text-gray-400 mt-1">
                    Payment ID: {order.razorpay_payment_id}
                  </span>
                )}
              </p>
              <p className="text-lg font-bold text-[#522D6D] mt-2">
                Total: ₹{order.total_amount?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
