"use server"

import { createAdminClient } from "@/lib/supabase-server"
import type { OrderStatus, PaymentStatus } from "@/lib/types/admin"

export async function getOrders(statusFilter?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (statusFilter && statusFilter !== "All") {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error("getOrders error:", error)
    return []
  }

  return data || []
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string
) {
  const supabase = createAdminClient()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (trackingNumber !== undefined) {
    updates.tracking_number = trackingNumber
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)

  if (error) {
    console.error("updateOrderStatus error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    console.error("updatePaymentStatus error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
