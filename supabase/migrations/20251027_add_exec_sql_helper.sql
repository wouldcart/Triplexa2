-- Helper RPC to execute arbitrary read-only SQL and return JSON
-- Intended for admin/service-role usage to audit catalog metadata.

BEGIN;

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  result json;
BEGIN
  -- Wrap the query to return rows as a JSON array
  EXECUTE format('SELECT coalesce(json_agg(t), ''[]''::json) FROM (%s) t', sql) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.exec_sql(text) IS 'Admin helper to execute SELECT queries and return JSON results for auditing';

COMMIT;