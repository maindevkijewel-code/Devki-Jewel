"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, Calendar, Edit3, Save, X, ShoppingBag, Heart, MapPin, Award } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useWishlistStore } from "@/store/wishlist-store"
import { toast } from "sonner"

export default function ProfileOverviewPage() {
  const { user, profile, setProfile } = useAuthStore()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [orderCount, setOrderCount] = useState(0)
  const [addressCount, setAddressCount] = useState(0)

  useEffect(() => {
    async function fetchCounts() {
      if (!user) return
      const supabase = getSupabaseBrowserClient()
      const { count: orders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      const { count: addresses } = await supabase.from('addresses').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      
      setOrderCount(orders || 0)
      setAddressCount(addresses || 0)
    }
    fetchCounts()
  }, [user])

  // Derive display values from either profile row or auth user metadata
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    ""
  const displayEmail = profile?.email || user?.email || ""
  const displayPhone = profile?.phone || user?.phone || ""

  const [formData, setFormData] = useState({
    full_name: displayName,
    email: displayEmail,
    phone: displayPhone,
  })

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const supabase = getSupabaseBrowserClient()

    // Try update first
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (updated) {
      setProfile(updated)
      toast.success("Profile updated successfully!")
      setIsEditing(false)
    } else if (updateError?.code === "PGRST116") {
      // Row doesn't exist, insert it
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          loyalty_points: 0,
        })
        .select()
        .single()

      if (inserted) {
        setProfile(inserted)
        toast.success("Profile created successfully!")
        setIsEditing(false)
      } else {
        toast.error(insertError?.message || "Failed to save profile")
      }
    } else {
      toast.error(updateError?.message || "Failed to update profile")
    }
    setSaving(false)
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Recently joined"

  const avatarInitial = (displayName || displayEmail || "U").charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Overview</h2>
            {!isEditing ? (
              <button
                onClick={() => {
                  setFormData({ full_name: displayName, email: displayEmail, phone: displayPhone })
                  setIsEditing(true)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#522D6D] border border-[#522D6D] rounded-lg hover:bg-[#522D6D] hover:text-white transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-[#522D6D] rounded-lg hover:bg-[#6B3D8A] disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-[#522D6D] to-[#7B4397] rounded-full flex items-center justify-center text-3xl font-semibold text-white shadow-lg">
                {avatarInitial}
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {memberSince}
              </div>
            </div>

            {/* Info Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{displayName || <span className="text-gray-400 italic">Not set</span>}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{displayEmail || <span className="text-gray-400 italic">Not set</span>}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{displayPhone || <span className="text-gray-400 italic">Not set</span>}</span>
                  </div>
                )}
              </div>

              {/* Loyalty Points */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Loyalty Points</label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Award className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="font-semibold text-[#522D6D]">{profile?.loyalty_points ?? 0}</span>
                  <span className="text-gray-500">points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ShoppingBag, label: "Total Orders", value: orderCount, bg: "bg-[#522D6D]/10", color: "text-[#522D6D]" },
          { icon: Heart, label: "Wishlist Items", value: wishlistCount, bg: "bg-pink-50", color: "text-pink-500" },
          { icon: MapPin, label: "Saved Addresses", value: addressCount, bg: "bg-blue-50", color: "text-blue-600" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
