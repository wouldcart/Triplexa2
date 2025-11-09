-- Create sightseeing table for inventory management
-- Uses bigserial id to align with existing number-based IDs in frontend

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sightseeing'
  ) THEN
    CREATE TABLE public.sightseeing (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      category TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      image_url TEXT,
      images JSONB,
      activities JSONB,
      duration TEXT,
      transfer_types JSONB,
      transfer_options JSONB,
      address TEXT,
      google_map_link TEXT,
      latitude NUMERIC,
      longitude NUMERIC,
      price JSONB,
      difficulty_level TEXT,
      season TEXT,
      allowed_age_group TEXT,
      days_of_week JSONB,
      timing TEXT,
      pickup_time TEXT,
      package_options JSONB,
      group_size_options JSONB,
      pricing_options JSONB,
      other_inclusions TEXT,
      advisory TEXT,
      cancellation_policy TEXT,
      refund_policy TEXT,
      confirmation_policy TEXT,
      terms_conditions TEXT,
      is_free BOOLEAN DEFAULT FALSE,
      policies JSONB,
      validity_period JSONB,
      is_expired BOOLEAN DEFAULT FALSE,
      expiration_notified BOOLEAN DEFAULT FALSE,
      currency TEXT,
      sic_available BOOLEAN DEFAULT FALSE,
      sic_pricing JSONB,
      requires_mandatory_transfer BOOLEAN DEFAULT FALSE,
      transfer_mandatory BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
      last_updated TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Indexes for common filters
    CREATE INDEX IF NOT EXISTS idx_sightseeing_status ON public.sightseeing(status);
    CREATE INDEX IF NOT EXISTS idx_sightseeing_country_city ON public.sightseeing(country, city);
  END IF;
END $$;

-- Ensure status values are constrained to known states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sightseeing_status_check'
  ) THEN
    ALTER TABLE public.sightseeing
    ADD CONSTRAINT sightseeing_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Trigger to auto-update last_updated on row change
CREATE OR REPLACE FUNCTION public.update_sightseeing_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_sightseeing_last_updated'
  ) THEN
    CREATE TRIGGER trg_update_sightseeing_last_updated
    BEFORE UPDATE ON public.sightseeing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sightseeing_last_updated();
  END IF;
END $$;