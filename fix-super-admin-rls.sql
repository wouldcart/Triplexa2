-- Fix RLS Policies for Super Admin Access
-- This script ensures super admin users have full access to profiles and agents tables

-- First, let's check current policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'agents')
ORDER BY tablename, policyname;

-- Drop existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- Create new, safe RLS policies for profiles table
-- 1. Super admins can do everything
CREATE POLICY "Super admins have full access to profiles" ON public.profiles
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    );

-- 2. Users can view and update their own profile (non-recursive)
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL 
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 3. Service role has full access (for admin operations)
CREATE POLICY "Service role full access to profiles" ON public.profiles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Now fix agents table policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.agents;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.agents;

-- Create new RLS policies for agents table
-- 1. Super admins can do everything
CREATE POLICY "Super admins have full access to agents" ON public.agents
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
    );

-- 2. Managers can view and manage agents
CREATE POLICY "Managers can manage agents" ON public.agents
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('manager', 'hr_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('manager', 'hr_manager')
        )
    );

-- 3. Staff can view agents (read-only)
CREATE POLICY "Staff can view agents" ON public.agents
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'staff'
        )
    );

-- 4. Agents can view their own record
CREATE POLICY "Agents can view own record" ON public.agents
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid());

-- 5. Service role has full access
CREATE POLICY "Service role full access to agents" ON public.agents
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Verify the new policies
SELECT 
    'After fix:' as status,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'agents')
ORDER BY tablename, policyname;