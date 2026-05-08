-- DEVKI JEWELS — COLLECTIONS SYSTEM MIGRATION
-- Execute this in your Supabase SQL Editor

-- ============================================================
-- 1. COLLECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    subtitle text,
    description text,
    story text, -- long-form storytelling content
    thumbnail_image text,
    banner_image text,
    hover_image text,
    video_url text,
    is_featured boolean DEFAULT false,
    is_trending boolean DEFAULT false,
    is_active boolean DEFAULT true,
    show_on_homepage boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    seo_title text,
    seo_description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Everyone can view active collections
DO $$ BEGIN
  CREATE POLICY "Collections are viewable by everyone" ON public.collections FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin CRUD policies
DO $$ BEGIN
  CREATE POLICY "Staff can insert collections" ON public.collections FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update collections" ON public.collections FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete collections" ON public.collections FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. COLLECTION ↔ PRODUCT JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collection_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id text REFERENCES public.products(id) ON DELETE CASCADE,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(collection_id, product_id)
);

ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Collection products viewable by everyone" ON public.collection_products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can insert collection products" ON public.collection_products FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can update collection products" ON public.collection_products FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete collection products" ON public.collection_products FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_homepage ON public.collections(show_on_homepage);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_collections_sort ON public.collections(sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product ON public.collection_products(product_id);

-- ============================================================
-- 4. STORAGE BUCKET for collection media
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collection-media', 'collection-media', true) 
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public access to collection media" ON storage.objects FOR SELECT USING (bucket_id = 'collection-media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can upload collection media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'collection-media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update collection media" ON storage.objects FOR UPDATE USING (
    bucket_id = 'collection-media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete collection media" ON storage.objects FOR DELETE USING (
    bucket_id = 'collection-media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
