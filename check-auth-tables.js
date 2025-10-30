import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

async function checkAuthTables() {
  console.log('🔍 Checking tables used for role-based authentication...\n')
  
  // Check profiles table
  console.log('1. PROFILES TABLE:')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role, department')
    .limit(3)
    
  if (!profileError) {
    console.log('   ✅ EXISTS')
    console.log('   📋 Columns: id, name, email, role, department')
    console.log('   📊 Sample data:', profiles)
  } else {
    console.log('   ❌ ERROR:', profileError.message)
  }
  
  // Check user_roles table
  console.log('\n2. USER_ROLES TABLE:')
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(3)
    
  if (!rolesError) {
    console.log('   ✅ EXISTS')
    console.log('   📊 Sample data:', userRoles)
  } else {
    console.log('   ❌ ERROR:', rolesError.message)
  }
  
  // Check agents table
  console.log('\n3. AGENTS TABLE:')
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, user_id, name, email, status')
    .limit(3)
    
  if (!agentsError) {
    console.log('   ✅ EXISTS')
    console.log('   📋 Columns: id, user_id, name, email, status')
    console.log('   📊 Sample data:', agents)
  } else {
    console.log('   ❌ ERROR:', agentsError.message)
  }
  
  // Check staff table
  console.log('\n4. STAFF TABLE:')
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, name, email, role, department')
    .limit(3)
    
  if (!staffError) {
    console.log('   ✅ EXISTS')
    console.log('   📋 Columns: id, name, email, role, department')
    console.log('   📊 Sample data:', staff)
  } else {
    console.log('   ❌ ERROR:', staffError.message)
  }

  // Summary
  console.log('\n📋 SUMMARY - Tables used for role-based login:')
  console.log('   🎯 PRIMARY: profiles (main user table with role column)')
  console.log('   🎯 SECONDARY: agents (for agent-specific data)')
  console.log('   🎯 OPTIONAL: user_roles (if exists, for additional role management)')
  console.log('   🎯 OPTIONAL: staff (if exists, for staff-specific data)')
}

checkAuthTables().catch(console.error)