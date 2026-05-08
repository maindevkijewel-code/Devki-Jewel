"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Grid3X3, ShoppingBag, TrendingUp, User } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useAuthStore } from "@/store/auth-store"

export function MobileBottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore((s) => s.items?.length || 0)
  const { user } = useAuthStore()

  // Hide on admin pages
  if (pathname?.startsWith("/admin")) return null

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/collections", label: "Category", icon: Grid3X3 },
    { href: "/cart", label: "Cart", icon: ShoppingBag, badge: cartCount },
    { href: "/live-gold-rate", label: "GOLD PRICE", icon: TrendingUp },
    { href: user ? "/profile" : "/login", label: "Account", icon: User },
  ]

  return (
    <nav className="hidden max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:flex max-md:z-50 bg-white border-t border-gray-200 h-[60px] items-center justify-around px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = 
          pathname === item.href || 
          (item.href !== "/" && pathname?.startsWith(item.href) && (item.label !== "Account" || !pathname?.startsWith("/profile/wishlist")))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors ${
              isActive ? "text-[#B76E79]" : "text-gray-500"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
