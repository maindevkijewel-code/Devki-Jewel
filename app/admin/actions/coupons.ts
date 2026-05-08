"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface Coupon {
  id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_order_amount: number | null
  max_discount_limit: number | null
  expiry_date: string | null
  usage_limit: number | null
  used_count: number
  is_active: boolean
  description: string | null
  created_at: string
}

// ─── ADMIN ACTIONS ───────────────────────────────────────────────

export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) { console.error(error); return [] }
    return data as Coupon[]
  } catch (err) { console.error(err); return [] }
}

export async function getActiveCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) return []
    return data as Coupon[]
  } catch { return [] }
}

export async function createCoupon(formData: FormData) {
  try {
    const supabase = createAdminClient()
    const code = (formData.get("code") as string).toUpperCase().trim()
    
    // Check uniqueness
    const { data: existing } = await supabase.from("coupons").select("id").eq("code", code).single()
    if (existing) return { success: false, error: "Coupon code already exists" }

    const couponData = {
      code,
      discount_type: formData.get("discount_type") as string,
      discount_value: Number(formData.get("discount_value")),
      min_order_amount: formData.get("min_order_amount") ? Number(formData.get("min_order_amount")) : null,
      max_discount_limit: formData.get("max_discount_limit") ? Number(formData.get("max_discount_limit")) : null,
      expiry_date: formData.get("expiry_date") ? new Date(formData.get("expiry_date") as string).toISOString() : null,
      usage_limit: formData.get("usage_limit") ? Number(formData.get("usage_limit")) : null,
      description: formData.get("description") as string || null,
      is_active: formData.get("is_active") === "true"
    }

    const { error } = await supabase.from("coupons").insert(couponData)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

export async function updateCoupon(id: string, formData: FormData) {
  try {
    const supabase = createAdminClient()
    const code = (formData.get("code") as string).toUpperCase().trim()
    
    const couponData = {
      code,
      discount_type: formData.get("discount_type") as string,
      discount_value: Number(formData.get("discount_value")),
      min_order_amount: formData.get("min_order_amount") ? Number(formData.get("min_order_amount")) : null,
      max_discount_limit: formData.get("max_discount_limit") ? Number(formData.get("max_discount_limit")) : null,
      expiry_date: formData.get("expiry_date") ? new Date(formData.get("expiry_date") as string).toISOString() : null,
      usage_limit: formData.get("usage_limit") ? Number(formData.get("usage_limit")) : null,
      description: formData.get("description") as string || null,
      is_active: formData.get("is_active") === "true",
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from("coupons").update(couponData).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

export async function deleteCoupon(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("coupons").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function toggleCouponActive(id: string, is_active: boolean) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── FRONTEND ACTIONS ────────────────────────────────────────────

export async function validateCoupon(code: string, cartTotal: number): Promise<{ success: boolean; data?: Coupon; error?: string }> {
  try {
    const supabase = createAdminClient()
    const normalizedCode = code.toUpperCase().trim()

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", normalizedCode)
      .single()

    if (error || !coupon) return { success: false, error: "Invalid coupon code." }

    if (!coupon.is_active) return { success: false, error: "This coupon is no longer active." }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { success: false, error: "This coupon has expired." }
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { success: false, error: "Coupon usage limit reached." }
    }

    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      return { success: false, error: `Minimum order amount of ₹${coupon.min_order_amount.toLocaleString("en-IN")} required.` }
    }

    return { success: true, data: coupon }
  } catch (err: any) {
    return { success: false, error: "Failed to validate coupon." }
  }
}
