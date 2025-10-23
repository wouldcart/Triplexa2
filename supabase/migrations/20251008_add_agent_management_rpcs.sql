-- RPCs for managed agent admin actions: approve, reject, suspend, reactivate
-- These functions validate caller role and update managed_agents accordingly.

-- Helper: check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r TEXT;
BEGIN
    r := get_current_user_role();
    RETURN (r = 'admin' OR r = 'super_admin');
END;
$$;

GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO anon;

-- Approve agent: set status active and assign staff
CREATE OR REPLACE FUNCTION approve_managed_agent(p_id UUID, p_assigned_staff UUID[] DEFAULT NULL)
RETURNS managed_agents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result managed_agents;
BEGIN
    -- Enforce admin role when called with user context
    IF auth.uid() IS NOT NULL AND NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Permission denied: admin role required';
    END IF;

    UPDATE managed_agents
    SET status = 'active',
        assigned_staff = COALESCE(p_assigned_staff, assigned_staff),
        approved_at = NOW(),
        rejected_at = NULL,
        rejection_reason = NULL,
        suspended_at = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO result;

    IF result IS NULL THEN
        RAISE EXCEPTION 'Agent not found';
    END IF;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_managed_agent(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_managed_agent(UUID, UUID[]) TO anon;

-- Reject agent: set status rejected with reason
CREATE OR REPLACE FUNCTION reject_managed_agent(p_id UUID, p_reason TEXT)
RETURNS managed_agents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result managed_agents;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Permission denied: admin role required';
    END IF;

    UPDATE managed_agents
    SET status = 'rejected',
        rejection_reason = p_reason,
        rejected_at = NOW(),
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO result;

    IF result IS NULL THEN
        RAISE EXCEPTION 'Agent not found';
    END IF;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION reject_managed_agent(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_managed_agent(UUID, TEXT) TO anon;

-- Suspend agent: set status suspended with reason
CREATE OR REPLACE FUNCTION suspend_managed_agent(p_id UUID, p_reason TEXT)
RETURNS managed_agents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result managed_agents;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Permission denied: admin role required';
    END IF;

    UPDATE managed_agents
    SET status = 'suspended',
        suspension_reason = p_reason,
        suspended_at = NOW(),
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO result;

    IF result IS NULL THEN
        RAISE EXCEPTION 'Agent not found';
    END IF;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION suspend_managed_agent(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_managed_agent(UUID, TEXT) TO anon;

-- Reactivate agent: set status active from suspended/rejected
CREATE OR REPLACE FUNCTION reactivate_managed_agent(p_id UUID)
RETURNS managed_agents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result managed_agents;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT is_current_user_admin() THEN
        RAISE EXCEPTION 'Permission denied: admin role required';
    END IF;

    UPDATE managed_agents
    SET status = 'active',
        suspended_at = NULL,
        suspension_reason = NULL,
        rejected_at = NULL,
        rejection_reason = NULL,
        updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO result;

    IF result IS NULL THEN
        RAISE EXCEPTION 'Agent not found';
    END IF;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION reactivate_managed_agent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_managed_agent(UUID) TO anon;