"use server"

import { createAdminClient } from "@/lib/supabase-server"

/**
 * Server action to trigger AI background removal for a product image.
 * Calls our internal API route which handles the Remove.bg integration.
 */
export async function removeImageBackground(imageUrl: string, productId?: string) {
  try {
    if (!imageUrl) {
      return { success: false, error: "No image URL provided" }
    }

    // Call our secure API route
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/remove-bg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, productId }),
    })

    const data = await response.json()

    if (!data.success) {
      return { success: false, error: data.error || "Background removal failed" }
    }

    return {
      success: true,
      transparentUrl: data.transparentUrl,
      message: "Background removed successfully",
    }
  } catch (error: any) {
    console.error("removeImageBackground error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

/**
 * Upload a transparent image directly (for manual upload fallback)
 */
export async function uploadTransparentImage(formData: FormData) {
  const supabase = createAdminClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  const fileName = `transparent-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
  const filePath = `products-transparent/${fileName}`

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("uploadTransparentImage error:", error)
    return { success: false, error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath)

  return { success: true, url: urlData.publicUrl }
}

/**
 * Save transparent image URL to product and auto-enable Try-On
 */
export async function saveTransparentImage(
  productId: string,
  transparentUrl: string,
  autoEnableTryOn: boolean = true
) {
  const supabase = createAdminClient()

  const updateData: Record<string, any> = {
    transparent_image: transparentUrl,
    bg_removal_status: "completed",
    updated_at: new Date().toISOString(),
  }

  if (autoEnableTryOn) {
    updateData.try_on_enabled = true
    updateData.try_on_image_url = transparentUrl
  }

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId)

  if (error) {
    console.error("saveTransparentImage error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
