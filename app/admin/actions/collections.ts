"use server"

import { createAdminClient } from "@/lib/supabase-server"

export interface AdminCollection {
  id: string
  name: string
  slug: string
  subtitle: string | null
  description: string | null
  story: string | null
  thumbnail_image: string | null
  mobile_thumbnail_image: string | null
  banner_image: string | null
  hover_image: string | null
  video_url: string | null
  is_featured: boolean
  is_trending: boolean
  is_active: boolean
  show_on_homepage: boolean
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

// ─── READ ────────────────────────────────────────

export async function getCollections(): Promise<AdminCollection[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getCollections error:", error)
    return []
  }
  return JSON.parse(JSON.stringify(data || [])) as AdminCollection[]
}

export async function getCollectionBySlug(slug: string): Promise<AdminCollection | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !data) return null
  return JSON.parse(JSON.stringify(data)) as AdminCollection
}

export async function getHomepageCollections(): Promise<AdminCollection[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .eq("show_on_homepage", true)
    .order("sort_order", { ascending: true })

  if (error) return []
  return JSON.parse(JSON.stringify(data || [])) as AdminCollection[]
}

export async function getActiveCollections(): Promise<AdminCollection[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) return []
  return JSON.parse(JSON.stringify(data || [])) as AdminCollection[]
}

// ─── CREATE ──────────────────────────────────────

export async function createCollection(formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get("name") as string
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const subtitle = (formData.get("subtitle") as string) || null
  const description = (formData.get("description") as string) || null
  const story = (formData.get("story") as string) || null
  const thumbnail_image = (formData.get("thumbnail_image") as string) || null
  const mobile_thumbnail_image = (formData.get("mobile_thumbnail_image") as string) || null
  const banner_image = (formData.get("banner_image") as string) || null
  const hover_image = (formData.get("hover_image") as string) || null
  const video_url = (formData.get("video_url") as string) || null
  const is_featured = formData.get("is_featured") === "true"
  const is_trending = formData.get("is_trending") === "true"
  const is_active = formData.get("is_active") === "true"
  const show_on_homepage = formData.get("show_on_homepage") === "true"
  const sort_order = Number(formData.get("sort_order")) || 0
  const seo_title = (formData.get("seo_title") as string) || null
  const seo_description = (formData.get("seo_description") as string) || null

  const { error } = await supabase.from("collections").insert({
    name, slug, subtitle, description, story,
    thumbnail_image, mobile_thumbnail_image, banner_image, hover_image, video_url,
    is_featured, is_trending, is_active, show_on_homepage, sort_order,
    seo_title, seo_description
  })

  if (error) {
    console.error("createCollection error:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ─── UPDATE ──────────────────────────────────────

export async function updateCollection(id: string, formData: FormData) {
  const supabase = createAdminClient()

  const name = formData.get("name") as string
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const subtitle = (formData.get("subtitle") as string) || null
  const description = (formData.get("description") as string) || null
  const story = (formData.get("story") as string) || null
  const thumbnail_image = (formData.get("thumbnail_image") as string) || null
  const mobile_thumbnail_image = (formData.get("mobile_thumbnail_image") as string) || null
  const banner_image = (formData.get("banner_image") as string) || null
  const hover_image = (formData.get("hover_image") as string) || null
  const video_url = (formData.get("video_url") as string) || null
  const is_featured = formData.get("is_featured") === "true"
  const is_trending = formData.get("is_trending") === "true"
  const is_active = formData.get("is_active") === "true"
  const show_on_homepage = formData.get("show_on_homepage") === "true"
  const sort_order = Number(formData.get("sort_order")) || 0
  const seo_title = (formData.get("seo_title") as string) || null
  const seo_description = (formData.get("seo_description") as string) || null

  const { error } = await supabase.from("collections").update({
    name, slug, subtitle, description, story,
    thumbnail_image, mobile_thumbnail_image, banner_image, hover_image, video_url,
    is_featured, is_trending, is_active, show_on_homepage, sort_order,
    seo_title, seo_description,
    updated_at: new Date().toISOString()
  }).eq("id", id)

  if (error) {
    console.error("updateCollection error:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ─── DELETE ──────────────────────────────────────

export async function deleteCollection(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("collections").delete().eq("id", id)
  if (error) {
    console.error("deleteCollection error:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ─── MEDIA UPLOADS ───────────────────────────────

export async function uploadCollectionMedia(formData: FormData, folder: string = "thumbnails") {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) return { success: false, error: "No file provided" }

  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `collections/${folder}/${fileName}`

  const { error } = await supabase.storage
    .from("collection-media")
    .upload(filePath, file, { cacheControl: "3600", upsert: false })

  if (error) {
    console.error("uploadCollectionMedia error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("collection-media")
    .getPublicUrl(filePath)

  return { success: true, url: urlData.publicUrl }
}

// ─── COLLECTION ↔ PRODUCT LINKING ────────────────

export async function getCollectionProducts(collectionId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("collection_products")
    .select("product_id")
    .eq("collection_id", collectionId)

  if (error) return []
  return JSON.parse(JSON.stringify(data || [])).map((d: any) => d.product_id)
}

export async function getProductCollections(productId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("collection_products")
    .select("collection_id")
    .eq("product_id", productId)

  if (error) return []
  return JSON.parse(JSON.stringify(data || [])).map((d: any) => d.collection_id)
}

export async function updateProductCollections(productId: string, collectionIds: string[]) {
  const supabase = createAdminClient()

  // Delete existing links
  await supabase.from("collection_products").delete().eq("product_id", productId)

  // Insert new links
  if (collectionIds.length > 0) {
    const rows = collectionIds.map(cid => ({ collection_id: cid, product_id: productId }))
    const { error } = await supabase.from("collection_products").insert(rows)
    if (error) {
      console.error("updateProductCollections error:", error)
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}
