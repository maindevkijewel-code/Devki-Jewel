"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion"
import { Heart, ShoppingBag, Check, ChevronRight, ChevronDown, Truck, Shield, Star, MapPin, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ProductCard"
import { useCartStore } from "@/store/cartStore"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

import { products as mockProducts } from "@/lib/mockData"
import { generateDefaultTryOnImage } from "@/lib/default-tryon-images"
import { useWishlistStore } from "@/store/wishlist-store"

const VirtualTryOn = dynamic(() => import("@/components/VirtualTryOn"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-12 rounded-xl" />,
})

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()

  const [selectedImage, setSelectedImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const [flyAnim, setFlyAnim] = useState(false)
  const [tryOnOpen, setTryOnOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [pincode, setPincode] = useState("")
  const [pincodeChecked, setPincodeChecked] = useState(false)
  const [selectedSize, setSelectedSize] = useState("6")
  const [selectedMetal, setSelectedMetal] = useState("")
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const addToCart = useCartStore((s) => s.addToCart)

  // Review state
  const [reviewStats, setReviewStats] = useState<{ total_reviews: number; average_rating: number; five_star: number; four_star: number; three_star: number; two_star: number; one_star: number } | null>(null)
  const [reviews, setReviews] = useState<any[]>([])

  // Swipe state for mobile gallery
  const dragX = useMotionValue(0)

  // Show sticky bar after scrolling past title
  useEffect(() => {
    if (!isMobile) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    )
    const el = titleRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [isMobile])

  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [effectiveTryOnImage, setEffectiveTryOnImage] = useState<string | null>(null)

  // Fetch product from Supabase
  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return

      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        let fetchedProduct = null
        let isMock = false

        // 1. Try fetching by slug
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .single()

        if (data) {
          fetchedProduct = data
        } else {
          // 2. Try fetching by ID (if it looks like a UUID)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(slug)) {
            const { data: idData } = await supabase.from('products').select('*').eq('id', slug).single()
            if (idData) fetchedProduct = idData
          }

          // 3. Try fetching from mock data
          if (!fetchedProduct) {
            const mock = mockProducts.find(p => p.id === slug || p.href?.endsWith(slug))
            if (mock) {
              fetchedProduct = mock
              isMock = true
            }
          }
        }

        if (fetchedProduct) {
          if (isMock) {
            setProduct(fetchedProduct)
            const related = mockProducts
              .filter((p) => p.category === fetchedProduct.category && p.id !== fetchedProduct.id)
              .slice(0, 4)
            setRelatedProducts(related)
          } else {
            // Fetch related data from DB
            const [variantsRes, imagesRes, highlightsRes] = await Promise.all([
              supabase.from('product_variants').select('*').eq('product_id', fetchedProduct.id),
              supabase.from('product_images').select('*').eq('product_id', fetchedProduct.id).order('display_order', { ascending: true }),
              supabase.from('product_highlights').select('*').eq('product_id', fetchedProduct.id).order('display_order', { ascending: true })
            ])

            const dbImages = imagesRes.data?.length ? imagesRes.data.map(img => img.image_url) : (fetchedProduct.image_urls || fetchedProduct.images || [])
            const dbHighlights = highlightsRes.data?.length ? highlightsRes.data.map(h => h.highlight_text) : []
            const dbVariants = variantsRes.data || []

            const mappedProduct = {
              ...fetchedProduct,
              price: fetchedProduct.price ? `₹${Number(fetchedProduct.price).toLocaleString("en-IN")}` : "₹0",
              priceNum: Number(fetchedProduct.price) || 0,
              originalPrice: fetchedProduct.original_price ? `₹${Number(fetchedProduct.original_price).toLocaleString("en-IN")}` : null,
              originalPriceNum: Number(fetchedProduct.original_price) || 0,
              hoverImage: fetchedProduct.hover_image,
              isLatest: fetchedProduct.is_latest,
              images: dbImages,
              highlights: dbHighlights,
              variants: dbVariants
            }
            setProduct(mappedProduct)

            // Fetch related products
            const { data: relatedData } = await supabase
              .from('products')
              .select('*')
              .eq('category', fetchedProduct.category)
              .neq('id', fetchedProduct.id)
              .limit(4)

            if (relatedData) {
              setRelatedProducts(relatedData.map((d: any) => ({
                ...d,
                price: d.price ? `₹${Number(d.price).toLocaleString("en-IN")}` : "₹0",
                priceNum: Number(d.price) || 0,
                originalPrice: d.original_price ? `₹${Number(d.original_price).toLocaleString("en-IN")}` : null,
                originalPriceNum: Number(d.original_price) || 0,
                hoverImage: d.hover_image,
                isLatest: d.is_latest,
                images: d.image_urls || d.images || [],
                href: `/product/${d.slug || d.id}`
              })))
            }
          }
        }
      } catch (err) {
        console.error("Error in fetchProduct:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  // Fetch reviews
  useEffect(() => {
    if (!product?.id) return
    async function fetchReviews() {
      const supabase = getSupabaseBrowserClient()
      // Stats
      const { data: stats } = await supabase
        .from("product_review_stats")
        .select("*")
        .eq("product_id", product.id)
        .single()
      if (stats) setReviewStats(stats)
      // Recent reviews
      const { data: revs } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(5)
      if (revs) setReviews(revs)
    }
    fetchReviews()
  }, [product?.id])

  // Set default metal on load
  useEffect(() => {
    if (!product) return
    const metals = product.metal_types?.length > 0 ? product.metal_types : (product.metal_type ? [product.metal_type] : [])
    if (metals.length > 0 && !selectedMetal) setSelectedMetal(metals[0])
  }, [product, selectedMetal])

  // Compute effective try-on image once product is loaded
  useEffect(() => {
    if (!product) return
    const tryOnCats = ["rings", "earrings", "necklaces", "necklace"]
    const isCat = tryOnCats.includes(product.category?.toLowerCase())
    const hasImg = !!product.try_on_image_url
    const eligible = product.try_on_enabled === true || isCat
    if (hasImg) {
      setEffectiveTryOnImage(product.try_on_image_url)
    } else if (eligible && typeof document !== "undefined") {
      setEffectiveTryOnImage(generateDefaultTryOnImage(product.category))
    } else {
      setEffectiveTryOnImage(null)
    }
  }, [product])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
        <Navigation />
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 lg:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
            <div className="space-y-6">
              <div className="h-10 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-8 bg-gray-100 rounded animate-pulse w-1/4" />
              <div className="h-32 bg-gray-100 rounded animate-pulse w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-500 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/" className="text-[#522D6D] font-medium hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }



  const discount = product.originalPriceNum
    ? Math.round(((product.originalPriceNum - product.priceNum) / product.originalPriceNum) * 100)
    : 0

  // Virtual Try-On eligibility
  const tryOnCategories = ["rings", "earrings", "necklaces", "necklace"]
  const isTryOnCategory = tryOnCategories.includes(product.category?.toLowerCase())
  const isTryOnEnabled = product.try_on_enabled === true
  const hasTryOnImage = !!product.try_on_image_url
  // Show button if: explicitly enabled OR category matches (for discoverability)
  const showTryOnButton = isTryOnEnabled || isTryOnCategory

  const handleAddToCart = () => {
    addToCart(product)
    setShowAdded(true)
    setFlyAnim(true)
    setTimeout(() => setShowAdded(false), 2000)
    setTimeout(() => setFlyAnim(false), 700)
  }

  const handlePincodeCheck = () => {
    if (pincode.length === 6) {
      setPincodeChecked(true)
      toast.success("Delivery available! Estimated by 3-5 business days.", { position: isMobile ? "bottom-center" : "top-right" })
    }
  }

  const handleMetalChange = (metal: string) => {
    setSelectedMetal(metal)
    toast(`Price updated for ${metal}`, {
      description: "Delivery by May 2-4",
      position: isMobile ? "bottom-center" : "top-right",
      duration: 2500,
    })
  }

  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    toast(`Size ${size} selected — In Stock`, {
      position: isMobile ? "bottom-center" : "top-right",
      duration: 2000,
    })
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x < -threshold && selectedImage < product.images.length - 1) {
      setSelectedImage(selectedImage + 1)
    } else if (info.offset.x > threshold && selectedImage > 0) {
      setSelectedImage(selectedImage - 1)
    }
  }



  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: isMobile ? 0.2 : 0.4 }}
        className="flex-1"
      >
        {/* Breadcrumb */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 max-md:hidden">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#522D6D] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/${product.category}`} className="hover:text-[#522D6D] transition-colors capitalize">
              {product.category}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>

        {/* Product Detail */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16 max-md:px-0 max-md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Left Column: Image Gallery */}
            <div>
              {/* Main Image — swipeable on mobile */}
              <motion.div
                className="relative aspect-square bg-white max-md:rounded-none md:rounded-2xl overflow-hidden border border-gray-100 mb-4 max-md:mb-0"
                layoutId={`product-image-${product.id}`}
              >
                {isMobile ? (
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    style={{ x: dragX }}
                    className="relative w-full h-full cursor-grab active:cursor-grabbing"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full h-full"
                      >
                        <Image
                          src={product.images[selectedImage]}
                          alt={product.name}
                          fill
                          className="object-contain p-6"
                          sizes="100vw"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={product.images[selectedImage]}
                        alt={product.name}
                        fill
                        className="object-contain p-8"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-[#E91E63] text-[#E91E63]" : "text-gray-400"}`} />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.isLatest && (
                    <Badge className="bg-[#522D6D] text-white text-xs">LATEST</Badge>
                  )}
                  {discount > 0 && (
                    <Badge className="bg-[#E91E63] text-white text-xs">{discount}% OFF</Badge>
                  )}

                </div>

                {/* Flying animation */}
                <AnimatePresence>
                  {flyAnim && (
                    <motion.div
                      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      animate={{ opacity: 0, scale: 0.2, x: 400, y: -400 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.65, ease: "easeInOut" }}
                      className="absolute top-1/2 left-1/2 z-50 w-14 h-14 rounded-full bg-[#522D6D] flex items-center justify-center shadow-2xl pointer-events-none"
                    >
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mobile dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 md:hidden z-10">
                  {product.images?.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`rounded-full transition-all ${idx === selectedImage ? "w-6 h-2 bg-[#522D6D]" : "w-2 h-2 bg-gray-300"}`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Thumbnails — horizontal scroll on mobile */}
              <div className="flex gap-3 max-md:overflow-x-auto max-md:px-4 max-md:py-3 max-md:scrollbar-hide">
                {product.images?.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 max-md:w-16 max-md:h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                      ? "border-[#522D6D] shadow-md"
                      : "border-gray-200 hover:border-[#522D6D]/50"
                      }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Product Details — CaratLane storytelling order on mobile */}
            <div className="lg:pt-4 max-md:px-5">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: isMobile ? 0.2 : 0.4, delay: 0.15 }}
              >
                {/* a) Product Title */}
                <h1 ref={titleRef} className="text-2xl lg:text-3xl max-md:font-light font-semibold text-gray-900 mb-2">
                  {product.name}
                </h1>

                {/* b) Price */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-xl max-md:font-semibold lg:text-3xl font-bold text-[#1A1A1A]">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-base text-gray-400 line-through">{product.originalPrice}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-sm font-semibold text-[#E91E63]">Save {discount}%</span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-4">Price inclusive of all taxes. Free Shipping.</p>

                {/* Rating — dynamic */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(reviewStats?.average_rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {reviewStats ? `${reviewStats.average_rating} (${reviewStats.total_reviews} reviews)` : "No reviews yet"}
                  </span>
                </div>

                <Separator className="my-5" />

                {/* c) Pincode Checker */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[#522D6D]" />
                    <span className="text-sm font-medium text-gray-900">Check Delivery Availability</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "")); setPincodeChecked(false) }}
                      placeholder="Enter pincode"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#522D6D] min-h-[44px]"
                    />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePincodeCheck}
                      className="px-5 py-3 bg-[#522D6D] text-white rounded-lg text-sm font-medium min-h-[44px]"
                    >
                      Check
                    </motion.button>
                  </div>
                  {pincodeChecked && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Delivery available to {pincode}. Est. 3-5 days.
                    </p>
                  )}
                </div>

                {/* d) Key Highlights */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Highlights</h3>
                  <ul className="space-y-2">
                    {(product.highlights && product.highlights.length > 0
                      ? product.highlights
                      : [
                        product.material ? `Metal: ${product.material}` : null,
                        product.gemstone ? `Gemstone: ${product.gemstone}` : null,
                        product.weight ? `Weight: ${product.weight}` : null,
                        product.purity ? `Purity: ${product.purity}` : null,
                        product.key_highlights,
                        "Craftsmanship: Handcrafted with precision setting",
                        "Styling Tip: Perfect for both casual & formal occasions",
                      ].filter(Boolean)
                    ).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#522D6D] mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* e) Customization — Size & Metal */}
                <div className="mb-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Select Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {(product.variants?.filter((v: any) => v.size).map((v: any) => v.size).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length > 0
                        ? product.variants.filter((v: any) => v.size).map((v: any) => v.size).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
                        : ["5", "6", "7", "8", "9", "10"]
                      ).map((size: string) => (
                        <motion.button
                          key={size}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSizeChange(size)}
                          className={`w-11 h-11 rounded-lg border text-sm font-medium transition-colors ${selectedSize === size
                            ? "border-[#522D6D] bg-[#522D6D] text-white"
                            : "border-gray-200 text-gray-700 hover:border-[#522D6D]"
                            }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-green-600 font-medium">
                      {selectedSize === "7" ? "3 left in stock" : "In Stock"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Metal Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {(product.metal_types?.length > 0
                        ? product.metal_types
                        : product.variants?.filter((v: any) => v.metal_type).map((v: any) => v.metal_type).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length > 0
                          ? product.variants.filter((v: any) => v.metal_type).map((v: any) => v.metal_type).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
                          : (product.metal_type ? [product.metal_type] : ["18K Yellow Gold"])
                      ).map((metal: string) => (
                        <motion.button
                          key={metal}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleMetalChange(metal)}
                          className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${selectedMetal === metal
                            ? "border-[#522D6D] bg-[#522D6D] text-white"
                            : "border-gray-200 text-gray-700 hover:border-[#522D6D]"
                            }`}
                        >
                          {metal}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Product Specifications */}
                {(product.weight || product.purity || product.metal_type || product.gemstone) && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Specifications</h3>
                    <div className="bg-[#FDFBF9] border border-gray-100 rounded-xl divide-y divide-gray-100">
                      {[
                        { label: "Weight", value: product.weight },
                        { label: "Purity", value: product.purity },
                        { label: "Metal", value: selectedMetal || product.metal_type || product.material },
                        { label: "Gemstone", value: product.gemstone && product.gemstone !== "None" ? product.gemstone : null },
                        { label: "Category", value: product.category },
                      ].filter(s => s.value).map((spec, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm text-gray-500">{spec.label}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-5" />

                {/* f) User Reviews — Dynamic */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Reviews</h3>
                  {reviewStats && reviewStats.total_reviews > 0 ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded-lg text-sm font-bold">
                          {reviewStats.average_rating} <Star className="w-3 h-3 fill-white" />
                        </div>
                        <span className="text-sm text-gray-500">Based on {reviewStats.total_reviews} reviews</span>
                      </div>
                      {/* Rating Breakdown */}
                      <div className="space-y-1.5 mb-5">
                        {[5, 4, 3, 2, 1].map(star => {
                          const key = `${['one', 'two', 'three', 'four', 'five'][star - 1]}_star` as keyof typeof reviewStats
                          const count = (reviewStats[key] as number) || 0
                          const pct = reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-4">{star}</span>
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                      {/* Individual Reviews */}
                      {reviews.map((review) => (
                        <div key={review.id} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                              ))}
                            </div>
                            {review.is_verified && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                <Check className="w-3 h-3" /> Verified
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{review.customer_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{review.review_text}</p>
                          {review.review_image && (
                            <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden relative">
                              <Image src={review.review_image} alt="" fill className="object-cover" />
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <Star className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No reviews yet</p>
                      <p className="text-xs text-gray-400 mt-1">Be the first to share your experience</p>
                    </div>
                  )}
                </div>

                {/* g) Collapsible Accordions */}
                <div className="mb-6 space-y-0">
                  {[
                    { id: "desc", title: "Description", content: product.description },
                    { id: "details", title: "Product Details", content: `Material: ${product.material}\nWeight: ${product.weight}\nPurity: ${product.purity}\nGemstone: ${product.gemstone}` },
                    { id: "shipping", title: "Shipping & Returns", content: "Free shipping on all orders. Lifetime exchange on all products. EMI options available." },
                  ].map((acc) => (
                    <div key={acc.id} className="border-b border-gray-100">
                      <button
                        onClick={() => setOpenAccordion(openAccordion === acc.id ? null : acc.id)}
                        className="w-full flex items-center justify-between py-4 text-sm font-semibold text-gray-900 min-h-[44px]"
                      >
                        {acc.title}
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openAccordion === acc.id ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {openAccordion === acc.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm text-gray-600 leading-relaxed pb-4 whitespace-pre-line">{acc.content}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Virtual Try-On Button */}
                {showTryOnButton && (
                  <div className="mb-6">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTryOnOpen(true)}
                      className="w-full bg-[#B76E79] text-white py-4 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-3 shadow-lg shadow-[#B76E79]/20 hover:shadow-xl hover:bg-[#A55D68] transition-all duration-300 min-h-[52px]"
                    >
                      <Sparkles className="w-5 h-5" />
                      Try It On
                    </motion.button>
                    <p className="text-xs text-gray-400 text-center mt-2">See how it looks on you with AR</p>
                  </div>
                )}


                {/* Premium Desktop Add to Cart */}
                <div className="flex gap-3 mb-8 max-md:hidden relative">
                  <button
                    onClick={handleAddToCart}
                    className="group/btn relative flex-1 overflow-hidden rounded-full bg-gradient-to-r from-[#4A2665] via-[#63368A] to-[#4A2665] bg-[length:200%_auto] text-white py-4 px-8 font-medium text-base tracking-wide transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(82,45,109,0.25)] hover:bg-[center_right_1rem] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {/* Shimmer sweep effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />

                    <span className="relative z-10 flex items-center gap-2.5">
                      {showAdded ? (
                        <><Check className="w-5 h-5 text-[#D4AF37]" /> Added to Cart!</>
                      ) : (
                        <><ShoppingBag className="w-5 h-5 text-[#D4AF37] opacity-90 group-hover/btn:scale-110 transition-transform duration-300" /> Add to Cart</>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`w-[56px] h-[56px] rounded-full border border-gray-200 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 ${isWishlisted
                        ? "border-[#E91E63] bg-pink-50/50 shadow-[0_8px_20px_rgba(233,30,99,0.15)]"
                        : "hover:border-[#522D6D]/30 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] bg-[#FDFBF9]"
                      }`}
                  >
                    <Heart className={`w-5 h-5 transition-transform duration-300 ${isWishlisted ? "fill-[#E91E63] text-[#E91E63] scale-110" : "text-gray-400 group-hover:text-gray-600"}`} />
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-gray-100">
                    <Truck className="w-5 h-5 text-[#522D6D] mb-2" />
                    <span className="text-xs font-medium text-gray-700">Free Shipping</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-gray-100">
                    <Shield className="w-5 h-5 text-[#522D6D] mb-2" />
                    <span className="text-xs font-medium text-gray-700">Certified</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 max-md:px-5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">You May Also Like</h2>
              <p className="text-sm text-gray-500 mb-8">More from our {product.category} collection</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={p} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Sticky Add to Cart Bar */}
      <AnimatePresence>
        {isMobile && showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-[60px] inset-x-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E5E3E0] z-50 md:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col justify-center pr-2">
                <span className="text-xs text-gray-500 font-medium">Price</span>
                <span className="text-lg font-bold text-[#1A1A1A] leading-none">{product.price}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="group/btn relative flex-1 overflow-hidden rounded-full bg-gradient-to-r from-[#4A2665] via-[#63368A] to-[#4A2665] bg-[length:200%_auto] text-white py-3.5 font-medium text-[15px] tracking-wide transition-all duration-500 hover:shadow-[0_8px_20px_rgba(82,45,109,0.25)] hover:bg-[center_right_1rem] flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {showAdded ? (
                    <><Check className="w-[18px] h-[18px] text-[#D4AF37]" /> Added!</>
                  ) : (
                    <><ShoppingBag className="w-[18px] h-[18px] text-[#D4AF37] opacity-90 group-hover/btn:scale-110 transition-transform duration-300" /> Add to Cart</>
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual Try-On Modal */}
      {showTryOnButton && effectiveTryOnImage && (
        <VirtualTryOn
          isOpen={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          productImageUrl={effectiveTryOnImage}
          productName={product.name}
          productCategory={product.category}
          product={product}
        />
      )}

      <Footer />
    </main>
  )
}
