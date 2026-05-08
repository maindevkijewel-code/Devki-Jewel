"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { X, Upload, ImagePlus, Loader2, Sparkles, Video } from "lucide-react"
import { createProduct, updateProduct, uploadProductImage, uploadProductVideo } from "../actions/products"
import { uploadTryOnImage, updateProductTryOn } from "../actions/tryon"
import { saveTransparentImage } from "../actions/bg-removal"
import { getCategories } from "../actions/categories"
import type { AdminCategory } from "../actions/categories"
import { getCollections, getProductCollections, updateProductCollections } from "../actions/collections"
import type { AdminCollection } from "../actions/collections"
import { toast } from "sonner"
import type { AdminProduct } from "@/lib/types/admin"
import AIBackgroundRemover from "./ai-background-remover"


const METAL_TYPES = ["18K Yellow Gold", "18K White Gold", "Platinum", "Silver"]
const GEMSTONES = ["Diamond", "Solitaire", "Ruby", "Emerald", "Sapphire", "Pearl", "Polki", "Kundan", "None"]
const DISCOUNT_TYPES = [
  { label: "None", value: "none" },
  { label: "Percentage", value: "percentage" },
  { label: "Flat", value: "flat" },
]

const OCCASIONS = ["Daily Wear", "Wedding / Bridal", "Party", "Gift"]
const STYLES = ["Minimal", "Elegant", "Bold"]

interface ProductFormProps {
  product?: AdminProduct | null
  onSuccess: () => void
  onCancel: () => void
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(product?.image_urls || product?.images || [])
  const [discountType, setDiscountType] = useState(product?.discount_type || "none")
  const [isActive, setIsActive] = useState(product?.is_active !== false)
  const [hoverVideoUrl, setHoverVideoUrl] = useState<string>((product as any)?.hover_video_url || "")
  const [isVideoUploading, setIsVideoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Try-on state
  const [tryOnEnabled, setTryOnEnabled] = useState((product as any)?.try_on_enabled || false)
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string>((product as any)?.try_on_image_url || "")
  const [tryOnType, setTryOnType] = useState<string>((product as any)?.try_on_type || "2d")
  const [isTryOnUploading, setIsTryOnUploading] = useState(false)
  const tryOnFileRef = useRef<HTMLInputElement>(null)

  // AI Background Removal state
  const [transparentImageUrl, setTransparentImageUrl] = useState<string>((product as any)?.transparent_image || "")
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState(product?.category || "")
  const [selectedCategoryId, setSelectedCategoryId] = useState((product as any)?.category_id || "")
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState((product as any)?.subcategory_id || "")



  const mainCategories = categories.filter(c => !c.parent_id)
  const subCategories = selectedCategoryId ? categories.filter(c => c.parent_id === selectedCategoryId) : []

  // Collections linking
  const [allCollections, setAllCollections] = useState<AdminCollection[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])

