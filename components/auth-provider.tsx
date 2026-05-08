"use client"

import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlist-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setIsLoading, setIsInitialized } = useAuthStore()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let mounted = true

    async function initializeAuth() {
      // 1. Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (!mounted) return

      if (error) {
        console.error("getSession error:", error)
        setIsInitialized(true)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setIsInitialized(true)
        }
      }

      // 2. Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!mounted) return

          // Only fetch profile if user has changed or logged in
          const currentUser = useAuthStore.getState().user
          const isNewUser = newSession?.user?.id !== currentUser?.id
          const isLogout = !newSession && currentUser

          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (isLogout) {
            setProfile(null)
            setIsInitialized(true)
          } else if (isNewUser && newSession?.user) {
            await fetchProfile(newSession.user.id)
          }
        }
      )

      return subscription
    }

    const authInit = initializeAuth()

    return () => {
      mounted = false
      authInit.then(sub => sub?.unsubscribe())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProfile(userId: string) {
    const supabase = getSupabaseBrowserClient()

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (data) {
        // Block check — sign out if user is blocked
        if (data.is_blocked) {
          await supabase.auth.signOut()
          setProfile(null)
          setUser(null)
          setSession(null)
          setIsInitialized(true)
          return
        }

        setProfile(data)
        
        // Sync carts and wishlists when explicitly logging in
        const { fetchCart, mergeCart } = useCartStore.getState()
        const { fetchWishlist } = useWishlistStore.getState()
        
        await fetchWishlist(userId)
        await mergeCart(userId)

        setIsInitialized(true)
        return
      }

      // Profile row doesn't exist yet → create it
      if (error && error.code === "PGRST116") {
        const user = useAuthStore.getState().user
        const newProfile = {
          id: userId,
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
          email: user?.email || null,
          phone: user?.phone || null,
          avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
          loyalty_points: 0,
        }

        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single()

        if (created) {
          setProfile(created)
          // Sync carts and wishlists when fully created
          const { fetchCart, mergeCart } = useCartStore.getState()
          const { fetchWishlist } = useWishlistStore.getState()
          
          await fetchWishlist(userId)
          await mergeCart(userId)
        } else if (insertError) {
          // Table might not exist yet; gracefully degrade
          console.warn("Could not create profile row:", insertError.message)
        }
      } else if (error) {
        console.warn("Profile fetch error:", error.message)
      }
    } catch (e) {
      console.error("fetchProfile threw:", e)
    } finally {
      // ALWAYS mark as initialized — guarantees the spinner stops
      setIsInitialized(true)
    }
  }

  return <>{children}</>
}
