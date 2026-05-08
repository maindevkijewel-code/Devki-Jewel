-- ==========================================
-- VIRTUAL TRY-ON MIGRATION
-- Execute this in your Supabase SQL Editor
-- ==========================================

-- 1. Add try-on columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS try_on_image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS try_on_type TEXT DEFAULT '2d';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS try_on_enabled BOOLEAN DEFAULT false;

-- 2. Create try-on analytics/logs table
CREATE TABLE IF NOT EXISTS public.try_on_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on try_on_logs
ALTER TABLE public.try_on_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can insert try-on logs (even anonymous users)
CREATE POLICY "Anyone can insert try_on_logs"
  ON public.try_on_logs FOR INSERT WITH CHECK (true);

-- Only authenticated users can view their own logs
CREATE POLICY "Users can view their own try_on_logs"
  ON public.try_on_logs FOR SELECT USING (auth.uid() = user_id);

-- 3. Insert default try-on settings into the settings table
INSERT INTO public.settings (key, value) VALUES
  ('tryon_global_enabled', 'true'),
  ('tryon_choker_y_offset', '-0.15'),
  ('tryon_necklace_y_offset', '-0.25'),
  ('tryon_earring_scaling', '1.0'),
  ('tryon_camera_guide_url', '')
ON CONFLICT (key) DO NOTHING;
