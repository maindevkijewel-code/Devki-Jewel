import { getSupabaseBrowserClient } from "@/lib/supabase"

export interface TryOnSettings {
  globalEnabled: boolean
  chokerYOffset: number
  necklaceYOffset: number
  earringScaling: number
  cameraGuideUrl: string
}

const DEFAULTS: TryOnSettings = {
  globalEnabled: true,
  chokerYOffset: -0.15,
  necklaceYOffset: -0.25,
  earringScaling: 1.0,
  cameraGuideUrl: "",
}

let cached: TryOnSettings | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export async function fetchTryOnSettings(): Promise<TryOnSettings> {
  const now = Date.now()
  if (cached && now - cacheTime < CACHE_TTL) {
    return cached
  }

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "tryon_global_enabled",
        "tryon_choker_y_offset",
        "tryon_necklace_y_offset",
        "tryon_earring_scaling",
        "tryon_camera_guide_url",
      ])

    if (error || !data) {
      return DEFAULTS
    }

    const map: Record<string, string> = {}
    for (const row of data) {
      map[row.key] = row.value || ""
    }

    const settings: TryOnSettings = {
      globalEnabled: map.tryon_global_enabled !== "false",
      chokerYOffset: parseFloat(map.tryon_choker_y_offset) || DEFAULTS.chokerYOffset,
      necklaceYOffset: parseFloat(map.tryon_necklace_y_offset) || DEFAULTS.necklaceYOffset,
      earringScaling: parseFloat(map.tryon_earring_scaling) || DEFAULTS.earringScaling,
      cameraGuideUrl: map.tryon_camera_guide_url || "",
    }

    cached = settings
    cacheTime = now
    return settings
  } catch {
    return DEFAULTS
  }
}
