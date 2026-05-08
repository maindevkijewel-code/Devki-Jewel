"use client"

import Link from "next/link"
                          
const categories = [
  { name: "Jewellery", items: ["Gold", "Diamond", "Solitaire", "Gemstone", "22kt Jewellery", "Platinum", "Charms", "Watch Charms", "Chains", "Silver Jewellery", "Rose Gold Jewellery", "White Gold Jewellery"] },
  { name: "Earrings", items: ["Gold Earrings", "Diamond Earrings", "Solitaire Earrings", "Platinum Earrings", "Kids Earrings", "Jhumka Earrings", "Hoop Earrings", "Stud Earrings", "Pearl Earrings", "Sui Dhaga Earrings", "Chandball Earrings", "Earcuff Earrings", "Fancy Earrings", "Stone Earrings", "Daily Wear Earrings", "Butterfly Earrings"] },
  { name: "Rings", items: ["Diamond Rings", "Gold Rings", "Platinum Rings", "Solitaire Rings", "Gemstone Rings", "Mens Rings", "Engagement Ring", "Couple Ring", "Wedding Ring", "Vanki Ring", "Ruby Ring", "Emerald Ring", "Name Ring", "Cocktail Ring", "Love Ring", "Butterfly Ring", "Infinity Rings", "Pearl Rings", "Promise Rings"] },
  { name: "Necklace", items: ["Gold Necklace", "Diamond Necklace", "Kids Necklace", "Gemstone Necklace", "Ruby Necklace", "Choker Necklace", "Pearl Necklace", "Evil Eye Necklace", "Necklaces For Women", "Long Necklace", "Name Necklace", "Stone Necklace", "Butterfly Necklace", "Bridal Necklace", "Fancy Necklace", "Emerald Necklace", "22kt Gold Chains"] },
  { name: "Bracelets", items: ["Gold Bracelet", "Diamond Bracelet", "Platinum Bracelet", "Kids Bracelet", "Tennis Bracelet", "Evil Eye Bracelet", "Charm Bracelet", "Chain Bracelet", "Couple Bracelet", "Mangalsutra Bracelet"] },
]

export function PopularSearches() {
  return (
    <section className="bg-white pb-12 max-md:hidden">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="border-t border-gray-100 pt-10">
          <h3 className="text-lg font-semibold text-[#522D6D] mb-6">Popular Searches</h3>
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.name} className="border-b border-gray-100 pb-6 last:border-0">
                <h4 className="text-[#522D6D] font-medium mb-3">{category.name}</h4>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {category.items.map((item, idx) => (
                    <span key={item} className="inline-flex items-center">
                      <Link 
                        href={`/${category.name.toLowerCase()}`} 
                        className="text-sm text-gray-600 hover:text-[#522D6D] transition-colors"
                      >
                        {item}
                      </Link>
                      {idx < category.items.length - 1 && (
                        <span className="mx-2 text-gray-300">|</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
