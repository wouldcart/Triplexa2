-- Adds staff working hours (with per-day shifts) and performance targets tables
-- Designed to integrate with existing public.staff (FK to profiles)

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- staff_working_hours: one row per staff per day_of_week with JSON shifts
CREATE TABLE IF NOT EXISTS public.staff_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_working boolean NOT NULL DEFAULT false,
  shifts jsonb NOT NULL DEFAULT '[]'::jsonb,
  timezone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_working_hours_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE,
  CONSTRAINT staff_working_hours_unique_day UNIQUE (staff_id, day_of_week)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_staff_working_hours_staff ON public.staff_working_hours(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_working_hours_day ON public.staff_working_hours(day_of_week);

-- staff_targets: performance targets associated with a staff member
CREATE TABLE IF NOT EXISTS public.staff_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'revenue', 'enquiries', 'conversions', 'response-time', 'satisfaction',
    'bookings', 'efficiency', 'tickets', 'first-call-resolution', 'accuracy', 'processing-time'
  )),
  value numeric NOT NULL,
  achieved numeric DEFAULT 0,
  period text NOT NULL CHECK (period IN ('daily','weekly','monthly','quarterly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','overdue')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_targets_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_staff_targets_staff ON public.staff_targets(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_targets_period ON public.staff_targets(period);
CREATE INDEX IF NOT EXISTS idx_staff_targets_status ON public.staff_targets(status);

-- Basic grants for application usage (RLS can be added later if needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_working_hours TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_targets TO authenticated;

-- Updated_at auto-update trigger function (idempotent create)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_staff_working_hours_set_updated_at'
  ) THEN
    CREATE TRIGGER tr_staff_working_hours_set_updated_at
    BEFORE UPDATE ON public.staff_working_hours
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_staff_targets_set_updated_at'
  ) THEN
    CREATE TRIGGER tr_staff_targets_set_updated_at
    BEFORE UPDATE ON public.staff_targets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;