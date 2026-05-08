// ── Admin Panel TypeScript Types ──────────────────────────────

export interface AdminProduct {
  id: string
  slug: string
  name: string
  category: string
  price: number
  metal_type: string
  gemstone: string | null
  description: string | null
  key_highlights: string | null
  image_urls: string[]
  discount_type: string | null
  discount_value: number
  stock_quantity: number
  is_active: boolean
  search_keywords?: string | null
  tags?: string[] | null
  occasion?: string | null
  style?: string | null
  created_at: string
  updated_at: string
  // Legacy columns from storefront (kept for compatibility)
  image?: string
  hover_image?: string
  images?: string[]
  original_price?: number
  material?: string
  weight?: number
  purity?: string
  is_latest?: boolean
  in_stock?: boolean
  // Virtual try-on fields
  try_on_enabled?: boolean
  try_on_image_url?: string | null
  try_on_type?: string
  // AI Background Removal fields
  transparent_image?: string | null
  bg_removal_status?: 'none' | 'processing' | 'completed' | 'failed'
}

export interface AdminOrder {
  id: string
  order_number?: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  products: OrderItem[] | null
  items?: OrderItem[] | null // legacy column
  total_amount: number
  delivery_address: string | null
  shipping_address?: Record<string, unknown> | null // legacy jsonb
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  payment_method: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id?: string
  product_id?: string
  product_name?: string
  product_image?: string
  name?: string
  quantity: number
  price: number
}

export interface AdminUser {
  id: string
  full_name: string | null
  email: string | null
  role: 'customer' | 'staff' | 'super_admin'
  is_blocked: boolean
  created_at: string
  order_count?: number
}

export interface Inquiry {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string | null
  message: string
  is_resolved: boolean
  admin_reply: string | null
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'flat'
  discount_value: number
  min_order_amount: number
  max_uses: number | null
  times_used: number
  is_active: boolean
  expiry_date: string | null
  created_at: string
}

export interface SiteSetting {
  key: string
  value: string
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
export type UserRole = 'customer' | 'staff' | 'super_admin'
