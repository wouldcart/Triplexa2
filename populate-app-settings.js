import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Populating app_settings table with test data...');

const testSettings = [
  {
    category: 'Branding & UI',
    setting_key: 'brand_tagline',
    setting_value: 'Your Journey, Our Expertise',
    description: 'Main tagline displayed on the website',
    data_type: 'text',
    is_required: false,
    is_active: true
  },
  {
    category: 'Branding & UI',
    setting_key: 'company_name',
    setting_value: 'Triplexa Travel',
    description: 'Company name displayed throughout the application',
    data_type: 'text',
    is_required: true,
    is_active: true
  },
  {
    category: 'SEO & Meta',
    setting_key: 'meta_title',
    setting_value: 'Triplexa - Premium Travel Services',
    description: 'Default meta title for SEO',
    data_type: 'text',
    is_required: false,
    is_active: true
  },
  {
    category: 'SEO & Meta',
    setting_key: 'meta_description',
    setting_value: 'Discover amazing travel experiences with Triplexa. Professional travel services, custom itineraries, and unforgettable journeys.',
    description: 'Default meta description for SEO',
    data_type: 'text',
    is_required: false,
    is_active: true
  },
  {
    category: 'General',
    setting_key: 'default_currency',
    setting_value: 'USD',
    description: 'Default currency for pricing',
    data_type: 'text',
    is_required: true,
    is_active: true
  }
];

async function populateSettings() {
  try {
    console.log('📝 Inserting test settings...');
    
    for (const setting of testSettings) {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .upsert(setting, { 
          onConflict: 'category,setting_key',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error inserting ${setting.setting_key}:`, error.message);
      } else {
        console.log(`✅ Inserted/Updated: ${setting.category} -> ${setting.setting_key}`);
      }
    }
    
    // Verify the data was inserted
    console.log('\n📋 Verifying inserted data...');
    const { data: allSettings, error: readError } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });
    
    if (readError) {
      console.error('❌ Error reading settings:', readError.message);
    } else {
      console.log(`✅ Successfully verified ${allSettings.length} settings in database`);
      
      // Group by category
      const grouped = allSettings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});
      
      console.log('\n📊 Settings by category:');
      Object.entries(grouped).forEach(([category, settings]) => {
        console.log(`\n${category}:`);
        settings.forEach(setting => {
          console.log(`  - ${setting.setting_key}: ${setting.setting_value}`);
        });
      });
    }
    
    console.log('\n🎉 App settings population completed!');
    
  } catch (error) {
    console.error('❌ Failed to populate settings:', error.message);
  }
}

populateSettings();