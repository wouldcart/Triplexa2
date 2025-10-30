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

async function testWorkingSolution() {
  console.log('🧪 Testing working trigger solution...');

  try {
    // 1. Test trigger with comprehensive metadata
    console.log('\n1. Testing trigger with comprehensive metadata...');
    
    const triggerMetadata = {
      name: 'Working Trigger User',
      phone: '+1234567890',
      company_name: 'Working Corp',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Manager'
    };

    const { data: triggerUser, error: triggerError } = await supabase.auth.admin.createUser({
      email: `working-trigger-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: triggerMetadata
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
        triggerProfile.name === triggerMetadata.name &&
        triggerProfile.phone === triggerMetadata.phone &&
        triggerProfile.company_name === triggerMetadata.company_name &&
        triggerProfile.role === triggerMetadata.role &&
        triggerProfile.department === triggerMetadata.department &&
        triggerProfile.position === triggerMetadata.position;
      
      if (allFieldsExtracted) {
        console.log('🎉 ALL METADATA FIELDS SUCCESSFULLY EXTRACTED BY TRIGGER!');
      } else {
        console.log('⚠️ Some metadata fields not extracted correctly by trigger');
        console.log('Expected:', triggerMetadata);
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

    // 2. Test with minimal metadata
    console.log('\n2. Testing with minimal metadata...');
    
    const minimalMetadata = {
      name: 'Minimal Working User'
    };

    const { data: minimalUser, error: minimalError } = await supabase.auth.admin.createUser({
      email: `minimal-working-${Date.now()}@example.com`,
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

    // 3. Test with no metadata
    console.log('\n3. Testing with no metadata...');
    
    const { data: noMetaUser, error: noMetaError } = await supabase.auth.admin.createUser({
      email: `no-meta-${Date.now()}@example.com`,
      password: 'testpassword123'
      // No user_metadata
    });

    if (noMetaError) {
      console.error('❌ Error creating no-meta user:', noMetaError);
    } else {
      console.log('✅ No-meta user created:', noMetaUser.user.id);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check profile
      const { data: noMetaProfile, error: noMetaProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', noMetaUser.user.id)
        .single();

      console.log('\n📊 No metadata profile:');
      if (noMetaProfileError) {
        console.error('❌ Error:', noMetaProfileError);
      } else {
        console.log('✅ No-meta profile:', {
          name: noMetaProfile.name,
          phone: noMetaProfile.phone,
          company_name: noMetaProfile.company_name,
          role: noMetaProfile.role,
          department: noMetaProfile.department,
          position: noMetaProfile.position
        });
        
        if (noMetaProfile.role === 'employee') {
          console.log('🎉 NO METADATA HANDLING SUCCESSFUL (default role applied)!');
        } else {
          console.log('⚠️ No metadata handling failed');
        }
      }
    }

    // 4. Clean up
    console.log('\n4. Cleaning up...');
    
    const usersToDelete = [
      triggerUser?.user?.id, 
      minimalUser?.user?.id, 
      noMetaUser?.user?.id
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

  console.log('\n🎉 Working solution testing completed!');
}

testWorkingSolution();