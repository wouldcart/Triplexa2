BEGIN;

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for username if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='profiles' AND indexname='profiles_username_idx'
  ) THEN
    EXECUTE 'CREATE INDEX profiles_username_idx ON public.profiles (username)';
  END IF;
END$$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies to avoid duplicates
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Grant basic table privileges (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Maintain updated_at via trigger
CREATE OR REPLACE FUNCTION public.profiles_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_set_updated_at();

-- RPC: get or create current user's profile
CREATE OR REPLACE FUNCTION public.get_or_create_my_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.profiles;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is null';
  END IF;

  INSERT INTO public.profiles (id)
  VALUES (uid)
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO p FROM public.profiles WHERE id = uid;
  RETURN p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_my_profile() TO authenticated;

-- RPC: update current user's profile via a JSON patch
CREATE OR REPLACE FUNCTION public.update_my_profile(patch jsonb)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.profiles;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is null';
  END IF;

  UPDATE public.profiles
  SET
    username = COALESCE(patch->>'username', username),
    full_name = COALESCE(patch->>'full_name', full_name),
    avatar_url = COALESCE(patch->>'avatar_url', avatar_url),
    website = COALESCE(patch->>'website', website),
    raw_user_meta_data = COALESCE(patch->'raw_user_meta_data', raw_user_meta_data),
    updated_at = now()
  WHERE id = uid
  RETURNING * INTO p;

  RETURN p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated;

COMMIT;