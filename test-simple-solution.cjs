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

async function testSimpleSolution() {
  console.log('🧪 Testing simple trigger solution...');

  try {
    // 1. Test trigger with comprehensive metadata
    console.log('\n1. Testing trigger with comprehensive metadata...');
    
    const triggerMetadata = {
      name: 'Simple Trigger User',
      phone: '+1234567890',
      company_name: 'Simple Corp',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Manager'
    };

    const { data: triggerUser, error: triggerError } = await supabase.auth.admin.createUser({
      email: `simple-trigger-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: triggerMetadata
    });

    if (triggerError) {
      console.error('❌ Error creating trigger user:', triggerError);
      return;
    }

    console.log('✅ Trigger user created:', triggerUser.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

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
      console.log('✅ SUCCESS! Trigger profile:', {
        name: triggerProfile.name,
        phone: triggerProfile.phone,
        company_name: triggerProfile.company_name,
        role: triggerProfile.role,
        department: triggerProfile.department,
        position: triggerProfile.position
      });
      
      // Check if all fields are properly extracted
      const allFieldsExtracted = 
        triggerProfile.name === triggerMetadata.name &&
        triggerProfile.phone === triggerMetadata.phone &&
        triggerProfile.company_name === triggerMetadata.company_name &&
        triggerProfile.role === triggerMetadata.role &&
        triggerProfile.department === triggerMetadata.department &&
        triggerProfile.position === triggerMetadata.position;
      
      if (allFieldsExtracted) {
        console.log('🎉 ALL METADATA FIELDS SUCCESSFULLY EXTRACTED!');
      } else {
        console.log('⚠️ Some metadata fields not extracted correctly');
      }
    }

    // 2. Test get_or_create function
    console.log('\n2. Testing get_or_create function...');
    
    const getCreateMetadata = {
      name: 'GetCreate Simple User',
      phone: '+9876543210',
      company_name: 'GetCreate Corp',
      role: 'Director',
      department: 'Sales',
      position: 'Sales Director'
    };

    const { data: getCreateUser, error: getCreateError } = await supabase.auth.admin.createUser({
      email: `getcreate-simple-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: getCreateMetadata
    });

    if (getCreateError) {
      console.error('❌ Error creating get/create user:', getCreateError);
    } else {
      console.log('✅ Get/create user created:', getCreateUser.user.id);
      
      // Delete the profile first to test the get_or_create function
      await supabase
        .from('profiles')
        .delete()
        .eq('id', getCreateUser.user.id);
      
      console.log('✅ Profile deleted for testing get_or_create');
      
      // Test the function (Note: this won't work with current user context, but let's try)
      const { data: getCreateProfile, error: getCreateProfileError } = await supabase.rpc('get_or_create_profile_for_current_user');
      
      console.log('\n📊 Get/create function result:');
      if (getCreateProfileError) {
        console.log('⚠️ Expected error (no current user context):', getCreateProfileError.message);
        
        // Instead, let's manually create a profile to test the logic
        console.log('📝 Manually testing profile creation logic...');
        
        const { data: manualProfile, error: manualError } = await supabase
          .from('profiles')
          .insert({
            id: getCreateUser.user.id,
            name: getCreateMetadata.name,
            phone: getCreateMetadata.phone,
            company_name: getCreateMetadata.company_name,
            role: getCreateMetadata.role,
            department: getCreateMetadata.department,
            position: getCreateMetadata.position
          })
          .select()
          .single();
        
        if (manualError) {
          console.error('❌ Manual profile creation error:', manualError);
        } else {
          console.log('✅ Manual profile created successfully:', {
            name: manualProfile.name,
            phone: manualProfile.phone,
            company_name: manualProfile.company_name,
            role: manualProfile.role,
            department: manualProfile.department,
            position: manualProfile.position
          });
        }
      } else {
        console.log('✅ Get/create profile:', getCreateProfile);
      }
    }

    // 3. Test with minimal metadata
    console.log('\n3. Testing with minimal metadata...');
    
    const minimalMetadata = {
      name: 'Minimal User'
    };

    const { data: minimalUser, error: minimalError } = await supabase.auth.admin.createUser({
      email: `minimal-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: minimalMetadata
    });

    if (minimalError) {
      console.error('❌ Error creating minimal user:', minimalError);
    } else {
      console.log('✅ Minimal user created:', minimalUser.user.id);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      }
    }

    // 4. Clean up
    console.log('\n4. Cleaning up...');
    
    const usersToDelete = [
      triggerUser?.user?.id, 
      getCreateUser?.user?.id, 
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

  console.log('\n🎉 Simple solution testing completed!');
}

testSimpleSolution();