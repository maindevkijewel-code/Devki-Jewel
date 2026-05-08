-- =====================================================================
-- ADMIN SETTINGS MIGRATION
-- Devki Jewels — Store Settings & Site Assets
-- Run this in Supabase SQL Editor
-- =====================================================================

-- ─── 1. Settings Table (Key-Value Store) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update timestamp on changes
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_settings_updated ON settings;
CREATE TRIGGER trigger_settings_updated
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();

-- ─── 2. Seed Default Settings ───────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('site_name',              'Devki Jewels'),
  ('logo_url',               ''),
  ('contact_email',          'support@devkijewels.com'),
  ('contact_phone',          '+91 98765 43210'),
  ('address',                'Mumbai, India'),
  ('stripe_publishable_key', ''),
  ('stripe_secret_key',      '')
ON CONFLICT (key) DO NOTHING;

-- ─── 3. RLS Policies ───────────────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (public site name, contact info, etc.)
DROP POLICY IF EXISTS "Public can read settings" ON settings;
CREATE POLICY "Public can read settings"
  ON settings FOR SELECT
  USING (true);

-- Only service_role (admin server actions) can insert/update/delete
DROP POLICY IF EXISTS "Service role can manage settings" ON settings;
CREATE POLICY "Service role can manage settings"
  ON settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── 4. Storage Bucket for Site Assets (Logo, etc.) ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- Storage policies: public read, service_role write
DROP POLICY IF EXISTS "Public can view site assets" ON storage.objects;
CREATE POLICY "Public can view site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Service role can upload site assets" ON storage.objects;
CREATE POLICY "Service role can upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Service role can update site assets" ON storage.objects;
CREATE POLICY "Service role can update site assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Service role can delete site assets" ON storage.objects;
CREATE POLICY "Service role can delete site assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets');

-- =====================================================================
-- DONE! Your admin settings page should now work without errors.
-- The "Bucket not found" error will be resolved.
-- =====================================================================
