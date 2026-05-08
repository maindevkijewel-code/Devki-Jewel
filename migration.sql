-- DEVKI JEWELS MIGRATION SCRIPT
-- Execute this script in your Supabase SQL Editor

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY, -- using string id to match mockData
  name text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  image text NOT NULL,
  hover_image text,
  images text[] DEFAULT '{}',
  is_latest boolean DEFAULT false,
  category text,
  description text,
  material text,
  gemstone text,
  weight numeric,
  purity text,
  
  -- Advanced Filter Attributes
  metal_type text,
  diamond_size numeric,
  diamond_clarity text,
  diamond_color text,
  diamond_shape text,
  occasion text[],
  collection text,
  in_stock boolean DEFAULT true,
  discount_percentage numeric GENERATED ALWAYS AS (
    CASE WHEN original_price > 0 THEN 
      ROUND(((original_price - price) / original_price) * 100)
    ELSE 0 END
  ) STORED,

  created_at timestamptz DEFAULT now()
);

-- Note: We assume the 'profiles' table already exists from previous setup.
-- Make sure loyalty_points column exists in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;

-- ==========================================
-- 3. WISHLISTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id text REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- ==========================================
-- 4. CART ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id text REFERENCES public.products(id) ON DELETE CASCADE,
    quantity integer DEFAULT 1,
    size text,
    metal_type text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- ==========================================
-- 5. ADDRESSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    address_type text DEFAULT 'Home', -- Home, Work, Other
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 6. ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number text UNIQUE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    items jsonb NOT NULL,
    shipping_address jsonb NOT NULL,
    subtotal numeric NOT NULL,
    discount numeric DEFAULT 0,
    shipping numeric DEFAULT 0,
    tax numeric DEFAULT 0,
    total_amount numeric NOT NULL,
    coupon_code text,
    gift_wrap boolean DEFAULT false,
    payment_id text,
    razorpay_order_id text,
    status text DEFAULT 'confirmed', -- pending, confirmed, shipped, delivered, cancelled
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 7. REVIEWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id text REFERENCES public.products(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    title text,
    body text,
    images text[],
    is_verified_purchase boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 8. NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL, -- 'order'|'review'|'wishlist'|'promotion'
    reference_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read
CREATE POLICY "Products are viewable by everyone." 
  ON public.products FOR SELECT USING (true);

-- Wishlists: Users can only see and manipulate their own
CREATE POLICY "Users can view their own wishlists." 
  ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wishlists." 
  ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wishlists." 
  ON public.wishlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlists." 
  ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Cart Items: Users can only see and manipulate their own
CREATE POLICY "Users can view their own cart items." 
  ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cart items." 
  ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items." 
  ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items." 
  ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Addresses: Users can only see and manipulate their own
CREATE POLICY "Users can view their own addresses." 
  ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses." 
  ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses." 
  ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses." 
  ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can only see and insert their own
CREATE POLICY "Users can view their own orders." 
  ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders." 
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders."
  ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- Reviews: Everyone can read reviews, users can insert their own
CREATE POLICY "Reviews are viewable by everyone." 
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." 
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." 
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews." 
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Users can only see and update their own
CREATE POLICY "Users can view their own notifications." 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications." 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications." 
  ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications." 
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);
