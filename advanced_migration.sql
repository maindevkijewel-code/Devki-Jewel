-- DEVKI JEWELS ADVANCED MIGRATION SCRIPT
-- Execute this in your Supabase SQL Editor

-- ============================================================
-- 1. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff and admin can insert categories" ON public.categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff and admin can update categories" ON public.categories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff and admin can delete categories" ON public.categories FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. UPDATE PRODUCTS TABLE
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hover_video_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

-- ============================================================
-- 3. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-videos', 'product-videos', true) 
ON CONFLICT (id) DO NOTHING;

-- Public read access for videos
DO $$ BEGIN
  CREATE POLICY "Public access to product videos" ON storage.objects FOR SELECT USING (bucket_id = 'product-videos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin upload access for videos
DO $$ BEGIN
  CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-videos' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin update access for videos
DO $$ BEGIN
  CREATE POLICY "Admins can update videos" ON storage.objects FOR UPDATE USING (
    bucket_id = 'product-videos' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin delete access for videos
DO $$ BEGIN
  CREATE POLICY "Admins can delete videos" ON storage.objects FOR DELETE USING (
    bucket_id = 'product-videos' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
