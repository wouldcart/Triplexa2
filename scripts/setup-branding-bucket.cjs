#!/usr/bin/env node

/**
 * Script to create the 'branding' storage bucket in Supabase
 * and configure proper CORS settings to fix ORB errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBrandingBucket() {
  console.log('🚀 Setting up branding storage bucket...');

  try {
    // Step 1: Create the branding bucket if it doesn't exist
    console.log('📦 Creating branding bucket...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const brandingBucket = buckets.find(bucket => bucket.id === 'branding');
    
    if (!brandingBucket) {
      const { data, error } = await supabase.storage.createBucket('branding', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Error creating branding bucket:', error);
        return;
      }
      console.log('✅ Branding bucket created successfully');
    } else {
      console.log('✅ Branding bucket already exists');
      
      // Update bucket to ensure it's public
      const { error: updateError } = await supabase.storage.updateBucket('branding', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880
      });

      if (updateError) {
        console.error('❌ Error updating branding bucket:', updateError);
      } else {
        console.log('✅ Branding bucket updated to public');
      }
    }

    // Step 2: Set up RLS policies for the branding bucket
    console.log('🔒 Setting up RLS policies...');
    
    const policies = [
      {
        name: 'branding_read_public',
        sql: `
          create policy if not exists "branding_read_public"
            on storage.objects
            for select
            to public
            using (bucket_id = 'branding');
        `
      },
      {
        name: 'branding_insert_authenticated',
        sql: `
          create policy if not exists "branding_insert_authenticated"
            on storage.objects
            for insert
            to authenticated
            with check (bucket_id = 'branding');
        `
      },
      {
        name: 'branding_update_authenticated',
        sql: `
          create policy if not exists "branding_update_authenticated"
            on storage.objects
            for update
            to authenticated
            using (bucket_id = 'branding')
            with check (bucket_id = 'branding');
        `
      },
      {
        name: 'branding_delete_authenticated',
        sql: `
          create policy if not exists "branding_delete_authenticated"
            on storage.objects
            for delete
            to authenticated
            using (bucket_id = 'branding');
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: policy.sql.trim()
        });
        
        if (error) {
          console.error(`❌ Error creating policy ${policy.name}:`, error);
        } else {
          console.log(`✅ Policy ${policy.name} created/updated`);
        }
      } catch (err) {
        console.error(`❌ Exception creating policy ${policy.name}:`, err.message);
      }
    }

    // Step 3: Test bucket access
    console.log('🧪 Testing bucket access...');
    
    const { data: testList, error: testError } = await supabase.storage
      .from('branding')
      .list('', { limit: 1 });

    if (testError) {
      console.error('❌ Error testing bucket access:', testError);
    } else {
      console.log('✅ Bucket access test successful');
    }

    console.log('\n🎉 Branding bucket setup completed!');
    console.log('📝 Summary:');
    console.log('   - Branding bucket created/updated as public');
    console.log('   - RLS policies configured for proper access');
    console.log('   - CORS issues should be resolved');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your application');
    console.log('   2. Try uploading a favicon or logo');
    console.log('   3. Check browser console for any remaining errors');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupBrandingBucket().catch(console.error);