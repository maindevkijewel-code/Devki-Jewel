import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

const REMOVEBG_API_URL = "https://api.remove.bg/v1.0/removebg"
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

async function callRemoveBgApi(imageBuffer: ArrayBuffer, apiKey: string): Promise<ArrayBuffer> {
  const formData = new FormData()
  formData.append("image_file", new Blob([imageBuffer]), "image.png")
  formData.append("size", "full")
  formData.append("type", "product")
  formData.append("format", "png")
  formData.append("channels", "rgba")

  const response = await fetch(REMOVEBG_API_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Remove.bg API error (${response.status})`
    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.errors?.[0]?.title || errorMessage
    } catch {}
    throw new Error(errorMessage)
  }

  return await response.arrayBuffer()
}

async function callWithRetry(imageBuffer: ArrayBuffer, apiKey: string): Promise<ArrayBuffer> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callRemoveBgApi(imageBuffer, apiKey)
    } catch (error: any) {
      lastError = error
      // Don't retry on auth errors or rate limits
      if (error.message?.includes("401") || error.message?.includes("403")) {
        throw error
      }
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error("Remove.bg API failed after retries")
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.REMOVEBG_API_KEY
    if (!apiKey || apiKey === "your_removebg_api_key_here") {
      return NextResponse.json(
        { success: false, error: "Remove.bg API key not configured. Add your real REMOVEBG_API_KEY to .env.local (get one at remove.bg/api)." },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { imageUrl, productId } = body

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "No image URL provided" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Update status to processing
    if (productId) {
      await supabase
        .from("products")
        .update({ bg_removal_status: "processing" })
        .eq("id", productId)
    }

    // Step 1: Fetch the original image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch original image")
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    // Step 2: Send to Remove.bg API with retry
    const transparentBuffer = await callWithRetry(imageBuffer, apiKey)

    // Step 3: Upload transparent PNG to Supabase Storage
    const fileName = `transparent-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const filePath = `products-transparent/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, transparentBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath)

    const transparentUrl = urlData.publicUrl

    // Step 4: Update product in database
    if (productId) {
      await supabase
        .from("products")
        .update({
          transparent_image: transparentUrl,
          bg_removal_status: "completed",
          try_on_image_url: transparentUrl,
          try_on_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
    }

    return NextResponse.json({
      success: true,
      transparentUrl,
      message: "Background removed successfully",
    })
  } catch (error: any) {
    console.error("Remove.bg API error:", error)

    // Update status to failed
    try {
      const body = await request.clone().json().catch(() => ({}))
      if (body.productId) {
        const supabase = createAdminClient()
        await supabase
          .from("products")
          .update({ bg_removal_status: "failed" })
          .eq("id", body.productId)
      }
    } catch {}

    return NextResponse.json(
      { success: false, error: error.message || "Background removal failed" },
      { status: 500 }
    )
  }
}
