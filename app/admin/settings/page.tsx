"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Save, Loader2, Upload, Eye, EyeOff } from "lucide-react"
import { getSettings, updateSettings, uploadSiteAsset } from "../actions/settings"
import { toast } from "sonner"

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const data = await getSettings()
      setSettings(data)
      setIsLoading(false)
    }
    load()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadSiteAsset(fd)
    setIsUploading(false)
    if (res.success && res.url) {
      handleChange("logo_url", res.url)
      toast.success("Logo uploaded")
    } else toast.error(res.error || "Upload failed")
  }

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateSettings(settings)
    setIsSaving(false)
    if (res.success) toast.success("Settings saved!")
    else toast.error(res.error || "Save failed")
  }

  const ic = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D] transition-colors"
  const lc = "block text-sm font-medium text-gray-700 mb-1.5"

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your store settings</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {/* Site Name */}
        <div>
          <label className={lc}>Website Name</label>
          <input value={settings.site_name || ""} onChange={e => handleChange("site_name", e.target.value)} placeholder="Devki Jewels" className={ic} />
        </div>

        {/* Logo */}
        <div>
          <label className={lc}>Logo</label>
          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden relative bg-gray-50">
                <Image src={settings.logo_url} alt="Logo" fill className="object-contain p-1" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {settings.logo_url ? "Change" : "Upload"} Logo
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        <hr className="border-gray-100" />

        {/* Contact Info */}
        <div>
          <label className={lc}>Contact Email</label>
          <input value={settings.contact_email || ""} onChange={e => handleChange("contact_email", e.target.value)} type="email" placeholder="support@devkijewels.com" className={ic} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lc}>Contact Phone</label>
            <input value={settings.contact_phone || ""} onChange={e => handleChange("contact_phone", e.target.value)} placeholder="+91 98765 43210" className={ic} />
          </div>
          <div>
            <label className={lc}>Address</label>
            <input value={settings.address || ""} onChange={e => handleChange("address", e.target.value)} placeholder="Mumbai, India" className={ic} />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Stripe Keys */}
        <div>
          <label className={lc}>Stripe Publishable Key</label>
          <input value={settings.stripe_publishable_key || ""} onChange={e => handleChange("stripe_publishable_key", e.target.value)} placeholder="pk_live_..." className={ic} />
        </div>

        <div>
          <label className={lc}>Stripe Secret Key</label>
          <div className="relative">
            <input type={showStripeSecret ? "text" : "password"} value={settings.stripe_secret_key || ""} onChange={e => handleChange("stripe_secret_key", e.target.value)} placeholder="sk_live_..." className={ic + " pr-12"} />
            <button type="button" onClick={() => setShowStripeSecret(!showStripeSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="pt-4 border-t border-gray-100">
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  )
}
