-- Add department/city/country to staff and agent login tracking tables
-- Safe to run multiple times due to IF NOT EXISTS guards

-- Staff tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_login_records' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.staff_login_records ADD COLUMN department text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_login_records' AND column_name = 'city'
  ) THEN
    ALTER TABLE public.staff_login_records ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_login_records' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.staff_login_records ADD COLUMN country text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_active_sessions' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.staff_active_sessions ADD COLUMN department text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_active_sessions' AND column_name = 'city'
  ) THEN
    ALTER TABLE public.staff_active_sessions ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_active_sessions' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.staff_active_sessions ADD COLUMN country text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_staff_login_records_department ON public.staff_login_records (department);
CREATE INDEX IF NOT EXISTS idx_staff_login_records_city ON public.staff_login_records (city);
CREATE INDEX IF NOT EXISTS idx_staff_login_records_country ON public.staff_login_records (country);

-- Agent tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_login_records' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.agent_login_records ADD COLUMN department text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_login_records' AND column_name = 'city'
  ) THEN
    ALTER TABLE public.agent_login_records ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_login_records' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.agent_login_records ADD COLUMN country text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_active_sessions' AND column_name = 'department'
  ) THEN
    ALTER TABLE public.agent_active_sessions ADD COLUMN department text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_active_sessions' AND column_name = 'city'
  ) THEN
    ALTER TABLE public.agent_active_sessions ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_active_sessions' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.agent_active_sessions ADD COLUMN country text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_login_records_department ON public.agent_login_records (department);
CREATE INDEX IF NOT EXISTS idx_agent_login_records_city ON public.agent_login_records (city);
CREATE INDEX IF NOT EXISTS idx_agent_login_records_country ON public.agent_login_records (country);