"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Plus, Edit3, Trash2, Check, Home, Briefcase, Building } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

interface Address {
  id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  pincode: string
  address_type: string
  is_default: boolean
}

const addressTypeIcons: Record<string, any> = { Home, Work: Briefcase, Other: Building }

const emptyForm: Omit<Address, "id"> = {
  full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", address_type: "Home", is_default: false,
}

export default function AddressesPage() {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAddresses() }, [user])

  async function fetchAddresses() {
    if (!user) {
      setIsLoading(false)
      return
    }
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
    if (data) setAddresses(data)
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!form.full_name || !form.phone || !form.address_line1 || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all required fields")
      return
    }
    if (!editingId && addresses.length >= 5) {
      toast.error("Maximum 5 addresses allowed")
      return
    }
    setSaving(true)
    const supabase = getSupabaseBrowserClient()

    // If setting as default, unset others first
    if (form.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id)
    }

    if (editingId) {
      const { error } = await supabase.from("addresses").update({ ...form }).eq("id", editingId)
      if (error) { toast.error("Failed to update address"); setSaving(false); return }
      toast.success("Address updated!")
    } else {
      const { error } = await supabase.from("addresses").insert({ ...form, user_id: user!.id })
      if (error) { toast.error("Failed to add address"); setSaving(false); return }
      toast.success("Address added!")
    }
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setSaving(false)
    fetchAddresses()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return
    const supabase = getSupabaseBrowserClient()
    await supabase.from("addresses").delete().eq("id", id)
    toast.success("Address deleted")
    fetchAddresses()
  }

  const handleEdit = (addr: Address) => {
    setForm({ full_name: addr.full_name, phone: addr.phone, address_line1: addr.address_line1, address_line2: addr.address_line2, city: addr.city, state: addr.state, pincode: addr.pincode, address_type: addr.address_type, is_default: addr.is_default })
    setEditingId(addr.id)
    setIsFormOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Addresses</h2>
        {addresses.length < 5 && (
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setIsFormOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#522D6D] rounded-lg hover:bg-[#6B3D8A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 overflow-hidden"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">{editingId ? "Edit Address" : "Add New Address"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 1 *</label>
                <input type="text" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 2</label>
                <input type="text" value={form.address_line2 || ""} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City *</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">State *</label>
                <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pincode *</label>
                <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm" maxLength={6} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address Type</label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((type) => (
                    <button key={type} onClick={() => setForm({ ...form, address_type: type })} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${form.address_type === type ? "bg-[#522D6D] text-white border-[#522D6D]" : "bg-white text-gray-600 border-gray-200 hover:border-[#522D6D]"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#522D6D] focus:ring-[#522D6D]" />
                <span className="text-sm text-gray-600">Set as default address</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#522D6D] text-white rounded-lg text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </button>
              <button onClick={() => { setIsFormOpen(false); setEditingId(null) }} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address Cards */}
      {addresses.length === 0 && !isFormOpen ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h3>
          <p className="text-gray-500 text-sm mb-6">Add an address for faster checkout</p>
          <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A]">
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const Icon = addressTypeIcons[addr.address_type] || MapPin
            return (
              <div key={addr.id} className={`bg-white rounded-2xl border p-5 relative ${addr.is_default ? "border-[#522D6D]" : "border-gray-100"}`}>
                {addr.is_default && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#522D6D] text-white text-[10px] font-medium rounded-full">
                    <Check className="w-3 h-3" />
                    Default
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[#522D6D]" />
                  <span className="text-xs font-medium text-[#522D6D]">{addr.address_type}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{addr.full_name}</p>
                <p className="text-sm text-gray-600 mt-1">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}</p>
                <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEdit(addr)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#522D6D] border border-[#522D6D] rounded-lg hover:bg-[#522D6D] hover:text-white transition-colors">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
