"use server"

import { createAdminClient } from "@/lib/supabase-server"

export async function getDashboardStats() {
  const supabase = createAdminClient()

  const [productsRes, ordersRes, usersRes, salesRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount, payment_status"),
  ])

  const totalProducts = productsRes.count || 0
  const totalOrders = ordersRes.count || 0
  const totalUsers = usersRes.count || 0

  const totalSales = (salesRes.data || [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

  return { totalProducts, totalOrders, totalUsers, totalSales }
}

export async function getRecentOrders() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("getRecentOrders error:", error)
    return []
  }

  return data || []
}

export async function getMonthlySales() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("orders")
    .select("total_amount, created_at, payment_status")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("getMonthlySales error:", error)
    return []
  }

  // Group by month
  const monthlyMap: Record<string, number> = {}
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  // Initialize last 6 months
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`
    monthlyMap[key] = 0
  }

  for (const order of data || []) {
    const d = new Date(order.created_at)
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`
    if (key in monthlyMap) {
      monthlyMap[key] += Number(order.total_amount) || 0
    }
  }

  return Object.entries(monthlyMap).map(([month, sales]) => ({
    month,
    sales,
  }))
}
