"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export async function getCategories(): Promise<AdminCategory[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("getCategories error:", error)
    return []
  }

  return JSON.parse(JSON.stringify(data || [])) as AdminCategory[]
}

export async function createCategory(formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get("name") as string
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const description = (formData.get("description") as string) || null
  const parent_id = (formData.get("parent_id") as string) || null
  const is_active = formData.get("is_active") === "true"
  const image_url = (formData.get("image_url") as string) || null

  const category = {
    name,
    slug,
    description,
    parent_id,
    is_active,
    image_url
  }

  const { error } = await supabase.from("categories").insert(category)

  if (error) {
    console.error("createCategory error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get("name") as string
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const description = (formData.get("description") as string) || null
  const parent_id = (formData.get("parent_id") as string) || null
  const is_active = formData.get("is_active") === "true"
  const image_url = (formData.get("image_url") as string) || null

  const updates = {
    name,
    slug,
    description,
    parent_id,
    is_active,
    image_url
  }

  const { error } = await supabase.from("categories").update(updates).eq("id", id)

  if (error) {
    console.error("updateCategory error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    console.error("deleteCategory error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function uploadCategoryImage(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `categories/${fileName}`

  const { error } = await supabase.storage
    .from("product-images") // we can use the same bucket
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("uploadCategoryImage error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath)

  return { success: true, url: urlData.publicUrl }
}
