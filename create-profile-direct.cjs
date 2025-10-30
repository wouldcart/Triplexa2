const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProfileDirect() {
  console.log('🔧 Creating profile directly...');
  
  const userId = 'ec18b01d-5fce-4376-b815-d9487aa578f3';
  const email = 'aaaaaaaaaaaaaaaalia@wouldcart.cpm';
  
  try {
    // Try to insert directly with minimal data
    console.log('📝 Inserting profile with minimal data...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        name: 'Test User',
        role: 'agent',
        status: 'active'
      })
      .select();
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      
      // Try to update existing profile if it exists
      console.log('🔄 Trying to update existing profile...');
      const { data: updateData, error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          status: 'active',
          role: 'agent',
          name: 'Test User'
        })
        .eq('id', userId)
        .select();
      
      if (updateError) {
        console.error('❌ Profile update error:', updateError);
      } else {
        console.log('✅ Profile updated:', updateData);
      }
    } else {
      console.log('✅ Profile created:', profileData);
    }
    
    // Verify the profile exists
    console.log('\n🔍 Verifying profile...');
    const { data: verifyData, error: verifyError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (verifyError) {
      console.error('❌ Profile verification error:', verifyError);
    } else {
      console.log('✅ Profile verified:', verifyData);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createProfileDirect();