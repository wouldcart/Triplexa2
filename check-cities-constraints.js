#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking Cities Table Constraints');
console.log('====================================\n');

async function checkConstraints() {
  try {
    // Check what status values exist in the table
    console.log('📊 Existing status values in cities table:');
    const { data: statusData, error: statusError } = await supabase
      .from('cities')
      .select('status')
      .not('status', 'is', null);
    
    if (statusError) {
      console.error('❌ Error fetching status values:', statusError.message);
    } else {
      const uniqueStatuses = [...new Set(statusData.map(item => item.status))];
      console.log('✅ Found status values:', uniqueStatuses);
    }
    
    // Test different status values to see which ones work
    console.log('\n🧪 Testing status values:');
    const testStatuses = ['active', 'inactive', 'disabled', 'pending', 'draft'];
    
    for (const status of testStatuses) {
      try {
        const { data, error } = await supabase
          .from('cities')
          .insert([{
            name: `Test Status ${status}`,
            country: 'Test Country',
            region: 'Test Region',
            status: status,
            has_airport: false,
            is_popular: false
          }])
          .select()
          .single();
        
        if (error) {
          console.log(`❌ Status '${status}': ${error.message}`);
        } else {
          console.log(`✅ Status '${status}': VALID`);
          // Clean up immediately
          await supabase.from('cities').delete().eq('id', data.id);
        }
      } catch (err) {
        console.log(`❌ Status '${status}': ${err.message}`);
      }
    }
    
    // Check other constraints
    console.log('\n🔍 Testing other field constraints:');
    
    // Test required fields
    try {
      const { error } = await supabase
        .from('cities')
        .insert([{
          name: null,
          country: 'Test',
          region: 'Test',
          status: 'active'
        }]);
      
      if (error) {
        console.log('✅ Name field: Required (as expected)');
      } else {
        console.log('⚠️  Name field: Not required (unexpected)');
      }
    } catch (err) {
      console.log('✅ Name field: Required (as expected)');
    }
    
    // Test boolean fields
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert([{
          name: 'Test Boolean Fields',
          country: 'Test Country',
          region: 'Test Region',
          status: 'active',
          has_airport: 'invalid_boolean',
          is_popular: 'invalid_boolean'
        }])
        .select()
        .single();
      
      if (error) {
        console.log('✅ Boolean fields: Type enforced');
      } else {
        console.log('⚠️  Boolean fields: Type not enforced');
        await supabase.from('cities').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log('✅ Boolean fields: Type enforced');
    }
    
  } catch (error) {
    console.error('💥 Constraint check failed:', error.message);
  }
}

checkConstraints();