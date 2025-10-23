import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  console.log('Checking location_codes table schema...\n');
  
  try {
    // Try to get table information using PostgREST introspection
    const { data, error } = await supabase
      .from('location_codes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing table:', error);
      return;
    }
    
    console.log('✅ Table is accessible');
    console.log('Sample query result:', data);
    
    // Try a simple insert with minimal data to see what columns are expected
    console.log('\n🔍 Testing minimal insert to discover required columns...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('location_codes')
      .insert([{ code: 'TEST' }])
      .select();
    
    if (insertError) {
      console.log('Insert error (this helps us understand the schema):', insertError);
    } else {
      console.log('Minimal insert successful:', insertData);
      
      // Clean up
      await supabase
        .from('location_codes')
        .delete()
        .eq('code', 'TEST');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkTableSchema();