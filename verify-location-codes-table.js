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

async function verifyLocationCodesTable() {
  console.log('Verifying location_codes table...\n');
  
  try {
    // Check table structure by trying to select with limit 0
    const { data: structure, error: structureError } = await supabase
      .from('location_codes')
      .select('*')
      .limit(0);
    
    if (structureError) {
      console.error('Error checking table structure:', structureError);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Check current record count
    const { count, error: countError } = await supabase
      .from('location_codes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting records:', countError);
      return;
    }
    
    console.log(`📊 Current record count: ${count}`);
    
    // Test inserting a single record
    const testRecord = {
      code: 'TEST001',
      name: 'Test Location',
      country: 'Test Country',
      type: 'Airport',
      latitude: 25.2048,
      longitude: 55.2708
    };
    
    console.log('\n🧪 Testing data insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('location_codes')
      .insert([testRecord])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return;
    }
    
    console.log('✅ Insert test successful:', insertData);
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('location_codes')
      .delete()
      .eq('code', 'TEST001');
    
    if (deleteError) {
      console.error('⚠️  Warning: Could not clean up test record:', deleteError);
    } else {
      console.log('🧹 Test record cleaned up');
    }
    
    console.log('\n✅ Table verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyLocationCodesTable();