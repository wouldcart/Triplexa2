require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPhoneColumn() {
  try {
    console.log('📞 Adding phone column to agents table...');
    
    // First check if the column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('agents')
      .select('phone')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Phone column already exists in agents table');
      return;
    }
    
    if (testError.message.includes('column "phone" does not exist')) {
      console.log('📋 Phone column does not exist, attempting to add it...');
      console.log('ℹ️ Note: Direct DDL execution through Supabase client is limited.');
      console.log('📄 SQL to execute manually: ALTER TABLE public.agents ADD COLUMN phone VARCHAR(20);');
      
      // Try to add the column (this may not work through the client)
      console.log('🔧 Attempting to add column through client...');
      
      // Since we can't execute DDL directly, let's just log the instruction
      console.log('⚠️ Manual database access required to execute:');
      console.log('   ALTER TABLE public.agents ADD COLUMN phone VARCHAR(20);');
      
    } else {
      console.log('❌ Unexpected error checking phone column:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPhoneColumn();