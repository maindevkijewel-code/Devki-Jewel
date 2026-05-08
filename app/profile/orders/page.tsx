"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Package, Eye, ShoppingBag } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  items: Array<{
    product_name: string
    product_image: string
    quantity: number
    price: number
  }>
}

export default function OrdersPage() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setOrders(data.map((o: any) => ({
          id: o.id,
          created_at: o.created_at,
          status: o.status,
          total_amount: o.total_amount,
          items: o.order_items || [],
        })))
      }
      setIsLoading(false)
    }
    fetchOrders()
  }, [user])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            You haven&apos;t placed any orders yet. Start exploring our beautiful jewellery collections!
          </p>
          <Link
            href="/jewellery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{order.total_amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {order.items.length > 0 && (
                <div className="flex gap-3 mb-4">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden">
                      <Image src={item.product_image || "/placeholder.jpg"} alt={item.product_name} fill className="object-contain p-1" sizes="64px" />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-medium text-gray-500">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
              )}

              <Link
                href={`/profile/orders/${order.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#522D6D] hover:underline"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
