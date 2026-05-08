import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Product } from '@/lib/mockData'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { useAuthStore } from './auth-store'

interface WishlistState {
  items: Product[]
  fetchWishlist: (userId: string) => Promise<void>
  addToWishlist: (product: Product) => Promise<void>
  removeFromWishlist: (id: string) => Promise<void>
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      fetchWishlist: async (userId: string) => {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('wishlists')
          .select('product_id, products(*)')
          .eq('user_id', userId)

        if (!error && data) {
          const products = data.map((item: any) => item.products).filter(Boolean) as Product[]
          set({ items: products })
        }
      },

      addToWishlist: async (product: Product) => {
        // Optimistic update
        set((state) => {
          if (state.items.find((item) => item.id === product.id)) return state
          return { items: [...state.items, product] }
        })

        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const supabase = getSupabaseBrowserClient()
          await supabase.from('wishlists').upsert({
            user_id: userId,
            product_id: product.id,
          })
        }
      },

      removeFromWishlist: async (id: string) => {
        // Optimistic update
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))

        const userId = useAuthStore.getState().user?.id
        if (userId) {
          const supabase = getSupabaseBrowserClient()
          await supabase.from('wishlists').delete().match({ user_id: userId, product_id: id })
        }
      },

      isInWishlist: (id: string) => {
        return get().items.some((item) => item.id === id)
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'devki-wishlist',
    }
  )
)
