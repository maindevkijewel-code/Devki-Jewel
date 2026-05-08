"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface HeroBanner {
  id: string
  title: string | null
  subtitle: string | null
  desktop_image: string
  mobile_image: string | null
  button_text: string | null
  button_link: string | null
  display_order: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  badge_text: string | null
  text_color: string | null
  overlay_opacity: number | null
  created_at: string
  updated_at: string
}

// ─── READ ─────────────────────────────────────────

export async function getActiveBanners(): Promise<HeroBanner[]> {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("getActiveBanners error:", error)
      return []
    }
    return JSON.parse(JSON.stringify(data || [])) as HeroBanner[]
  } catch (err) {
    console.error("getActiveBanners exception:", err)
    return []
  }
}

export async function getAllBanners(): Promise<HeroBanner[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) return []
    return JSON.parse(JSON.stringify(data || [])) as HeroBanner[]
  } catch {
    return []
  }
}

// ─── CREATE ───────────────────────────────────────

export async function createBanner(formData: FormData) {
  try {
    const supabase = createAdminClient()

    const banner = {
      title: (formData.get("title") as string) || null,
      subtitle: (formData.get("subtitle") as string) || null,
      desktop_image: formData.get("desktop_image") as string,
      mobile_image: (formData.get("mobile_image") as string) || null,
      button_text: (formData.get("button_text") as string) || "Shop Now",
      button_link: (formData.get("button_link") as string) || "/jewellery",
      display_order: Number(formData.get("display_order")) || 0,
      is_active: formData.get("is_active") === "true",
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
      badge_text: (formData.get("badge_text") as string) || null,
      text_color: (formData.get("text_color") as string) || "dark",
      overlay_opacity: Number(formData.get("overlay_opacity")) || 0,
    }

    if (!banner.desktop_image) return { success: false, error: "Desktop image is required" }

    const { error } = await supabase.from("hero_banners").insert(banner)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── UPDATE ───────────────────────────────────────

export async function updateBanner(id: string, formData: FormData) {
  try {
    const supabase = createAdminClient()

    const updates: any = {
      title: (formData.get("title") as string) || null,
      subtitle: (formData.get("subtitle") as string) || null,
      button_text: (formData.get("button_text") as string) || "Shop Now",
      button_link: (formData.get("button_link") as string) || "/jewellery",
      display_order: Number(formData.get("display_order")) || 0,
      is_active: formData.get("is_active") === "true",
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
      badge_text: (formData.get("badge_text") as string) || null,
      text_color: (formData.get("text_color") as string) || "dark",
      overlay_opacity: Number(formData.get("overlay_opacity")) || 0,
    }

    const desktopImage = formData.get("desktop_image") as string
    if (desktopImage) updates.desktop_image = desktopImage

    const mobileImage = formData.get("mobile_image") as string
    if (mobileImage) updates.mobile_image = mobileImage

    const { error } = await supabase.from("hero_banners").update(updates).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── TOGGLE ACTIVE ────────────────────────────────

export async function toggleBannerActive(id: string, isActive: boolean) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("hero_banners")
      .update({ is_active: isActive })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── DELETE ───────────────────────────────────────

export async function deleteBanner(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("hero_banners").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── REORDER ──────────────────────────────────────

export async function reorderBanners(orderedIds: string[]) {
  try {
    const supabase = createAdminClient()
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("hero_banners").update({ display_order: index }).eq("id", id)
      )
    )
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── IMAGE UPLOAD ─────────────────────────────────

export async function uploadBannerImage(formData: FormData, folder: "desktop" | "mobile") {
  try {
    const supabase = createAdminClient()
    const file = formData.get("file") as File

    if (!file) return { success: false, error: "No file provided" }

    const ext = file.name.split(".").pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const { error } = await supabase.storage
      .from("hero-banners")
      .upload(fileName, file, { cacheControl: "3600", upsert: false })

    if (error) return { success: false, error: error.message }

    const { data: urlData } = supabase.storage.from("hero-banners").getPublicUrl(fileName)
    return { success: true, url: urlData.publicUrl }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}
