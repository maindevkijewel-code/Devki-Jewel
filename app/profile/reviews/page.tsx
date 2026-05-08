"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, MessageSquare, History } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending")
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [submittedReviews, setSubmittedReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [reviewForm, setReviewForm] = useState<{ productId: string, rating: number, text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      setIsLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch user's orders
      const { data: orders } = await supabase.from('orders').select('items, order_number, id').eq('user_id', user.id).eq('status', 'delivered')
      
      // Fetch user's submitted reviews
      const { data: reviews } = await supabase.from('reviews').select('*, products(name, image)').eq('user_id', user.id).order('created_at', { ascending: false })

      if (reviews) {
        setSubmittedReviews(reviews)
      }

      if (orders && reviews) {
        // Find products ordered but not reviewed
        const reviewedProductIds = new Set(reviews.map((r: any) => r.product_id))
        const pendingMap = new Map() // to avoid duplicates if ordered multiple times
        
        orders.forEach((order: any) => {
          if (Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              if (!reviewedProductIds.has(item.product_id) && !pendingMap.has(item.product_id)) {
                pendingMap.set(item.product_id, {
                  ...item,
                  order_id: order.id,
                  order_number: order.order_number
                })
              }
            })
          }
        })
        setPendingItems(Array.from(pendingMap.values()))
      }
      setIsLoading(false)
    }
    fetchData()
  }, [user])

  const submitReview = async () => {
    if (!user || !reviewForm || reviewForm.rating === 0) {
      toast.error("Please provide a rating.")
      return
    }
    setIsSubmitting(true)
    const supabase = getSupabaseBrowserClient()
    
    // find the order id for this product to link it
    const pendingItem = pendingItems.find(p => p.product_id === reviewForm.productId)

    const { data, error } = await supabase.from('reviews').insert({
      user_id: user.id,
      product_id: reviewForm.productId,
      order_id: pendingItem?.order_id,
      rating: reviewForm.rating,
      body: reviewForm.text,
      is_verified_purchase: true
    }).select('*, products(name, image)').single()

    if (error) {
      toast.error(error.message)
    } else if (data) {
      toast.success("Review submitted successfully!")
      setSubmittedReviews(prev => [data, ...prev])
      setPendingItems(prev => prev.filter(p => p.product_id !== reviewForm.productId))
      setReviewForm(null)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">My Reviews</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "pending" ? "text-[#522D6D]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Reviews
          {activeTab === "pending" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#522D6D]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative ${
            activeTab === "submitted" ? "text-[#522D6D]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Submitted Reviews
          {activeTab === "submitted" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#522D6D]" />
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
        </div>
      ) : activeTab === "pending" ? (
        <div className="space-y-4">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No pending reviews</h3>
              <p className="text-gray-500 mt-2">You've reviewed all your delivered purchases!</p>
            </div>
          ) : (
            pendingItems.map((item) => (
              <div key={item.product_id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-lg shrink-0 relative overflow-hidden">
                  <img src={item.product_image || "/placeholder.jpg"} alt={item.product_name} className="w-full h-full object-contain p-2" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.product_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Delivered on Order #{item.order_number}</p>
                  
                  {reviewForm?.productId === item.product_id ? (
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setReviewForm(prev => prev ? { ...prev, rating: star } : null)}>
                            <Star className={`w-8 h-8 transition-colors ${star <= (reviewForm?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewForm?.text || ""}
                        onChange={(e) => setReviewForm(prev => prev ? { ...prev, text: e.target.value } : null)}
                        placeholder="Write your review here..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#522D6D] focus:ring-0 outline-none resize-none h-24"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setReviewForm(null)}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={submitReview}
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-[#522D6D] text-white rounded-lg text-sm font-medium hover:bg-[#6B3D8A] disabled:opacity-50"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setReviewForm({ productId: item.product_id, rating: 0, text: "" })}
                      className="mt-4 px-5 py-2 bg-purple-50 text-[#522D6D] font-medium text-sm rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Write a Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {submittedReviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
              <p className="text-gray-500 mt-2">Your submitted reviews will appear here.</p>
            </div>
          ) : (
            submittedReviews.map((review) => {
              const product = Array.isArray(review.products) ? review.products[0] : review.products;
              return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-lg shrink-0 relative overflow-hidden">
                  <img src={product?.image || "/placeholder.jpg"} alt={product?.name || "Product"} className="w-full h-full object-contain p-2" />
                </div>
                <div className="flex-1">
                  <Link href={`/product/${review.product_id}`} className="font-semibold text-gray-900 hover:text-[#522D6D] transition-colors">
                    {product?.name || "View Product"}
                  </Link>
                  <div className="flex items-center gap-1 mt-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                    {review.is_verified_purchase && (
                      <span className="ml-2 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Verified Purchase</span>
                    )}
                  </div>
                  {review.body && <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">{review.body}</p>}
                </div>
              </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
