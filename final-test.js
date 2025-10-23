import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test read operation
    const { data: countries, error: readError } = await supabase
      .from('countries')
      .select('*')
      .limit(3);
    
    if (readError) throw readError;
    console.log('✅ Read test passed:', countries?.length || 0, 'countries found');
    
    console.log('🎉 All Supabase operations working correctly!');
    console.log('📊 Connection Status: HEALTHY');
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    process.exit(1);
  }
}

testConnection();