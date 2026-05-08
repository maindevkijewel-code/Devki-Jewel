"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Loader2,
  Upload, GripVertical, ArrowUpDown, Image as ImageIcon,
  Smartphone, Link2,
} from "lucide-react"
import { toast } from "sonner"
import {
  getAllMobileBanners, createMobileBanner, updateMobileBanner, deleteMobileBanner,
  toggleMobileBannerActive, reorderMobileBanners, uploadMobileBannerImage,
  type MobileHeroBanner,
} from "../actions/mobile-banner-actions"

// ─── Banner Form Modal ──────────────────────────────────────────────────────
function MobileBannerForm({
  banner,
  onClose,
  onSaved,
}: {
  banner: MobileHeroBanner | null
  onClose: () => void
  onSaved: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(banner?.image_url || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isActive, setIsActive] = useState(banner?.is_active ?? true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)

    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadMobileBannerImage(fd)

    setIsUploading(false)
    if (res.success && res.url) {
      setImagePreview(res.url)
      toast.success("Image uploaded")
    } else {
      toast.error(res.error || "Upload failed")
    }
    e.target.value = ""
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!imagePreview) { toast.error("Image is required"); return }
    setIsLoading(true)

    const fd = new FormData(e.currentTarget)
    fd.set("image_url", imagePreview)
    fd.set("is_active", isActive ? "true" : "false")

    const res = banner ? await updateMobileBanner(banner.id, fd) : await createMobileBanner(fd)
    setIsLoading(false)
    if (res.success) { toast.success(banner ? "Banner updated!" : "Banner created!"); onSaved() }
    else toast.error(res.error || "Failed")
  }

  const ic = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"
  const lc = "block text-xs font-medium text-gray-600 mb-1.5"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg my-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#522D6D]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {banner ? "Edit Mobile Banner" : "Add Mobile Banner"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className={lc}>Banner Image * <span className="text-gray-400">(portrait 4:5 recommended)</span></label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-[4/5] max-h-[280px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-[#522D6D]/40 hover:bg-[#522D6D]/5 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <>
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : isUploading ? (
                <Loader2 className="w-6 h-6 text-[#522D6D] animate-spin" />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Upload mobile banner image</p>
                  <p className="text-[10px] text-gray-300 mt-1">4:5 ratio · Max 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Text Content */}
          <div>
            <label className={lc}>Title <span className="text-gray-400">(optional)</span></label>
            <input name="title" defaultValue={banner?.title || ""} placeholder="Summer Collection" className={ic} />
          </div>
          <div>
            <label className={lc}>Subtitle <span className="text-gray-400">(optional)</span></label>
            <input name="subtitle" defaultValue={banner?.subtitle || ""} placeholder="Up to 30% off" className={ic} />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>CTA Text</label>
              <input name="cta_text" defaultValue={banner?.cta_text || ""} placeholder="Shop Now" className={ic} />
            </div>
            <div>
              <label className={lc}>CTA Link</label>
              <input name="cta_link" defaultValue={banner?.cta_link || ""} placeholder="/jewellery" className={ic} />
            </div>
          </div>

          {/* Sort Order */}
          <div className="w-32">
            <label className={lc}>Sort Order</label>
            <input name="sort_order" type="number" defaultValue={banner?.sort_order ?? 0} className={ic} />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-[#522D6D]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {isActive ? "Active — visible on mobile homepage" : "Inactive — hidden"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-[#522D6D] text-white rounded-xl font-medium text-sm hover:bg-[#6B3D8A] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {banner ? "Save Changes" : "Create Banner"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
export default function MobileHeroBannersPage() {
  const [banners, setBanners] = useState<MobileHeroBanner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<MobileHeroBanner | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const loadBanners = useCallback(async () => {
    const data = await getAllMobileBanners()
    setBanners(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { loadBanners() }, [loadBanners])

  const handleToggleActive = async (id: string, current: boolean) => {
    const res = await toggleMobileBannerActive(id, !current)
    if (res.success) { toast.success(!current ? "Banner activated" : "Banner deactivated"); loadBanners() }
    else toast.error(res.error || "Failed")
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const res = await deleteMobileBanner(id)
    setDeletingId(null)
    if (res.success) { toast.success("Banner deleted"); loadBanners() }
    else toast.error(res.error || "Failed")
  }

  const handleReorderSave = async () => {
    setReordering(true)
    const res = await reorderMobileBanners(banners.map(b => b.id))
    setReordering(false)
    if (res.success) toast.success("Order saved!")
    else toast.error(res.error || "Failed")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#522D6D]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-[#522D6D]" />
            <h1 className="text-2xl font-semibold text-gray-900">Mobile Hero Banners</h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage promotional banners shown on the mobile home screen only (≤767px) · {banners.filter(b => b.is_active).length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          {banners.length > 1 && (
            <button
              onClick={handleReorderSave}
              disabled={reordering}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-60"
            >
              {reordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
              Save Order
            </button>
          )}
          <button
            onClick={() => { setEditingBanner(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] shadow-md shadow-[#522D6D]/20"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {/* Info callout */}
      <div className="bg-[#F8F4FF] border border-[#522D6D]/10 rounded-xl px-4 py-3 flex items-start gap-3">
        <Smartphone className="w-4 h-4 text-[#522D6D] mt-0.5 shrink-0" />
        <p className="text-xs text-gray-600 leading-relaxed">
          These banners are displayed <strong>only on mobile devices</strong> (screen width ≤767px). Desktop visitors will see the regular hero carousel managed from the "Hero Banners" page.
        </p>
      </div>

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-500">No mobile banners yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Add your first mobile hero banner to get started</p>
          <button
            onClick={() => { setEditingBanner(null); setShowForm(true) }}
            className="px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A]"
          >
            Add First Banner
          </button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={banners} onReorder={setBanners} className="space-y-3">
          {banners.map((banner) => (
            <Reorder.Item key={banner.id} value={banner}>
              <motion.div
                layout
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex items-stretch gap-0">
                  {/* Drag Handle */}
                  <div className="flex items-center px-3 text-gray-300 cursor-grab hover:text-gray-400 border-r border-gray-100">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Image Preview */}
                  <div className="relative w-20 sm:w-28 bg-gray-100 shrink-0">
                    <div className="aspect-[4/5] relative">
                      <Image
                        src={banner.image_url}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Order Badge */}
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                      {banner.sort_order + 1}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {banner.title || <span className="text-gray-400 italic">No title</span>}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{banner.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {banner.cta_link && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Link2 className="w-3 h-3" />
                              {banner.cta_link}
                            </span>
                          )}
                          {banner.cta_text && (
                            <span className="text-[11px] bg-[#522D6D]/10 text-[#522D6D] px-2 py-0.5 rounded">
                              {banner.cta_text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleActive(banner.id, banner.is_active)}
                          title={banner.is_active ? "Deactivate" : "Activate"}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            banner.is_active
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          {banner.is_active ? (
                            <><Eye className="w-3.5 h-3.5" /> Live</>
                          ) : (
                            <><EyeOff className="w-3.5 h-3.5" /> Off</>
                          )}
                        </button>

                        <button
                          onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                          className="p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm("Delete this banner?")) handleDelete(banner.id)
                          }}
                          disabled={deletingId === banner.id}
                          className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deletingId === banner.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Tip */}
      <p className="text-xs text-gray-400 text-center">
        Drag banners to reorder, then click "Save Order". Active banners appear as a carousel on mobile.
      </p>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <MobileBannerForm
            banner={editingBanner}
            onClose={() => { setShowForm(false); setEditingBanner(null) }}
            onSaved={() => { setShowForm(false); setEditingBanner(null); loadBanners() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
