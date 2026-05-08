"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getActivePromoSections, type PromoSection } from "@/app/admin/actions/promo-sections"

const ease = [0.4, 0, 0.2, 1] as const

// ─── Text overlay ────────────────────────────────────────────────────────────
function TextOverlay({ title, subtitle, btnText, btnLink, badge, textColor, align, inView }: {
  title?: string | null; subtitle?: string | null; btnText?: string | null; btnLink?: string | null
  badge?: string | null; textColor?: string | null; align?: string | null; inView: boolean
}) {
  if (!title && !subtitle && !btnText) return null
  const light = textColor === "light"
  const ac = align === "center" ? "text-center items-center" : align === "right" ? "text-right items-end" : "text-left items-start"

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} 
      transition={{ duration: 0.6, ease, delay: 0.2 }} 
      className={`flex flex-col max-w-[280px] sm:max-w-md ${ac}`}
    >
      {badge && (
        <span className={`text-[9px] md:text-[11px] tracking-[0.3em] uppercase font-bold mb-3 md:mb-4 px-3 py-1 rounded-full border ${light ? "text-white border-white/20 bg-white/5" : "text-[#522D6D] border-[#522D6D]/10 bg-[#522D6D]/5"}`}>
          {badge}
        </span>
      )}
      {title && (
        <h2 className={`text-2xl md:text-4xl lg:text-5xl font-serif italic leading-[1.1] mb-3 md:mb-5 ${light ? "text-white" : "text-gray-900"}`}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={`text-xs md:text-sm leading-relaxed mb-6 md:mb-8 font-medium ${light ? "text-white/80" : "text-gray-500"}`}>
          {subtitle}
        </p>
      )}
      {btnText && (
        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-[11px] md:text-xs font-bold tracking-widest uppercase transition-all shadow-lg active:scale-95 ${light ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-[#1A1A1A] text-white hover:bg-[#522D6D]"}`}>
          {btnText}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      )}
    </motion.div>
  )
}

