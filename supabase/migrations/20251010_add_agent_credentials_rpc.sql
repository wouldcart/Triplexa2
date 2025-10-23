-- Enable required extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table to store agent credentials if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_credentials (
  agent_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_temporary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to update updated_at (create if missing)
CREATE OR REPLACE FUNCTION public.handle_updated_at_generic()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on agent_credentials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_agent_credentials_updated_at'
  ) THEN
    CREATE TRIGGER handle_agent_credentials_updated_at
    BEFORE UPDATE ON public.agent_credentials
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at_generic();
  END IF;
END $$;

-- Secure RPC to set agent credentials (upsert)
CREATE OR REPLACE FUNCTION public.set_agent_credentials(
  p_id UUID,
  p_username TEXT,
  p_password TEXT,
  p_is_temporary BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hashed TEXT;
BEGIN
  IF p_id IS NULL OR p_username IS NULL OR p_password IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Hash the password using pgcrypto
  hashed := crypt(p_password, gen_salt('bf'));

  -- Upsert credentials; user name stored in lowercase for consistency
  INSERT INTO public.agent_credentials(agent_id, username, password_hash, is_temporary)
  VALUES (p_id, lower(p_username), hashed, COALESCE(p_is_temporary, false))
  ON CONFLICT (agent_id) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    is_temporary = EXCLUDED.is_temporary,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_agent_credentials(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_agent_credentials(UUID, TEXT, TEXT, BOOLEAN) TO anon;