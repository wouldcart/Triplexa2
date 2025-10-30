require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFinalSolution() {
  console.log('🧪 Testing final working solution...');

  try {
    // 1. Test trigger with comprehensive metadata
    console.log('\n1. Testing trigger with comprehensive metadata...');
    
    const comprehensiveMetadata = {
      name: 'Final Test User',
      phone: '+1987654321',
      company_name: 'Final Corp',
      role: 'Director',
      department: 'Operations',
      position: 'Senior Director'
    };

    const { data: triggerUser, error: triggerError } = await supabase.auth.admin.createUser({
      email: `final-trigger-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: comprehensiveMetadata
    });

    if (triggerError) {
      console.error('❌ Error creating trigger user:', triggerError);
      return;
    }

    console.log('✅ Trigger user created:', triggerUser.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check profile created by trigger
    const { data: triggerProfile, error: triggerProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', triggerUser.user.id)
      .single();

    console.log('\n📊 Profile created by trigger:');
    if (triggerProfileError) {
      console.error('❌ Error:', triggerProfileError);
    } else {
      console.log('✅ Trigger profile:', {
        name: triggerProfile.name,
        phone: triggerProfile.phone,
        company_name: triggerProfile.company_name,
        role: triggerProfile.role,
        department: triggerProfile.department,
        position: triggerProfile.position
      });
      
      // Check if all fields are properly extracted
      const allFieldsExtracted = 
        triggerProfile.name === comprehensiveMetadata.name &&
        triggerProfile.phone === comprehensiveMetadata.phone &&
        triggerProfile.company_name === comprehensiveMetadata.company_name &&
        triggerProfile.role === comprehensiveMetadata.role &&
        triggerProfile.department === comprehensiveMetadata.department &&
        triggerProfile.position === comprehensiveMetadata.position;
      
      if (allFieldsExtracted) {
        console.log('🎉 ALL METADATA FIELDS SUCCESSFULLY EXTRACTED BY TRIGGER!');
      } else {
        console.log('⚠️ Some metadata fields not extracted correctly by trigger');
        console.log('Expected:', comprehensiveMetadata);
        console.log('Actual:', {
          name: triggerProfile.name,
          phone: triggerProfile.phone,
          company_name: triggerProfile.company_name,
          role: triggerProfile.role,
          department: triggerProfile.department,
          position: triggerProfile.position
        });
      }
    }

    // 2. Test get_or_create function
    console.log('\n2. Testing get_or_create function...');
    
    const getOrCreateMetadata = {
      name: 'Get Or Create User',
      phone: '+1555666777',
      company_name: 'GetOrCreate Inc',
      role: 'Manager',
      department: 'Sales',
      position: 'Sales Manager'
    };

    const { data: getOrCreateUser, error: getOrCreateError } = await supabase.auth.admin.createUser({
      email: `get-or-create-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: getOrCreateMetadata
    });

    if (getOrCreateError) {
      console.error('❌ Error creating get-or-create user:', getOrCreateError);
    } else {
      console.log('✅ Get-or-create user created:', getOrCreateUser.user.id);
      
      // Delete the profile created by trigger to test get_or_create
      await supabase
        .from('profiles')
        .delete()
        .eq('id', getOrCreateUser.user.id);
      
      console.log('✅ Deleted trigger-created profile to test get_or_create');
      
      // Test get_or_create function by calling it directly
      const { data: getOrCreateProfile, error: getOrCreateProfileError } = await supabase
        .rpc('get_or_create_profile_for_current_user');

      console.log('\n📊 Profile created by get_or_create function:');
      if (getOrCreateProfileError) {
        console.error('❌ Error:', getOrCreateProfileError);
        
        // Fallback: manually create profile to test metadata extraction
        console.log('⚠️ RPC call failed, testing manual profile creation...');
        
        const { data: manualProfile, error: manualError } = await supabase
          .from('profiles')
          .insert({
            id: getOrCreateUser.user.id,
            name: getOrCreateMetadata.name,
            phone: getOrCreateMetadata.phone,
            company_name: getOrCreateMetadata.company_name,
            role: getOrCreateMetadata.role,
            department: getOrCreateMetadata.department,
            position: getOrCreateMetadata.position
          })
          .select()
          .single();
          
        if (manualError) {
          console.error('❌ Manual creation error:', manualError);
        } else {
          console.log('✅ Manual profile created:', {
            name: manualProfile.name,
            phone: manualProfile.phone,
            company_name: manualProfile.company_name,
            role: manualProfile.role,
            department: manualProfile.department,
            position: manualProfile.position
          });
        }
      } else {
        console.log('✅ Get-or-create profile:', {
          name: getOrCreateProfile.name,
          phone: getOrCreateProfile.phone,
          company_name: getOrCreateProfile.company_name,
          role: getOrCreateProfile.role,
          department: getOrCreateProfile.department,
          position: getOrCreateProfile.position
        });
        
        const allFieldsExtracted = 
          getOrCreateProfile.name === getOrCreateMetadata.name &&
          getOrCreateProfile.phone === getOrCreateMetadata.phone &&
          getOrCreateProfile.company_name === getOrCreateMetadata.company_name &&
          getOrCreateProfile.role === getOrCreateMetadata.role &&
          getOrCreateProfile.department === getOrCreateMetadata.department &&
          getOrCreateProfile.position === getOrCreateMetadata.position;
        
        if (allFieldsExtracted) {
          console.log('🎉 GET_OR_CREATE FUNCTION METADATA EXTRACTION SUCCESSFUL!');
        } else {
          console.log('⚠️ Get-or-create metadata extraction failed');
        }
      }
    }

    // 3. Test with minimal metadata
    console.log('\n3. Testing with minimal metadata...');
    
    const minimalMetadata = {
      name: 'Minimal Final User'
    };

    const { data: minimalUser, error: minimalError } = await supabase.auth.admin.createUser({
      email: `minimal-final-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: minimalMetadata
    });

    if (minimalError) {
      console.error('❌ Error creating minimal user:', minimalError);
    } else {
      console.log('✅ Minimal user created:', minimalUser.user.id);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check profile
      const { data: minimalProfile, error: minimalProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', minimalUser.user.id)
        .single();

      console.log('\n📊 Minimal metadata profile:');
      if (minimalProfileError) {
        console.error('❌ Error:', minimalProfileError);
      } else {
        console.log('✅ Minimal profile:', {
          name: minimalProfile.name,
          phone: minimalProfile.phone,
          company_name: minimalProfile.company_name,
          role: minimalProfile.role,
          department: minimalProfile.department,
          position: minimalProfile.position
        });
        
        if (minimalProfile.name === minimalMetadata.name && minimalProfile.role === 'employee') {
          console.log('🎉 MINIMAL METADATA EXTRACTION SUCCESSFUL!');
        } else {
          console.log('⚠️ Minimal metadata extraction failed');
        }
      }
    }

    // 4. Clean up
    console.log('\n4. Cleaning up...');
    
    const usersToDelete = [
      triggerUser?.user?.id, 
      getOrCreateUser?.user?.id, 
      minimalUser?.user?.id
    ].filter(Boolean);
    
    for (const userId of usersToDelete) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log(`✅ Deleted user: ${userId}`);
      } catch (error) {
        console.log(`⚠️ Could not delete user ${userId}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 Final solution testing completed!');
}

testFinalSolution();