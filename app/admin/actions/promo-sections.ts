"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface PromoSection {
  id: string
  // Left / Main side
  title: string | null
  subtitle: string | null
  desktop_image: string
  mobile_image: string | null
  button_text: string | null
  button_link: string | null
  text_color: string | null
  text_alignment: string | null
  overlay_opacity: number | null
  badge_text: string | null
  // Right side (for split layouts)
  right_desktop_image: string | null
  right_mobile_image: string | null
  right_title: string | null
  right_subtitle: string | null
  right_button_text: string | null
  right_button_link: string | null
  right_text_color: string | null
  right_text_alignment: string | null
  right_overlay_opacity: number | null
  right_badge_text: string | null
  // Layout
  layout_type: string
  layout_ratio: string | null
  mobile_behavior: string | null
  aspect_ratio: string | null
  display_order: number
  background_color: string | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

// Helper: extract all fields from FormData
function extractFields(fd: FormData) {
  return {
    // Left / main
    title: (fd.get("title") as string) || null,
    subtitle: (fd.get("subtitle") as string) || null,
    desktop_image: (fd.get("desktop_image") as string) || "",
    mobile_image: (fd.get("mobile_image") as string) || null,
    button_text: (fd.get("button_text") as string) || null,
    button_link: (fd.get("button_link") as string) || null,
    text_color: (fd.get("text_color") as string) || "dark",
    text_alignment: (fd.get("text_alignment") as string) || "left",
    overlay_opacity: Number(fd.get("overlay_opacity")) || 0,
    badge_text: (fd.get("badge_text") as string) || null,
    // Right
    right_desktop_image: (fd.get("right_desktop_image") as string) || null,
    right_mobile_image: (fd.get("right_mobile_image") as string) || null,
    right_title: (fd.get("right_title") as string) || null,
    right_subtitle: (fd.get("right_subtitle") as string) || null,
    right_button_text: (fd.get("right_button_text") as string) || null,
    right_button_link: (fd.get("right_button_link") as string) || null,
    right_text_color: (fd.get("right_text_color") as string) || "dark",
    right_text_alignment: (fd.get("right_text_alignment") as string) || "left",
    right_overlay_opacity: Number(fd.get("right_overlay_opacity")) || 0,
    right_badge_text: (fd.get("right_badge_text") as string) || null,
    // Layout
    layout_type: (fd.get("layout_type") as string) || "full_width",
    layout_ratio: (fd.get("layout_ratio") as string) || "50/50",
    mobile_behavior: (fd.get("mobile_behavior") as string) || "stack",
    aspect_ratio: (fd.get("aspect_ratio") as string) || "21/8",
    display_order: Number(fd.get("display_order")) || 0,
    background_color: (fd.get("background_color") as string) || "#FFFFFF",
    is_active: fd.get("is_active") === "true",
    start_date: (fd.get("start_date") as string) || null,
    end_date: (fd.get("end_date") as string) || null,
  }
}

// ─── READ ─────────────────────────────────────────

export async function getActivePromoSections(): Promise<PromoSection[]> {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("promo_sections")
      .select("*")
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("display_order", { ascending: true })

    if (error) { console.error("getActivePromoSections error:", error); return [] }
    return JSON.parse(JSON.stringify(data || [])) as PromoSection[]
  } catch (err) { console.error("getActivePromoSections exception:", err); return [] }
}

export async function getAllPromoSections(): Promise<PromoSection[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("promo_sections")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) return []
    return JSON.parse(JSON.stringify(data || [])) as PromoSection[]
  } catch { return [] }
}

// ─── CREATE ───────────────────────────────────────

export async function createPromoSection(formData: FormData) {
  try {
    const supabase = createAdminClient()
    const section = extractFields(formData)
    if (!section.desktop_image) return { success: false, error: "Left desktop image is required" }

    const { error } = await supabase.from("promo_sections").insert(section)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── UPDATE ───────────────────────────────────────

export async function updatePromoSection(id: string, formData: FormData) {
  try {
    const supabase = createAdminClient()
    const updates = extractFields(formData)

    const { error } = await supabase.from("promo_sections").update(updates).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── TOGGLE ───────────────────────────────────────

export async function togglePromoActive(id: string, isActive: boolean) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("promo_sections").update({ is_active: isActive }).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── DELETE ───────────────────────────────────────

export async function deletePromoSection(id: string) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("promo_sections").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── REORDER ──────────────────────────────────────

export async function reorderPromoSections(orderedIds: string[]) {
  try {
    const supabase = createAdminClient()
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("promo_sections").update({ display_order: index }).eq("id", id)
      )
    )
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}

// ─── IMAGE UPLOAD ─────────────────────────────────

export async function uploadPromoImage(formData: FormData, folder: "desktop" | "mobile") {
  try {
    const supabase = createAdminClient()
    const file = formData.get("file") as File

    if (!file) return { success: false, error: "No file provided" }

    const ext = file.name.split(".").pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const { error } = await supabase.storage
      .from("promo-banners")
      .upload(fileName, file, { cacheControl: "3600", upsert: false })

    if (error) return { success: false, error: error.message }

    const { data: urlData } = supabase.storage.from("promo-banners").getPublicUrl(fileName)
    return { success: true, url: urlData.publicUrl }
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" }
  }
}
