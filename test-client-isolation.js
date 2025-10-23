#!/usr/bin/env node

/**
 * Test script to verify that the multiple GoTrueClient instances warning has been resolved
 * This script imports both the main client and admin client to check for conflicts
 */

import { supabase } from './src/integrations/supabase/client.ts';
import { supabaseAdmin, isAdminClientConfigured } from './src/integrations/supabase/adminClient.ts';

console.log('🧪 Testing Supabase Client Isolation');
console.log('===================================');

// Test main client
console.log('\n📱 Testing Main Client:');
console.log('- Client created:', !!supabase);
console.log('- Auth client exists:', !!supabase.auth);
console.log('- Storage key:', supabase.auth.storageKey || 'default');

// Test admin client
console.log('\n🔐 Testing Admin Client:');
console.log('- Admin configured:', isAdminClientConfigured);
console.log('- Admin client created:', !!supabaseAdmin);

if (supabaseAdmin) {
  console.log('- Admin auth client exists:', !!supabaseAdmin.auth);
  console.log('- Admin storage key:', supabaseAdmin.auth.storageKey || 'default');
  
  // Check if storage keys are different
  const mainStorageKey = supabase.auth.storageKey || 'sb-auth-token';
  const adminStorageKey = supabaseAdmin.auth.storageKey || 'sb-auth-token';
  
  console.log('\n🔍 Storage Key Comparison:');
  console.log('- Main client storage key:', mainStorageKey);
  console.log('- Admin client storage key:', adminStorageKey);
  console.log('- Keys are different:', mainStorageKey !== adminStorageKey);
  
  if (mainStorageKey === adminStorageKey) {
    console.log('❌ WARNING: Both clients are using the same storage key!');
  } else {
    console.log('✅ SUCCESS: Clients are using different storage keys');
  }
} else {
  console.log('⚠️  Admin client not configured (missing environment variables)');
}

// Test basic functionality
console.log('\n🔧 Testing Basic Functionality:');

try {
  // Test main client
  const mainClientTest = supabase.from('transport_routes').select('count', { count: 'exact', head: true });
  console.log('- Main client query created successfully');
  
  // Test admin client (if configured)
  if (supabaseAdmin) {
    const adminClientTest = supabaseAdmin.from('transport_routes').select('count', { count: 'exact', head: true });
    console.log('- Admin client query created successfully');
  }
  
  console.log('✅ Both clients can create queries without conflicts');
} catch (error) {
  console.log('❌ Error creating queries:', error.message);
}

console.log('\n🎉 Client isolation test completed!');
console.log('If you see this message without any GoTrueClient warnings, the fix is working correctly.');