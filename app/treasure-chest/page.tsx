"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gift, Lock, Loader2, PartyPopper } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useAuthStore } from "@/store/auth-store"
import Link from "next/link"

const PRIZES = [
  { title: "Flat ₹500 Off", code: "DEVKI500", desc: "Valid on orders above ₹5000" },
  { title: "10% Off Diamonds", code: "DIAMOND10", desc: "No minimum purchase" },
  { title: "Free Shipping + Gift", code: "FREESHIP", desc: "On your next order" },
]

export default function TreasureChestPage() {
  const { user } = useAuthStore()
  const [openedChest, setOpenedChest] = useState<number | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [prize, setPrize] = useState<{title: string, code: string, desc: string} | null>(null)

  const [showConfetti, setShowConfetti] = useState(false)

  const handleOpenChest = (index: number) => {
    if (openedChest !== null || isOpening) return
    setIsOpening(true)
    
    // Simulate API delay and animation
    setTimeout(() => {
      const selectedPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)]
      setPrize(selectedPrize)
      setOpenedChest(index)
      setIsOpening(false)
      setShowConfetti(true)
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex flex-col items-center py-20 px-4 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  y: -50, 
                  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
                  x: typeof window !== 'undefined' ? window.innerWidth / 2 + (Math.random() - 0.5) * 800 : 500,
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{ duration: 2 + Math.random() * 2, ease: "easeOut" }}
                className={`absolute w-3 h-3 rounded-sm ${['bg-[#522D6D]', 'bg-[#E91E63]', 'bg-[#FFD700]', 'bg-blue-400'][Math.floor(Math.random() * 4)]}`}
              />
            ))}
          </div>
        )}

        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-[#522D6D] text-sm font-semibold mb-6">
              <PartyPopper className="w-4 h-4" /> Exclusive Rewards
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#522D6D] mb-4">Devki Treasure Chest</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-16">
              Feeling lucky? Pick one chest to unlock an exclusive reward for your next jewellery purchase.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[0, 1, 2].map((index) => {
              const isThisOpened = openedChest === index
              const isOtherOpened = openedChest !== null && openedChest !== index

              return (
                <motion.div
                  key={index}
                  whileHover={openedChest === null ? { scale: 1.05, y: -10 } : {}}
                  whileTap={openedChest === null ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.2 } }}
                  onClick={() => handleOpenChest(index)}
                  className={`relative aspect-square rounded-3xl cursor-pointer transition-all duration-500 flex flex-col items-center justify-center border-4 ${
                    isThisOpened ? 'bg-gradient-to-br from-purple-50 to-white border-[#522D6D] shadow-2xl shadow-purple-500/20' : 
                    isOtherOpened ? 'bg-gray-50 border-gray-100 opacity-50 grayscale cursor-not-allowed' : 
                    'bg-white border-purple-100 hover:border-[#522D6D] hover:shadow-xl shadow-purple-500/10'
                  }`}
                >
                  {isOpening && isThisOpened ? (
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <img src="https://cdn-icons-png.flaticon.com/512/3588/3588320.png" alt="Chest" className="w-32 h-32 object-contain filter drop-shadow-xl" />
                    </motion.div>
                  ) : isThisOpened ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                       <img src="https://cdn-icons-png.flaticon.com/512/3588/3588295.png" alt="Open Chest" className="w-40 h-40 object-contain filter drop-shadow-xl" />
                    </motion.div>
                  ) : (
                    <>
                      <img src="https://cdn-icons-png.flaticon.com/512/3588/3588320.png" alt="Closed Chest" className="w-32 h-32 object-contain filter drop-shadow-xl mb-4 transition-transform group-hover:rotate-3" />
                      {!isOtherOpened && (
                        <div className="absolute bottom-6 flex items-center gap-2 text-sm font-bold text-[#522D6D] bg-purple-50 px-4 py-2 rounded-full">
                          <Lock className="w-4 h-4" /> Tap to Unlock
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>

          <AnimatePresence>
            {prize && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-white max-w-xl mx-auto rounded-3xl border border-gray-100 p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#522D6D] via-[#E91E63] to-[#FFD700]" />
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h3>
                <p className="text-gray-500 mb-8">You've unlocked a special Devki Jewels reward</p>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100/50 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 text-9xl opacity-5">🎁</div>
                  <Gift className="w-12 h-12 text-[#522D6D] mx-auto mb-4 relative z-10" />
                  <h4 className="text-2xl font-black text-[#522D6D] uppercase tracking-wide relative z-10">{prize.title}</h4>
                  <p className="text-gray-600 font-medium mt-1 relative z-10">{prize.desc}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-xl mb-8">
                  <span className="text-sm text-gray-500 font-medium">Your Coupon Code:</span>
                  <div className="px-6 py-3 bg-white border-2 border-dashed border-[#522D6D] text-[#522D6D] font-mono font-bold text-lg rounded-lg select-all cursor-pointer hover:bg-purple-50 transition-colors"
                       onClick={() => {
                         navigator.clipboard.writeText(prize.code)
                         alert("Coupon Code Copied!")
                       }}>
                    {prize.code}
                  </div>
                </div>

                {!user && (
                  <p className="text-sm text-red-500 mb-6 font-medium">Please login or sign up to claim this offer.</p>
                )}

                <Link
                  href={user ? "/jewellery" : "/login"}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[#522D6D] text-white font-bold rounded-xl hover:bg-[#6B3D8A] transition-colors hover:shadow-lg hover:-translate-y-0.5 duration-200"
                >
                  {user ? "Shop Now" : "Login to Save Coupon"}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
