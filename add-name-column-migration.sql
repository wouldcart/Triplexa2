-- Add name column to transport_routes table
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transport_routes' 
    AND column_name = 'name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.transport_routes 
    ADD COLUMN name TEXT NOT NULL DEFAULT '';
    
    COMMENT ON COLUMN public.transport_routes.name 
    IS 'Display name for the transport route (used by frontend)';
    
    -- Update existing records to use route_name as name if name is empty
    UPDATE public.transport_routes 
    SET name = COALESCE(route_name, '') 
    WHERE name = '' OR name IS NULL;
    
    RAISE NOTICE 'Successfully added name column to transport_routes table';
  ELSE
    RAISE NOTICE 'Column name already exists in transport_routes table';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'transport_routes' 
  AND table_schema = 'public'
  AND column_name = 'name';

-- Show sample data to verify
SELECT 
  id,
  name,
  route_name,
  origin,
  destination
FROM public.transport_routes 
LIMIT 3;