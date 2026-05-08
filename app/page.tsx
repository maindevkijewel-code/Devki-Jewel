"use client"

import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { CategoryChips } from "@/components/category-chips"
import { CategoryCards } from "@/components/category-cards"
import { FeaturedProducts } from "@/components/featured-products"
import { PromoBanner } from "@/components/promo-banner"
import { PopularSearches } from "@/components/popular-searches"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FDFBF9]">
      <Navigation />
      <HeroSection />
      <CategoryChips />
      <CategoryCards />
      <FeaturedProducts />
      <PromoBanner />
      <PopularSearches />
      <Footer />
    </main>
  )
}
