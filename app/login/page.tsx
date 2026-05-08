"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Phone, ArrowRight, Loader2, Shield } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = getSupabaseBrowserClient()

  // ─── Google OAuth ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    })
    if (error) {
      toast.error("Failed to sign in with Google")
      setIsLoading(false)
    }
  }

  // ─── Send OTP (via Supabase — plug in any SMS provider) ───
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }
    setIsLoading(true)
    const formattedPhone = `+91${phone}`

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    })

    if (error) {
      toast.error(error.message || "Failed to send OTP. Please try again.")
      setIsLoading(false)
      return
    }

    toast.success("OTP sent successfully!")
    setStep("otp")
    setIsLoading(false)
  }

  // ─── Verify OTP ────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }
    setIsLoading(true)
    const formattedPhone = `+91${phone}`

    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    })

    if (error) {
      toast.error(error.message || "Invalid OTP. Please try again.")
      setIsLoading(false)
      return
    }

    toast.success("Logged in successfully! 🎉")
    router.push("/profile")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F8F4FF] via-white to-[#FFF8F0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <img
            src="/logo.png"
            alt="Devki Jewels"
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Devki Jewels
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to access your account, wishlist & orders
            </p>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Step 1: Phone Input ── */}
          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:border-[#522D6D] focus:ring-1 focus:ring-[#522D6D] focus:outline-none text-sm"
                    maxLength={10}
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isLoading || phone.length < 10}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ── Step 2: OTP Input ── */
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                OTP sent to +91{phone}{" "}
                <button
                  onClick={() => { setStep("phone"); setOtp("") }}
                  className="text-[#522D6D] font-medium hover:underline"
                >
                  Change
                </button>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#522D6D] focus:ring-1 focus:ring-[#522D6D] focus:outline-none text-center tracking-[0.5em] text-lg font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Verify & Login
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full text-sm text-[#522D6D] font-medium hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-center gap-2 mt-6 p-3 bg-green-50 rounded-lg">
            <Shield className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700">
              Your data is secure with 256-bit encryption
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[#522D6D] hover:underline">
            Terms of Service
          </Link>
          {" & "}
          <Link href="/privacy-policy" className="text-[#522D6D] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
