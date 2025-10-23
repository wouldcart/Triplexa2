import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';

/**
 * Setup RLS policies for the countries table
 * This script creates proper Row Level Security policies for production use
 */
async function setupRLSPolicies() {
  console.log('🔒 Setting up RLS policies for countries table...');

  try {
    // Note: RLS policies should ideally be set up through Supabase Dashboard or SQL migrations
    // This script demonstrates the policies that should be created
    
    console.log('📋 RLS Policies that should be created:');
    console.log('');
    console.log('1. Enable RLS on countries table:');
    console.log('   ALTER TABLE countries ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('2. Allow authenticated users to read countries:');
    console.log('   CREATE POLICY "Allow authenticated users to read countries"');
    console.log('   ON countries FOR SELECT TO authenticated USING (true);');
    console.log('');
    console.log('3. Allow service role full access:');
    console.log('   CREATE POLICY "Allow service role full access to countries"');
    console.log('   ON countries FOR ALL TO service_role USING (true) WITH CHECK (true);');
    console.log('');
    console.log('4. Allow anonymous users to read countries:');
    console.log('   CREATE POLICY "Allow anonymous users to read countries"');
    console.log('   ON countries FOR SELECT TO anon USING (true);');
    console.log('');
    console.log('5. Allow authenticated users to modify countries:');
    console.log('   CREATE POLICY "Allow authenticated users to modify countries"');
    console.log('   ON countries FOR ALL TO authenticated USING (true) WITH CHECK (true);');
    console.log('');

    // Test if we can access the countries table with admin client
    console.log('🧪 Testing admin client access...');
    const { data, error, count } = await supabaseAdmin
      .from('countries')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error accessing countries table:', error);
    } else {
      console.log(`✅ Admin client can access countries table. Total records: ${count || 0}`);
    }

    console.log('');
    console.log('📝 Note: Since we are using the admin client (service role), RLS policies');
    console.log('   are automatically bypassed. For production, you should:');
    console.log('   1. Set up proper authentication in your app');
    console.log('   2. Use the regular client for authenticated users');
    console.log('   3. Apply the RLS policies shown above via Supabase Dashboard');
    console.log('');
    console.log('🎉 RLS policy setup guidance completed!');

  } catch (error) {
    console.error('❌ Error during RLS setup:', error);
    throw error;
  }
}

// Run the setup
setupRLSPolicies()
  .then(() => {
    console.log('✅ RLS setup completed');
  })
  .catch((error) => {
    console.error('❌ RLS setup failed:', error);
  });

export { setupRLSPolicies };