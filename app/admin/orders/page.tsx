"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart } from "lucide-react"
import { getOrders } from "../actions/orders"
import OrderDetailModal from "./order-detail-modal"
import { getSupabaseBrowserClient } from "@/lib/supabase"

const TABS = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("All")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  const load = useCallback(async () => {
    const data = await getOrders(activeTab)
    setOrders(data)
    setIsLoading(false)
  }, [activeTab])

  useEffect(() => { setIsLoading(true); load() }, [load])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel("admin-orders").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => { load() }
    ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const getStatusColor = (s: string) => {
    const l = s?.toLowerCase()
    if (l === "delivered") return "bg-emerald-100 text-emerald-700"
    if (l === "shipped") return "bg-blue-100 text-blue-700"
    if (l === "confirmed") return "bg-violet-100 text-violet-700"
    if (l === "cancelled") return "bg-red-100 text-red-700"
    return "bg-yellow-100 text-yellow-700"
  }
  const getPayColor = (s: string) => {
    if (s === "paid") return "bg-emerald-100 text-emerald-700"
    if (s === "refunded") return "bg-orange-100 text-orange-700"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track customer orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? "bg-[#522D6D] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Order ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">{Array.from({ length: 7 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />No orders found
                </td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer">
                    <td className="py-3 px-4 font-medium text-gray-900">{o.order_number || o.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-gray-600">{o.customer_name || "–"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{o.customer_email || "–"}</td>
                    <td className="py-3 px-4 font-medium">₹{Number(o.total_amount || 0).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>{o.status || "Pending"}</span></td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getPayColor(o.payment_status)}`}>{o.payment_status || "unpaid"}</span></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={() => { setSelectedOrder(null); load() }} />
        )}
      </AnimatePresence>
    </div>
  )
}
