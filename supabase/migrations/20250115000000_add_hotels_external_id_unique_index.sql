-- Add unique index for external_id in hotels table
-- This ensures external_id values are unique when not null

CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_external_id 
ON public.hotels (external_id) 
WHERE external_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_hotels_external_id IS 'Unique index on hotels.external_id to ensure uniqueness of auto-generated external IDs';