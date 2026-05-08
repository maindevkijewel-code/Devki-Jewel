"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// ── Shared hook to fetch public site settings on the client ─────────────────
// Caches in-memory so multiple components don't re-fetch on the same page.

let cachedSettings: Record<string, string> | null = null
let fetchPromise: Promise<Record<string, string>> | null = null

async function fetchSettings(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("settings").select("key, value")

  if (error || !data) {
    console.error("useSiteSettings fetch error:", error)
    return {}
  }

  const settings: Record<string, string> = {}
  for (const row of data) {
    settings[row.key] = row.value || ""
  }
  cachedSettings = settings
  fetchPromise = null
  return settings
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>(cachedSettings || {})
  const [isLoading, setIsLoading] = useState(!cachedSettings)

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings)
      setIsLoading(false)
      return
    }

    if (!fetchPromise) {
      fetchPromise = fetchSettings()
    }

    fetchPromise.then((data) => {
      setSettings(data)
      setIsLoading(false)
    })
  }, [])

  return { settings, isLoading }
}

// ── Invalidate cache (call after admin saves settings) ──────────────────────
export function invalidateSiteSettings() {
  cachedSettings = null
  fetchPromise = null
}
