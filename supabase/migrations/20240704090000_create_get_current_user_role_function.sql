-- Early definition of get_current_user_role used by RLS policies
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN 'guest';
    END IF;

    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF user_role IS NULL THEN
        RETURN 'user';
    END IF;

    RETURN user_role;
END;
$$;

GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated, anon;