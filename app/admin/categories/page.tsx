"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit2, Trash2, Search, Layers, Loader2 } from "lucide-react"
import { getCategories, deleteCategory, type AdminCategory } from "../actions/categories"
import CategoryForm from "./category-form"
import { toast } from "sonner"
import Image from "next/image"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)

  const fetchCategories = async () => {
    setIsLoading(true)
    const data = await getCategories()
    setCategories(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return
    const res = await deleteCategory(id)
    if (res.success) {
      toast.success("Category deleted")
      fetchCategories()
    } else {
      toast.error(res.error || "Failed to delete")
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const mainCategories = filteredCategories.filter(c => !c.parent_id)
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage main categories, subcategories, and collections.</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setIsFormOpen(true) }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <CategoryForm
              category={editingCategory}
              categories={categories}
              onSuccess={() => {
                setIsFormOpen(false)
                fetchCategories()
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"
              />
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#522D6D]" />
              </div>
            ) : mainCategories.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900">No categories found</h3>
                <p className="text-sm text-gray-500 mt-1">Get started by creating a new category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mainCategories.map((category) => (
                  <div key={category.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        {category.image_url ? (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 relative overflow-hidden shrink-0">
                            <Image src={category.image_url} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-xs text-gray-500">Slug: {category.slug} • {getSubcategories(category.id).length} subcategories</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-medium ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => { setEditingCategory(category); setIsFormOpen(true) }} className="p-2 text-gray-400 hover:text-[#522D6D] hover:bg-purple-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {getSubcategories(category.id).length > 0 && (
                      <div className="border-t border-gray-100 p-4 bg-white pl-20 space-y-3">
                        {getSubcategories(category.id).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                              <span className="text-[10px] text-gray-400">/{sub.slug}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingCategory(sub); setIsFormOpen(true) }} className="p-1 text-gray-400 hover:text-[#522D6D]">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(sub.id)} className="p-1 text-gray-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
