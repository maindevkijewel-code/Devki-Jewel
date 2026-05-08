-- ============================================================
-- DEVKI JEWELS — PRODUCT REVIEWS + SPECS UPGRADE
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. ADD MISSING COLUMNS TO PRODUCTS TABLE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purity text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS metal_types text[];

-- 2. PRODUCT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id text NOT NULL,
    customer_name text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    review_image text,
    is_verified boolean DEFAULT false,
    is_approved boolean DEFAULT true,
    helpful_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. RLS FOR REVIEWS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Reviews are viewable by everyone" ON public.product_reviews
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update reviews" ON public.product_reviews FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete reviews" ON public.product_reviews FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved);

-- 5. VIEW FOR REVIEW STATS (average rating + count per product)
CREATE OR REPLACE VIEW public.product_review_stats AS
SELECT
    product_id,
    COUNT(*)::int AS total_reviews,
    ROUND(AVG(rating)::numeric, 1) AS average_rating,
    COUNT(*) FILTER (WHERE rating = 5)::int AS five_star,
    COUNT(*) FILTER (WHERE rating = 4)::int AS four_star,
    COUNT(*) FILTER (WHERE rating = 3)::int AS three_star,
    COUNT(*) FILTER (WHERE rating = 2)::int AS two_star,
    COUNT(*) FILTER (WHERE rating = 1)::int AS one_star
FROM public.product_reviews
WHERE is_approved = true
GROUP BY product_id;