  useEffect(() => {
    getCategories().then(setCategories)
    getCollections().then(cols => setAllCollections(cols.filter(c => c.is_active)))
    if (product) {
      getProductCollections(product.id).then(setSelectedCollectionIds)
    }
  }, [product])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setIsUploading(true)
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append("file", files[i])
      const res = await uploadProductImage(fd)
      if (res.success && res.url) setImageUrls((p) => [...p, res.url!])
      else toast.error(`Upload failed: ${res.error}`)
    }
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check type client side before uploading
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      toast.error('Only MP4 or WebM videos are allowed')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Video must be less than 20MB')
      return
    }

    setIsVideoUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadProductVideo(fd)
    if (res.success && res.url) {
      setHoverVideoUrl(res.url)
      toast.success("Hover video uploaded")
    } else {
      toast.error(`Upload failed: ${res.error}`)
    }
    setIsVideoUploading(false)
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  const handleTryOnUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsTryOnUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadTryOnImage(fd)
    setIsTryOnUploading(false)
    if (res.success && res.url) {
      setTryOnImageUrl(res.url)
      toast.success("Try-on image uploaded")
    } else toast.error(`Upload failed: ${res.error}`)
    if (tryOnFileRef.current) tryOnFileRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (imageUrls.length === 0) { toast.error("At least one image required"); return }
      setIsLoading(true)
      const fd = new FormData(e.currentTarget)
      fd.set("image_urls", JSON.stringify(imageUrls))
      fd.set("is_active", isActive ? "true" : "false")
      if (hoverVideoUrl) fd.set("hover_video_url", hoverVideoUrl)
      if (selectedCategoryId) fd.set("category_id", selectedCategoryId)
      if (selectedSubcategoryId) fd.set("subcategory_id", selectedSubcategoryId)
      const res = product ? await updateProduct(product.id, fd) : await createProduct(fd)

      // Save try-on config, transparent image, and collections
      if (res.success) {
        const productId = product?.id || (res as any).id
        if (productId) {
          // If we have a transparent image from AI removal, save it and auto-enable try-on
          if (transparentImageUrl) {
            await saveTransparentImage(productId, transparentImageUrl, true)
            // Use AI-generated transparent as the try-on image
            await updateProductTryOn(productId, true, transparentImageUrl, tryOnType)
          } else {
            await updateProductTryOn(productId, tryOnEnabled, tryOnImageUrl || null, tryOnType)
          }
          await updateProductCollections(productId, selectedCollectionIds)
        }
      }

      setIsLoading(false)
      if (res.success) { toast.success(product ? "Updated!" : "Created!"); onSuccess() }
      else toast.error(res.error || "Error")
    } catch (err: any) {
      console.error("Submit error:", err)
      setIsLoading(false)
      toast.error("An unexpected error occurred during submission.")
    }
  }

  const ic = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"
  const lc = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">{product ? "Edit Product" : "Add New Product"}</h2>
        <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lc}>Product Name *</label><input name="name" required defaultValue={product?.name} placeholder="Diamond Eternity Ring" className={ic} /></div>
          <div>
            <label className={lc}>Main Category *</label>
            <select name="category" required value={selectedCategory} onChange={(e) => {
              const val = e.target.value
              setSelectedCategory(val)
              const cat = categories.find(c => c.slug === val || c.name.toLowerCase() === val.toLowerCase())
              if (cat) {
                setSelectedCategoryId(cat.id)
                setSelectedSubcategoryId("") // reset subcategory
              }
            }} className={ic}>
              <option value="">Select Main Category</option>
              {mainCategories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subCategories.length > 0 && (
            <div>
              <label className={lc}>Subcategory</label>
              <select value={selectedSubcategoryId} onChange={(e) => setSelectedSubcategoryId(e.target.value)} className={ic}>
                <option value="">Select Subcategory (Optional)</option>
                {subCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div><label className={lc}>Price (₹) *</label><input name="price" type="number" required min={0} defaultValue={product?.price} className={ic} /></div>
          <div className={subCategories.length === 0 ? "col-span-1 md:col-span-2" : ""}><label className={lc}>Metal Type *</label><select name="metal_type" required defaultValue={product?.metal_type||product?.material} className={ic}><option value="">Select</option>{METAL_TYPES.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        <div><label className={lc}>Gemstone (optional)</label><select name="gemstone" defaultValue={product?.gemstone||""} className={ic}><option value="">Select or None</option>{GEMSTONES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={lc}>Weight</label><input name="weight" defaultValue={(product as any)?.weight||""} placeholder="e.g. 12.5g" className={ic} /><p className="text-xs text-gray-400 mt-1">Product weight with unit</p></div>
          <div><label className={lc}>Purity</label><input name="purity" defaultValue={(product as any)?.purity||""} placeholder="e.g. 18K, 22K, 925 Silver" className={ic} /></div>
          <div><label className={lc}>Metal Types</label><input name="metal_types" defaultValue={(product as any)?.metal_types?.join(", ")||""} placeholder="18K White Gold, 14K Rose Gold, Platinum" className={ic} /><p className="text-xs text-gray-400 mt-1">Comma-separated metal options</p></div>
        </div>
        <div><label className={lc}>Description</label><textarea name="description" rows={3} defaultValue={product?.description||""} className={ic+" resize-none"} /></div>
        <div><label className={lc}>Search Keywords</label><input name="search_keywords" defaultValue={product?.search_keywords||""} placeholder="e.g. daily wear, gift, anniversary, solitaire, thin" className={ic} /><p className="text-xs text-gray-400 mt-1">Comma-separated keywords for better search results</p></div>
        <div><label className={lc}>Occasion</label><select name="occasion" defaultValue={product?.occasion||""} className={ic}><option value="">Select or None</option>{OCCASIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
        <div><label className={lc}>Style</label><select name="style" defaultValue={product?.style||""} className={ic}><option value="">Select or None</option>{STYLES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className={lc}>Tags</label><input name="tags" defaultValue={product?.tags?.join(", ")||""} placeholder="e.g. statement, everyday, bridal" className={ic} /><p className="text-xs text-gray-400 mt-1">Comma-separated tags</p></div>
        <div><label className={lc}>Key Highlights</label><textarea name="key_highlights" rows={3} defaultValue={product?.key_highlights||""} placeholder="One per line" className={ic+" resize-none"} /><p className="text-xs text-gray-400 mt-1">One highlight per line</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lc}>Discount Type</label><select name="discount_type" value={discountType} onChange={e=>setDiscountType(e.target.value)} className={ic}>{DISCOUNT_TYPES.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
          {discountType!=="none"&&<div><label className={lc}>Discount Value {discountType==="percentage"?"(%)":"(₹)"}</label><input name="discount_value" type="number" min={0} defaultValue={product?.discount_value||""} className={ic} /></div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={lc}>Stock Quantity *</label><input name="stock_quantity" type="number" required min={0} defaultValue={product?.stock_quantity??0} className={ic} /></div>
          <div className="flex items-center gap-3 pt-7">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isActive} onChange={e=>setIsActive(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#522D6D]" />
            </label>
            <span className="text-sm font-medium text-gray-700">{isActive?"Active":"Inactive"}</span>
          </div>
        </div>
        <div>
          <label className={lc}>Product Images * (min 1)</label>
          <div className="flex flex-wrap gap-3 mt-2">
            {imageUrls.map((url,i)=>(
              <div key={i} className="relative w-24 h-24 rounded-xl border overflow-hidden group">
                <Image src={url} alt="" fill className="object-cover" />
                <button type="button" onClick={()=>setImageUrls(p=>p.filter((_,j)=>j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={isUploading} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#522D6D] hover:border-[#522D6D]">
              {isUploading?<Loader2 className="w-5 h-5 animate-spin" />:<><ImagePlus className="w-5 h-5 mb-1" /><span className="text-[10px]">Upload</span></>}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </div>

        {/* AI Background Removal Section */}
        {imageUrls.length > 0 && (
          <AIBackgroundRemover
            imageUrls={imageUrls}
            productId={product?.id}
            existingTransparentUrl={transparentImageUrl}
            onTransparentImageReady={(url) => {
              setTransparentImageUrl(url)
              // Auto-set try-on image and enable try-on
              setTryOnImageUrl(url)
              setTryOnEnabled(true)
            }}
            onTryOnAutoEnabled={() => {
              setTryOnEnabled(true)
            }}
          />
        )}

        {/* Hover Video Section */}
        <div>
          <label className={lc}>Hover Preview Video (MP4/WebM, max 20MB)</label>
          <div className="flex items-center gap-4 mt-2">
            {hoverVideoUrl ? (
              <div className="relative w-40 h-24 rounded-xl border overflow-hidden group bg-gray-50">
                <video src={hoverVideoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                <button type="button" onClick={() => setHoverVideoUrl("")} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => videoInputRef.current?.click()} disabled={isVideoUploading} className="w-40 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#522D6D] hover:border-[#522D6D]">
                {isVideoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Video className="w-6 h-6 mb-1" /><span className="text-xs">Upload Video</span></>}
              </button>
            )}
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
          </div>
        </div>

        {/* Virtual Try-On Section */}
        {["rings", "earrings", "necklaces"].includes(selectedCategory) && product && (
          <div className="border border-[#B76E79]/20 rounded-xl p-4 bg-[#B76E79]/5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#B76E79]" />
              <span className="text-sm font-semibold text-gray-800">Virtual Try-On</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={tryOnEnabled} onChange={(e) => setTryOnEnabled(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B76E79]" />
              </label>
              <span className="text-sm text-gray-700">{tryOnEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            {tryOnEnabled && (
              <>
                <div>
                  <label className={lc}>Try-On Image (transparent PNG)</label>
                  <div className="flex items-center gap-3">
                    {tryOnImageUrl ? (
                      <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden relative bg-gray-50 checkerboard">
                        <Image src={tryOnImageUrl} alt="Try-on" fill className="object-contain p-1" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                    )}
                    <button type="button" onClick={() => tryOnFileRef.current?.click()} disabled={isTryOnUploading} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                      {isTryOnUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {tryOnImageUrl ? "Change" : "Upload"}
                    </button>
                  </div>
                  <input ref={tryOnFileRef} type="file" accept="image/png" onChange={handleTryOnUpload} className="hidden" />
                </div>
                <div>
                  <label className={lc}>Try-On Type</label>
                  <div className="flex gap-3">
                    {["2d", "3d"].map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="try_on_type" value={t} checked={tryOnType === t} onChange={() => setTryOnType(t)} className="accent-[#B76E79]" />
                        <span className="text-sm text-gray-700">{t.toUpperCase()}{t === "3d" ? " (future)" : " (default)"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Collection Linking */}
        {allCollections.length > 0 && (
          <div className="border border-[#522D6D]/10 rounded-xl p-4 bg-[#522D6D]/5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-[#522D6D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-sm font-semibold text-gray-800">Collections</span>
              <span className="text-xs text-gray-500 ml-auto">{selectedCollectionIds.length} selected</span>
            </div>
            <p className="text-xs text-gray-500">Assign this product to one or more collections.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {allCollections.map(col => {
                const isSelected = selectedCollectionIds.includes(col.id)
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollectionIds(prev => 
                      isSelected ? prev.filter(id => id !== col.id) : [...prev, col.id]
                    )}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected 
                        ? 'bg-[#522D6D] text-white border-[#522D6D]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#522D6D] hover:text-[#522D6D]'
                    }`}
                  >
                    {col.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2">
            {isLoading&&<Loader2 className="w-4 h-4 animate-spin" />}{product?"Update":"Create"} Product
          </button>
        </div>
      </form>
    </motion.div>
  )
}
