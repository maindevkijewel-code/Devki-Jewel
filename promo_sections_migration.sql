-- ============================================================
-- DEVKI JEWELS — PROMO SECTIONS SYSTEM
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. PROMO SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.promo_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    subtitle text,
    desktop_image text NOT NULL,
    mobile_image text,
    button_text text DEFAULT 'Shop Now',
    button_link text DEFAULT '/jewellery',
    layout_type text DEFAULT 'full_width',       -- full_width | two_column | split_left | split_right | card_overlay
    display_order integer DEFAULT 0,
    background_color text DEFAULT '#FFFFFF',
    text_color text DEFAULT 'dark',              -- dark | light
    overlay_opacity numeric DEFAULT 0,           -- 0–1
    text_alignment text DEFAULT 'left',          -- left | center | right
    badge_text text,                             -- e.g. "New Arrival" | "Limited Edition"
    aspect_ratio text DEFAULT '21/8',            -- CSS aspect-ratio value
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. ROW LEVEL SECURITY
ALTER TABLE public.promo_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Promo sections are viewable by everyone" ON public.promo_sections
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert promo sections" ON public.promo_sections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update promo sections" ON public.promo_sections FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete promo sections" ON public.promo_sections FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. INDEX
CREATE INDEX IF NOT EXISTS idx_promo_sections_order ON public.promo_sections(display_order, is_active);

-- 4. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('promo-banners', 'promo-banners', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public can read promo banners" ON storage.objects
    FOR SELECT USING (bucket_id = 'promo-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can upload promo banners" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'promo-banners' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete promo banners" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'promo-banners' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_promo_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_promo_sections_updated_at ON public.promo_sections;
CREATE TRIGGER set_promo_sections_updated_at
    BEFORE UPDATE ON public.promo_sections
    FOR EACH ROW EXECUTE FUNCTION update_promo_sections_updated_at();
