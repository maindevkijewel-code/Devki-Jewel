"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, ChevronDown, Check } from "lucide-react"
import { ProductCard } from "@/components/ProductCard"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { products as mockProducts, type Product } from "@/lib/mockData"

const sortOptions = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
  { label: "Discount: High to Low", value: "discount_desc" },
]

interface ProductListingProps {
  title: string
  description?: string
  baseCategory?: string // e.g., 'rings', 'earrings'. If empty, fetches all
  collection?: string // specifically for /collections/[slug] routing
}

function ProductListingInner({ title, description, baseCategory, collection }: ProductListingProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    metal: true,
    purity: false,
    gemstone: false,
    diamond: false,
    weight: false,
  })

  const [filterOptions, setFilterOptions] = useState({
    metal: ['Gold', 'Rose Gold', 'White Gold', 'Silver', 'Platinum'],
    gemstone: ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl'],
    subcategories: [] as {id: string, name: string}[]
  })

  // Parse filters from URL
  const filters = useMemo(() => {
    return {
      subcategory: searchParams.getAll('subcategory'),
      type: searchParams.getAll('type'),
      priceMin: searchParams.get('p_min'),
      priceMax: searchParams.get('p_max'),
      metal: searchParams.getAll('metal'),
      purity: searchParams.getAll('purity'),
      gemstone: searchParams.getAll('gemstone'),
      diamondSize: searchParams.getAll('d_size'),
      diamondClarity: searchParams.getAll('d_clarity'),
      diamondColor: searchParams.getAll('d_color'),
      diamondShape: searchParams.getAll('d_shape'),
      weightMin: searchParams.get('w_min'),
      weightMax: searchParams.get('w_max'),
      occasion: searchParams.getAll('occasion'),
      collection: searchParams.getAll('collection'),
      discount: searchParams.getAll('discount'),
      inStock: searchParams.get('in_stock') === 'true',
      sort: searchParams.get('sort') || 'recommended',
      search: searchParams.get('search'),
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true)
      const supabase = getSupabaseBrowserClient()

      let query = supabase.from('products').select('*')

      // Fetch dynamic filter options for current category
      const filterQuery = supabase.from('products').select('metal_type, gemstone').eq('is_active', true)
      if (baseCategory) filterQuery.eq('category', baseCategory)
      const { data: filterData } = await filterQuery
      
      let subcats: {id: string, name: string}[] = []
      if (baseCategory) {
        const { data: allCats } = await supabase.from('categories').select('*')
        if (allCats) {
          const mainCat = allCats.find(c => c.slug === baseCategory)
          if (mainCat) {
            subcats = allCats.filter(c => c.parent_id === mainCat.id).map(c => ({ id: c.id, name: c.name }))
          }
        }
      }

      if (filterData) {
        const metals = Array.from(new Set(filterData.map(d => d.metal_type).filter(Boolean))) as string[]
        const gemstones = Array.from(new Set(filterData.map(d => d.gemstone).filter(Boolean))) as string[]
        setFilterOptions({
          metal: metals.length > 0 ? metals : ['Gold', 'Rose Gold', 'White Gold', 'Silver', 'Platinum'],
          gemstone: gemstones.length > 0 ? gemstones : ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl'],
          subcategories: subcats
        })
      }

      if (baseCategory) {
        query = query.eq('category', baseCategory)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,category.ilike.%${filters.search}%,metal_type.ilike.%${filters.search}%,gemstone.ilike.%${filters.search}%,search_keywords.ilike.%${filters.search}%`)
      }

      if (filters.type.length > 0) {
        // Just a basic ILIKE matching on generic properties since we use 'type' freely in nav
        query = query.or(filters.type.map(t => `name.ilike.%${t}%,material.ilike.%${t}%,gemstone.ilike.%${t}%`).join(','))
      }

      if (filters.priceMin) query = query.gte('price', parseInt(filters.priceMin))
      if (filters.priceMax) query = query.lte('price', parseInt(filters.priceMax))

      if (filters.subcategory.length > 0) query = query.in('subcategory_id', filters.subcategory)
      if (filters.metal.length > 0) query = query.in('metal_type', filters.metal)
      if (filters.purity.length > 0) query = query.in('purity', filters.purity)

      if (filters.gemstone.length > 0) {
        query = query.or(filters.gemstone.map(g => `gemstone.ilike.%${g}%`).join(','))
      }

      if (filters.diamondSize.length > 0) query = query.in('diamond_size', filters.diamondSize.map(Number))
      if (filters.diamondClarity.length > 0) query = query.in('diamond_clarity', filters.diamondClarity)
      if (filters.diamondColor.length > 0) query = query.in('diamond_color', filters.diamondColor)
      if (filters.diamondShape.length > 0) query = query.in('diamond_shape', filters.diamondShape)

      if (filters.weightMin) query = query.gte('weight', parseFloat(filters.weightMin))
      if (filters.weightMax) query = query.lte('weight', parseFloat(filters.weightMax))

      if (filters.occasion.length > 0) query = query.contains('occasion', filters.occasion)

      const effectiveCollections = [...filters.collection]
      if (collection && !effectiveCollections.includes(collection)) {
        // Find if any subset matches or exact match
        // The URL slug might be 'shaya-diamonds' and db is 'Shaya Diamonds'
        // For simplicity, we just use ilike filter later, but let's assume exact match or ilike
        // Let's add it to ilike
        query = query.ilike('collection', `%${collection.replace('-', ' ')}%`)
      }
      if (filters.collection.length > 0) query = query.in('collection', filters.collection)

      if (filters.discount.length > 0) {
        const minDiscount = Math.min(...filters.discount.map(d => parseInt(d)))
        query = query.gte('discount_percentage', minDiscount)
      }

      if (filters.inStock) {
        query = query.eq('in_stock', true)
      }

      // Sorting
      switch (filters.sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'discount_desc':
          query = query.order('discount_percentage', { ascending: false })
          break
        default:
          query = query.order('is_latest', { ascending: false }).order('created_at', { ascending: false })
      }
      const { data, error } = await query

      if (data && data.length > 0) {
        // Map db properties back to the client Product type expected by ProductCard
        const mapped = data.map((d: any) => ({
          ...d,
          price: `₹${d.price.toLocaleString("en-IN")}`,
          priceNum: d.price,
          originalPrice: d.original_price ? `₹${d.original_price.toLocaleString("en-IN")}` : null,
          originalPriceNum: d.original_price,
          hoverImage: d.hover_image,
          isLatest: d.is_latest,
          href: `/product/${d.slug || d.id}`
        }))
        setProducts(mapped)
      } else {
        // Fallback to mock data if database is empty or error occurs
        let filtered = [...mockProducts]

        if (baseCategory) {
          filtered = filtered.filter(p => p.category === baseCategory)
        }

        if (filters.search) {
          const s = filters.search.toLowerCase()
          filtered = filtered.filter(p => p.name.toLowerCase().includes(s))
        }

        if (filters.type.length > 0) {
          filtered = filtered.filter(p => filters.type.some(t =>
            p.name.toLowerCase().includes(t.toLowerCase()) ||
            p.material.toLowerCase().includes(t.toLowerCase()) ||
            p.gemstone.toLowerCase().includes(t.toLowerCase())
          ))
        }

        if (filters.priceMin) filtered = filtered.filter(p => p.priceNum >= parseInt(filters.priceMin!))
        if (filters.priceMax) filtered = filtered.filter(p => p.priceNum <= parseInt(filters.priceMax!))

        if (filters.metal.length > 0) {
          filtered = filtered.filter(p => filters.metal.some(m => p.material.toLowerCase().includes(m.toLowerCase())))
        }

        // Sorting
        if (filters.sort === 'price_asc') filtered.sort((a, b) => a.priceNum - b.priceNum)
        else if (filters.sort === 'price_desc') filtered.sort((a, b) => b.priceNum - a.priceNum)

        setProducts(filtered)
      }
      setIsLoading(false)
    }

    fetchProducts()
  }, [filters, baseCategory])

  const updateFilters = (key: string, value: string | null, isArray = false) => {
    const params = new URLSearchParams(searchParams.toString())

    if (isArray && value) {
      const current = params.getAll(key)
      if (current.includes(value)) {
        params.delete(key)
        current.filter(v => v !== value).forEach(v => params.append(key, v))
      } else {
        params.append(key, value)
      }
    } else {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }

    router.replace(`${pathname}?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.replace(pathname)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const showDiamondFilters = filters.gemstone.includes("Diamond") || baseCategory === "rings" || pathname.includes('diamond')

  const activeFilterCount = Array.from(searchParams.keys()).filter(k => k !== 'sort').length

  const Sidebar = () => (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters
        </h3>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-xs font-medium text-[#E91E63] hover:underline">
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Availability Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">In Stock Only</span>
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={filters.inStock}
              onChange={(e) => updateFilters('in_stock', e.target.checked ? 'true' : null)}
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#522D6D]"></div>
          </div>
        </label>

        <hr className="border-gray-100" />

        {/* Filter Accordions */}
        {[
          {
            id: 'price', title: 'Price', type: 'preset', key: 'p_max',
            options: [
              { label: 'Under ₹10K', max: '10000', min: null },
              { label: '₹10K - ₹20K', min: '10000', max: '20000' },
              { label: '₹20K - ₹50K', min: '20000', max: '50000' },
              { label: 'Above ₹50K', min: '50000', max: null },
            ]
          },
          ...(filterOptions.subcategories.length > 0 ? [{
            id: 'subcategory', title: 'Category', type: 'checkbox', key: 'subcategory',
            options: filterOptions.subcategories.map(s => s.id),
            labels: filterOptions.subcategories.reduce((acc, s) => ({...acc, [s.id]: s.name}), {})
          }] : []),
          ...(filterOptions.metal.length > 0 ? [{
            id: 'metal', title: 'Metal Type', type: 'checkbox', key: 'metal',
            options: filterOptions.metal
          }] : []),
          ...(filterOptions.gemstone.length > 0 ? [{
            id: 'gemstone', title: 'Gemstone', type: 'checkbox', key: 'gemstone',
            options: filterOptions.gemstone.filter(g => g.toLowerCase() !== 'none')
          }] : []),
          ...(showDiamondFilters ? [
            {
              id: 'diamond', title: 'Diamond Clarity', type: 'checkbox', key: 'd_clarity',
              options: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']
            }
          ] : [])
        ].map((section) => (
          <div key={section.id} className="border-b border-gray-100 pb-4">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-900 py-2"
            >
              {section.title}
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {expandedSections[section.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 pb-1 space-y-2.5">
                    {section.type === 'checkbox' && (
                      section.options.map((opt: any) => {
                        const displayLabel = section.labels ? (section.labels as any)[opt] : opt;
                        return (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${(filters as any)[section.key]?.includes(opt)
                              ? 'bg-[#522D6D] border-[#522D6D]'
                              : 'border-gray-300 group-hover:border-[#522D6D]'
                              }`}>
                              {(filters as any)[section.key]?.includes(opt) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-[#522D6D]">{displayLabel}</span>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={(filters as any)[section.key]?.includes(opt)}
                              onChange={(e) => updateFilters(section.key, opt, true)}
                            />
                          </label>
                        )
                      })
                    )}
                    {section.type === 'preset' && section.id === 'price' && (
                      section.options.map((opt: any) => (
                        <label key={opt.label} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.priceMax === opt.max && filters.priceMin === opt.min
                            ? 'border-[#522D6D]'
                            : 'border-gray-300 group-hover:border-[#522D6D]'
                            }`}>
                            {filters.priceMax === opt.max && filters.priceMin === opt.min && <div className="w-2 h-2 rounded-full bg-[#522D6D]" />}
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-[#522D6D]">{opt.label}</span>
                          <input
                            type="radio"
                            className="hidden"
                            name="price_preset"
                            onChange={() => {
                              const params = new URLSearchParams(searchParams.toString())
                              if (opt.min) params.set('p_min', opt.min)
                              else params.delete('p_min')

                              if (opt.max) params.set('p_max', opt.max)
                              else params.delete('p_max')

                              router.replace(`${pathname}?${params.toString()}`)
                            }}
                          />
                        </label>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-6 py-10 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl lg:text-4xl font-semibold text-[#522D6D] mb-3 capitalize">
          {filters.search ? `Search results for "${filters.search}"` : title}
        </h1>
        {description && <p className="text-gray-500 max-w-xl">{description}</p>}
      </motion.div>

      {/* Top Sort Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{products.length}</span> designs
        </p>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 bg-white"
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#522D6D] text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative group">
            <select
              value={filters.sort}
              onChange={(e) => updateFilters('sort', e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:border-[#522D6D] focus:outline-none focus:border-[#522D6D] bg-white cursor-pointer"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-[#522D6D]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-24">
          <Sidebar />
        </aside>

        {/* Mobile Bottom Sheet Sidebar */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-3xl z-50 flex flex-col lg:hidden"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <h3 className="font-semibold text-lg">Filter Options</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 -mr-2 bg-gray-50 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <Sidebar />
                </div>
                <div className="p-4 border-t border-gray-100 shrink-0 flex gap-3 bg-white">
                  <button onClick={clearAllFilters} className="flex-1 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm">
                    Clear All
                  </button>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="flex-[2] py-3.5 bg-[#522D6D] text-white rounded-xl font-medium text-sm">
                    Show Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1 w-full min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">New Collection Coming Soon</h3>
              <p className="text-gray-500 max-w-md mx-auto">We are currently curating an exquisite selection of jewellery. Our latest designs will be available shortly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductListing(props: ProductListingProps) {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#522D6D] border-t-transparent flex rounded-full animate-spin" /></div>}>
      <ProductListingInner {...props} />
    </Suspense>
  )
}
