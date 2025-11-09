-- Minimal hotels table to support subsequent index migrations
CREATE TABLE IF NOT EXISTS public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id integer,
  name text,
  country text,
  city text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);