"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, ShoppingBag, Heart, Menu, X, ChevronDown, MapPin, Bell } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { SERVICES } from "@/lib/config/services"
import { useSiteSettings } from "@/hooks/use-site-settings"

const initialNavCategories = [
  {
    name: "Jewellery",
    href: "/jewellery",
    items: [
      { label: "Gold", href: "/jewellery?type=gold" },
      { label: "Solitaire", href: "/jewellery?type=solitaire" },
      { label: "Silver", href: "/jewellery?type=silver" },
      { label: "Rose Gold", href: "/jewellery?type=rose-gold" },
    ]
  },
  {
    name: "Earrings",
    href: "/earrings",
    items: [
      { label: "Gold Earrings", href: "/earrings?type=gold" },
      { label: "Diamond Earrings", href: "/earrings?type=diamond" },
      { label: "Solitaire Earrings", href: "/earrings?type=solitaire" },
    ]
  },
  {
    name: "Rings",
    href: "/rings",
    items: [
      { label: "Diamond Rings", href: "/rings?type=diamond" },
      { label: "Gold Rings", href: "/rings?type=gold" },
      { label: "Solitaire Rings", href: "/rings?type=solitaire" },
    ]
  },
  {
    name: "Necklaces",
    href: "/necklace",
    items: [
      { label: "Gold Necklace", href: "/necklace?type=gold" },
      { label: "Diamond Necklace", href: "/necklace?type=diamond" },
    ]
  },
  {
    name: "Bangles",
    href: "/bracelets",
    items: [
      { label: "Gold Bangles", href: "/bracelets?type=gold" },
      { label: "Bracelets", href: "/bracelets?type=bracelet" },
      { label: "Kada", href: "/bracelets?type=kada" },
    ]
  },
  {
    name: "Collections",
    href: "/collections",
    items: [
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Bestsellers", href: "/collections/bestsellers" },
      { label: "Everyday Essentials", href: "/collections/everyday-essentials" },
      { label: "Gifting", href: "/collections/gifting" },
    ]
  }
]

