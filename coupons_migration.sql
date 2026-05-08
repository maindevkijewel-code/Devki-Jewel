-- ============================================================
-- DEVKI JEWELS — COUPONS SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_discount_limit numeric,
  expiry_date timestamptz,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: Track coupon usage per user/order
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id text, -- Can be linked to an orders table later
  discount_applied numeric NOT NULL,
  used_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coupons for validation/listing
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Allow admins full access (assuming admin check via JWT or similar, placeholder rule for now)
CREATE POLICY "Admin full access coupons" ON public.coupons
  FOR ALL USING (true);

CREATE POLICY "Admin full access coupon usage" ON public.coupon_usage
  FOR ALL USING (true);
