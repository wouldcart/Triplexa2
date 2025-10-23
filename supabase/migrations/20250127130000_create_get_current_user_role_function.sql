-- Create the get_current_user_role function
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
    
    -- Get the user's role from the user_roles table
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- If no role found, return default role
    IF user_role IS NULL THEN
        RETURN 'user';
    END IF;
    
    RETURN user_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;