export function Navigation() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const totalItems = useCartStore((s) => s.items.length)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [dynamicCategories, setDynamicCategories] = useState(initialNavCategories)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch dynamic categories
  useEffect(() => {
    async function fetchFilters() {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from('products').select('category, metal_type, gemstone, is_active')
      if (data && !error) {
        // Filter out inactive products
        const activeProducts = data.filter(p => p.is_active !== false)

        const allMetals = Array.from(new Set(activeProducts.map(p => p.metal_type).filter(Boolean))) as string[]
        const allGemstones = Array.from(new Set(activeProducts.map(p => p.gemstone).filter(Boolean))) as string[]

        setDynamicCategories(prev => prev.map(cat => {
          if (cat.name === "Jewellery") {
            const items: any[] = []
            allMetals.forEach(m => items.push({ label: m, href: `/jewellery?metal=${encodeURIComponent(m)}` }))
            allGemstones.forEach(g => {
              if (g && g.toLowerCase() !== 'none') {
                items.push({ label: g === 'Diamond' || g === 'Solitaire' ? g : `${g} Jewellery`, href: `/jewellery?gemstone=${encodeURIComponent(g)}` })
              }
            })
            // Keep original if empty
            return { ...cat, items: items.length > 0 ? items : cat.items }
          }
          // We can also make others dynamic if needed, e.g. Rings
          if (cat.name.toLowerCase() === "rings" || cat.name.toLowerCase() === "earrings" || cat.name.toLowerCase() === "necklaces" || cat.name.toLowerCase() === "bangles") {
            const baseCategory = cat.name.toLowerCase()
            const catProducts = activeProducts.filter(p => p.category?.toLowerCase() === baseCategory)
            const catMetals = Array.from(new Set(catProducts.map(p => p.metal_type).filter(Boolean))) as string[]
            const catGemstones = Array.from(new Set(catProducts.map(p => p.gemstone).filter(Boolean))) as string[]

            const items: any[] = []
            catGemstones.forEach(g => {
              if (g && g.toLowerCase() !== 'none') items.push({ label: `${g} ${cat.name}`, href: `/${baseCategory === 'bangles' ? 'bracelets' : baseCategory === 'necklaces' ? 'necklace' : baseCategory}?gemstone=${encodeURIComponent(g)}` })
            })
            catMetals.forEach(m => items.push({ label: `${m} ${cat.name}`, href: `/${baseCategory === 'bangles' ? 'bracelets' : baseCategory === 'necklaces' ? 'necklace' : baseCategory}?metal=${encodeURIComponent(m)}` }))

            return { ...cat, items: items.length > 0 ? items : cat.items }
          }
          return cat
        }))
      }
    }
    fetchFilters()
  }, [])

  // Body scroll lock for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    async function fetchUnread() {
      if (!user) return
      const supabase = getSupabaseBrowserClient()
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
      setUnreadNotifications(count || 0)
    }
    fetchUnread()
  }, [user])

  // Search functionality (Debounced)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      const supabase = getSupabaseBrowserClient()
      const query = searchQuery.trim()

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,metal_type.ilike.%${query}%,gemstone.ilike.%${query}%,search_keywords.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(5)

      if (data && !error) {
        setSearchResults(data.map((d: any) => ({
          id: d.id,
          name: d.name,
          price: `₹${d.price.toLocaleString("en-IN")}`,
          image: d.image_urls?.[0] || d.image || "",
          href: `/product/${d.slug || d.id}`
        })))
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      const inDesktop = searchRef.current?.contains(target)
      const inMobile = mobileSearchRef.current?.contains(target)
      if (!inDesktop && !inMobile) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/jewellery?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearchResults(false)
      setSearchQuery("")
    }
  }

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm max-md:bg-[#FDFBF9] max-md:border-b max-md:border-[#E5E3E0] max-md:shadow-none">
        {/* Top Header Row */}
        <div className="border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between h-16 lg:h-[72px] gap-4">
              {/* Mobile Menu */}
              <button
                className="lg:hidden w-[48px] h-[48px] flex items-center justify-center max-md:order-4 max-md:ml-0 max-md:-mr-2"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0 max-md:order-1 max-md:justify-start">
                <DevkiLogo />
              </Link>

              {/* Search Bar - Mobile with real-time results */}
              <div className="lg:hidden flex-1 max-md:order-2 max-md:mx-2 relative" ref={mobileSearchRef}>
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchResults(true)
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className="w-full h-10 pl-4 pr-20 rounded-full border border-gray-300 bg-gray-50 focus:border-[#522D6D] focus:outline-none text-sm transition-colors"
                  />
                  {/* Clear button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearchResults(false) }}
                      className="absolute right-[40px] top-0 h-10 w-10 flex items-center justify-center text-gray-400"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-10 w-[40px] text-gray-500 flex items-center justify-center rounded-r-full hover:bg-gray-200 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* Mobile Search Results Dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchQuery.trim().length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                      {isSearching && (
                        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-gray-300 border-t-[#522D6D] rounded-full" />
                          Searching…
                        </div>
                      )}
                      {!isSearching && searchResults.length > 0 && (
                        <>
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              href={product.href}
                              onClick={() => { setShowSearchResults(false); setSearchQuery("") }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px] border-b border-gray-50 last:border-0"
                            >
                              <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                                {product.image ? (
                                  <Image src={product.image} alt={product.name} fill className="object-contain p-1" sizes="40px" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-4 h-4" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                <p className="text-xs text-[#B76E79] font-semibold">{product.price}</p>
                              </div>
                            </Link>
                          ))}
                          <Link
                            href={`/jewellery?search=${encodeURIComponent(searchQuery)}`}
                            onClick={() => { setShowSearchResults(false); setSearchQuery("") }}
                            className="block px-4 py-3 text-sm font-medium text-[#522D6D] bg-gray-50 hover:bg-gray-100 text-center transition-colors min-h-[44px]"
                          >
                            View all results for &quot;{searchQuery}&quot;
                          </Link>
                        </>
                      )}
                      {!isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                        <div className="py-8 text-center">
                          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No products found for &quot;{searchQuery}&quot;</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Bar - Desktop */}
              <div className="hidden lg:flex flex-1 max-w-[420px] mx-6" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search jewellery, rings, earrings..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchResults(true)
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className="w-full h-11 pl-5 pr-14 rounded-full border border-gray-300 bg-white focus:border-[#522D6D] focus:ring-1 focus:ring-[#522D6D] focus:outline-none text-sm transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-11 w-11 bg-[#522D6D] text-white rounded-full flex items-center justify-center hover:bg-[#6B3D8A] transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={product.href}
                            onClick={() => {
                              setShowSearchResults(false)
                              setSearchQuery("")
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                              <Image src={product.image} alt={product.name} fill className="object-contain p-1" sizes="40px" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.price}</p>
                            </div>
                          </Link>
                        ))}
                        <Link
                          href={`/jewellery?search=${encodeURIComponent(searchQuery)}`}
                          onClick={() => {
                            setShowSearchResults(false)
                            setSearchQuery("")
                          }}
                          className="block px-4 py-3 text-sm font-medium text-[#522D6D] bg-gray-50 hover:bg-gray-100 text-center transition-colors"
                        >
                          View all results for &quot;{searchQuery}&quot;
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-1 lg:gap-3 max-md:order-3">
                {/* Stores */}
                <Link
                  href="/stores"
                  className="hidden lg:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full hover:border-[#522D6D] transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-[#522D6D]" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#522D6D]">Stores</span>
                </Link>

                {/* Gold Button */}
                <Link
                  href="/live-gold-rate"
                  className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-[#FFD700] hover:bg-[#F5C800] rounded-full text-sm font-semibold text-gray-800 transition-colors shadow-sm"
                >
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">G</span>
                  Live Gold Rate
                </Link>

                {/* User */}
                <Link href={mounted && user ? "/profile" : "/login"} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors max-md:hidden">
                  <User className="w-5 h-5 text-gray-600" />
                </Link>

                {/* Notifications */}
                {mounted && user && (
                  <Link href="/profile/notifications" className="p-2.5 hover:bg-gray-100 rounded-full transition-colors relative max-md:hidden">
                    <Bell className="w-5 h-5 text-gray-600 hover:text-[#522D6D]" />
                    <AnimatePresence>
                      {unreadNotifications > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"
                        />
                      )}
                    </AnimatePresence>
                  </Link>
                )}

                {/* Wishlist */}
                <Link href={mounted && user ? "/profile/wishlist" : "/login"} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors max-md:hidden">
                  <Heart className="w-5 h-5 text-[#522D6D]" />
                </Link>

                {/* Cart */}
                <Link href="/cart" className="w-[48px] h-[48px] flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors relative -mr-2" id="cart-icon">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  <AnimatePresence>
                    {mounted && totalItems > 0 ? (
                      <motion.span
                        key="cart-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-[#E91E63] text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1"
                      >
                        {totalItems}
                      </motion.span>
                    ) : (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-[#522D6D] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        +
                      </span>
                    )}
                  </AnimatePresence>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Purple Navigation Bar */}
        <div className="bg-gradient-to-r from-[#522D6D] via-[#7B4397] to-[#522D6D] max-md:hidden relative" onMouseLeave={() => setActiveMenu(null)}>
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between">
              {/* Category Navigation */}
              <nav className="hidden lg:flex items-center">
                {dynamicCategories.map((category) => (
                  <div
                    key={category.name}
                    className="relative"
                    onMouseEnter={() => setActiveMenu(category.name)}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Link href={category.href} className="flex items-center gap-1 px-4 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                      {category.name}
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </Link>

                    <AnimatePresence>
                      {activeMenu === category.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 w-52 bg-white shadow-xl border-t-2 border-[#522D6D] py-2 z-50"
                        >
                          {(category as any).items?.map((item: any) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#522D6D] transition-colors"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </nav>

              {/* Services Dropdown */}
              <div
                className="relative ml-auto"
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <button className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                  Services
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                <AnimatePresence>
                  {isServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 w-48 bg-white shadow-xl border-t-2 border-[#522D6D] py-2 z-50"
                    >
                      {SERVICES.map((service) => (
                        <Link
                          key={service.name}
                          href={service.href}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#522D6D] transition-colors"
                        >
                          {service.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay — Full-screen CaratLane Big Cards */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden backdrop-blur-md bg-white/95 overflow-y-auto"
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#E5E3E0] px-5 flex items-center justify-between h-16">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <DevkiLogo />
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-[48px] h-[48px] flex items-center justify-center -mr-2">
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="px-5 pt-5 pb-10">
              {/* Mobile Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    router.push(`/jewellery?search=${encodeURIComponent(searchQuery.trim())}`)
                    setIsMobileMenuOpen(false)
                    setSearchQuery("")
                  }
                }}
                className="relative mb-6"
              >
                <input
                  type="text"
                  placeholder="Search jewellery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-4 pr-14 rounded-full border border-gray-300 focus:border-[#522D6D] focus:outline-none text-sm"
                />
                <button type="submit" className="absolute right-0 top-0 h-12 w-12 bg-[#522D6D] text-white rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {/* Big Visual Category Cards — CaratLane IA pattern */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {dynamicCategories.map((category) => {
                  const categoryImages: Record<string, string> = {
                    Jewellery: "/images/category-necklaces.jpg",
                    Earrings: "/images/category-earrings.jpg",
                    Rings: "/images/category-rings.jpg",
                    Necklaces: "/images/category-necklaces.jpg",
                    Bangles: "/images/bridal-collection.jpg",
                    Collections: "/images/hero-jewelry.jpg",
                  }
                  return (
                    <motion.div key={category.name} whileTap={{ scale: 0.97 }}>
                      <Link
                        href={category.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="relative block rounded-xl overflow-hidden min-h-[80px]"
                      >
                        <img
                          src={categoryImages[category.name] || "/images/hero-jewelry.jpg"}
                          alt={category.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <span className="absolute bottom-3 left-3 text-white font-semibold text-sm drop-shadow-lg">
                          {category.name}
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Secondary Links */}
              <div className="border-t border-[#E5E3E0] pt-5 space-y-1">
                {[
                  { label: mounted && user ? "My Account" : "Login / Sign Up", href: mounted && user ? "/profile" : "/login", icon: <User className="w-5 h-5 text-[#522D6D]" /> },
                  { label: "Wishlist", href: mounted && user ? "/profile/wishlist" : "/login", icon: <Heart className="w-5 h-5 text-[#522D6D]" /> },
                  { label: "Store Locator", href: "/stores", icon: <MapPin className="w-5 h-5 text-[#522D6D]" /> },
                  { label: "Help", href: "/faq", icon: <Bell className="w-5 h-5 text-[#522D6D]" /> },
                ].map((link) => (
                  <motion.div key={link.label} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-2 py-3 min-h-[44px] text-sm font-medium text-gray-700 hover:text-[#522D6D] rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function DevkiLogo() {
  const { settings, isLoading } = useSiteSettings()
  const logoUrl = settings.logo_url || "/images/devkijewel_logo.png"

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <div className="h-12 w-[120px] max-md:h-8 max-md:w-[80px] bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <img
          src={logoUrl}
          alt={settings.site_name || "Devki Jewels"}
          className="h-12 w-auto object-contain max-md:h-8"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/devkijewel_logo.png"
          }}
        />
      )}
    </div>
  )
}

function CartSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getDiscountAmount, getFinalPrice, appliedCoupon } = useCartStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[90%] max-w-md bg-white z-[301] shadow-2xl flex flex-col safe-area-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-50 bg-[#FDFBF9]">
              <div>
                <h3 className="text-xl font-serif text-gray-900">Your Shopping Bag</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B8860B] font-bold mt-1">{items.length} {items.length === 1 ? 'Item' : 'Items'}</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 active:scale-90 transition-transform">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 mobile-scroll">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                  </div>
                  <h4 className="text-lg font-serif italic text-gray-900 mb-2">Your bag is empty</h4>
                  <p className="text-sm text-gray-400 mb-8 max-w-[200px]">Discover our exquisite collections and find your perfect piece.</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-[#1A1A1A] text-white rounded-full text-xs font-bold tracking-widest uppercase active:scale-95 transition-all shadow-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="px-6 space-y-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-4 group">
                      <div className="w-24 h-32 bg-gray-50 rounded-2xl overflow-hidden relative shrink-0 border border-gray-100">
                        <img
                          src={item.product.images?.[0] || item.product.image ? ((item.product.images?.[0] || item.product.image).startsWith("http") || (item.product.images?.[0] || item.product.image).startsWith("/") ? (item.product.images?.[0] || item.product.image) : `/${item.product.images?.[0] || item.product.image}`) : "/placeholder.jpg"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.product.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-auto">Metal: {item.product.material || 'Gold'}</p>

                        <div className="flex items-end justify-between mt-4">
                          <div className="flex items-center border border-gray-100 rounded-lg p-1 bg-gray-50/50">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#522D6D] active:scale-90"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#522D6D] active:scale-90"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-bold text-gray-900">₹{(item.product.priceNum * item.quantity).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Section */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-[#FDFBF9] space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest font-bold">
                    <span>Subtotal</span>
                    <span>₹{getTotalPrice().toLocaleString("en-IN")}</span>
                  </div>
                  {getDiscountAmount() > 0 && (
                    <div className="flex justify-between text-xs text-green-600 uppercase tracking-widest font-bold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{getDiscountAmount().toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-400 uppercase tracking-widest font-bold pt-2">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-serif text-gray-900 border-t border-gray-100 pt-3">
                    <span>Total</span>
                    <span>₹{getFinalPrice().toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full py-4 bg-[#1A1A1A] text-white text-center rounded-2xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#522D6D] transition-all shadow-xl active:scale-[0.98]"
                >
                  Proceed to Checkout
                </Link>

                <p className="text-[10px] text-gray-400 text-center font-medium">Safe & Secure Checkout • Tax Included</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Navigation
