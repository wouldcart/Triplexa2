-- Staff table and sync from profiles (idempotent, error-free)

-- 1) Create staff table (with FK to profiles)
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  department text,
  role text NOT NULL,
  status text DEFAULT 'active',
  employee_id text UNIQUE,
  join_date date,
  reporting_manager text,
  date_of_birth date,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT staff_email_key UNIQUE (email),
  CONSTRAINT staff_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);

-- 2) Helpful index
CREATE INDEX IF NOT EXISTS staff_status_idx ON public.staff USING btree (status);

-- 3) Ensure FK exists when table pre-existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_id_fkey'
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id);
  END IF;
END
$$;

-- 4) Ensure role is NOT NULL if table existed with nullable role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'role' AND is_nullable = 'YES'
  ) THEN
    UPDATE public.staff SET role = COALESCE(role, 'staff') WHERE role IS NULL;
    ALTER TABLE public.staff ALTER COLUMN role SET NOT NULL;
  END IF;
END
$$;

-- 5) Upsert staff whenever profiles are inserted/updated for staff/manager/hr_manager
CREATE OR REPLACE FUNCTION public.profiles_to_staff_sync()
RETURNS trigger AS $$
BEGIN
  -- Prevent recursion loops
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Only load staff for relevant roles
  IF NEW.role IS NULL OR NEW.role NOT IN ('staff','manager','hr_manager') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.staff (
    id, name, email, phone, department, role, status, employee_id, updated_at
  ) VALUES (
    NEW.id, NEW.name, NEW.email, NEW.phone, NEW.department, NEW.role,
    COALESCE(NEW.status, 'active'), NEW.employee_id, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    employee_id = EXCLUDED.employee_id,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) Attach trigger on profiles (matches your provided trigger name)
DROP TRIGGER IF EXISTS trg_profiles_to_staff_sync ON public.profiles;
CREATE TRIGGER trg_profiles_to_staff_sync
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_to_staff_sync();

-- 7) Optional: keep staff.updated_at fresh if helper exists
DO $$
BEGIN
  IF to_regproc('public.update_updated_at_column') IS NULL THEN
    RAISE NOTICE 'Function public.update_updated_at_column not found; skipping staff updated_at trigger.';
  ELSE
    EXECUTE 'DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff';
    EXECUTE 'CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END
$$;