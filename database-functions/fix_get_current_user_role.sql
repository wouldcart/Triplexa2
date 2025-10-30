-- Fix the get_current_user_role function to use profiles table
-- This function returns the role of the currently authenticated user

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN 'guest';
    END IF;
    
    -- Get the user's role from the profiles table
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- If no role found in profiles, check user_roles table as fallback
    IF user_role IS NULL THEN
        SELECT role INTO user_role
        FROM public.user_roles
        WHERE user_id = auth.uid()
        LIMIT 1;
    END IF;
    
    -- If still no role found, return default role
    IF user_role IS NULL OR user_role = '' THEN
        RETURN 'agent';
    END IF;
    
    RETURN user_role;
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;

-- Test the function
SELECT get_current_user_role() as current_user_role;