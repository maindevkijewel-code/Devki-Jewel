"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCircle2, Ticket, ShoppingBag, Heart, Trash2 } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [user])

  async function fetchNotifications() {
    if (!user) return
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) {
      setNotifications(data)
    }
    setIsLoading(false)
  }

  const markAsRead = async (id: string) => {
    if (!user) return
    // Optimistic
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    
    const supabase = getSupabaseBrowserClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    const supabase = getSupabaseBrowserClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    toast.success("Marked all as read")
  }

  const deleteNotification = async (id: string) => {
    if (!user) return
    setNotifications(prev => prev.filter(n => n.id !== id))
    const supabase = getSupabaseBrowserClient()
    await supabase.from('notifications').delete().eq('id', id)
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'order': return <ShoppingBag className="w-5 h-5 text-blue-500" />
      case 'promotion': return <Ticket className="w-5 h-5 text-green-500" />
      case 'wishlist': return <Heart className="w-5 h-5 text-pink-500" />
      default: return <Bell className="w-5 h-5 text-purple-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm font-medium text-[#522D6D] hover:underline"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-[#522D6D]" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
          <p className="text-gray-500 text-sm">You're all caught up! Browse our items in the meantime.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex items-start gap-4 p-4 md:p-5 rounded-2xl border transition-colors ${
                  notification.is_read ? 'bg-white border-gray-100' : 'bg-purple-50/50 border-purple-100 relative'
                }`}
              >
                {!notification.is_read && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-8 bg-[#522D6D] rounded-r-full" />
                )}
                
                <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${notification.is_read ? 'bg-gray-50' : 'bg-white shadow-sm'}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0" onClick={() => !notification.is_read && markAsRead(notification.id)}>
                  <h4 className={`text-sm ${notification.is_read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {notification.title}
                  </h4>
                  <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date(notification.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
