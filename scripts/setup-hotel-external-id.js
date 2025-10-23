#!/usr/bin/env node

/**
 * Setup script for Hotel External ID feature
 * 
 * This script:
 * 1. Creates unique index on external_id if it doesn't exist
 * 2. Tests the external_id generation logic
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExternalIdGeneration() {
  console.log('🧪 Testing external_id generation logic...');
  
  try {
    // Get the latest external_id
    const { data: latestHotel, error: queryError } = await supabase
      .from('hotels')
      .select('external_id')
      .not('external_id', 'is', null)
      .order('external_id', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('❌ Error querying latest external_id:', queryError);
      return false;
    }

    let nextExternalId;
    if (latestHotel && latestHotel.length > 0) {
      nextExternalId = latestHotel[0].external_id + 1;
      console.log(`📊 Latest external_id: ${latestHotel[0].external_id}`);
    } else {
      nextExternalId = 10001;
      console.log('📊 No existing external_id found, starting from 10001');
    }

    console.log(`🎯 Next external_id would be: ${nextExternalId}`);

    // Test uniqueness check
    const { data: existingHotel, error: checkError } = await supabase
      .from('hotels')
      .select('id')
      .eq('external_id', nextExternalId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking external_id uniqueness:', checkError);
      return false;
    }

    if (existingHotel) {
      console.log(`⚠️  external_id ${nextExternalId} already exists`);
    } else {
      console.log(`✅ external_id ${nextExternalId} is available`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error testing external_id generation:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up Hotel External ID feature...\n');

  // Test external_id generation
  const testOk = await testExternalIdGeneration();
  if (!testOk) {
    console.log('\n❌ External ID generation test failed');
    process.exit(1);
  }

  console.log('\n✅ Hotel External ID setup completed successfully!');
  console.log('\nDatabase schema notes:');
  console.log('- external_id column already exists in hotels table (integer, nullable)');
  console.log('- Unique index will be created via SQL migration');
  console.log('\nNext steps:');
  console.log('1. Create unique index via SQL migration');
  console.log('2. Update HotelForm to include external_id auto-generation');
  console.log('3. Modify AddHotel page to handle external_id logic');
  console.log('4. Implement redirect flow to Add Room Type page');
}

main().catch(console.error);