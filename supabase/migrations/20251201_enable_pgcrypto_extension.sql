-- Enable pgcrypto extension for password hashing
-- This migration ensures pgcrypto is available for agent authentication

-- Drop extension if it exists and recreate it
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto WITH SCHEMA public;

-- Grant usage on the extension functions to authenticated and anonymous users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Test that pgcrypto functions are available
DO $$
BEGIN
  -- Test gen_salt function with explicit schema
  PERFORM public.gen_salt('bf');
  
  -- Test crypt function with explicit schema
  PERFORM public.crypt('test', public.gen_salt('bf'));
  
  RAISE NOTICE 'pgcrypto extension is working correctly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'pgcrypto extension test failed: %', SQLERRM;
END;
$$;