-- Transport Routes Migration Script
-- Run this in Supabase SQL Editor

-- Step 1: Add new columns to transport_routes table
DO $$ 
BEGIN
  -- Add created_by_user column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transport_routes' 
    AND column_name = 'created_by_user'
  ) THEN
    ALTER TABLE public.transport_routes 
    ADD COLUMN created_by_user UUID REFERENCES auth.users(id);
    
    COMMENT ON COLUMN public.transport_routes.created_by_user 
    IS 'User who created this route';
  END IF;

  -- Add updated_by_user column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transport_routes' 
    AND column_name = 'updated_by_user'
  ) THEN
    ALTER TABLE public.transport_routes 
    ADD COLUMN updated_by_user UUID REFERENCES auth.users(id);
    
    COMMENT ON COLUMN public.transport_routes.updated_by_user 
    IS 'User who last updated this route';
  END IF;

  -- Add is_active boolean column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transport_routes' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.transport_routes 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    
    COMMENT ON COLUMN public.transport_routes.is_active 
    IS 'Boolean status: true for active, false for inactive';
  END IF;
END $$;

-- Step 2: Migrate existing status data to boolean
UPDATE public.transport_routes 
SET is_active = CASE 
  WHEN status = 'active' OR status::text = 'true' THEN true
  WHEN status = 'inactive' OR status::text = 'false' THEN false
  ELSE true -- Default to active for any other values
END
WHERE is_active IS NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transport_routes_is_active 
ON public.transport_routes(is_active);

CREATE INDEX IF NOT EXISTS idx_transport_routes_created_by_user 
ON public.transport_routes(created_by_user);

CREATE INDEX IF NOT EXISTS idx_transport_routes_updated_by_user 
ON public.transport_routes(updated_by_user);

-- Step 4: Add updated_at trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_transport_routes_updated_at'
  ) THEN
    CREATE TRIGGER update_transport_routes_updated_at
      BEFORE UPDATE ON public.transport_routes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 5: Verify the migration
SELECT 
  'Migration Summary' as info,
  COUNT(*) as total_routes,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_routes,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_routes,
  COUNT(created_by_user) as routes_with_creator,
  COUNT(updated_by_user) as routes_with_updater
FROM public.transport_routes;

-- Show sample data
SELECT 
  id,
  name,
  status as old_status,
  is_active as new_status,
  created_by_user,
  updated_by_user,
  created_at,
  updated_at
FROM public.transport_routes 
LIMIT 5;