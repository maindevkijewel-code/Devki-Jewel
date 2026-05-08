"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ProductCard"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, use } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Product } from "@/lib/mockData"

interface CollectionDetail {
  id: string
  name: string
  slug: string
  subtitle: string | null
  description: string | null
  story: string | null
  banner_image: string | null
  thumbnail_image: string | null
  is_featured: boolean
  is_trending: boolean
  seo_title: string | null
  seo_description: string | null
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  
  const [collection, setCollection] = useState<CollectionDetail | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabaseBrowserClient()

      // 1. Fetch collection details
      const { data: colData } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single()

      if (colData) {
        setCollection(colData)

        // 2. Fetch linked products via junction table
        const { data: links } = await supabase
          .from("collection_products")
          .select("product_id")
          .eq("collection_id", colData.id)

        if (links && links.length > 0) {
          const productIds = links.map(l => l.product_id)
          const { data: prodData } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds)
            .eq("is_active", true)

          if (prodData) {
            setProducts(prodData.map((d: any) => ({
              ...d,
              price: `₹${d.price.toLocaleString("en-IN")}`,
              priceNum: d.price,
              originalPrice: d.original_price ? `₹${d.original_price.toLocaleString("en-IN")}` : null,
              originalPriceNum: d.original_price,
              hoverImage: d.hover_image,
              isLatest: d.is_latest,
              href: `/product/${d.slug || d.id}`
            })))
          }
        }

        // 3. Fallback: if no linked products, try legacy `collection` text field
        if (!links || links.length === 0) {
          const { data: legacyData } = await supabase
            .from("products")
            .select("*")
            .ilike("collection", `%${slug.replace(/-/g, " ")}%`)
            .eq("is_active", true)

          if (legacyData && legacyData.length > 0) {
            setProducts(legacyData.map((d: any) => ({
              ...d,
              price: `₹${d.price.toLocaleString("en-IN")}`,
              priceNum: d.price,
              originalPrice: d.original_price ? `₹${d.original_price.toLocaleString("en-IN")}` : null,
              originalPriceNum: d.original_price,
              hoverImage: d.hover_image,
              isLatest: d.is_latest,
              href: `/product/${d.slug || d.id}`
            })))
          }
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [slug])

  const title = collection?.name || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />

      {/* Hero Banner */}
      {collection?.banner_image ? (
        <div className="relative h-[280px] lg:h-[400px] w-full overflow-hidden">
          <Image
            src={collection.banner_image}
            alt={collection.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
                <span>/</span>
                <span className="text-white">{title}</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {title}
              </h1>
              {collection?.subtitle && (
                <p className="text-white/80 text-lg">{collection.subtitle}</p>
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#522D6D] to-[#7B4397] py-16 lg:py-24">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
                <span>/</span>
                <span className="text-white">{title}</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-2">{title}</h1>
              {collection?.subtitle && <p className="text-white/80 text-lg">{collection.subtitle}</p>}
            </motion.div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-6 py-10 w-full">
        {/* Description */}
        {collection?.description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <p className="text-gray-600 text-lg max-w-3xl leading-relaxed">{collection.description}</p>
          </motion.div>
        )}

        {/* Story Section */}
        {collection?.story && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12 bg-white rounded-2xl border border-gray-100 p-8 lg:p-12"
          >
            <h2 className="text-xs font-bold text-[#522D6D] uppercase tracking-wider mb-4">The Story</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line max-w-3xl">
              {collection.story}
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {products.length > 0 ? `${products.length} Design${products.length > 1 ? 's' : ''}` : 'Designs'}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
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
              <h3 className="text-xl font-medium text-gray-900 mb-2">Designs Coming Soon</h3>
              <p className="text-gray-500 max-w-md mx-auto">We are curating exquisite pieces for this collection. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
