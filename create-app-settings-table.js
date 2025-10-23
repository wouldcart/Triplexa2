import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAppSettingsTable() {
  try {
    console.log('🔄 Checking if app_settings table exists...');
    
    // First, try to query the table to see if it exists
    const { data, error } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ app_settings table already exists!');
      return true;
    }
    
    console.log('📝 Table does not exist. Attempting to create it...');
    
    // Since we can't execute raw SQL, let's try to create a simple version
    // and then manually add it via Supabase dashboard
    console.log('❌ Cannot create table directly via API.');
    console.log('');
    console.log('🔧 MANUAL SETUP REQUIRED:');
    console.log('');
    console.log('Please follow these steps to create the app_settings table:');
    console.log('');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to your project: xzofytokwszfwiupsdvi');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the following SQL:');
    console.log('');
    console.log('-- Create the app_settings table');
    console.log('CREATE TABLE IF NOT EXISTS app_settings (');
    console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('    category TEXT NOT NULL,');
    console.log('    setting_key TEXT NOT NULL,');
    console.log('    setting_value TEXT,');
    console.log('    setting_json JSONB,');
    console.log('    description TEXT,');
    console.log('    data_type TEXT DEFAULT \'text\',');
    console.log('    is_required BOOLEAN DEFAULT false,');
    console.log('    is_active BOOLEAN DEFAULT true,');
    console.log('    created_at TIMESTAMPTZ DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMPTZ DEFAULT NOW(),');
    console.log('    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,');
    console.log('    UNIQUE(category, setting_key)');
    console.log(');');
    console.log('');
    console.log('-- Create indexes');
    console.log('CREATE INDEX IF NOT EXISTS app_settings_category_idx ON app_settings (category);');
    console.log('CREATE INDEX IF NOT EXISTS app_settings_active_idx ON app_settings (is_active);');
    console.log('');
    console.log('-- Enable RLS');
    console.log('ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Create policy for authenticated users');
    console.log('CREATE POLICY "Allow authenticated users to read app_settings" ON app_settings');
    console.log('    FOR SELECT TO authenticated USING (true);');
    console.log('');
    console.log('CREATE POLICY "Allow authenticated users to modify app_settings" ON app_settings');
    console.log('    FOR ALL TO authenticated USING (true);');
    console.log('');
    console.log('5. Click "Run" to execute the SQL');
    console.log('');
    console.log('After creating the table, run this script again to verify.');
    
    return false;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the check
createAppSettingsTable()
  .then(success => {
    if (success) {
      console.log('🎉 app_settings table is ready!');
      process.exit(0);
    } else {
      console.log('⚠️  Manual setup required - see instructions above');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });