-- =====================================================
-- Profiles Table Setup and Auto-Population Triggers
-- =====================================================

-- Create the profiles table with all specified columns and constraints
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    name text NULL,
    email text NULL,
    role text NULL DEFAULT ''::text,
    department text NULL,
    phone text NULL,
    status text NULL DEFAULT ''::text,
    position text NULL,
    employee_id text NULL,
    created_at timestamp without time zone NULL DEFAULT now(),
    updated_at timestamp without time zone NULL DEFAULT now(),
    company_name text NULL,
    avatar text NULL,
    preferred_language text NULL,
    country text NULL,
    city text NULL,
    must_change_password boolean NULL DEFAULT false,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
    -- REMOVED: CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS profiles_employee_id_idx ON public.profiles USING btree (employee_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS profiles_department_idx ON public.profiles USING btree (department) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles USING btree (status) TABLESPACE pg_default;

-- =====================================================
-- Trigger Function: Auto-create profile on auth user creation
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert a new profile record when a new auth user is created
    INSERT INTO public.profiles (
        id,
        email,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table to auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Trigger Function: Sync agent data from profile updates
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_agent_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function can be customized based on your agent table structure
    -- For now, it's a placeholder that can be extended as needed
    
    -- Example: Update an agents table if it exists
    -- UPDATE public.agents 
    -- SET 
    --     name = NEW.name,
    --     email = NEW.email,
    --     phone = NEW.phone,
    --     updated_at = NOW()
    -- WHERE user_id = NEW.id;
    
    -- Log the profile change (optional)
    RAISE NOTICE 'Profile updated for user ID: %', NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger on profiles table for syncing agent data
DROP TRIGGER IF EXISTS sync_agent_from_profile ON public.profiles;
CREATE TRIGGER sync_agent_from_profile
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_agent_from_profile();

-- =====================================================
-- Function: Update updated_at timestamp automatically
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Enable Row Level Security (RLS) for profiles table
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow service role to manage all profiles (for admin functions)
CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role')
    WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- =====================================================
-- Grant necessary permissions
-- =====================================================

-- Grant usage on the profiles table to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Grant usage on the trigger functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_agent_from_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles table that automatically syncs with auth.users';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to auto-create profile when new auth user is created';
COMMENT ON FUNCTION public.sync_agent_from_profile() IS 'Trigger function to sync agent data when profile is updated';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to automatically update the updated_at timestamp';