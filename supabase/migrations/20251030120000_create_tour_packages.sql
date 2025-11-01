-- Create tour_packages table and indexes
CREATE TABLE IF NOT EXISTS public.tour_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text NULL,
  name text NOT NULL,
  summary text NULL,
  description text NULL,
  min_pax integer NOT NULL,
  max_pax integer NULL,
  days integer NOT NULL,
  nights integer NOT NULL,
  is_fixed_departure boolean NULL DEFAULT false,
  departure_date date NULL,
  return_date date NULL,
  total_seats integer NULL,
  start_city text NULL,
  end_city text NULL,
  destinations jsonb NULL DEFAULT '[]'::jsonb,
  package_type text NOT NULL,
  themes jsonb NULL DEFAULT '[]'::jsonb,
  banners jsonb NULL DEFAULT '[]'::jsonb,
  itinerary jsonb NULL DEFAULT '[]'::jsonb,
  base_cost numeric(10, 2) NOT NULL DEFAULT 0,
  markup numeric(10, 2) NOT NULL DEFAULT 0,
  commission numeric(10, 2) NULL,
  final_price numeric(10, 2) NOT NULL DEFAULT 0,
  price_per_person numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL,
  inclusions text NULL,
  exclusions text NULL,
  cancellation_policy text NULL,
  payment_policy text NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  CONSTRAINT tour_packages_pkey PRIMARY KEY (id),
  CONSTRAINT tour_packages_package_type_check CHECK (
    package_type = ANY (ARRAY['domestic'::text, 'international'::text, 'custom'::text, 'inbound'::text])
  ),
  CONSTRAINT tour_packages_status_check CHECK (
    status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])
  )
);

CREATE INDEX IF NOT EXISTS idx_tour_packages_status ON public.tour_packages USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tour_packages_type ON public.tour_packages USING btree (package_type);