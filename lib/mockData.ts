export interface Product {
  id: string
  name: string
  price: string
  priceNum: number
  originalPrice: string
  originalPriceNum: number
  image: string
  hoverImage: string
  images: string[]
  href: string
  isLatest: boolean
  category: string
  description: string
  material: string
  gemstone: string
  weight: string
  purity: string
  hover_video_url?: string
  category_id?: string
  subcategory_id?: string
}

export const products: Product[] = []

export const categories = [
  { name: "Jewellery", slug: "jewellery", description: "Explore our complete collection of exquisite jewellery, from timeless classics to contemporary designs." },
  { name: "Rings", slug: "rings", description: "Discover stunning rings for every occasion — engagement, wedding, everyday wear, and more." },
  { name: "Earrings", slug: "earrings", description: "From elegant studs to dramatic drops, find earrings that frame your face beautifully." },
  { name: "Necklaces", slug: "necklace", description: "Browse our curated collection of necklaces, pendants, and chains in gold, diamond, and gemstones." },
  { name: "Bracelets", slug: "bracelets", description: "Adorn your wrist with our selection of bangles, bracelets, and tennis bracelets." },
]
