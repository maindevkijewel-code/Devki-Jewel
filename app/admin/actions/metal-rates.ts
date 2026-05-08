"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface MetalRate {
  id: string
  metal_type: string
  purity: string | null
  unit: string
  current_price: number
  price_change: number
  percentage_change: number
  icon_emoji: string | null
  display_order: number
  is_active: boolean
  updated_at: string
}

export interface MetalRateHistory {
  id: string
  metal_type: string
  price: number
  date: string
}

// ─── READ ────────────────────────────────────────

export async function getMetalRates(): Promise<MetalRate[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("metal_rates")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("getMetalRates error:", error)
      return []
    }
    return JSON.parse(JSON.stringify(data || [])) as MetalRate[]
  } catch (err) {
    console.error("getMetalRates exception:", err)
    return []
  }
}

export async function getAllMetalRates(): Promise<MetalRate[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("metal_rates")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) return []
    return JSON.parse(JSON.stringify(data || [])) as MetalRate[]
  } catch {
    return []
  }
}

export async function getMetalRateHistory(metalType: string, days: number = 30): Promise<MetalRateHistory[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("metal_rate_history")
      .select("*")
      .eq("metal_type", metalType)
      .order("date", { ascending: true })
      .limit(days)

    if (error) {
      console.error("getMetalRateHistory error:", error)
      return []
    }
    return JSON.parse(JSON.stringify(data || [])) as MetalRateHistory[]
  } catch (err) {
    console.error("getMetalRateHistory exception:", err)
    return []
  }
}

export async function getAllRateHistory(): Promise<MetalRateHistory[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("metal_rate_history")
      .select("*")
      .order("date", { ascending: false })
      .limit(200)

    if (error) return []
    return JSON.parse(JSON.stringify(data || [])) as MetalRateHistory[]
  } catch {
    return []
  }
}

// ─── UPDATE RATE ─────────────────────────────────

export async function updateMetalRate(metalType: string, newPrice: number) {
  try {
    const supabase = createAdminClient()

    // Get current price to calculate change
    const { data: current } = await supabase
      .from("metal_rates")
      .select("current_price")
      .eq("metal_type", metalType)
      .single()

    const oldPrice = current?.current_price || newPrice
    const priceChange = newPrice - oldPrice
    const percentageChange = oldPrice > 0 ? Number(((priceChange / oldPrice) * 100).toFixed(2)) : 0

    // Update current rate
    const { error: updateError } = await supabase
      .from("metal_rates")
      .update({
        current_price: newPrice,
        price_change: priceChange,
        percentage_change: percentageChange,
        updated_at: new Date().toISOString(),
      })
      .eq("metal_type", metalType)

    if (updateError) {
      console.error("updateMetalRate error:", updateError)
      return { success: false, error: updateError.message }
    }

    // Also add to history for today
    const today = new Date().toISOString().split("T")[0]
    await supabase
      .from("metal_rate_history")
      .upsert(
        { metal_type: metalType, price: newPrice, date: today },
        { onConflict: "metal_type,date" }
      )

    return { success: true }
  } catch (err: any) {
    console.error("updateMetalRate exception:", err)
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── ADD HISTORY ENTRY ───────────────────────────

export async function addRateHistoryEntry(metalType: string, price: number, date: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("metal_rate_history")
      .upsert(
        { metal_type: metalType, price, date },
        { onConflict: "metal_type,date" }
      )

    if (error) {
      console.error("addRateHistoryEntry error:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── DELETE HISTORY ENTRY ────────────────────────

export async function deleteRateHistoryEntry(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("metal_rate_history").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}
