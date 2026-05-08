"use client"

import Link from "next/link"
import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const footerSections = [
  {
    title: "Devki Jewels",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Story", href: "/about" },
      { label: "Collections", href: "/collections" },
      { label: "Gift Guide", href: "/gift-cards" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "FAQs", href: "/faq" },
      { label: "Track Order", href: "/track-order" },
      { label: "Shipping Policy", href: "/shipping" },
      { label: "Return Policy", href: "/returns" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
  {
    title: "Collections",
    links: [
      { label: "Rings", href: "/rings" },
      { label: "Earrings", href: "/earrings" },
      { label: "Necklaces", href: "/necklace" },
      { label: "Bangles", href: "/bracelets" },
      { label: "Bridal Collection", href: "/collections/bridal" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Gold Rate", href: "/live-gold-rate" },
      { label: "Store Locator", href: "/stores" },
      { label: "Digital Gold", href: "/digital-gold" },
      { label: "Gift Cards", href: "/gift-cards" },
      { label: "Book Appointment", href: "/appointment" },
    ],
  },
]

const socialLinks = [
  { name: "facebook", href: "https://facebook.com/devkijewels" },
  { name: "instagram", href: "https://instagram.com/devkijewels" },
  { name: "twitter", href: "https://twitter.com/devkijewels" },
  { name: "youtube", href: "https://youtube.com/@devkijewels" },
  { name: "pinterest", href: "https://pinterest.com/devkijewels" },
]

// ─── Mobile Collapsible Section ──────────────────────────────────────────────
function MobileFooterSection({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-100/80">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-[#1A1A1A]"
      >
        {title}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="pb-4 space-y-3">
              {links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-gray-500 hover:text-[#522D6D] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Footer ─────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="bg-[#FDFBF9] safe-area-bottom pb-safe">
      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 pb-12">
        {/* Brand + Tagline */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-block group">
            <h2 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] tracking-[0.1em] group-hover:opacity-80 transition-opacity">
              DEVKI <span className="font-light text-gray-400">JEWELS</span>
            </h2>
          </Link>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="w-6 h-px bg-gray-200" />
            <p className="text-[10px] md:text-[11px] tracking-[0.3em] text-[#B8860B] uppercase font-bold">
              Timeless Artisanship
            </p>
            <div className="w-6 h-px bg-gray-200" />
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-x-12 lg:gap-x-20">
          {footerSections.map(section => (
            <div key={section.title}>
              <h4 className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-[0.15em] mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3.5">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-gray-500 hover:text-[#522D6D] transition-colors duration-300 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden space-y-1">
          {footerSections.map(section => (
            <MobileFooterSection key={section.title} title={section.title} links={section.links} />
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-white/30">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map(social => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#522D6D] hover:bg-purple-50 hover:border-purple-100 transition-all duration-500 active:scale-90"
                >
                  <span className="sr-only">{social.name}</span>
                  <SocialIcon name={social.name} />
                </Link>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-2">
                {["VISA", "MC", "UPI", "EMI", "SECURE"].map(method => (
                  <span
                    key={method}
                    className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-gray-400 tracking-widest uppercase shadow-sm"
                  >
                    {method}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">Secure SSL Encryption • 256-bit Protected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-50 bg-white/80">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-gray-400 font-medium tracking-wide">
              &copy; {new Date().getFullYear()} Devki Jewels. Designed for Excellence.
            </p>
            <div className="flex items-center gap-6 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
              <Link href="/privacy-policy" className="hover:text-[#522D6D] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#522D6D] transition-colors">Terms</Link>
              <Link href="/sitemap" className="hover:text-[#522D6D] transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ name }: { name: string }) {
  const icons: Record<string, React.JSX.Element> = {
    facebook: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
    instagram: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>,
    twitter: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>,
    youtube: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
    pinterest: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" /></svg>,
  }
  return icons[name] || null
}

export default Footer
