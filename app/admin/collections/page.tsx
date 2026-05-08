"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit2, Trash2, Search, Loader2, Star, TrendingUp, Home, Eye, EyeOff, GalleryVerticalEnd, ExternalLink } from "lucide-react"
import { getCollections, deleteCollection, type AdminCollection } from "../actions/collections"
import CollectionForm from "./collection-form"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"

export default function CollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<AdminCollection | null>(null)

  const fetchCollections = async () => {
    setIsLoading(true)
    const data = await getCollections()
    setCollections(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This will also remove all product links to this collection.`)) return
    const res = await deleteCollection(id)
    if (res.success) {
      toast.success("Collection deleted")
      fetchCollections()
    } else {
      toast.error(res.error || "Failed to delete")
    }
  }

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: collections.length,
    active: collections.filter(c => c.is_active).length,
    featured: collections.filter(c => c.is_featured).length,
    homepage: collections.filter(c => c.show_on_homepage).length,
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your luxury jewellery collections.</p>
        </div>
        <button
          onClick={() => { setEditingCollection(null); setIsFormOpen(true) }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Collection
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, icon: GalleryVerticalEnd, color: "text-gray-900" },
          { label: "Active", value: stats.active, icon: Eye, color: "text-green-600" },
          { label: "Featured", value: stats.featured, icon: Star, color: "text-amber-500" },
          { label: "On Homepage", value: stats.homepage, icon: Home, color: "text-[#522D6D]" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
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
            <CollectionForm
              collection={editingCollection}
              onSuccess={() => {
                setIsFormOpen(false)
                fetchCollections()
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
                placeholder="Search collections..."
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
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <GalleryVerticalEnd className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900">No collections found</h3>
                <p className="text-sm text-gray-500 mt-1">Get started by creating your first collection.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCollections.map((col) => (
                  <motion.div
                    key={col.id}
                    layout
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg bg-gray-100 relative overflow-hidden shrink-0">
                        {col.thumbnail_image ? (
                          <Image src={col.thumbnail_image} alt={col.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GalleryVerticalEnd className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{col.name}</h3>
                          {col.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          {col.is_trending && <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>/collections/{col.slug}</span>
                          {col.subtitle && <><span>•</span><span className="truncate">{col.subtitle}</span></>}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        {col.show_on_homepage && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-purple-50 text-[#522D6D]">Homepage</span>
                        )}
                        <span className={`px-2 py-1 rounded-md text-[10px] font-medium ${
                          col.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {col.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-50 text-gray-500">
                          Order: {col.sort_order}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/collections/${col.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-[#522D6D] hover:bg-purple-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => { setEditingCollection(col); setIsFormOpen(true) }}
                          className="p-2 text-gray-400 hover:text-[#522D6D] hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(col.id, col.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
