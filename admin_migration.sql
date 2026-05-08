-- ============================================================
-- DEVKI JEWELS — ADMIN PANEL MIGRATION
-- Execute this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES — Add role & is_blocked columns
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer' CHECK (role IN ('customer','staff','super_admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Ensure email column exists (may already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- ============================================================
-- 2. PRODUCTS — Add admin columns (preserving existing schema)
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS key_highlights text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_type text CHECK (discount_type IN ('percentage','flat'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure metal_type exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS metal_type text;

-- ============================================================
-- 3. ORDERS — Add admin columns (preserving existing schema)
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS products jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;

-- ============================================================
-- 4. INQUIRIES TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  admin_reply text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
-- Allow anyone to insert (contact form)
DO $$ BEGIN
  CREATE POLICY "Anyone can insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Allow authenticated users to read their own
DO $$ BEGIN
  CREATE POLICY "Users can view own inquiries" ON public.inquiries FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. COUPONS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','flat')),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  times_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expiry_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- Allow anyone to read active coupons (for validation at checkout)
DO $$ BEGIN
  CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. SETTINGS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- Allow anyone to read settings
DO $$ BEGIN
  CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
  ('site_name','Devki Jewels'),
  ('logo_url',''),
  ('contact_email','support@devkijewels.com'),
  ('contact_phone',''),
  ('address',''),
  ('stripe_publishable_key',''),
  ('stripe_secret_key','')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 7. ENABLE REALTIME on products & orders
-- ============================================================
-- Run these one at a time if needed:
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- 8. SET YOUR ADMIN USER
-- Replace <YOUR_USER_ID> with your actual user UUID from auth.users
-- ============================================================
-- UPDATE public.profiles SET role = 'super_admin' WHERE id = '<YOUR_USER_ID>';