// ─── Full Width ──────────────────────────────────────────────────────────────
function FullWidth({ s, inView }: { s: PromoSection; inView: boolean }) {
  return (
    <Link href={s.button_link || "/jewellery"} className="block group relative overflow-hidden rounded-3xl shadow-xl shadow-gray-200/50">
      <div className="relative w-full aspect-[16/10] md:aspect-[21/8]">
        <Image 
          src={s.desktop_image} 
          alt={s.title || ""} 
          fill 
          className="object-cover hidden md:block group-hover:scale-105 transition-transform duration-1000" 
          sizes="100vw" 
        />
        <Image 
          src={s.mobile_image || s.desktop_image} 
          alt={s.title || ""} 
          fill 
          className="object-cover md:hidden" 
          sizes="100vw" 
        />
        {(s.overlay_opacity ?? 0) > 0 && (
          <div className="absolute inset-0 bg-black/30" style={{ backgroundColor: `rgba(0,0,0,${s.overlay_opacity})` }} />
        )}
        {/* Mobile Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
        
        <div className={`absolute inset-0 flex items-center z-10 px-6 md:px-20 ${s.text_alignment === "center" ? "justify-center" : s.text_alignment === "right" ? "justify-end" : "justify-start"}`}>
          <TextOverlay title={s.title} subtitle={s.subtitle} btnText={s.button_text} btnLink={s.button_link} badge={s.badge_text} textColor={s.text_color} align={s.text_alignment} inView={inView} />
        </div>
      </div>
    </Link>
  )
}

// ─── Two Column (Image + Text) ───────────────────────────────────────────────
function TwoCol({ s, inView }: { s: PromoSection; inView: boolean }) {
  return (
    <Link href={s.button_link || "/jewellery"} className="block group shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
      <div className="grid lg:grid-cols-2" style={{ backgroundColor: s.background_color || "#FDFBF9" }}>
        <div className="flex items-center p-10 md:p-16 lg:p-24 order-2 lg:order-1">
          <TextOverlay title={s.title} subtitle={s.subtitle} btnText={s.button_text} badge={s.badge_text} textColor={s.text_color} align={s.text_alignment} inView={inView} />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }} 
          animate={inView ? { opacity: 1, scale: 1 } : {}} 
          transition={{ duration: 1, ease }} 
          className="relative aspect-square lg:aspect-auto order-1 lg:order-2 min-h-[320px] overflow-hidden"
        >
          <Image 
            src={s.desktop_image} 
            alt="" 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-1000" 
            sizes="(max-width:1024px) 100vw, 50vw" 
          />
        </motion.div>
      </div>
    </Link>
  )
}

// ─── Card Overlay ────────────────────────────────────────────────────────────
function Overlay({ s, inView }: { s: PromoSection; inView: boolean }) {
  return (
    <Link href={s.button_link || "/jewellery"} className="block group relative overflow-hidden rounded-3xl shadow-xl shadow-gray-200/50">
      <div className="relative w-full aspect-[16/9] md:aspect-[16/7]">
        <Image src={s.desktop_image} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" sizes="100vw" />
        <div className={`absolute inset-0 ${s.text_color === "light" ? "bg-black/20" : "bg-white/10"}`} />
        <div className={`absolute inset-0 flex items-center z-10 px-8 md:px-20 ${s.text_alignment === "center" ? "justify-center" : s.text_alignment === "right" ? "justify-end" : "justify-start"}`}>
          <TextOverlay title={s.title} subtitle={s.subtitle} btnText={s.button_text} badge={s.badge_text} textColor={s.text_color} align={s.text_alignment} inView={inView} />
        </div>
      </div>
    </Link>
  )
}

// ─── DUAL SPLIT BANNER ───────────────────────────────────────────────────────
function SplitPanel({ image, mobileImage, title, subtitle, btnText, btnLink, badge, textColor, align, overlay, inView }: {
  image: string; mobileImage?: string | null; title?: string | null; subtitle?: string | null
  btnText?: string | null; btnLink?: string | null; badge?: string | null; textColor?: string | null
  align?: string | null; overlay?: number | null; inView: boolean
}) {
  return (
    <Link href={btnLink || "/jewellery"} className="block group relative overflow-hidden h-full">
      <div className="relative w-full h-full min-h-[300px] md:min-h-[400px]">
        <Image src={image} alt={title || ""} fill className="object-cover hidden md:block group-hover:scale-105 transition-transform duration-1000" sizes="50vw" />
        <Image src={mobileImage || image} alt={title || ""} fill className="object-cover md:hidden" sizes="100vw" />
        {(overlay ?? 0) > 0 && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />}
        {/* Subtle Bottom Gradient for Mobile Text Legibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent md:hidden" />
        
        {(title || subtitle || btnText) && (
          <div className={`absolute inset-0 flex items-center z-10 p-8 md:p-12 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`}>
            <TextOverlay title={title} subtitle={subtitle} btnText={btnText} btnLink={btnLink} badge={badge} textColor={textColor} align={align} inView={inView} />
          </div>
        )}
      </div>
    </Link>
  )
}

function DualSplit({ s, inView }: { s: PromoSection; inView: boolean }) {
  const ratio = s.layout_ratio || "50/50"
  const gridCols = ratio === "60/40" ? "md:grid-cols-[3fr_2fr]" : ratio === "40/60" ? "md:grid-cols-[2fr_3fr]" : "md:grid-cols-2"
  const isStack = (s.mobile_behavior || "stack") === "stack"

  return (
    <div className={`grid ${isStack ? "grid-cols-1" : "grid-cols-2"} ${gridCols} gap-px bg-gray-100 overflow-hidden rounded-3xl shadow-xl shadow-gray-200/50`}>
      <SplitPanel
        image={s.desktop_image} mobileImage={s.mobile_image}
        title={s.title} subtitle={s.subtitle} btnText={s.button_text} btnLink={s.button_link}
        badge={s.badge_text} textColor={s.text_color} align={s.text_alignment} overlay={s.overlay_opacity}
        inView={inView}
      />
      {s.right_desktop_image && (
        <SplitPanel
          image={s.right_desktop_image} mobileImage={s.right_mobile_image}
          title={s.right_title} subtitle={s.right_subtitle} btnText={s.right_button_text} btnLink={s.right_button_link}
          badge={s.right_badge_text} textColor={s.right_text_color} align={s.right_text_alignment} overlay={s.right_overlay_opacity}
          inView={inView}
        />
      )}
    </div>
  )
}

// ─── Section Router ──────────────────────────────────────────────────────────
function PromoSectionCard({ section, index }: { section: PromoSection; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }} transition={{ duration: 0.8, ease, delay: index * 0.1 }}>
      {section.layout_type === "split_dual" ? <DualSplit s={section} inView={isInView} /> :
       section.layout_type === "two_column" ? <TwoCol s={section} inView={isInView} /> :
       section.layout_type === "card_overlay" ? <Overlay s={section} inView={isInView} /> :
       <FullWidth s={section} inView={isInView} />}
    </motion.div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function PromoBanner() {
  const [sections, setSections] = useState<PromoSection[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => { getActivePromoSections().then(d => { setSections(d); setIsLoaded(true) }) }, [])

  if (!isLoaded) return (
    <section className="py-8 bg-[#FDFBF9]"><div className="max-w-[1400px] mx-auto px-4 lg:px-6 space-y-6">
      {[1, 2].map(i => <div key={i} className="animate-pulse rounded-2xl bg-gray-100" style={{ aspectRatio: "21/8" }} />)}
    </div></section>
  )
  if (sections.length === 0) return null

  return (
    <section className="py-8 md:py-12 bg-[#FDFBF9]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 space-y-6 md:space-y-8">
        {sections.map((s, i) => <PromoSectionCard key={s.id} section={s} index={i} />)}
      </div>
    </section>
  )
}

export default PromoBanner
