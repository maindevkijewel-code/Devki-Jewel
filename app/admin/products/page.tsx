"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react"
import { getProducts, deleteProduct, toggleProductActive } from "../actions/products"
import ProductForm from "./product-form"
import { toast } from "sonner"
import type { AdminProduct } from "@/lib/types/admin"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    const data = await getProducts()
    setProducts(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel("admin-products").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => { loadProducts() }
    ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadProducts])

  const handleDelete = async (id: string) => {
    const res = await deleteProduct(id)
    if (res.success) { toast.success("Product deleted"); setDeletingId(null); loadProducts() }
    else toast.error(res.error || "Delete failed")
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    const res = await toggleProductActive(id, active)
    if (res.success) { toast.success(active ? "Activated" : "Deactivated"); loadProducts() }
    else toast.error(res.error || "Toggle failed")
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (showForm || editingProduct) {
    return (
      <ProductForm
        product={editingProduct}
        onSuccess={() => { setShowForm(false); setEditingProduct(null); loadProducts() }}
        onCancel={() => { setShowForm(false); setEditingProduct(null) }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} total products</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A]">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Image</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Metal</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Active</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />No products found
                </td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 px-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative">
                        {(p.image_urls?.[0] || p.image) ? (
                          <Image src={p.image_urls?.[0] || p.image || ""} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-5 h-5" /></div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px] truncate">{p.name}</td>
                    <td className="py-3 px-4 capitalize text-gray-600">{p.category}</td>
                    <td className="py-3 px-4 font-medium">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{p.metal_type || p.material || "–"}</td>
                    <td className="py-3 px-4">{p.stock_quantity ?? "–"}</td>
                    <td className="py-3 px-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={p.is_active !== false} onChange={e => handleToggleActive(p.id, e.target.checked)} />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#522D6D]" />
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingProduct(p)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingId(p.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Delete Product?</h3>
              <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeletingId(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={() => handleDelete(deletingId)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
