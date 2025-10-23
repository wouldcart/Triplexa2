-- Add currency columns to hotels table
-- This migration adds `currency` and `currency_symbol` to support per-hotel pricing display

DO $$
BEGIN
  -- Add currency code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'hotels' 
      AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.hotels 
      ADD COLUMN currency TEXT;
    COMMENT ON COLUMN public.hotels.currency IS 'ISO currency code used for hotel pricing (e.g., AED, USD)';
  END IF;

  -- Add currency symbol column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'hotels' 
      AND column_name = 'currency_symbol'
  ) THEN
    ALTER TABLE public.hotels 
      ADD COLUMN currency_symbol TEXT;
    COMMENT ON COLUMN public.hotels.currency_symbol IS 'Currency symbol used for hotel pricing (e.g., د.إ, $)';
  END IF;
END $$;

-- Optional indexes for filtering/searching by currency
CREATE INDEX IF NOT EXISTS idx_hotels_currency ON public.hotels(currency);