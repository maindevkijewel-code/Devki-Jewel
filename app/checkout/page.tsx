"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Script from "next/script"
import { motion, AnimatePresence } from "framer-motion"
import { Check, MapPin, CreditCard, ShoppingBag, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useCartStore } from "@/store/cartStore"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CouponSection } from "@/components/checkout/CouponSection"
import { toast } from "sonner"

const STEPS = ["Delivery Address", "Order Summary", "Payment"]

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()
  const { items, getTotalPrice, getDiscountAmount, getFinalPrice, clearCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(0)

  // Address state
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false)

  const totalPrice = getTotalPrice()
  const discountAmount = getDiscountAmount()
  const finalPrice = getFinalPrice()

  useEffect(() => {
    if (isInitialized && !user) {
      toast.error("Please log in to checkout")
      router.push("/login")
    }
  }, [user, isInitialized, router])

  useEffect(() => {
    if (items.length === 0 && isInitialized) {
      router.push("/cart")
    }
  }, [items, isInitialized, router])

  useEffect(() => {
    async function fetchAddresses() {
      if (!user) return
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })

      if (data && data.length > 0) {
        setAddresses(data)
        setSelectedAddressId(data[0].id)
      }
      setIsLoadingAddresses(false)
    }
    fetchAddresses()
  }, [user])

  const handleNextStep = () => {
    if (currentStep === 0 && !selectedAddressId) {
      toast.error("Please select a delivery address")
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // 1. Create Order on backend
    try {
      const createRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalPrice })
      })
      
      const orderData = await createRes.json()
      
      if (!createRes.ok) throw new Error(orderData.error || "Failed to create order")

      // Special handling for Mock flow (no razorpay keys)
      if (orderData._mock) {
        await finalizeOrder(orderData.id, "mock_pay_" + Math.random(), "mock_sig_" + Math.random())
        return
      }

      // 2. Open Razorpay Checktout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Devki Jewels",
        description: "Luxury Jewellery Purchase",
        image: "/logo.png", // fallback placeholder
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            })
            
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              await finalizeOrder(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature)
            } else {
              toast.error("Payment verification failed")
              setIsProcessing(false)
            }
          } catch (e) {
            toast.error("Failed to verify payment")
            setIsProcessing(false)
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#522D6D"
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any){
        toast.error(response.error.description || "Payment failed")
        setIsProcessing(false)
      })
      rzp.open()
      
    } catch (e: any) {
      toast.error(e.message || "Failed to initialize payment")
      setIsProcessing(false)
    }
  }

  const finalizeOrder = async (rzpOrderId: string, paymentId: string, _signature: string) => {
    try {
      const selectedAddr = addresses.find(a => a.id === selectedAddressId)
      const orderNumber = `DEV-${Date.now().toString().slice(-6)}`
      const { appliedCoupon } = useCartStore.getState()
      
      const orderToInsert = {
        order_number: orderNumber,
        user_id: user?.id,
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.image,
          quantity: item.quantity,
          price: item.product.priceNum
        })),
        shipping_address: selectedAddr,
        subtotal: totalPrice,
        ...(discountAmount > 0 ? { discount_amount: discountAmount, coupon_code: appliedCoupon?.code } : {}),
        total_amount: finalPrice,
        status: "confirmed",
        razorpay_order_id: rzpOrderId,
        payment_id: paymentId
      }

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("orders").insert(orderToInsert)
      
      if (error) throw error

      await clearCart()
      router.push(`/order-success?order=${orderNumber}`)
    } catch (error) {
      console.error(error)
      toast.error("Payment succeeded but failed to save order. Contact support.")
      setIsProcessing(false)
    }
  }

  if (!isInitialized || !user || items.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#522D6D]" /></div>
  }

  return (
    <main className="min-h-screen bg-[#FDFBF9] flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navigation />
      
      <div className="flex-1 max-w-[1200px] mx-auto px-4 py-8 lg:py-12 w-full">
        <h1 className="text-3xl font-semibold text-[#522D6D] mb-8">Checkout</h1>
        
        {/* Stepper */}
        <div className="flex items-center mb-10 max-w-2xl">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative z-10 gap-2 w-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                  currentStep > idx ? 'bg-green-500 text-white' : 
                  currentStep === idx ? 'bg-[#522D6D] text-white border-2 border-[#522D6D]' : 
                  'bg-white text-gray-400 border-2 border-gray-200'
                }`}>
                  {currentStep > idx ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`absolute top-10 text-xs font-medium whitespace-nowrap ${currentStep >= idx ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-[2px] flex-1 mx-2 transition-colors duration-300 ${currentStep > idx ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* STEP 1: ADDRESS */}
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8"
                >
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#522D6D]" /> Delivery Address
                  </h2>

                  {isLoadingAddresses ? (
                    <div className="animate-pulse space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">You have no saved addresses.</p>
                      <button onClick={() => router.push("/profile/addresses")} className="px-6 py-2 bg-[#522D6D] text-white rounded-lg hover:bg-[#6B3D8A]">
                        Add Address in Profile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map(addr => (
                        <label 
                          key={addr.id} 
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-[#522D6D] bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <input 
                            type="radio" 
                            name="address" 
                            className="mt-1"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{addr.full_name} <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-gray-200 rounded-full">{addr.address_type}</span></p>
                            <p className="text-sm text-gray-600 mt-1">{addr.address_line1}, {addr.address_line2}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-sm text-gray-500 mt-2">📞 {addr.phone}</p>
                          </div>
                        </label>
                      ))}
                      <div className="pt-6">
                        <button 
                          onClick={handleNextStep}
                          disabled={!selectedAddressId}
                          className="w-full sm:w-auto px-8 py-3.5 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A] disabled:opacity-50"
                        >
                          Continue to Summary
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: SUMMARY */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8"
                >
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#522D6D]" /> Order Summary
                  </h2>

                  <div className="space-y-4 mb-8">
                    {items.map(item => (
                      <div key={item.product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0">
                          <Image src={item.product.image} alt={item.product.name} fill className="object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-semibold text-[#522D6D]">
                          ₹{(item.product.priceNum * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setCurrentStep(0)} className="px-6 py-3.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50">
                      Back
                    </button>
                    <button onClick={handleNextStep} className="flex-1 px-8 py-3.5 bg-[#522D6D] text-white rounded-xl font-medium hover:bg-[#6B3D8A]">
                      Proceed to Payment
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PAYMENT */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 text-center py-12"
                >
                  <CreditCard className="w-16 h-16 text-[#522D6D] mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Secure Payment</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    You will be redirected to Razorpay's secure and encrypted payment gateway.
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setCurrentStep(1)} disabled={isProcessing} className="px-6 py-3.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                      Back
                    </button>
                    <button onClick={handlePayment} disabled={isProcessing} className="px-8 py-3.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center min-w-[200px]">
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${finalPrice.toLocaleString('en-IN')}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CouponSection />

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-lg mb-4">Price Details</h3>
                <div className="space-y-3 pb-4 border-b border-gray-100 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Price ({items.length} items)</span>
                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex justify-between text-emerald-600 font-medium">
                      <span>Coupon Discount</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </motion.div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Charges</span>
                    <span className="text-emerald-600 font-medium">Free</span>
                  </div>
                  {/* Could add GST here */}
                </div>
                <div className="flex justify-between font-bold text-xl pt-4">
                  <span>Total Amount</span>
                  <div className="text-right">
                    <span className="text-[#522D6D]">₹{finalPrice.toLocaleString('en-IN')}</span>
                    {discountAmount > 0 && <p className="text-xs text-emerald-600 font-medium mt-1">You will save ₹{discountAmount.toLocaleString('en-IN')} on this order</p>}
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Check className="w-3 h-3 text-emerald-500" /> Safe and Secure Payments
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
