"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { X, Loader2, ImagePlus, Video, Eye, EyeOff, Star, TrendingUp, Home } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { createCollection, updateCollection, uploadCollectionMedia } from "../actions/collections"
import type { AdminCollection } from "../actions/collections"

interface CollectionFormProps {
  collection?: AdminCollection | null
  onSuccess: () => void
  onCancel: () => void
}

export default function CollectionForm({ collection, onSuccess, onCancel }: CollectionFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Media state
  const [thumbnailImage, setThumbnailImage] = useState(collection?.thumbnail_image || "")
  const [mobileThumbnailImage, setMobileThumbnailImage] = useState(collection?.mobile_thumbnail_image || "")
  const [bannerImage, setBannerImage] = useState(collection?.banner_image || "")
  const [hoverImage, setHoverImage] = useState(collection?.hover_image || "")
  const [videoUrl, setVideoUrl] = useState(collection?.video_url || "")
  const [isUploadingThumb, setIsUploadingThumb] = useState(false)
  const [isUploadingMobileThumb, setIsUploadingMobileThumb] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isUploadingHover, setIsUploadingHover] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const thumbRef = useRef<HTMLInputElement>(null)
  const mobileThumbRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const hoverRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // Toggle state
  const [isActive, setIsActive] = useState(collection?.is_active !== false)
  const [isFeatured, setIsFeatured] = useState(collection?.is_featured || false)
  const [isTrending, setIsTrending] = useState(collection?.is_trending || false)
  const [showOnHomepage, setShowOnHomepage] = useState(collection?.show_on_homepage || false)

  // Slug generation
  const [slug, setSlug] = useState(collection?.slug || "")
  const [nameValue, setNameValue] = useState(collection?.name || "")

  const handleNameChange = (val: string) => {
    setNameValue(val)
    if (!collection) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    }
  }

  const handleUpload = async (
    file: File,
    folder: string,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadCollectionMedia(fd, folder)
    setUploading(false)
    if (res.success && res.url) {
      setUrl(res.url)
      toast.success("Uploaded successfully")
    } else {
      toast.error(`Upload failed: ${res.error}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const fd = new FormData(e.currentTarget)
    fd.set("slug", slug)
    if (thumbnailImage) fd.set("thumbnail_image", thumbnailImage)
    if (mobileThumbnailImage) fd.set("mobile_thumbnail_image", mobileThumbnailImage)
    if (bannerImage) fd.set("banner_image", bannerImage)
    if (hoverImage) fd.set("hover_image", hoverImage)
    if (videoUrl) fd.set("video_url", videoUrl)
    fd.set("is_active", isActive ? "true" : "false")
    fd.set("is_featured", isFeatured ? "true" : "false")
    fd.set("is_trending", isTrending ? "true" : "false")
    fd.set("show_on_homepage", showOnHomepage ? "true" : "false")

    const res = collection
      ? await updateCollection(collection.id, fd)
      : await createCollection(fd)

    setIsLoading(false)

    if (res.success) {
      toast.success(collection ? "Collection updated!" : "Collection created!")
      onSuccess()
    } else {
      toast.error(res.error || "Something went wrong")
    }
  }

  const ic = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D] transition-colors"
  const lc = "block text-sm font-medium text-gray-700 mb-1.5"

  const MediaUploadBox = ({
    label,
    url,
    onClear,
    onUpload,
    isUploading,
    inputRef,
    accept = "image/*",
    isVideo = false,
    aspectClass = "aspect-video"
  }: {
    label: string
    url: string
    onClear: () => void
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    isUploading: boolean
    inputRef: React.RefObject<HTMLInputElement | null>
    accept?: string
    isVideo?: boolean
    aspectClass?: string
  }) => (
    <div>
      <label className={lc}>{label}</label>
      <div className="mt-1">
        {url ? (
          <div className={`relative ${aspectClass} max-w-[200px] rounded-xl border overflow-hidden group bg-gray-50`}>
            {isVideo ? (
              <video src={url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <Image src={url} alt="" fill className="object-cover" />
            )}
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-full max-w-[200px] aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#522D6D] hover:border-[#522D6D] transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isVideo ? (
              <><Video className="w-6 h-6 mb-1" /><span className="text-xs">Upload Video</span></>
            ) : (
              <><ImagePlus className="w-6 h-6 mb-1" /><span className="text-xs">Upload Image</span></>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onUpload}
          className="hidden"
        />
      </div>
    </div>
  )

  const TogglePill = ({
    label,
    icon: Icon,
    checked,
    onChange,
    color = "[#522D6D]"
  }: {
    label: string
    icon: any
    checked: boolean
    onChange: (v: boolean) => void
    color?: string
  }) => (
    <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
      checked ? `bg-${color}/10 border-${color}` : "bg-white border-gray-200 hover:border-gray-300"
    }`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <Icon className={`w-4 h-4 ${checked ? `text-${color}` : "text-gray-400"}`} />
      <span className={`text-sm font-medium ${checked ? `text-${color}` : "text-gray-600"}`}>{label}</span>
      <div className={`ml-auto w-8 h-4.5 rounded-full transition-colors relative ${checked ? "bg-[#522D6D]" : "bg-gray-200"}`}>
        <div className={`absolute top-[2px] w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${checked ? "left-[calc(100%-18px)]" : "left-[2px]"}`} />
      </div>
    </label>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {collection ? "Edit Collection" : "Create New Collection"}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Collection Name *</label>
              <input
                name="name"
                required
                value={nameValue}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g., Bridal Collection"
                className={ic}
              />
            </div>
            <div>
              <label className={lc}>URL Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 shrink-0">/collections/</span>
                <input
                  name="slug"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className={ic}
                />
              </div>
            </div>
          </div>
          <div>
            <label className={lc}>Subtitle</label>
            <input name="subtitle" defaultValue={collection?.subtitle || ""} placeholder="e.g., For Your Special Day" className={ic} />
          </div>
          <div>
            <label className={lc}>Description</label>
            <textarea name="description" rows={3} defaultValue={collection?.description || ""} className={ic + " resize-none"} />
          </div>
          <div>
            <label className={lc}>Collection Story</label>
            <textarea name="story" rows={5} defaultValue={collection?.story || ""} placeholder="Tell the story behind this collection..." className={ic + " resize-none"} />
            <p className="text-xs text-gray-400 mt-1">Long-form content displayed on the collection detail page.</p>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Media</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MediaUploadBox
              label="Desktop Thumbnail"
              url={thumbnailImage}
              onClear={() => setThumbnailImage("")}
              onUpload={e => e.target.files?.[0] && handleUpload(e.target.files[0], "thumbnails", setThumbnailImage, setIsUploadingThumb)}
              isUploading={isUploadingThumb}
              inputRef={thumbRef}
              aspectClass="aspect-square"
            />
            <MediaUploadBox
              label="Mobile Thumbnail"
              url={mobileThumbnailImage}
              onClear={() => setMobileThumbnailImage("")}
              onUpload={e => e.target.files?.[0] && handleUpload(e.target.files[0], "thumbnails", setMobileThumbnailImage, setIsUploadingMobileThumb)}
              isUploading={isUploadingMobileThumb}
              inputRef={mobileThumbRef}
              aspectClass="aspect-square"
            />
            <MediaUploadBox
              label="Banner Image"
              url={bannerImage}
              onClear={() => setBannerImage("")}
              onUpload={e => e.target.files?.[0] && handleUpload(e.target.files[0], "banners", setBannerImage, setIsUploadingBanner)}
              isUploading={isUploadingBanner}
              inputRef={bannerRef}
            />
            <MediaUploadBox
              label="Hover Image"
              url={hoverImage}
              onClear={() => setHoverImage("")}
              onUpload={e => e.target.files?.[0] && handleUpload(e.target.files[0], "thumbnails", setHoverImage, setIsUploadingHover)}
              isUploading={isUploadingHover}
              inputRef={hoverRef}
            />
            <MediaUploadBox
              label="Preview Video"
              url={videoUrl}
              onClear={() => setVideoUrl("")}
              onUpload={e => e.target.files?.[0] && handleUpload(e.target.files[0], "videos", setVideoUrl, setIsUploadingVideo)}
              isUploading={isUploadingVideo}
              inputRef={videoRef}
              accept="video/mp4,video/webm"
              isVideo
            />
          </div>
        </div>

        {/* Visibility & Flags */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Visibility & Flags</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <TogglePill label="Active" icon={isActive ? Eye : EyeOff} checked={isActive} onChange={setIsActive} />
            <TogglePill label="Featured" icon={Star} checked={isFeatured} onChange={setIsFeatured} />
            <TogglePill label="Trending" icon={TrendingUp} checked={isTrending} onChange={setIsTrending} />
            <TogglePill label="Homepage" icon={Home} checked={showOnHomepage} onChange={setShowOnHomepage} />
          </div>
        </div>

        {/* SEO & Ordering */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">SEO & Ordering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lc}>SEO Title</label>
              <input name="seo_title" defaultValue={collection?.seo_title || ""} placeholder="Custom page title for search engines" className={ic} />
            </div>
            <div>
              <label className={lc}>Sort Order</label>
              <input name="sort_order" type="number" defaultValue={collection?.sort_order || 0} className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>SEO Description</label>
            <textarea name="seo_description" rows={2} defaultValue={collection?.seo_description || ""} placeholder="Meta description for search engines" className={ic + " resize-none"} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {collection ? "Update" : "Create"} Collection
          </button>
        </div>
      </form>
    </motion.div>
  )
}
