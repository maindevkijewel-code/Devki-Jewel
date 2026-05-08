"use server"

import { createAdminClient } from "@/lib/supabase-server"
import type { UserRole } from "@/lib/types/admin"

export async function getUsers() {
  const supabase = createAdminClient()

  // Get profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getUsers error:", error)
    return []
  }

  // Get order counts per user
  const { data: orderCounts } = await supabase
    .from("orders")
    .select("user_id")

  const countMap: Record<string, number> = {}
  for (const o of orderCounts || []) {
    if (o.user_id) {
      countMap[o.user_id] = (countMap[o.user_id] || 0) + 1
    }
  }

  return (profiles || []).map((p) => ({
    ...p,
    order_count: countMap[p.id] || 0,
  }))
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) {
    console.error("updateUserRole error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function toggleUserBlocked(userId: string, isBlocked: boolean) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: isBlocked })
    .eq("id", userId)

  if (error) {
    console.error("toggleUserBlocked error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getUserOrders(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getUserOrders error:", error)
    return []
  }

  return data || []
}
