"use server"

import { createAdminClient } from "@/lib/supabase-server"

// ── Fetch all settings as key-value map ─────────────────────────────────────
export async function getSettings() {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("settings").select("*")

  if (error) {
    console.error("getSettings error:", error)
    return {}
  }

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.key] = row.value || ""
  }
  return settings
}

// ── Upsert settings ─────────────────────────────────────────────────────────
export async function updateSettings(settings: Record<string, string>) {
  const supabase = createAdminClient()

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
  }))

  const { error } = await supabase.from("settings").upsert(upserts)

  if (error) {
    console.error("updateSettings error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ── Upload logo to Supabase Storage ─────────────────────────────────────────
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function uploadSiteAsset(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Allowed: PNG, JPG, WEBP, SVG" }
  }

  // Validate file size
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "File too large. Maximum size is 5MB" }
  }

  // Store in logos/ subdirectory with unique timestamp name
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png"
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
  const fileName = `logos/${Date.now()}-${sanitizedName}.${fileExt}`

  const { error } = await supabase.storage
    .from("site-assets")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (error) {
    console.error("uploadSiteAsset error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("site-assets")
    .getPublicUrl(fileName)

  // Also save logo_url to settings automatically
  await supabase.from("settings").upsert({ key: "logo_url", value: urlData.publicUrl })

  return { success: true, url: urlData.publicUrl }
}
