const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function exec(sql) {
  const { data, error } = await admin.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

async function main() {
  try {
    console.log('🔄 Creating user_roles table...');
    await exec(`
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id BIGSERIAL PRIMARY KEY,
        user_id uuid NOT NULL,
        role text NOT NULL,
        source text DEFAULT 'profile_sync',
        assigned_by uuid,
        created_at timestamp without time zone DEFAULT now(),
        updated_at timestamp without time zone DEFAULT now(),
        CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
      );
    `);

    console.log('🔄 Adding FK to profiles...');
    await exec(`
      ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
    `);
    await exec(`
      ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
    `);

    console.log('🔄 Creating index on user_id...');
    await exec(`
      CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles USING btree (user_id);
    `);

    console.log('🔄 Enabling RLS and policies...');
    await exec(`ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`);
    await exec(`DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;`);
    await exec(`DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;`);
    await exec(`DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;`);
    await exec(`DROP POLICY IF EXISTS "Service role full access to user_roles" ON public.user_roles;`);
    await exec(`
      CREATE POLICY "Users can read own roles" ON public.user_roles
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
    `);
    await exec(`
      CREATE POLICY "Users can insert their own roles" ON public.user_roles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
    `);
    await exec(`
      CREATE POLICY "Users can update their own roles" ON public.user_roles
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `);
    await exec(`
      CREATE POLICY "Service role full access to user_roles" ON public.user_roles
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
    `);

    console.log('🔄 Creating sync function and triggers...');
    await exec(`DROP FUNCTION IF EXISTS public.sync_user_roles_from_profiles CASCADE;`);
    await exec(`
      CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profiles()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF NEW.role IS NOT NULL AND NEW.role <> '' THEN
          INSERT INTO public.user_roles (user_id, role, source, assigned_by, created_at, updated_at)
          VALUES (NEW.id, NEW.role, 'profile_sync', NULL, NOW(), NOW())
          ON CONFLICT (user_id, role) DO UPDATE SET updated_at = NOW();
        END IF;
        RETURN NEW;
      END;
      $$;
    `);
    await exec(`DROP TRIGGER IF EXISTS profiles_role_sync_insert ON public.profiles;`);
    await exec(`DROP TRIGGER IF EXISTS profiles_role_sync_update ON public.profiles;`);
    await exec(`
      CREATE TRIGGER profiles_role_sync_insert
      AFTER INSERT ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles_from_profiles();
    `);
    await exec(`
      CREATE TRIGGER profiles_role_sync_update
      AFTER UPDATE OF role ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles_from_profiles();
    `);

    console.log('✅ user_roles setup complete.');
  } catch (err) {
    console.error('❌ Setup failed:', err.message || err);
    process.exit(1);
  }
}

main();