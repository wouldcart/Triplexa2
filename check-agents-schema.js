import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkAgentsSchema() {
  console.log('🔍 Checking agents table schema...');
  
  try {
    // Try to get the first row to see what columns exist
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error querying agents table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Agents table exists with columns:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('📋 Agents table exists but is empty');
      
      // Try to insert a minimal record to see what's required
      const testId = '00000000-0000-0000-0000-000000000000';
      const { data: insertData, error: insertError } = await supabase
        .from('agents')
        .insert({
          id: testId,
          status: 'pending'
        })
        .select();
      
      if (insertError) {
        console.log('❌ Insert error (shows required columns):', insertError.message);
      } else {
        console.log('✅ Minimal insert successful, columns:');
        console.log(Object.keys(insertData[0]));
        
        // Clean up
        await supabase.from('agents').delete().eq('id', testId);
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkAgentsSchema();