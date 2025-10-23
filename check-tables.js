#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('🔍 Checking transport-related tables...\n');
  
  const tables = [
    'transport_routes', 
    'transport_types', 
    'route_transport_types', 
    'transport_options',
    'intermediate_stops',
    'sightseeing_options'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (!error) {
        console.log(`✅ Table exists: ${table}`);
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log('   (No data to show columns)');
        }
      } else {
        console.log(`❌ Table not found: ${table}`);
      }
    } catch (err) {
      console.log(`❌ Error checking ${table}: ${err.message}`);
    }
    console.log('');
  }
}

checkTables();