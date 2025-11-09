-- Agent Login Tracking Schema and Policies
-- Mirrors staff login tracking with agent-specific tables

-- Create agent_login_records table
CREATE TABLE IF NOT EXISTS public.agent_login_records (
  id TEXT PRIMARY KEY,
  agent_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  login_time TIMESTAMPTZ NOT NULL,
  logout_time TIMESTAMPTZ NULL,
  duration_minutes INTEGER NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'logged-out')),
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agent_active_sessions table
CREATE TABLE IF NOT EXISTS public.agent_active_sessions (
  agent_id UUID PRIMARY KEY,
  agent_name TEXT NOT NULL,
  login_time TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status = 'active'),
  login_record_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_agent_login_record
    FOREIGN KEY (login_record_id)
    REFERENCES public.agent_login_records (id)
    ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_login_records_agent_id ON public.agent_login_records (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_login_records_login_time ON public.agent_login_records (login_time DESC);
CREATE INDEX IF NOT EXISTS idx_agent_active_sessions_last_activity ON public.agent_active_sessions (last_activity DESC);

-- Enable Row Level Security
ALTER TABLE public.agent_login_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_active_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: allow agents to view and manage their own data
DROP POLICY IF EXISTS agent_select_own_login_records ON public.agent_login_records;
CREATE POLICY agent_select_own_login_records
  ON public.agent_login_records
  FOR SELECT
  USING (agent_id = auth.uid());

DROP POLICY IF EXISTS agent_insert_own_login_records ON public.agent_login_records;
CREATE POLICY agent_insert_own_login_records
  ON public.agent_login_records
  FOR INSERT
  WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS agent_update_own_login_records ON public.agent_login_records;
CREATE POLICY agent_update_own_login_records
  ON public.agent_login_records
  FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS agent_select_own_active_sessions ON public.agent_active_sessions;
CREATE POLICY agent_select_own_active_sessions
  ON public.agent_active_sessions
  FOR SELECT
  USING (agent_id = auth.uid());

DROP POLICY IF EXISTS agent_upsert_own_active_sessions ON public.agent_active_sessions;
CREATE POLICY agent_upsert_own_active_sessions
  ON public.agent_active_sessions
  FOR INSERT
  WITH CHECK (agent_id = auth.uid());

DROP POLICY IF EXISTS agent_update_own_active_sessions ON public.agent_active_sessions;
CREATE POLICY agent_update_own_active_sessions
  ON public.agent_active_sessions
  FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Staff/admin visibility across agents for reporting
DROP POLICY IF EXISTS staff_admin_select_all_agent_login_records ON public.agent_login_records;
CREATE POLICY staff_admin_select_all_agent_login_records
  ON public.agent_login_records
  FOR SELECT
  USING (get_current_user_role() IN ('admin', 'manager', 'hr_manager', 'super_admin', 'staff'));

DROP POLICY IF EXISTS staff_admin_select_all_agent_active_sessions ON public.agent_active_sessions;
CREATE POLICY staff_admin_select_all_agent_active_sessions
  ON public.agent_active_sessions
  FOR SELECT
  USING (get_current_user_role() IN ('admin', 'manager', 'hr_manager', 'super_admin', 'staff'));

-- Staff/admin can manage records if needed (optional)
DROP POLICY IF EXISTS staff_admin_manage_agent_login_records ON public.agent_login_records;
CREATE POLICY staff_admin_manage_agent_login_records
  ON public.agent_login_records
  FOR ALL
  USING (get_current_user_role() IN ('admin', 'manager', 'hr_manager', 'super_admin'))
  WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'hr_manager', 'super_admin'));

DROP POLICY IF EXISTS staff_admin_manage_agent_active_sessions ON public.agent_active_sessions;
CREATE POLICY staff_admin_manage_agent_active_sessions
  ON public.agent_active_sessions
  FOR ALL
  USING (get_current_user_role() IN ('admin', 'manager', 'hr_manager', 'super_admin'))
  WITH CHECK (get_current_user_role() IN ('admin', 'manager', 'hr_manager', 'super_admin'));

-- Grants: typically handled by Supabase, but ensure basic usage
GRANT SELECT ON public.agent_login_records TO authenticated;
GRANT INSERT, UPDATE ON public.agent_login_records TO authenticated;
GRANT SELECT ON public.agent_active_sessions TO authenticated;
GRANT INSERT, UPDATE ON public.agent_active_sessions TO authenticated;