"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

const chips = [
  { label: "All", href: "/jewellery" },
  { label: "Rings", href: "/rings" },
  { label: "Earrings", href: "/earrings" },
  { label: "Necklaces", href: "/necklace" },
  { label: "Bangles", href: "/bracelets" },
  { label: "Bridal", href: "/collections/bridal" },
]

export function CategoryChips() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})
  const [selected, setSelected] = useState<string | null>(null)

  const scrollToActive = (label: string) => {
    const chip = chipRefs.current[label]
    if (chip && scrollRef.current) {
      const container = scrollRef.current
      const containerWidth = container.offsetWidth
      const chipLeft = chip.offsetLeft
      const chipWidth = chip.offsetWidth

      const scrollPosition = chipLeft - (containerWidth / 2) + (chipWidth / 2)

      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth"
      })
    }
  }

  // Sync selected state with pathname and scroll into view
  useEffect(() => {
    const currentChip = chips.find(chip => chip.href === pathname)
    if (currentChip) {
      setSelected(currentChip.label)
      // Small delay to ensure refs are populated and layout is ready
      const timer = setTimeout(() => {
        scrollToActive(currentChip.label)
      }, 100)
      return () => clearTimeout(timer)
    } else if (pathname === "/") {
      setSelected(null)
    }
  }, [pathname])

  const handleChipClick = (label: string) => {
    setSelected(label)
    scrollToActive(label)
  }

  return (
    <section className="md:hidden py-4 bg-white/90 backdrop-blur-xl sticky top-[64px] z-40 border-b border-[#F5E6D3]/30 shadow-[0_4px_20px_-10px_rgba(82,45,109,0.1)]">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide mobile-scroll snap-x snap-mandatory flex items-center"
      >
        <div className="flex gap-3 px-6 min-w-max">
          {chips.map((chip) => {
            const isActive = selected === chip.label
            return (
              <motion.div
                key={chip.label}
                className="snap-center"
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link
                  ref={(el) => { chipRefs.current[chip.label] = el }}
                  href={chip.href}
                  onClick={() => handleChipClick(chip.label)}
                  className={`relative block px-6 py-2.5 rounded-full text-[12px] font-bold tracking-[0.08em] uppercase transition-all duration-500 border flex items-center justify-center whitespace-nowrap ${isActive
                      ? "bg-[#522D6D] text-white border-[#522D6D] shadow-[0_8px_20px_-6px_rgba(82,45,109,0.4)]"
                      : "bg-white border-[#F0E6D2] text-[#7A6B5D] hover:border-[#522D6D]/30 shadow-sm"
                    }`}
                >
                  <span className="relative z-10">{chip.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeChipBackground"
                      className="absolute inset-0 bg-[#522D6D] rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
