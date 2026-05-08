"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { X, Upload, Loader2, ImagePlus } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { createCategory, updateCategory, uploadCategoryImage } from "../actions/categories"
import type { AdminCategory } from "../actions/categories"

interface CategoryFormProps {
  category?: AdminCategory | null
  categories: AdminCategory[]
  onSuccess: () => void
  onCancel: () => void
}

export default function CategoryForm({ category, categories, onSuccess, onCancel }: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(category?.image_url || "")
  const [isActive, setIsActive] = useState(category?.is_active !== false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await uploadCategoryImage(fd)
    setIsUploading(false)
    if (res.success && res.url) {
      setImageUrl(res.url)
      toast.success("Image uploaded")
    } else {
      toast.error(`Upload failed: ${res.error}`)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("is_active", isActive ? "true" : "false")
    if (imageUrl) fd.set("image_url", imageUrl)

    const res = category ? await updateCategory(category.id, fd) : await createCategory(fd)
    setIsLoading(false)

    if (res.success) {
      toast.success(category ? "Category updated!" : "Category created!")
      onSuccess()
    } else {
      toast.error(res.error || "Something went wrong")
    }
  }

  const ic = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"
  const lc = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">{category ? "Edit Category" : "Add New Category"}</h2>
        <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={lc}>Category Name *</label>
          <input name="name" required defaultValue={category?.name} placeholder="e.g., Rings" className={ic} />
        </div>
        
        <div>
          <label className={lc}>Parent Category</label>
          <select name="parent_id" defaultValue={category?.parent_id || ""} className={ic}>
            <option value="">None (Main Category)</option>
            {categories.filter(c => c.id !== category?.id).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Select a parent category to make this a subcategory.</p>
        </div>

        <div>
          <label className={lc}>Description</label>
          <textarea name="description" rows={3} defaultValue={category?.description || ""} className={ic + " resize-none"} />
        </div>

        <div>
          <label className={lc}>Category Banner/Icon</label>
          <div className="flex items-center gap-4 mt-2">
            {imageUrl ? (
              <div className="relative w-24 h-24 rounded-xl border overflow-hidden group bg-gray-50">
                <Image src={imageUrl} alt="Banner" fill className="object-cover" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#522D6D] hover:border-[#522D6D]">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImagePlus className="w-6 h-6 mb-1" /><span className="text-[10px]">Upload</span></>}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#522D6D]" />
          </label>
          <span className="text-sm font-medium text-gray-700">{isActive ? "Active" : "Inactive"}</span>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50 flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}{category ? "Update" : "Create"} Category
          </button>
        </div>
      </form>
    </motion.div>
  )
}
