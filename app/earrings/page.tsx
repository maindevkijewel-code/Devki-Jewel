import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductListing } from "@/components/ProductListing"



export default function EarringsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      <ProductListing 
        title="Earrings" 
        description="From elegant studs to dramatic drops, find earrings that frame your face beautifully."
        baseCategory="earrings"
      />
      <Footer />
    </main>
  )
}
