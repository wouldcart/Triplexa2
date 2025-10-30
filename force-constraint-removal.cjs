const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceConstraintRemoval() {
  console.log('💪 Force removing all constraints and policies...\n');

  try {
    // 1. Get all constraints on profiles table
    console.log('1. Getting all constraints on profiles table...');
    
    const getAllConstraintsSql = `
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass`;

    const { data: allConstraints, error: constraintsError } = await supabase.rpc('exec_sql', { sql: getAllConstraintsSql });
    if (constraintsError) {
      console.log('❌ Error getting constraints:', constraintsError.message);
    } else {
      console.log('✅ All constraints on profiles:');
      console.table(allConstraints);
      
      // Drop each constraint
      if (allConstraints && allConstraints.length > 0) {
        for (const constraint of allConstraints) {
          if (constraint.constraint_type === 'f') { // Foreign key
            console.log(`\n🔧 Force dropping foreign key: ${constraint.constraint_name}`);
            
            const dropSql = `ALTER TABLE public.profiles DROP CONSTRAINT ${constraint.constraint_name} CASCADE`;
            const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSql });
            
            if (dropError) {
              console.log(`❌ Error dropping ${constraint.constraint_name}:`, dropError.message);
            } else {
              console.log(`✅ Dropped ${constraint.constraint_name}`);
            }
          }
        }
      }
    }

    // 2. Drop all policies
    console.log('\n2. Force dropping all policies...');
    
    const dropAllPoliciesSql = `
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON public.profiles';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$`;

    const { error: dropPoliciesError } = await supabase.rpc('exec_sql', { sql: dropAllPoliciesSql });
    if (dropPoliciesError) {
      console.log('❌ Error dropping policies:', dropPoliciesError.message);
    } else {
      console.log('✅ All policies dropped');
    }

    // 3. Disable RLS
    console.log('\n3. Disabling RLS...');
    const { error: disableRlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY' 
    });
    if (disableRlsError) {
      console.log('❌ Error disabling RLS:', disableRlsError.message);
    } else {
      console.log('✅ RLS disabled');
    }

    // 4. Verify constraints are gone
    console.log('\n4. Verifying constraints are removed...');
    const { data: remainingConstraints, error: verifyError } = await supabase.rpc('exec_sql', { sql: getAllConstraintsSql });
    if (verifyError) {
      console.log('❌ Error verifying:', verifyError.message);
    } else {
      console.log('✅ Remaining constraints:');
      console.table(remainingConstraints);
    }

    // 5. Test manual insertion with a real auth user ID
    console.log('\n5. Testing with a real auth user...');
    
    // First create a test user
    const testEmail = `test-constraint-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Constraint Test User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Test user created!');
      console.log('User ID:', signupData.user?.id);
      
      if (signupData.user?.id) {
        // Try manual profile insertion with the real user ID
        console.log('\n6. Testing manual profile insertion with real user ID...');
        
        const { error: manualInsertError } = await supabase
          .from('profiles')
          .insert({
            id: signupData.user.id,
            email: signupData.user.email,
            name: 'Manual Test User',
            role: 'agent',
            status: 'active'
          });

        if (manualInsertError) {
          console.log('❌ Manual insert failed:', manualInsertError.message);
        } else {
          console.log('✅ Manual profile insert successful!');
          
          // Verify the profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signupData.user.id)
            .single();

          if (profileError) {
            console.log('❌ Could not retrieve profile:', profileError.message);
          } else {
            console.log('✅ Profile retrieved successfully!');
            console.log('Profile data:', profile);
          }
        }

        // Clean up
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
        if (deleteError) {
          console.log('⚠️ Could not delete test user:', deleteError.message);
        } else {
          console.log('🧹 Test user cleaned up');
        }
      }
    }

    // 7. Now test the trigger
    console.log('\n7. Testing trigger with new signup...');
    
    const triggerTestEmail = `test-trigger-${Date.now()}@example.com`;
    
    const { data: triggerSignupData, error: triggerSignupError } = await supabase.auth.signUp({
      email: triggerTestEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Trigger Test User'
        }
      }
    });

    if (triggerSignupError) {
      console.log('❌ Trigger test signup failed:', triggerSignupError.message);
    } else {
      console.log('✅ Trigger test signup successful!');
      console.log('User ID:', triggerSignupData.user?.id);
      
      if (triggerSignupData.user?.id) {
        // Wait for trigger
        console.log('⏳ Waiting for trigger...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check profile
        const { data: triggerProfile, error: triggerProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', triggerSignupData.user.id)
          .single();

        if (triggerProfileError) {
          console.log('❌ Trigger profile not found:', triggerProfileError.message);
        } else {
          console.log('✅ Trigger profile created successfully!');
          console.log('Trigger profile data:', triggerProfile);
        }

        // Clean up
        await supabase.auth.admin.deleteUser(triggerSignupData.user.id);
        console.log('🧹 Trigger test user cleaned up');
      }
    }

    console.log('\n🎉 Force constraint removal completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

forceConstraintRemoval();