"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit2, Trash2, Tag, Loader2, Save, X, Search, CalendarClock } from "lucide-react"
import { toast } from "sonner"
import {
  getAllCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive, type Coupon
} from "../actions/coupons"

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null, onClose: () => void, onSaved: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState<"percentage"|"fixed">(coupon?.discount_type || "percentage")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("is_active", "true") // newly created always active, edits preserve? actually let's default active
    
    const res = coupon ? await updateCoupon(coupon.id, fd) : await createCoupon(fd)
    setIsLoading(false)
    if (res.success) {
      toast.success(coupon ? "Coupon updated" : "Coupon created")
      onSaved()
    } else {
      toast.error(res.error || "Failed")
    }
  }

  const ic = "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D]"
  const lc = "block text-xs font-medium text-gray-600 mb-1.5"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-[#522D6D]">
            <Tag className="w-5 h-5" />
            <h2 className="text-lg font-semibold">{coupon ? "Edit Coupon" : "Create New Coupon"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className={lc}>Coupon Code *</label>
            <input name="code" required defaultValue={coupon?.code} placeholder="e.g. SUMMER20" className={`${ic} uppercase font-semibold text-gray-900 tracking-wider`} />
            <p className="text-[10px] text-gray-400 mt-1">Customers will enter this code at checkout.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Discount Type</label>
              <select name="discount_type" value={type} onChange={(e) => setType(e.target.value as any)} className={ic}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={lc}>Discount Value *</label>
              <input name="discount_value" type="number" required min="1" step="0.01" defaultValue={coupon?.discount_value} placeholder={type === 'percentage' ? "e.g. 10" : "e.g. 500"} className={ic} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Min Order Amount (₹)</label>
              <input name="min_order_amount" type="number" min="0" defaultValue={coupon?.min_order_amount || ""} placeholder="No minimum" className={ic} />
            </div>
            <div>
              <label className={lc}>Max Discount Cap (₹)</label>
              <input name="max_discount_limit" type="number" min="0" defaultValue={coupon?.max_discount_limit || ""} placeholder="No cap" disabled={type === "fixed"} className={`${ic} disabled:opacity-50 disabled:bg-gray-50`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Expiry Date</label>
              <input name="expiry_date" type="datetime-local" defaultValue={coupon?.expiry_date ? new Date(new Date(coupon.expiry_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""} className={ic} />
            </div>
            <div>
              <label className={lc}>Usage Limit</label>
              <input name="usage_limit" type="number" min="1" defaultValue={coupon?.usage_limit || ""} placeholder="Unlimited" className={ic} />
            </div>
          </div>

          <div>
            <label className={lc}>Description (Internal / Customer facing)</label>
            <input name="description" defaultValue={coupon?.description || ""} placeholder="e.g. Flat 10% off on all items for summer" className={ic} />
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-[#522D6D] text-white rounded-xl font-medium text-sm hover:bg-[#6B3D8A] disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-[#522D6D]/20 transition-all active:scale-[0.98]">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{coupon ? "Save Changes" : "Create Coupon"}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    const data = await getAllCoupons()
    setCoupons(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id: string, current: boolean) => {
    const res = await toggleCouponActive(id, !current)
    if (res.success) {
      toast.success(!current ? "Coupon Activated" : "Coupon Deactivated")
      load()
    } else toast.error(res.error)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) return
    setDeletingId(id)
    const res = await deleteCoupon(id)
    setDeletingId(null)
    if (res.success) {
      toast.success("Coupon deleted")
      load()
    } else toast.error(res.error)
  }

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional codes and special offers.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-[#522D6D] text-white rounded-xl text-sm font-medium hover:bg-[#6B3D8A] shadow-lg shadow-[#522D6D]/20 transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#522D6D]/20 focus:border-[#522D6D] transition-all" />
        </div>
        <div className="text-sm text-gray-500 font-medium px-4 border-l border-gray-200 hidden sm:block">
          {filtered.length} total
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#522D6D]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No coupons found</h3>
          <p className="text-gray-500 text-sm">Create your first discount code to start saving.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(coupon => {
            const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date()
            const isExhausted = coupon.usage_limit && coupon.used_count >= coupon.usage_limit
            const statusColor = !coupon.is_active ? "bg-gray-100 text-gray-500" : isExpired || isExhausted ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            const statusText = !coupon.is_active ? "Inactive" : isExpired ? "Expired" : isExhausted ? "Limit Reached" : "Active"

            return (
              <motion.div layout key={coupon.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                {/* Status Badge */}
                <div className={`absolute top-5 right-5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                  {statusText}
                </div>

                {/* Code & Type */}
                <div className="flex items-start gap-3 mb-4 pr-20">
                  <div className="w-10 h-10 rounded-xl bg-[#522D6D]/5 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5 text-[#522D6D]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-wide font-mono">{coupon.code}</h3>
                    <p className="text-xs font-medium text-[#522D6D]">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value.toLocaleString("en-IN")} OFF`}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-gray-500 mb-5 p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                  <div>
                    <span className="block text-gray-400 mb-0.5">Min Order</span>
                    <span className="font-medium text-gray-700">{coupon.min_order_amount ? `₹${coupon.min_order_amount.toLocaleString("en-IN")}` : "None"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-0.5">Max Cap</span>
                    <span className="font-medium text-gray-700">{coupon.max_discount_limit ? `₹${coupon.max_discount_limit.toLocaleString("en-IN")}` : "None"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-0.5">Usage Limit</span>
                    <span className="font-medium text-gray-700">{coupon.used_count} / {coupon.usage_limit || "∞"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-0.5 flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Expiry</span>
                    <span className="font-medium text-gray-700">{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric'}) : "Never"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button onClick={() => handleToggle(coupon.id, coupon.is_active)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${coupon.is_active ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                    {coupon.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(coupon); setShowForm(true) }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(coupon.id)} disabled={deletingId === coupon.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && <CouponForm coupon={editing} onClose={() => { setShowForm(false); setEditing(null) }} onSaved={() => { setShowForm(false); setEditing(null); load() }} />}
      </AnimatePresence>
    </div>
  )
}
