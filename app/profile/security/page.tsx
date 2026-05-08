"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Phone, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlist-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function SecurityPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Phone change state
  const [showPhoneChange, setShowPhoneChange] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input")
  const [phoneLoading, setPhoneLoading] = useState(false)

  const handleSendPhoneOtp = async () => {
    if (!newPhone || newPhone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    setPhoneLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({
      phone: `+91${newPhone}`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("OTP sent to new number!")
      setPhoneStep("otp")
    }
    setPhoneLoading(false)
  }

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length < 6) {
      toast.error("Please enter a valid OTP")
      return
    }
    setPhoneLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${newPhone}`,
      token: phoneOtp,
      type: "phone_change",
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Phone number updated!")
      setShowPhoneChange(false)
      setPhoneStep("input")
      setNewPhone("")
      setPhoneOtp("")
    }
    setPhoneLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }
    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()
    if (user) {
      await supabase.from("addresses").delete().eq("user_id", user.id)
      await supabase.from("notification_preferences").delete().eq("user_id", user.id)
      await supabase.from("reviews").delete().eq("user_id", user.id)
      await supabase.from("cart_items").delete().eq("user_id", user.id)
      await supabase.from("wishlists").delete().eq("user_id", user.id)
      await supabase.from("profiles").delete().eq("id", user.id)
    }
    await supabase.auth.signOut()
    useAuthStore.getState().reset()
    useCartStore.getState().clearCart()
    useWishlistStore.getState().clearWishlist()
    toast.success("Account deleted. We're sorry to see you go.")
    router.push("/")
  }

  const isGoogleConnected = user?.app_metadata?.providers?.includes("google") || user?.app_metadata?.provider === "google"

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>

      {/* Connected Accounts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Connected Accounts</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          {isGoogleConnected ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="text-xs text-gray-400">Not connected</span>
          )}
        </div>
      </div>

      {/* Change Phone */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Phone Number</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Current: {user?.phone || "Not set"}
            </p>
          </div>
          <button
            onClick={() => setShowPhoneChange(!showPhoneChange)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#522D6D] border border-[#522D6D] rounded-lg hover:bg-[#522D6D] hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" />
            {showPhoneChange ? "Cancel" : "Change"}
          </button>
        </div>

        {showPhoneChange && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
            {phoneStep === "input" ? (
              <>
                <label className="block text-xs font-medium text-gray-500">New Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-white text-sm text-gray-500">+91</span>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-r-lg focus:border-[#522D6D] focus:outline-none text-sm"
                    maxLength={10}
                  />
                </div>
                <button onClick={handleSendPhoneOtp} disabled={phoneLoading} className="px-4 py-2 bg-[#522D6D] text-white rounded-lg text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50">
                  {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <label className="block text-xs font-medium text-gray-500">Enter OTP sent to +91{newPhone}</label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#522D6D] focus:outline-none text-sm tracking-widest text-center"
                  maxLength={6}
                />
                <button onClick={handleVerifyPhoneOtp} disabled={phoneLoading} className="px-4 py-2 bg-[#522D6D] text-white rounded-lg text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50">
                  {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-700">Delete Account</h3>
            <p className="text-sm text-gray-500 mt-1">
              This will permanently delete your account, including all orders, addresses, and preferences. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Are you absolutely sure?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete your account and all associated data. Type <strong>DELETE</strong> to confirm.
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-red-500 focus:outline-none text-sm text-center mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText("") }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
