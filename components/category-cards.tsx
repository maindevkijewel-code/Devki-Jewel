"use client"

import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Collection {
  id: string
  name: string
  slug: string
  thumbnail_image: string | null
  hover_image: string | null
  subtitle: string | null
}

export function CategoryCards() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCollections() {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, thumbnail_image, hover_image, subtitle")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .order("sort_order", { ascending: true })
        .limit(8)

      if (data && data.length > 0) {
        setCollections(data)
      }
      setIsLoading(false)
    }
    fetchCollections()
  }, [])

  // Don't render section at all if no collections
  if (!isLoading && collections.length === 0) return null

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Shop Our Collections</h2>
            <Link href="/collections" className="text-[#522D6D] text-sm font-medium hover:underline min-h-[44px] flex items-center">
              View All Collections
            </Link>
          </div>

          {isLoading ? (
            /* Skeleton */
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-full bg-gray-100 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link href={`/collections/${collection.slug}`} className="group block text-center">
                    <div className="relative aspect-square rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-[#522D6D] transition-all duration-500 shadow-sm group-hover:shadow-lg">
                      {collection.thumbnail_image ? (
                      <Image
                          src={collection.thumbnail_image}
                        alt={collection.name}
                        fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#522D6D]/10 to-[#B76E79]/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-[#522D6D]/30">{collection.name[0]}</span>
                        </div>
                      )}
                      {/* Hover image overlay */}
                      {collection.hover_image && (
                        <Image
                          src={collection.hover_image}
                          alt=""
                          fill
                          className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#522D6D] transition-colors">
                      {collection.name}
                    </span>
                    {collection.subtitle && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{collection.subtitle}</p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default CategoryCards
