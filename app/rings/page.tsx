import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductListing } from "@/components/ProductListing"



export default function RingsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <ProductListing 
        title="Rings" 
        description="Discover stunning rings for every occasion — engagement, wedding, everyday wear, and more."
        baseCategory="rings"
      />
      <Footer />
    </main>
  )
}
