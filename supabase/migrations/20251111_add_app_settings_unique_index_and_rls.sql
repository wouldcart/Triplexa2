-- Ensure unique constraint for upsert and basic RLS on app_settings
-- Date: 2025-11-11

-- Create a unique index on (category, setting_key) so PostgREST upsert with
-- onConflict: 'category,setting_key' works correctly.
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_category_setting_key_uniq
  ON public.app_settings (category, setting_key);

-- Helpful indexes for common queries
CREATE INDEX IF NOT EXISTS app_settings_category_idx
  ON public.app_settings (category);
CREATE INDEX IF NOT EXISTS app_settings_active_idx
  ON public.app_settings (is_active);

-- Enable RLS and grant privileges to authenticated users
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Allow authenticated users to read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to modify app_settings" ON public.app_settings;

-- Read policy for authenticated
CREATE POLICY "Allow authenticated users to read app_settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Write policy for authenticated (insert, update, delete)
CREATE POLICY "Allow authenticated users to modify app_settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant table privileges (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;