"use server"

import { createAdminClient } from "@/lib/supabase-server"

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

export async function uploadSiteAsset(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `logo-${Date.now()}.${fileExt}`

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

  return { success: true, url: urlData.publicUrl }
}
