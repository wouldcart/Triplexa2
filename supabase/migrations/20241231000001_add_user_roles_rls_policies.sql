-- Enable RLS on user_roles table if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own roles
CREATE POLICY "Users can read their own roles" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own roles (for role syncing)
CREATE POLICY "Users can insert their own roles" ON user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own roles (for role syncing)
CREATE POLICY "Users can update their own roles" ON user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow service role to manage all user roles (for admin operations)
CREATE POLICY "Service role can manage all user roles" ON user_roles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');