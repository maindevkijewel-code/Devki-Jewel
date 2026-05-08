-- ============================================================
-- DEVKI JEWELS — AI BACKGROUND REMOVAL MIGRATION
-- Execute this in your Supabase SQL Editor
-- ============================================================

-- Add transparent image URL field to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS transparent_image text;

-- Add status field for background removal processing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bg_removal_status text DEFAULT 'none'
  CHECK (bg_removal_status IN ('none', 'processing', 'completed', 'failed'));

-- Ensure try-on fields exist (may already be present)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS try_on_enabled boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS try_on_image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS try_on_type text DEFAULT '2d';

-- Create storage bucket for transparent images (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
