"use server"

import { createAdminClient } from "@/lib/supabase-server"

/**
 * Automated Live Rate Updater
 *
 * Fetches spot prices for gold, silver, and platinum from free APIs,
 * converts them to INR, and upserts into the existing Supabase tables:
 *   - metal_rates       (current live prices)
 *   - metal_rate_history (daily history for charts)
 *
 * Data sources (free, no credit card, no API key required):
 *   1. Spot prices:  https://api.gold-api.com/price/{XAU|XAG|XPT}
 *   2. FX rate:      https://open.er-api.com/v6/latest/USD
 *
 * This function is idempotent — safe to call multiple times per day.
 */

// ─── Types ──────────────────────────────────────────────

interface MetalConfig {
  metalType: string
  /** gold-api.com symbol: XAU (gold), XAG (silver), XPT (platinum) */
  apiSymbol: string
  unit: string
  purity: string | null
  displayOrder: number
  iconEmoji: string | null
  /** Multiplier applied to the per-gram price to get the display unit price */
  unitMultiplier: number
  /** For 22K gold, apply this purity factor to 24K price */
  purityFactor?: number
}

// ─── Constants ──────────────────────────────────────────

const TROY_OUNCE_GRAMS = 31.1035

/** Fallback FX rate if API is temporarily down */
const FALLBACK_USD_INR = 85.0

const METAL_CONFIGS: MetalConfig[] = [
  {
    metalType: "Gold 22K",
    apiSymbol: "XAU",
    unit: "10g",
    purity: "22K",
    displayOrder: 1,
    iconEmoji: "🥇",
    unitMultiplier: 10,
    purityFactor: 0.916,
  },
  {
    metalType: "Gold 24K",
    apiSymbol: "XAU",
    unit: "10g",
    purity: "24K",
    displayOrder: 2,
    iconEmoji: "🏅",
    unitMultiplier: 10,
  },
  {
    metalType: "Silver",
    apiSymbol: "XAG",
    unit: "1kg",
    purity: null,
    displayOrder: 3,
    iconEmoji: "🥈",
    unitMultiplier: 1000,
  },
  {
    metalType: "Platinum",
    apiSymbol: "XPT",
    unit: "10g",
    purity: null,
    displayOrder: 4,
    iconEmoji: "💎",
    unitMultiplier: 10,
  },
]

// ─── Helpers ────────────────────────────────────────────

/**
 * Fetch spot price from gold-api.com (free, no key needed)
 * Returns USD per troy ounce.
 */
async function fetchSpotPriceUSD(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.gold-api.com/price/${symbol}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      console.error(`[gold-api] Fetch failed for ${symbol}: ${res.status} ${res.statusText}`)
      return null
    }

    const data = await res.json()
    // Response: { price: number, currency: "USD", symbol: "XAU", ... }
    const price = data?.price
    if (typeof price !== "number" || price <= 0) {
      console.error(`[gold-api] Invalid price for ${symbol}:`, data)
      return null
    }
    return price
  } catch (err) {
    console.error(`[gold-api] Error fetching ${symbol}:`, err)
    return null
  }
}

/**
 * Fetch USD → INR exchange rate from open.er-api.com (free, no key needed)
 */
async function fetchUsdToInr(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
    })

    if (!res.ok) {
      console.warn(`[FX] API failed (${res.status}), using fallback rate ₹${FALLBACK_USD_INR}`)
      return FALLBACK_USD_INR
    }

    const data = await res.json()
    const rate = data?.rates?.INR
    if (typeof rate !== "number" || rate <= 0) {
      console.warn("[FX] Invalid rate, using fallback:", data?.rates?.INR)
      return FALLBACK_USD_INR
    }
    return rate
  } catch (err) {
    console.warn("[FX] Error, using fallback rate:", err)
    return FALLBACK_USD_INR
  }
}

// ─── Main Action ────────────────────────────────────────

