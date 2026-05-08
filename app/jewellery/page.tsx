import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductListing } from "@/components/ProductListing"



export default function JewelleryPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <ProductListing 
        title="All Jewellery" 
        description="Explore our complete collection of exquisite jewellery, from timeless classics to contemporary designs."
      />
      <Footer />
    </main>
  )
}
