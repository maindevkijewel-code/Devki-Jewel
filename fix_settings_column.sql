-- =====================================================================
-- FIX: Add missing updated_at column to existing settings table
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Add the missing column (safe if it already exists)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Recreate the trigger cleanly
DROP TRIGGER IF EXISTS trigger_settings_updated ON settings;

CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_settings_updated
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();

-- =====================================================================
-- DONE! Now "Save Settings" will work without the field error.
-- =====================================================================
