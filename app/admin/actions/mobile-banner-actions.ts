"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface MobileHeroBanner {
  id: string
  image_url: string
  title: string | null
  subtitle: string | null
  cta_text: string | null
  cta_link: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

// ─── READ ─────────────────────────────────────────

export async function getActiveMobileBanners(): Promise<MobileHeroBanner[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("mobile_hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("getActiveMobileBanners error:", error)
      return []
    }
    return JSON.parse(JSON.stringify(data || [])) as MobileHeroBanner[]
  } catch (err) {
    console.error("getActiveMobileBanners exception:", err)
    return []
  }
}

export async function getAllMobileBanners(): Promise<MobileHeroBanner[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("mobile_hero_banners")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) return []
    return JSON.parse(JSON.stringify(data || [])) as MobileHeroBanner[]
  } catch {
    return []
  }
}

// ─── CREATE ───────────────────────────────────────

export async function createMobileBanner(formData: FormData) {
  try {
    const supabase = createAdminClient()
    const banner = {
      image_url: formData.get("image_url") as string,
      title: (formData.get("title") as string) || null,
      subtitle: (formData.get("subtitle") as string) || null,
      cta_text: (formData.get("cta_text") as string) || null,
      cta_link: (formData.get("cta_link") as string) || null,
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    }

    if (!banner.image_url) return { success: false, error: "Image is required" }

    const { error } = await supabase.from("mobile_hero_banners").insert(banner)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── UPDATE ───────────────────────────────────────

export async function updateMobileBanner(id: string, formData: FormData) {
  try {
    const supabase = createAdminClient()
    const updates: any = {
      title: (formData.get("title") as string) || null,
      subtitle: (formData.get("subtitle") as string) || null,
      cta_text: (formData.get("cta_text") as string) || null,
      cta_link: (formData.get("cta_link") as string) || null,
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    }

    const imageUrl = formData.get("image_url") as string
    if (imageUrl) updates.image_url = imageUrl

    const { error } = await supabase.from("mobile_hero_banners").update(updates).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── TOGGLE ACTIVE ────────────────────────────────

export async function toggleMobileBannerActive(id: string, isActive: boolean) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("mobile_hero_banners")
      .update({ is_active: isActive })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── DELETE ───────────────────────────────────────

export async function deleteMobileBanner(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("mobile_hero_banners").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── REORDER ──────────────────────────────────────

export async function reorderMobileBanners(orderedIds: string[]) {
  try {
    const supabase = createAdminClient()
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("mobile_hero_banners").update({ sort_order: index }).eq("id", id)
      )
    )
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── IMAGE UPLOAD ─────────────────────────────────

export async function uploadMobileBannerImage(formData: FormData) {
  try {
    const supabase = createAdminClient()
    const file = formData.get("file") as File

    if (!file) return { success: false, error: "No file provided" }

    const ext = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const { error } = await supabase.storage
      .from("mobile-hero-banners")
      .upload(fileName, file, { cacheControl: "3600", upsert: false })

    if (error) return { success: false, error: error.message }

    const { data: urlData } = supabase.storage.from("mobile-hero-banners").getPublicUrl(fileName)
    return { success: true, url: urlData.publicUrl }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}
