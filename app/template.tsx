"use client"

import { motion } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Template({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: isMobile ? 0.2 : 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
