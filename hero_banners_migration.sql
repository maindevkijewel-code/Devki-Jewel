-- ============================================================
-- DEVKI JEWELS — HERO BANNERS SYSTEM
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. HERO BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    subtitle text,
    desktop_image text NOT NULL,
    mobile_image text,
    button_text text DEFAULT 'Shop Now',
    button_link text DEFAULT '/jewellery',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Extra luxury fields
    overlay_opacity numeric DEFAULT 0,  -- 0 to 1, for text readability
    text_color text DEFAULT 'dark',     -- 'dark' | 'light'
    badge_text text                     -- Optional badge like "New Collection"
);

-- 2. ROW LEVEL SECURITY
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- Public read
DO $$ BEGIN
  CREATE POLICY "Hero banners are viewable by everyone" ON public.hero_banners
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Staff write
DO $$ BEGIN
  CREATE POLICY "Staff can insert banners" ON public.hero_banners FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update banners" ON public.hero_banners FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete banners" ON public.hero_banners FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. INDEX
CREATE INDEX IF NOT EXISTS idx_hero_banners_order ON public.hero_banners(display_order, is_active);

-- 4. STORAGE BUCKET
-- Run this to create the storage bucket if it doesn't exist:
-- (Supabase Storage policies must be set in the dashboard or via this SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-banners', 'hero-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on hero-banners bucket
DO $$ BEGIN
  CREATE POLICY "Public can read hero banners" ON storage.objects
    FOR SELECT USING (bucket_id = 'hero-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow staff to upload
DO $$ BEGIN
  CREATE POLICY "Staff can upload hero banners" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'hero-banners' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete hero banners" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'hero-banners' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_hero_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_hero_banners_updated_at ON public.hero_banners;
CREATE TRIGGER set_hero_banners_updated_at
    BEFORE UPDATE ON public.hero_banners
    FOR EACH ROW EXECUTE FUNCTION update_hero_banners_updated_at();
