-- Migration: Add mobile_thumbnail_image to collections
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS mobile_thumbnail_image TEXT;
