import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Product } from '@/lib/mockData'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { useAuthStore } from './auth-store'

export interface CartItem {
  product: Product
  quantity: number
}

import { type Coupon } from '@/app/admin/actions/coupons'

interface CartState {
  items: CartItem[]
  fetchCart: (userId: string) => Promise<void>
  addToCart: (product: Product) => Promise<void>
  removeFromCart: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  mergeCart: (userId: string) => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  appliedCoupon: Coupon | null
  setCoupon: (coupon: Coupon | null) => void
  getDiscountAmount: () => number
  getFinalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      setCoupon: (coupon: Coupon | null) => set({ appliedCoupon: coupon }),

      fetchCart: async (userId: string) => {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity, products(*)')
          .eq('user_id', userId)

        if (!error && data) {
          const items = data.map((item: any) => ({
            product: item.products,
            quantity: item.quantity,
          })).filter((i: any) => i.product) as CartItem[]
          set({ items })
        }
      },

      mergeCart: async (userId: string) => {
        const state = get()
        if (state.items.length === 0) return
        
        const supabase = getSupabaseBrowserClient()
        // Upsert guest items
        const upserts = state.items.map((item) => ({
          user_id: userId,
          product_id: item.product.id,
          quantity: item.quantity,
        }))
        
        await supabase.from('cart_items').upsert(upserts)
        await state.fetchCart(userId)
      },

      addToCart: async (product: Product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            }
          }
          return { items: [...state.items, { product, quantity: 1 }] }
        })

        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const supabase = getSupabaseBrowserClient()
          const newVol = get().items.find(i => i.product.id === product.id)?.quantity || 1
          await supabase.from('cart_items').upsert({
            user_id: userId,
            product_id: product.id,
            quantity: newVol
          })
        }
      },

      removeFromCart: async (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== id),
        }))

        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const supabase = getSupabaseBrowserClient()
          await supabase.from('cart_items').delete().match({ user_id: userId, product_id: id })
        }
      },

      updateQuantity: async (id: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.product.id !== id) }
          }
          return {
            items: state.items.map((item) =>
              item.product.id === id ? { ...item, quantity } : item
            ),
          }
        })

        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const supabase = getSupabaseBrowserClient()
          if (quantity <= 0) {
            await supabase.from('cart_items').delete().match({ user_id: userId, product_id: id })
          } else {
            await supabase.from('cart_items').update({ quantity }).match({ user_id: userId, product_id: id })
          }
        }
      },

      clearCart: async () => {
        set({ items: [] })
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const supabase = getSupabaseBrowserClient()
          await supabase.from('cart_items').delete().eq('user_id', userId)
        }
      },

      getTotalItems: () => {
        return get().items.length
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.priceNum * item.quantity,
          0
        )
      },

      getDiscountAmount: () => {
        const state = get()
        const total = state.getTotalPrice()
        const coupon = state.appliedCoupon
        if (!coupon) return 0

        // If subtotal drops below minimum order amount, coupon is invalid
        if (coupon.min_order_amount && total < coupon.min_order_amount) return 0

        let discount = 0
        if (coupon.discount_type === 'percentage') {
          discount = (total * coupon.discount_value) / 100
        } else {
          discount = coupon.discount_value
        }

        if (coupon.max_discount_limit && discount > coupon.max_discount_limit) {
          discount = coupon.max_discount_limit
        }

        // Discount cannot exceed total
        return Math.min(discount, total)
      },

      getFinalPrice: () => {
        const state = get()
        return Math.max(0, state.getTotalPrice() - state.getDiscountAmount())
      },
    }),
    {
      name: 'devki-cart',
    }
  )
)
