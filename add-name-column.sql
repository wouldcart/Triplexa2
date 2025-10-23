-- Add missing 'name' column to transport_routes table
-- This column is required by the frontend transportRoutesService.ts

ALTER TABLE public.transport_routes 
ADD COLUMN name TEXT NOT NULL DEFAULT '';

-- Update existing records to populate the name field with route_name
UPDATE public.transport_routes 
SET name = route_name 
WHERE name = '' OR name IS NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.transport_routes.name IS 'Route display name used by frontend, typically derived from start and end locations';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'transport_routes' 
AND column_name = 'name';