"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Ticket,
  Settings,
  LogOut,
  Gem,
  Loader2,
  ChevronLeft,
  Menu,
  Sparkles,
  Layers,
  GalleryVerticalEnd,
  TrendingUp,
  LayoutTemplate,
  Megaphone,
  Smartphone,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"

interface AdminProfile {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Collections", href: "/admin/collections", icon: GalleryVerticalEnd },
  { label: "Hero Banners", href: "/admin/hero-banners", icon: LayoutTemplate },
  { label: "Mobile Banners", href: "/admin/mobile-hero-banners", icon: Smartphone },
  { label: "Promo Sections", href: "/admin/promo-sections", icon: Megaphone },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Try-On Config", href: "/admin/tryon-config", icon: Sparkles },
  { label: "Live Rates", href: "/admin/live-rates", icon: TrendingUp },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const { isInitialized, session, profile } = useAuthStore()

  // Skip auth check for login pages
  const isLoginPage = pathname.startsWith("/admin/login")

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false)
      return
    }

    if (!isInitialized) {
      return // wait for global auth to finish loading
    }

    console.log("[AdminLayout] Initialized, checking session:", !!session)

    if (!session) {
      console.log("[AdminLayout] No session, redirecting to login")
      router.push("/admin/login")
      return
    }

    // Profile from store has 'role' fetched because AuthProvider does select("*")
    const userRole = (profile as any)?.role

    console.log("[AdminLayout] Profile role:", userRole)

    if (!profile || (userRole !== "staff" && userRole !== "super_admin")) {
      console.warn("[AdminLayout] Unauthorized access, signing out")
      const supabase = getSupabaseBrowserClient()
      supabase.auth.signOut().then(() => {
        router.push("/admin/login")
      })
      // Even if unauthorized, we stop loading to allow the redirect to happen
      // or to show an error message if the redirect fails.
      setIsLoading(false) 
      return
    }

    setAdmin(profile as any)
    setIsLoading(false)
  }, [isLoginPage, router, pathname, isInitialized, session, profile])

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    toast.success("Signed out successfully")
    router.push("/admin/login")
  }

  // Login pages render without sidebar
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#FAFAFA]">{children}</div>
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#522D6D] mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading admin panel…</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto
          bg-white border-r border-gray-100 flex flex-col
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "w-[72px]" : "w-[260px]"}
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#522D6D] flex items-center justify-center shrink-0">
            <Gem className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <h1 className="font-semibold text-gray-900 text-sm whitespace-nowrap">Devki Jewels</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Panel</p>
            </motion.div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-[#522D6D] text-white shadow-md shadow-[#522D6D]/20"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                  ${isSidebarCollapsed ? "justify-center" : ""}
                `}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : ""}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} />
        </button>

        {/* User Profile + Sign Out */}
        <div className="border-t border-gray-100 p-3">
          {isSidebarCollapsed ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#522D6D]/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-[#522D6D]">
                  {admin?.full_name?.[0]?.toUpperCase() || admin?.email?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {admin?.full_name || "Admin"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{admin?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar (mobile) */}
        <div className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-[#522D6D]" />
            <span className="font-semibold text-sm text-gray-900">Admin</span>
          </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
