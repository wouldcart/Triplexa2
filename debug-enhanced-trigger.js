#!/usr/bin/env node

/**
 * Debug Enhanced Trigger - Check what records are created
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testEmail = 'debug-enhanced-test@example.com';

async function debugEnhancedTrigger() {
  console.log('🔍 Debugging Enhanced Trigger');
  console.log('=' .repeat(50));
  
  let testUserId = null;
  
  try {
    // Clean up first
    console.log('\n1️⃣ Cleaning up existing test user...');
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log(`   🗑️ Removing existing user: ${existingUser.id}`);
      await adminSupabase.auth.admin.deleteUser(existingUser.id);
      await adminSupabase.from('agents').delete().eq('user_id', existingUser.id);
      await adminSupabase.from('profiles').delete().eq('id', existingUser.id);
    }
    
    // Create test user
    console.log('\n2️⃣ Creating test user...');
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpass123',
      email_confirm: true,
      user_metadata: {
        name: 'Debug Test User',
        role: 'agent',
        phone: '+1-555-0123',
        company_name: 'Debug Company',
        city: 'Debug City',
        country: 'Debug Country',
        profile_image: 'https://example.com/debug.jpg',
        preferred_language: 'en',
        status: 'active'
      }
    });
    
    if (authError) {
      console.log(`   ❌ User creation failed: ${authError.message}`);
      return;
    }
    
    testUserId = authData.user.id;
    console.log(`   ✅ User created: ${testUserId}`);
    
    // Wait for trigger
    console.log('\n3️⃣ Waiting for trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check profiles table
    console.log('\n4️⃣ Checking profiles table...');
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId);
    
    if (profilesError) {
      console.log(`   ❌ Profiles query error: ${profilesError.message}`);
    } else {
      console.log(`   📊 Found ${profiles.length} profile record(s)`);
      profiles.forEach((profile, index) => {
        console.log(`   Profile ${index + 1}:`, JSON.stringify(profile, null, 2));
      });
    }
    
    // Check agents table
    console.log('\n5️⃣ Checking agents table...');
    const { data: agents, error: agentsError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', testUserId);
    
    if (agentsError) {
      console.log(`   ❌ Agents query error: ${agentsError.message}`);
    } else {
      console.log(`   📊 Found ${agents.length} agent record(s)`);
      agents.forEach((agent, index) => {
        console.log(`   Agent ${index + 1}:`, JSON.stringify(agent, null, 2));
      });
    }
    
    // Check auth.users table
    console.log('\n6️⃣ Checking auth.users metadata...');
    const { data: userData } = await adminSupabase.auth.admin.getUserById(testUserId);
    if (userData?.user) {
      console.log('   📋 User metadata:', JSON.stringify(userData.user.user_metadata, null, 2));
      console.log('   📋 Raw user metadata:', JSON.stringify(userData.user.raw_user_meta_data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\n🧹 Cleaning up...');
      try {
        await adminSupabase.auth.admin.deleteUser(testUserId);
        await adminSupabase.from('agents').delete().eq('user_id', testUserId);
        await adminSupabase.from('profiles').delete().eq('id', testUserId);
        console.log('   ✅ Cleanup completed');
      } catch (cleanupError) {
        console.log(`   ⚠️ Cleanup warning: ${cleanupError.message}`);
      }
    }
  }
}

debugEnhancedTrigger().catch(console.error);