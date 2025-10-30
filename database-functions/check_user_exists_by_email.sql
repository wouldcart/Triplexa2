-- Secure RPC to check if a user exists by email
-- Uses auth.users and runs as SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT u.id INTO v_id
  FROM auth.users u
  WHERE lower(u.email) = lower(p_email)
  LIMIT 1;

  RETURN json_build_object(
    'exists', v_id IS NOT NULL,
    'id', v_id,
    'email', p_email
  );
END;
$$;

COMMENT ON FUNCTION public.check_user_exists_by_email(text) IS 'Security definer RPC to check if a user exists by email via auth.users';