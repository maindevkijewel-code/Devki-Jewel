"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ProductCard"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Product } from "@/lib/mockData"

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  subtitle: string | null
  thumbnail_image: string | null
  banner_image: string | null
  is_featured: boolean
  is_trending: boolean
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabaseBrowserClient()

      // Fetch active collections
      const { data: colData } = await supabase
        .from("collections")
        .select("id, name, slug, description, subtitle, thumbnail_image, banner_image, is_featured, is_trending")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (colData) setCollections(colData)

      // Fetch trending products across collections
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_latest", true)
        .order("created_at", { ascending: false })
        .limit(4)

      if (prodData) {
        setTrendingProducts(prodData.map((d: any) => ({
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

      setIsLoading(false)
    }
    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <div className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-6 py-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-3xl lg:text-4xl font-semibold text-[#522D6D] mb-3">Our Collections</h1>
          <p className="text-gray-500 max-w-xl">
            Explore our curated collections of exquisite jewellery, each telling a unique story of craftsmanship and beauty.
          </p>
        </motion.div>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100" />
            ))}
          </div>
        ) : collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group block relative overflow-hidden rounded-2xl aspect-[4/3]"
                >
                  {(collection.banner_image || collection.thumbnail_image) ? (
                    <Image
                      src={collection.banner_image || collection.thumbnail_image!}
                      alt={collection.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#522D6D]/20 to-[#B76E79]/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {collection.is_featured && (
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider rounded-full">
                        Featured
                      </span>
                    )}
                    {collection.is_trending && (
                      <span className="px-2.5 py-1 bg-[#E91E63]/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider rounded-full">
                        Trending
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white text-xl font-semibold mb-1">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-white/70 text-sm line-clamp-2">{collection.description}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 mb-16">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Collections Coming Soon</h3>
            <p className="text-gray-500 max-w-md mx-auto">Our curated collections are being prepared. Check back soon for exclusive jewellery collections.</p>
          </div>
        )}

        {/* Trending Products */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Trending Across Collections</h2>
          {trendingProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trending Pieces Coming Soon</h3>
              <p className="text-gray-500">We are updating our trending collections.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
