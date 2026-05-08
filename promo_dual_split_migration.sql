-- ============================================================
-- DEVKI JEWELS — DUAL SPLIT BANNER UPGRADE
-- Run this in your Supabase SQL Editor
-- Adds right-side columns for split layouts
-- ============================================================

-- RIGHT-SIDE IMAGE COLUMNS
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_desktop_image text;
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_mobile_image text;

-- RIGHT-SIDE CONTENT COLUMNS
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_title text;
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_subtitle text;
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_button_text text;
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_button_link text;
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_text_color text DEFAULT 'dark';
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_text_alignment text DEFAULT 'left';
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_overlay_opacity numeric DEFAULT 0;
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS right_badge_text text;

-- SPLIT RATIO + MOBILE BEHAVIOR
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS layout_ratio text DEFAULT '50/50';
ALTER TABLE public.promo_sections ADD COLUMN IF NOT EXISTS mobile_behavior text DEFAULT 'stack';
