"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"
import { getDashboardStats, getRecentOrders, getMonthlySales } from "./actions/dashboard"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Stats {
  totalSales: number
  totalOrders: number
  totalUsers: number
  totalProducts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [monthlySales, setMonthlySales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, r, m] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(),
        getMonthlySales(),
      ])
      setStats(s)
      setRecentOrders(r)
      setMonthlySales(m)
      setIsLoading(false)
    }
    load()
  }, [])

  const statCards = [
    {
      title: "Total Sales",
      value: stats ? `₹${stats.totalSales.toLocaleString("en-IN")}` : "–",
      icon: DollarSign,
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toString() || "–",
      icon: ShoppingCart,
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers?.toString() || "–",
      icon: Users,
      color: "bg-violet-500",
      bgLight: "bg-violet-50",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts?.toString() || "–",
      icon: Package,
      color: "bg-amber-500",
      bgLight: "bg-amber-50",
    },
  ]

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === "delivered") return "bg-emerald-100 text-emerald-700"
    if (s === "shipped") return "bg-blue-100 text-blue-700"
    if (s === "confirmed") return "bg-violet-100 text-violet-700"
    if (s === "cancelled") return "bg-red-100 text-red-700"
    return "bg-yellow-100 text-yellow-700"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl animate-pulse" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${card.bgLight} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color.replace("bg-", "text-")}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
            <p className="text-sm text-gray-500">Monthly revenue for the last 6 months</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4" />
            Revenue
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySales} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Sales"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e5", fontSize: "13px" }}
              />
              <Bar dataKey="sales" fill="#522D6D" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Order</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {order.customer_name || "–"}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
