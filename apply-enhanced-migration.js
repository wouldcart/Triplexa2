#!/usr/bin/env node

/**
 * Apply Enhanced Migration - Manually apply the enhanced trigger migration
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

async function applyEnhancedMigration() {
  console.log('🚀 Applying Enhanced Migration');
  console.log('=' .repeat(50));
  
  try {
    // Read the migration file
    console.log('\n1️⃣ Reading migration file...');
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250101_enhanced_handle_new_user_auth_data.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');
    console.log(`   📄 Migration file loaded (${migrationSql.length} characters)`);
    
    // Split the migration into individual statements
    console.log('\n2️⃣ Parsing migration statements...');
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');
    
    console.log(`   📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    console.log('\n3️⃣ Executing migration statements...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   📋 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the raw query method to execute SQL
        const { error } = await adminSupabase.rpc('exec', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.log(`   ⚠️ Statement ${i + 1} failed via RPC: ${error.message}`);
          // Try alternative approach for some statements
          if (statement.includes('DROP TRIGGER') || statement.includes('DROP FUNCTION')) {
            console.log(`   🔄 Skipping DROP statement (may not exist)`);
          } else {
            console.log(`   ❌ Failed to execute: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.log(`   ⚠️ Statement ${i + 1} execution error: ${execError.message}`);
      }
    }
    
    // Verify the trigger exists
    console.log('\n4️⃣ Verifying trigger installation...');
    try {
      const { data: triggers, error: triggerError } = await adminSupabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, action_statement')
        .eq('trigger_name', 'on_auth_user_created');
      
      if (triggerError) {
        console.log(`   ⚠️ Could not verify trigger: ${triggerError.message}`);
      } else if (triggers && triggers.length > 0) {
        console.log(`   ✅ Trigger 'on_auth_user_created' found`);
        triggers.forEach(trigger => {
          console.log(`      Event: ${trigger.event_manipulation}`);
          console.log(`      Action: ${trigger.action_statement?.substring(0, 100)}...`);
        });
      } else {
        console.log(`   ❌ Trigger 'on_auth_user_created' not found`);
      }
    } catch (verifyError) {
      console.log(`   ⚠️ Trigger verification failed: ${verifyError.message}`);
    }
    
    console.log('\n🎉 Migration application completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📝 Error details:', error);
  }
}

applyEnhancedMigration().catch(console.error);