export async function updateLiveRates(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // 1. Fetch all spot prices + FX rate in parallel
    // De-duplicate API calls (Gold 22K and 24K share XAU)
    const uniqueSymbols = [...new Set(METAL_CONFIGS.map((c) => c.apiSymbol))]

    const [usdToInr, ...spotResults] = await Promise.all([
      fetchUsdToInr(),
      ...uniqueSymbols.map((sym) => fetchSpotPriceUSD(sym)),
    ])

    // Build symbol → USD price map
    const spotPriceMap: Record<string, number | null> = {}
    uniqueSymbols.forEach((sym, i) => {
      spotPriceMap[sym] = spotResults[i]
    })

    // Check that at least one commodity price was fetched
    const validPrices = Object.values(spotPriceMap).filter((p) => p !== null)
    if (validPrices.length === 0) {
      return { success: false, error: "Failed to fetch any commodity spot prices" }
    }

    console.log(`[update-live-rates] FX rate: 1 USD = ₹${usdToInr.toFixed(2)}`)
    console.log(
      `[update-live-rates] Spot prices (USD/oz):`,
      Object.entries(spotPriceMap)
        .map(([k, v]) => `${k}=$${v}`)
        .join(", ")
    )

    // 2. Get yesterday's prices from history for change calculation
    const today = new Date().toISOString().split("T")[0]

    const { data: yesterdayRates } = await supabase
      .from("metal_rate_history")
      .select("metal_type, price")
      .lt("date", today)
      .order("date", { ascending: false })
      .limit(8) // 4 metals × 2 safety margin

    const yesterdayPriceMap: Record<string, number> = {}
    if (yesterdayRates) {
      for (const row of yesterdayRates) {
        // Only take the first (most recent) entry per metal
        if (!yesterdayPriceMap[row.metal_type]) {
          yesterdayPriceMap[row.metal_type] = Number(row.price)
        }
      }
    }

    // 3. Calculate INR prices for each metal and upsert
    const errors: string[] = []

    for (const config of METAL_CONFIGS) {
      const spotUsd = spotPriceMap[config.apiSymbol]
      if (!spotUsd) {
        console.warn(`[update-live-rates] Skipping ${config.metalType} — no spot price for ${config.apiSymbol}`)
        errors.push(`No spot price for ${config.metalType}`)
        continue
      }

      // Convert: USD/troy oz → INR/gram → INR/display unit
      let pricePerGramInr = (spotUsd / TROY_OUNCE_GRAMS) * usdToInr

      // Apply purity factor (e.g. 22K = 91.6% of 24K)
      if (config.purityFactor) {
        pricePerGramInr *= config.purityFactor
      }

      const displayPrice = Math.round(pricePerGramInr * config.unitMultiplier)

      // Calculate change from yesterday
      const yesterdayPrice = yesterdayPriceMap[config.metalType]
      let priceChange = 0
      let percentageChange = 0

      if (yesterdayPrice && yesterdayPrice > 0) {
        priceChange = displayPrice - yesterdayPrice
        percentageChange = Number(((priceChange / yesterdayPrice) * 100).toFixed(2))
      }

      console.log(
        `[update-live-rates] ${config.metalType}: ₹${displayPrice.toLocaleString("en-IN")}/${config.unit} (${percentageChange >= 0 ? "+" : ""}${percentageChange}%)`
      )

      // 4. Upsert into metal_rates
      const { error: upsertError } = await supabase
        .from("metal_rates")
        .upsert(
          {
            metal_type: config.metalType,
            purity: config.purity,
            unit: config.unit,
            current_price: displayPrice,
            price_change: priceChange,
            percentage_change: percentageChange,
            icon_emoji: config.iconEmoji,
            display_order: config.displayOrder,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "metal_type" }
        )

      if (upsertError) {
        console.error(`[update-live-rates] Upsert error for ${config.metalType}:`, upsertError)
        errors.push(`Upsert failed for ${config.metalType}: ${upsertError.message}`)
        continue
      }

      // 5. Insert into daily history (idempotent via upsert on metal_type+date)
      const { error: historyError } = await supabase
        .from("metal_rate_history")
        .upsert(
          {
            metal_type: config.metalType,
            price: displayPrice,
            date: today,
          },
          { onConflict: "metal_type,date" }
        )

      if (historyError) {
        console.error(`[update-live-rates] History error for ${config.metalType}:`, historyError)
        errors.push(`History insert failed for ${config.metalType}: ${historyError.message}`)
      }
    }

    if (errors.length > 0 && errors.length >= METAL_CONFIGS.length) {
      return { success: false, error: `All updates failed: ${errors.join("; ")}` }
    }

    if (errors.length > 0) {
      console.warn(`[update-live-rates] Partial success — ${errors.length} errors: ${errors.join("; ")}`)
    }

    return { success: true }
  } catch (err: any) {
    console.error("[update-live-rates] Fatal error:", err)
    return { success: false, error: err.message || "Unexpected error in updateLiveRates" }
  }
}
