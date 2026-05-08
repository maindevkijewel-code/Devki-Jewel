"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Save, Loader2, Upload, Sparkles } from "lucide-react"
import { getTryOnSettings, updateTryOnSettings, uploadTryOnImage } from "../actions/tryon"
import { toast } from "sonner"

export default function TryOnConfigPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const data = await getTryOnSettings()
      setSettings(data)
      setIsLoading(false)
    }
    load()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadTryOnImage(fd)
    setIsUploading(false)
    if (res.success && res.url) {
      handleChange("tryon_camera_guide_url", res.url)
      toast.success("Guide overlay uploaded")
    } else {
      toast.error(res.error || "Upload failed")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateTryOnSettings(settings)
    setIsSaving(false)
    if (res.success) toast.success("Try-On settings saved!")
    else toast.error(res.error || "Save failed")
  }

  const ic =
    "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D] transition-colors"
  const lc = "block text-sm font-medium text-gray-700 mb-1.5"

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#B76E79]/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#B76E79]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Try-On Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure virtual try-on placement algorithm and global settings
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6"
      >
        {/* Global Enable */}
        <div>
          <label className={lc}>Global Enable</label>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.tryon_global_enabled !== "false"}
                onChange={(e) =>
                  handleChange("tryon_global_enabled", e.target.checked ? "true" : "false")
                }
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#522D6D]" />
            </label>
            <span className="text-sm text-gray-600">
              {settings.tryon_global_enabled !== "false" ? "Enabled sitewide" : "Disabled sitewide"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            When disabled, the Try It On button won&apos;t appear on any product page.
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Offset Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lc}>Choker Y-Offset</label>
            <input
              type="number"
              step="0.01"
              value={settings.tryon_choker_y_offset || "-0.15"}
              onChange={(e) => handleChange("tryon_choker_y_offset", e.target.value)}
              className={ic}
            />
            <p className="text-xs text-gray-400 mt-1">
              Moves choker up (negative) or down (positive) relative to neck anchor
            </p>
          </div>
          <div>
            <label className={lc}>Necklace Y-Offset</label>
            <input
              type="number"
              step="0.01"
              value={settings.tryon_necklace_y_offset || "-0.25"}
              onChange={(e) => handleChange("tryon_necklace_y_offset", e.target.value)}
              className={ic}
            />
            <p className="text-xs text-gray-400 mt-1">
              Moves necklace up (negative) or down (positive)
            </p>
          </div>
        </div>

        <div>
          <label className={lc}>Earring Scaling</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="3"
            value={settings.tryon_earring_scaling || "1.0"}
            onChange={(e) => handleChange("tryon_earring_scaling", e.target.value)}
            className={ic + " max-w-xs"}
          />
          <p className="text-xs text-gray-400 mt-1">
            Scale multiplier for earring size (1.0 = default)
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Camera Guide Overlay */}
        <div>
          <label className={lc}>Camera Guide Overlay</label>
          <p className="text-xs text-gray-400 mb-3">
            A silhouette image shown in the camera view to help users align their face/neck.
          </p>
          <div className="flex items-center gap-4">
            {settings.tryon_camera_guide_url ? (
              <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden relative bg-gray-50">
                <Image
                  src={settings.tryon_camera_guide_url}
                  alt="Guide"
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {settings.tryon_camera_guide_url ? "Change" : "Upload"} Guide
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleGuideUpload}
            className="hidden"
          />
        </div>

        {/* Save */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  )
}
