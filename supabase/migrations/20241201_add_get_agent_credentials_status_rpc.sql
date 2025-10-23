-- Add RPC function to get agent credentials status
CREATE OR REPLACE FUNCTION get_agent_credentials_status(p_username TEXT)
RETURNS TABLE(
  exists BOOLEAN,
  is_temporary BOOLEAN,
  agent_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as exists,
    ac.is_temporary,
    ac.agent_id
  FROM public.agent_credentials ac
  WHERE ac.username = p_username;
  
  -- If no record found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE as exists, FALSE as is_temporary, NULL::UUID as agent_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_agent_credentials_status(TEXT) TO authenticated;