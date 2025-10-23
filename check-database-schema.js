#!/usr/bin/env node

/**
 * Check database schema and existing tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n');

  try {
    // Check what tables exist
    console.log('1. Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');

    if (tablesError) {
      console.log('RPC not available, trying direct query...');
      
      // Try to query information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (schemaError) {
        console.log('Information schema not accessible, checking known tables...');
        
        // Check specific tables we know about
        const tablesToCheck = [
          'location_codes',
          'transport_routes', 
          'intermediate_stops',
          'transport_types',
          'sightseeing_options'
        ];

        for (const tableName of tablesToCheck) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (error) {
              console.log(`❌ Table '${tableName}' - Error: ${error.message}`);
            } else {
              console.log(`✅ Table '${tableName}' exists`);
            }
          } catch (e) {
            console.log(`❌ Table '${tableName}' - Error: ${e.message}`);
          }
        }
      } else {
        console.log('Available tables:', schemaData?.map(t => t.table_name));
      }
    } else {
      console.log('Available tables:', tables);
    }

    // Check if we can access any transport-related data
    console.log('\n2. Checking for any existing transport data...');
    
    // Try to find any table that might contain transport routes
    const possibleTables = [
      'routes',
      'transport_routes',
      'transportroutes',
      'transport',
      'locations',
      'location_codes',
      'locationcodes'
    ];

    for (const table of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`✅ Found table '${table}' with ${data.length} sample records`);
          if (data.length > 0) {
            console.log(`   Sample columns:`, Object.keys(data[0]));
          }
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

    console.log('\n3. Checking database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.log('❌ Database connection issue:', connectionError.message);
    } else {
      console.log('✅ Database connection working');
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

// Run the check
checkDatabaseSchema();