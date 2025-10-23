require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTransportRoutes() {
  console.log('🚀 Starting transport_routes table migration...\n');

  try {
    // Step 1: Check current schema
    console.log('📊 Checking current schema...');
    const { data: currentData, error: fetchError } = await supabase
      .from('transport_routes')
      .select('id, status, created_by, updated_by')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching current data:', fetchError);
      return;
    }

    console.log('Current sample data:', currentData);

    // Step 2: Add new columns if they don't exist
    console.log('\n🔧 Adding new columns...');
    
    // Add created_by column (UUID reference to auth.users)
    try {
      const { error: addCreatedByError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'transport_routes' 
              AND column_name = 'created_by_user'
            ) THEN
              ALTER TABLE public.transport_routes 
              ADD COLUMN created_by_user UUID REFERENCES auth.users(id);
              COMMENT ON COLUMN public.transport_routes.created_by_user IS 'User who created this route';
            END IF;
          END $$;
        `
      });

      if (addCreatedByError) {
        console.log('Note: created_by_user column may already exist or RPC not available');
      } else {
        console.log('✅ Added created_by_user column');
      }
    } catch (e) {
      console.log('Note: Using alternative method for created_by_user column');
    }

    // Add updated_by column (UUID reference to auth.users)
    try {
      const { error: addUpdatedByError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'transport_routes' 
              AND column_name = 'updated_by_user'
            ) THEN
              ALTER TABLE public.transport_routes 
              ADD COLUMN updated_by_user UUID REFERENCES auth.users(id);
              COMMENT ON COLUMN public.transport_routes.updated_by_user IS 'User who last updated this route';
            END IF;
          END $$;
        `
      });

      if (addUpdatedByError) {
        console.log('Note: updated_by_user column may already exist or RPC not available');
      } else {
        console.log('✅ Added updated_by_user column');
      }
    } catch (e) {
      console.log('Note: Using alternative method for updated_by_user column');
    }

    // Step 3: Add boolean status column
    try {
      const { error: addStatusBoolError } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'transport_routes' 
              AND column_name = 'is_active'
            ) THEN
              ALTER TABLE public.transport_routes 
              ADD COLUMN is_active BOOLEAN DEFAULT true;
              COMMENT ON COLUMN public.transport_routes.is_active IS 'Boolean status: true for active, false for inactive';
            END IF;
          END $$;
        `
      });

      if (addStatusBoolError) {
        console.log('Note: is_active column may already exist or RPC not available');
      } else {
        console.log('✅ Added is_active boolean column');
      }
    } catch (e) {
      console.log('Note: Using alternative method for is_active column');
    }

    // Step 4: Migrate existing status data to boolean
    console.log('\n🔄 Migrating status data...');
    
    // Get all routes with their current status
    const { data: allRoutes, error: getAllError } = await supabase
      .from('transport_routes')
      .select('id, status');

    if (getAllError) {
      console.error('❌ Error fetching routes for migration:', getAllError);
      return;
    }

    console.log(`📊 Found ${allRoutes.length} routes to migrate`);

    // Update each route's boolean status based on text status
    let successCount = 0;
    let errorCount = 0;

    for (const route of allRoutes) {
      const isActive = route.status === 'active' || route.status === true;
      
      try {
        const { error: updateError } = await supabase
          .from('transport_routes')
          .update({ is_active: isActive })
          .eq('id', route.id);

        if (updateError) {
          console.error(`❌ Error updating route ${route.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        console.error(`❌ Exception updating route ${route.id}:`, e);
        errorCount++;
      }
    }

    console.log(`✅ Migration complete: ${successCount} success, ${errorCount} errors`);

    // Step 5: Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('transport_routes')
      .select('id, status, is_active, created_by_user, updated_by_user')
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
      return;
    }

    console.log('✅ Sample migrated data:');
    verifyData.forEach((route, index) => {
      console.log(`${index + 1}. Route ${route.id}:`);
      console.log(`   Original status: ${route.status}`);
      console.log(`   New is_active: ${route.is_active}`);
      console.log(`   Created by: ${route.created_by_user || 'null'}`);
      console.log(`   Updated by: ${route.updated_by_user || 'null'}`);
    });

    // Step 6: Create indexes for performance
    console.log('\n🚀 Creating indexes...');
    
    try {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_transport_routes_is_active 
          ON public.transport_routes(is_active);
          
          CREATE INDEX IF NOT EXISTS idx_transport_routes_created_by_user 
          ON public.transport_routes(created_by_user);
          
          CREATE INDEX IF NOT EXISTS idx_transport_routes_updated_by_user 
          ON public.transport_routes(updated_by_user);
        `
      });

      if (indexError) {
        console.log('Note: Indexes may already exist or RPC not available');
      } else {
        console.log('✅ Created performance indexes');
      }
    } catch (e) {
      console.log('Note: Using alternative method for indexes');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application code to use is_active instead of status');
    console.log('2. Implement user tracking in your application');
    console.log('3. Consider deprecating the old status column after testing');

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
  }
}

migrateTransportRoutes().then(() => {
  console.log('\n✅ Migration script complete');
});