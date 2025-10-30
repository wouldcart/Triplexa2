-- Secure RPC to check if a user exists by phone
-- Normalizes phone to digits-only and checks both auth.users.phone and profiles.phone
CREATE OR REPLACE FUNCTION public.check_user_exists_by_phone(p_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
  v_norm text;
BEGIN
  -- Normalize to digits-only
  v_norm := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

  -- First check auth.users.phone
  SELECT u.id INTO v_id
  FROM auth.users u
  WHERE regexp_replace(coalesce(u.phone, ''), '\D', '', 'g') = v_norm
  LIMIT 1;

  -- Fallback: check profiles.phone (if available)
  IF v_id IS NULL THEN
    SELECT p.id::uuid INTO v_id
    FROM public.profiles p
    WHERE regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = v_norm
    LIMIT 1;
  END IF;

  RETURN json_build_object(
    'exists', v_id IS NOT NULL,
    'id', v_id,
    'phone', p_phone
  );
END;
$$;

COMMENT ON FUNCTION public.check_user_exists_by_phone(text) IS 'Security definer RPC to check if a user exists by phone via auth.users and profiles';