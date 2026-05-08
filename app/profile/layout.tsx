"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  User, ShoppingBag, Heart, MapPin, CreditCard, Bell, Star, Shield, LogOut, ChevronRight, Package
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlist-store"
import { toast } from "sonner"

const sidebarLinks = [
  { label: "Overview",      href: "/profile",               icon: User },
  { label: "My Orders",     href: "/profile/orders",        icon: Package },
  { label: "Wishlist",      href: "/profile/wishlist",      icon: Heart },
  { label: "Addresses",     href: "/profile/addresses",     icon: MapPin },
  { label: "Payments",      href: "/profile/payments",      icon: CreditCard },
  { label: "Notifications", href: "/profile/notifications", icon: Bell },
  { label: "Reviews",       href: "/profile/reviews",       icon: Star },
  { label: "Security",      href: "/profile/security",      icon: Shield },
]

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isInitialized } = useAuthStore()

  // Hard-timeout safety net — if Supabase never resolves in 5s, stop waiting
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [])

  // Redirect to login once we know there's no user
  useEffect(() => {
    if ((isInitialized || timedOut) && !user) {
      router.replace("/login")
    }
  }, [isInitialized, timedOut, user, router])

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      
      // Clear local state first for immediate UI response
      useAuthStore.getState().reset()
      await useCartStore.getState().clearCart()
      useWishlistStore.getState().clearWishlist()
      
      // Perform sign out
      await supabase.auth.signOut()
      
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback: force redirect and reload if something goes wrong
      window.location.href = "/"
    }
  }

  // Show spinner only while truly waiting (max 5 seconds)
  if (!isInitialized && !timedOut) {
    return (
      <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-[3px] border-[#522D6D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading your profile...</p>
          </div>
        </div>
      </main>
    )
  }

  // Not authenticated (after init/timeout) — show nothing while redirect happens
  if (!user) return null

  // ── Render profile UI ──────────────────────────────────────
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User"
  const displayEmail = user.email || user.phone || ""

  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <div className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-6 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
              {/* Profile Header */}
              <div className="p-6 bg-gradient-to-br from-[#522D6D] to-[#7B4397] text-white">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-semibold mb-3 uppercase">
                  {displayName.charAt(0)}
                </div>
                <p className="font-semibold text-sm truncate">{displayName}</p>
                <p className="text-white/70 text-xs mt-0.5 truncate">{displayEmail}</p>
              </div>

              {/* Nav Links */}
              <nav className="p-2">
                {sidebarLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/profile" && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#522D6D]/10 text-[#522D6D]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <link.icon className="w-4 h-4 shrink-0" />
                      {link.label}
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </Link>
                  )
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </nav>
            </div>
          </aside>

          {/* ── Mobile tab strip ── */}
          <div className="lg:hidden overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 min-w-max pb-4">
              {sidebarLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/profile" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-[#522D6D] text-white"
                        : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </Link>
                )
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap bg-white text-red-500 border border-red-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>

          {/* ── Page content ── */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
