"use server"

import { createAdminClient } from "@/lib/supabase-server"
import type { AdminProduct } from "@/lib/types/admin"

export async function getProducts(): Promise<AdminProduct[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getProducts error:", error)
    return []
  }

  return JSON.parse(JSON.stringify(data || [])) as AdminProduct[]
}

export async function createProduct(formData: FormData) {
  try {
    const supabase = createAdminClient()

    const name = formData.get("name") as string
    const category = formData.get("category") as string || ""
    const category_id = (formData.get("category_id") as string) || null
    const subcategory_id = (formData.get("subcategory_id") as string) || null
    const price = Number(formData.get("price"))
    const metal_type = formData.get("metal_type") as string
    const gemstone = (formData.get("gemstone") as string) || null
    const description = (formData.get("description") as string) || null
    const search_keywords = (formData.get("search_keywords") as string) || null
    const occasion = (formData.get("occasion") as string) || null
    const style = (formData.get("style") as string) || null
    const tagsRaw = formData.get("tags") as string
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []
    const key_highlights = (formData.get("key_highlights") as string) || null
    const discount_type = (formData.get("discount_type") as string) || null
    const discount_value = Number(formData.get("discount_value")) || 0
    const stock_quantity = Number(formData.get("stock_quantity")) || 0
    const is_active = formData.get("is_active") === "true"
    const image_urls_raw = formData.get("image_urls") as string
    const image_urls = image_urls_raw ? JSON.parse(image_urls_raw) : []
    const hover_video_url = (formData.get("hover_video_url") as string) || null
    const weight = (formData.get("weight") as string) || null
    const purity = (formData.get("purity") as string) || null
    const metalTypesRaw = formData.get("metal_types") as string
    const metal_types = metalTypesRaw ? metalTypesRaw.split(",").map(t => t.trim()).filter(Boolean) : []

    if (!name) return { success: false, error: "Product name is required" }

    // Generate slug-style id for compatibility with storefront
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const product = {
      id,
      slug: id,
      name,
      category: category.toLowerCase(),
      category_id,
      subcategory_id,
      price,
      metal_type,
      gemstone,
      description,
      search_keywords,
      occasion,
      style,
      tags,
      key_highlights,
      discount_type: discount_type === "none" ? null : discount_type,
      discount_value,
      stock_quantity,
      is_active,
      image_urls,
      hover_video_url,
      weight,
      purity,
      metal_types,
      // Also populate legacy columns for storefront compatibility
      image: image_urls[0] || "",
      hover_image: image_urls[1] || image_urls[0] || "",
      images: image_urls,
      material: metal_type,
      original_price: discount_type === "percentage"
        ? Math.round(price / (1 - discount_value / 100))
        : discount_type === "flat"
          ? price + discount_value
          : price,
      is_latest: true,
      in_stock: stock_quantity > 0,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("products").insert(product)

    if (error) {
      console.error("createProduct error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id }
  } catch (err: any) {
    console.error("createProduct exception:", err)
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  try {
    const supabase = createAdminClient()

    const name = formData.get("name") as string
    const category = formData.get("category") as string || ""
    const category_id = (formData.get("category_id") as string) || null
    const subcategory_id = (formData.get("subcategory_id") as string) || null
    const price = Number(formData.get("price"))
    const metal_type = formData.get("metal_type") as string
    const gemstone = (formData.get("gemstone") as string) || null
    const description = (formData.get("description") as string) || null
    const search_keywords = (formData.get("search_keywords") as string) || null
    const occasion = (formData.get("occasion") as string) || null
    const style = (formData.get("style") as string) || null
    const tagsRaw = formData.get("tags") as string
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []
    const key_highlights = (formData.get("key_highlights") as string) || null
    const discount_type = (formData.get("discount_type") as string) || null
    const discount_value = Number(formData.get("discount_value")) || 0
    const stock_quantity = Number(formData.get("stock_quantity")) || 0
    const is_active = formData.get("is_active") === "true"
    const image_urls_raw = formData.get("image_urls") as string
    const image_urls = image_urls_raw ? JSON.parse(image_urls_raw) : []
    const hover_video_url = (formData.get("hover_video_url") as string) || null
    const weight = (formData.get("weight") as string) || null
    const purity = (formData.get("purity") as string) || null
    const metalTypesRaw = formData.get("metal_types") as string
    const metal_types = metalTypesRaw ? metalTypesRaw.split(",").map(t => t.trim()).filter(Boolean) : []

    if (!name) return { success: false, error: "Product name is required" }

    const updates = {
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name,
      category: category.toLowerCase(),
      category_id,
      subcategory_id,
      price,
      metal_type,
      gemstone,
      description,
      search_keywords,
      occasion,
      style,
      tags,
      key_highlights,
      discount_type: discount_type === "none" ? null : discount_type,
      discount_value,
      stock_quantity,
      is_active,
      image_urls,
      hover_video_url,
      weight,
      purity,
      metal_types,
      image: image_urls[0] || "",
      hover_image: image_urls[1] || image_urls[0] || "",
      images: image_urls,
      material: metal_type,
      original_price: discount_type === "percentage"
        ? Math.round(price / (1 - discount_value / 100))
        : discount_type === "flat"
          ? price + discount_value
          : price,
      in_stock: stock_quantity > 0,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)

    if (error) {
      console.error("updateProduct error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("updateProduct exception:", err)
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}

export async function deleteProduct(productId: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("products").delete().eq("id", productId)

    if (error) {
      console.error("deleteProduct error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("deleteProduct exception:", err)
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", productId)

    if (error) {
      console.error("toggleProductActive error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("toggleProductActive exception:", err)
    return { success: false, error: err.message || "An unexpected error occurred" }
  }
}

export async function uploadProductImage(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("uploadProductImage error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath)

  return { success: true, url: urlData.publicUrl }
}

export async function uploadProductVideo(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  // Validate format and size
  const isValidFormat = ['video/mp4', 'video/webm'].includes(file.type)
  if (!isValidFormat) return { success: false, error: "Invalid video format. Use MP4 or WebM." }
  
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: "Video size must be less than 20MB" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `products/videos/${fileName}`

  const { error } = await supabase.storage
    .from("product-videos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("uploadProductVideo error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("product-videos")
    .getPublicUrl(filePath)

  return { success: true, url: urlData.publicUrl }
}
