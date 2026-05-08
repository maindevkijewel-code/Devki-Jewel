-- ============================================================
-- DEVKI JEWELS — MOBILE HERO BANNERS
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mobile_hero_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mobile_hero_banners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read mobile banners" ON public.mobile_hero_banners
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert mobile banners" ON public.mobile_hero_banners
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update mobile banners" ON public.mobile_hero_banners
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete mobile banners" ON public.mobile_hero_banners
    FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_mobile_hero_banners_order ON public.mobile_hero_banners(sort_order, is_active);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mobile-hero-banners', 'mobile-hero-banners', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public can read mobile hero banners" ON storage.objects
    FOR SELECT USING (bucket_id = 'mobile-hero-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can upload mobile hero banners" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'mobile-hero-banners' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete mobile hero banners" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'mobile-hero-banners' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
