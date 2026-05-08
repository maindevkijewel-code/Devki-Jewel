"use server"

import { createAdminClient } from "@/lib/supabase-server"

export async function uploadTryOnImage(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `tryon-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `tryon/${fileName}`

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("uploadTryOnImage error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath)

  return { success: true, url: urlData.publicUrl }
}

export async function updateProductTryOn(
  productId: string,
  tryOnEnabled: boolean,
  tryOnImageUrl: string | null,
  tryOnType: string
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("products")
    .update({
      try_on_enabled: tryOnEnabled,
      try_on_image_url: tryOnImageUrl,
      try_on_type: tryOnType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  if (error) {
    console.error("updateProductTryOn error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getTryOnSettings() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .in("key", [
      "tryon_global_enabled",
      "tryon_choker_y_offset",
      "tryon_necklace_y_offset",
      "tryon_earring_scaling",
      "tryon_camera_guide_url",
    ])

  if (error) {
    console.error("getTryOnSettings error:", error)
    return {}
  }

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.key] = row.value || ""
  }
  return settings
}

export async function updateTryOnSettings(settings: Record<string, string>) {
  const supabase = createAdminClient()

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
  }))

  const { error } = await supabase.from("settings").upsert(upserts)

  if (error) {
    console.error("updateTryOnSettings error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
