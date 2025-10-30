
-- Fix Agent Profile Image RLS Policy Issue
-- Drop conflicting policies that use 'id = auth.uid()' instead of 'user_id = auth.uid()'

-- Drop all existing policies on agents table
DROP POLICY IF EXISTS "Users can view own agent record" ON public.agents;
DROP POLICY IF EXISTS "Users can update own agent record" ON public.agents;
DROP POLICY IF EXISTS "agents_select_own" ON public.agents;
DROP POLICY IF EXISTS "agents_update_own" ON public.agents;

-- Ensure RLS is enabled
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create correct policies using user_id (not id)
CREATE POLICY "agents_select_own" ON public.agents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "agents_update_own" ON public.agents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "service_role_full_access_agents" ON public.agents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
