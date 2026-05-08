"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Loader2,
  Upload, GripVertical, ArrowUpDown, Image as ImageIcon, ExternalLink,
  ToggleLeft, ToggleRight, Calendar, Type, Link2, Badge
} from "lucide-react"
import { toast } from "sonner"
import {
  getAllBanners, createBanner, updateBanner, deleteBanner,
  toggleBannerActive, reorderBanners, uploadBannerImage,
  type HeroBanner,
} from "../actions/hero-banners"

// ─── Banner Form Modal ──────────────────────────────────────────────────────
function BannerForm({
  banner,
  onClose,
  onSaved,
}: {
  banner: HeroBanner | null
  onClose: () => void
  onSaved: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [desktopPreview, setDesktopPreview] = useState(banner?.desktop_image || "")
  const [mobilePreview, setMobilePreview] = useState(banner?.mobile_image || "")
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false)
  const [isUploadingMobile, setIsUploadingMobile] = useState(false)
  const [isActive, setIsActive] = useState(banner?.is_active ?? true)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: "desktop" | "mobile"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (folder === "desktop") setIsUploadingDesktop(true)
    else setIsUploadingMobile(true)

    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadBannerImage(fd, folder)

    if (folder === "desktop") setIsUploadingDesktop(false)
    else setIsUploadingMobile(false)

    if (res.success && res.url) {
      if (folder === "desktop") setDesktopPreview(res.url)
      else setMobilePreview(res.url)
      toast.success(`${folder} image uploaded`)
    } else {
      toast.error(res.error || "Upload failed")
    }
    e.target.value = ""
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!desktopPreview) { toast.error("Desktop image is required"); return }
    setIsLoading(true)

    const fd = new FormData(e.currentTarget)
    fd.set("desktop_image", desktopPreview)
    if (mobilePreview) fd.set("mobile_image", mobilePreview)
    fd.set("is_active", isActive ? "true" : "false")

    const res = banner ? await updateBanner(banner.id, fd) : await createBanner(fd)
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
        className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {banner ? "Edit Banner" : "Add New Banner"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Desktop Image */}
            <div>
              <label className={lc}>Desktop Image * <span className="text-gray-400">(16:6 ratio)</span></label>
              <div
                onClick={() => desktopInputRef.current?.click()}
                className="relative aspect-[16/6] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-[#522D6D]/40 hover:bg-[#522D6D]/5 transition-colors overflow-hidden"
              >
                {desktopPreview ? (
                  <>
                    <Image src={desktopPreview} alt="Desktop preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : isUploadingDesktop ? (
                  <Loader2 className="w-6 h-6 text-[#522D6D] animate-spin" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Upload desktop image</p>
                  </div>
                )}
              </div>
              <input ref={desktopInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "desktop")} />
            </div>

            {/* Mobile Image */}
            <div>
              <label className={lc}>Mobile Image <span className="text-gray-400">(4:5 ratio)</span></label>
              <div
                onClick={() => mobileInputRef.current?.click()}
                className="relative aspect-[4/5] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-[#522D6D]/40 hover:bg-[#522D6D]/5 transition-colors overflow-hidden max-h-[160px]"
              >
                {mobilePreview ? (
                  <>
                    <Image src={mobilePreview} alt="Mobile preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : isUploadingMobile ? (
                  <Loader2 className="w-5 h-5 text-[#522D6D] animate-spin" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Upload mobile</p>
                  </div>
                )}
              </div>
              <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "mobile")} />
            </div>
          </div>

          {/* Text Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Banner Title</label>
              <input name="title" defaultValue={banner?.title || ""} placeholder="New Bridal Collection" className={ic} />
            </div>
            <div>
              <label className={lc}>Subtitle</label>
              <input name="subtitle" defaultValue={banner?.subtitle || ""} placeholder="Crafted with love" className={ic} />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Button Text</label>
              <input name="button_text" defaultValue={banner?.button_text || "Shop Now"} placeholder="Shop Now" className={ic} />
            </div>
            <div>
              <label className={lc}>Button Link</label>
              <input name="button_link" defaultValue={banner?.button_link || "/jewellery"} placeholder="/jewellery" className={ic} />
            </div>
          </div>

          {/* Badge + Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lc}>Badge Text <span className="text-gray-400">(optional)</span></label>
              <input name="badge_text" defaultValue={banner?.badge_text || ""} placeholder="New Arrival" className={ic} />
            </div>
            <div>
              <label className={lc}>Display Order</label>
              <input name="display_order" type="number" defaultValue={banner?.display_order ?? 0} className={ic} />
            </div>
            <div>
              <label className={lc}>Text Color</label>
              <select name="text_color" defaultValue={banner?.text_color || "dark"} className={ic}>
                <option value="dark">Dark (on light bg)</option>
                <option value="light">Light (on dark bg)</option>
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lc}><Calendar className="w-3 h-3 inline mr-1" />Start Date <span className="text-gray-400">(optional)</span></label>
              <input name="start_date" type="date" defaultValue={banner?.start_date || ""} className={ic} />
            </div>
            <div>
              <label className={lc}><Calendar className="w-3 h-3 inline mr-1" />End Date <span className="text-gray-400">(optional)</span></label>
              <input name="end_date" type="date" defaultValue={banner?.end_date || ""} className={ic} />
            </div>
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
            <span className="text-sm font-medium text-gray-700">{isActive ? "Active — visible on homepage" : "Inactive — hidden"}</span>
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
export default function HeroBannersAdminPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const loadBanners = useCallback(async () => {
    const data = await getAllBanners()
    setBanners(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { loadBanners() }, [loadBanners])

  const handleToggleActive = async (id: string, current: boolean) => {
    const res = await toggleBannerActive(id, !current)
    if (res.success) { toast.success(!current ? "Banner activated" : "Banner deactivated"); loadBanners() }
    else toast.error(res.error || "Failed")
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const res = await deleteBanner(id)
    setDeletingId(null)
    if (res.success) { toast.success("Banner deleted"); loadBanners() }
    else toast.error(res.error || "Failed")
  }

  const handleReorderSave = async () => {
    setReordering(true)
    const res = await reorderBanners(banners.map(b => b.id))
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
          <h1 className="text-2xl font-semibold text-gray-900">Hero Banners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage hero carousel · {banners.filter(b => b.is_active).length} active
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

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-500">No banners yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Add your first hero banner to get started</p>
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
                  <div className="relative w-32 sm:w-48 bg-gray-100 shrink-0 aspect-[16/7]">
                    <Image
                      src={banner.desktop_image}
                      alt={banner.title || "Banner"}
                      fill
                      className="object-cover"
                    />
                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {banner.display_order + 1}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {banner.title || <span className="text-gray-400 italic">No title</span>}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{banner.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {banner.button_link && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Link2 className="w-3 h-3" />
                              {banner.button_link}
                            </span>
                          )}
                          {banner.badge_text && (
                            <span className="text-[11px] bg-[#522D6D]/10 text-[#522D6D] px-2 py-0.5 rounded">
                              {banner.badge_text}
                            </span>
                          )}
                          {(banner.start_date || banner.end_date) && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Calendar className="w-3 h-3" />
                              {banner.start_date || "∞"} → {banner.end_date || "∞"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Active toggle */}
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

                        {/* Edit */}
                        <button
                          onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                          className="p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
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
        Drag banners to reorder them, then click "Save Order" to publish the new sequence.
      </p>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <BannerForm
            banner={editingBanner}
            onClose={() => { setShowForm(false); setEditingBanner(null) }}
            onSaved={() => { setShowForm(false); setEditingBanner(null); loadBanners() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
