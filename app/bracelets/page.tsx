import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductListing } from "@/components/ProductListing"



export default function BraceletsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <ProductListing 
        title="Bracelets" 
        description="Adorn your wrist with our selection of bangles, bracelets, and tennis bracelets."
        baseCategory="bracelets"
      />
      <Footer />
    </main>
  )
}
