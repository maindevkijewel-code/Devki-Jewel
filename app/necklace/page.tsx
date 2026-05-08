import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductListing } from "@/components/ProductListing"



export default function NecklacesPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <ProductListing 
        title="Necklaces" 
        description="Browse our curated collection of necklaces, pendants, and chains in gold, diamond, and gemstones."
        baseCategory="necklace"
      />
      <Footer />
    </main>
  )
}
