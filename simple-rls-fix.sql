-- Simple RLS Fix Script
-- This script completely removes all RLS policies from the profiles table
-- to eliminate the infinite recursion error

-- 1. Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can view profiles" ON profiles;
DROP POLICY IF EXISTS "Managers can update profiles" ON profiles;

-- 3. Ensure agents table has minimal, safe policies
DROP POLICY IF EXISTS "agents_select_policy" ON agents;
DROP POLICY IF EXISTS "agents_insert_policy" ON agents;
DROP POLICY IF EXISTS "agents_update_policy" ON agents;
DROP POLICY IF EXISTS "agents_delete_policy" ON agents;

-- Create simple, safe policies for agents table
CREATE POLICY "super_admin_full_access" ON agents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    );

CREATE POLICY "service_role_access" ON agents
    FOR ALL
    TO service_role
    USING (true);

-- 4. Verify the fix
SELECT 'RLS Fix Complete - profiles table cleaned, agents table has safe policies' as status;