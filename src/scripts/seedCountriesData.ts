import { supabaseAdmin } from '../integrations/supabase/adminClient';

// Real world countries data
const countriesData = [
  // Asia
  { name: 'India', code: 'IN', continent: 'Asia', region: 'South Asia', currency: 'INR', currency_symbol: '₹', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Hindi', 'English'], is_popular: true, visa_required: true },
  { name: 'China', code: 'CN', continent: 'Asia', region: 'East Asia', currency: 'CNY', currency_symbol: '¥', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Mandarin'], is_popular: true, visa_required: true },
  { name: 'Japan', code: 'JP', continent: 'Asia', region: 'East Asia', currency: 'JPY', currency_symbol: '¥', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Japanese'], is_popular: true, visa_required: true },
  { name: 'Thailand', code: 'TH', continent: 'Asia', region: 'Southeast Asia', currency: 'THB', currency_symbol: '฿', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Thai'], is_popular: true, visa_required: true },
  { name: 'Singapore', code: 'SG', continent: 'Asia', region: 'Southeast Asia', currency: 'SGD', currency_symbol: 'S$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English', 'Mandarin', 'Malay', 'Tamil'], is_popular: true, visa_required: false },
  { name: 'Malaysia', code: 'MY', continent: 'Asia', region: 'Southeast Asia', currency: 'MYR', currency_symbol: 'RM', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Malay', 'English'], is_popular: true, visa_required: true },
  { name: 'Indonesia', code: 'ID', continent: 'Asia', region: 'Southeast Asia', currency: 'IDR', currency_symbol: 'Rp', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Indonesian'], is_popular: true, visa_required: true },
  { name: 'South Korea', code: 'KR', continent: 'Asia', region: 'East Asia', currency: 'KRW', currency_symbol: '₩', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Korean'], is_popular: true, visa_required: true },
  { name: 'Vietnam', code: 'VN', continent: 'Asia', region: 'Southeast Asia', currency: 'VND', currency_symbol: '₫', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Vietnamese'], is_popular: true, visa_required: true },
  { name: 'Philippines', code: 'PH', continent: 'Asia', region: 'Southeast Asia', currency: 'PHP', currency_symbol: '₱', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Filipino', 'English'], is_popular: true, visa_required: true },
  { name: 'Sri Lanka', code: 'LK', continent: 'Asia', region: 'South Asia', currency: 'LKR', currency_symbol: 'Rs', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Sinhala', 'Tamil'], is_popular: true, visa_required: true },
  { name: 'Nepal', code: 'NP', continent: 'Asia', region: 'South Asia', currency: 'NPR', currency_symbol: 'Rs', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Nepali'], is_popular: true, visa_required: true },
  { name: 'Bhutan', code: 'BT', continent: 'Asia', region: 'South Asia', currency: 'BTN', currency_symbol: 'Nu', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Dzongkha'], is_popular: true, visa_required: true },
  { name: 'Maldives', code: 'MV', continent: 'Asia', region: 'South Asia', currency: 'MVR', currency_symbol: 'Rf', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Dhivehi'], is_popular: true, visa_required: false },
  { name: 'Cambodia', code: 'KH', continent: 'Asia', region: 'Southeast Asia', currency: 'KHR', currency_symbol: '៛', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Khmer'], is_popular: true, visa_required: true },
  { name: 'Laos', code: 'LA', continent: 'Asia', region: 'Southeast Asia', currency: 'LAK', currency_symbol: '₭', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Lao'], is_popular: true, visa_required: true },
  { name: 'Myanmar', code: 'MM', continent: 'Asia', region: 'Southeast Asia', currency: 'MMK', currency_symbol: 'K', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Burmese'], is_popular: true, visa_required: true },
  { name: 'Bangladesh', code: 'BD', continent: 'Asia', region: 'South Asia', currency: 'BDT', currency_symbol: '৳', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Bengali'], is_popular: true, visa_required: true },

  // Europe
  { name: 'United Kingdom', code: 'GB', continent: 'Europe', region: 'Western Europe', currency: 'GBP', currency_symbol: '£', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['English'], is_popular: true, visa_required: false },
  { name: 'France', code: 'FR', continent: 'Europe', region: 'Western Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['French'], is_popular: true, visa_required: false },
  { name: 'Germany', code: 'DE', continent: 'Europe', region: 'Western Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['German'], is_popular: true, visa_required: false },
  { name: 'Italy', code: 'IT', continent: 'Europe', region: 'Southern Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Italian'], is_popular: true, visa_required: false },
  { name: 'Spain', code: 'ES', continent: 'Europe', region: 'Southern Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Spanish'], is_popular: true, visa_required: false },
  { name: 'Netherlands', code: 'NL', continent: 'Europe', region: 'Western Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Dutch'], is_popular: true, visa_required: false },
  { name: 'Switzerland', code: 'CH', continent: 'Europe', region: 'Western Europe', currency: 'CHF', currency_symbol: 'Fr', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['German', 'French', 'Italian'], is_popular: true, visa_required: false },
  { name: 'Austria', code: 'AT', continent: 'Europe', region: 'Western Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['German'], is_popular: true, visa_required: false },
  { name: 'Belgium', code: 'BE', continent: 'Europe', region: 'Western Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Dutch', 'French', 'German'], is_popular: true, visa_required: false },
  { name: 'Portugal', code: 'PT', continent: 'Europe', region: 'Southern Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Portuguese'], is_popular: true, visa_required: false },
  { name: 'Greece', code: 'GR', continent: 'Europe', region: 'Southern Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Greek'], is_popular: true, visa_required: false },
  { name: 'Norway', code: 'NO', continent: 'Europe', region: 'Northern Europe', currency: 'NOK', currency_symbol: 'kr', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Norwegian'], is_popular: true, visa_required: false },
  { name: 'Sweden', code: 'SE', continent: 'Europe', region: 'Northern Europe', currency: 'SEK', currency_symbol: 'kr', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Swedish'], is_popular: true, visa_required: false },
  { name: 'Denmark', code: 'DK', continent: 'Europe', region: 'Northern Europe', currency: 'DKK', currency_symbol: 'kr', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Danish'], is_popular: true, visa_required: false },
  { name: 'Finland', code: 'FI', continent: 'Europe', region: 'Northern Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Finnish', 'Swedish'], is_popular: true, visa_required: false },
  { name: 'Iceland', code: 'IS', continent: 'Europe', region: 'Northern Europe', currency: 'ISK', currency_symbol: 'kr', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Icelandic'], is_popular: true, visa_required: false },
  { name: 'Ireland', code: 'IE', continent: 'Europe', region: 'Western Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['English', 'Irish'], is_popular: true, visa_required: false },
  { name: 'Czech Republic', code: 'CZ', continent: 'Europe', region: 'Eastern Europe', currency: 'CZK', currency_symbol: 'Kč', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Czech'], is_popular: true, visa_required: false },
  { name: 'Poland', code: 'PL', continent: 'Europe', region: 'Eastern Europe', currency: 'PLN', currency_symbol: 'zł', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Polish'], is_popular: true, visa_required: false },
  { name: 'Hungary', code: 'HU', continent: 'Europe', region: 'Eastern Europe', currency: 'HUF', currency_symbol: 'Ft', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Hungarian'], is_popular: true, visa_required: false },
  { name: 'Croatia', code: 'HR', continent: 'Europe', region: 'Southern Europe', currency: 'EUR', currency_symbol: '€', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Croatian'], is_popular: true, visa_required: false },
  { name: 'Turkey', code: 'TR', continent: 'Europe', region: 'Western Asia', currency: 'TRY', currency_symbol: '₺', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Turkish'], is_popular: true, visa_required: true },
  { name: 'Russia', code: 'RU', continent: 'Europe', region: 'Eastern Europe', currency: 'RUB', currency_symbol: '₽', pricing_currency: 'EUR', pricing_currency_symbol: '€', languages: ['Russian'], is_popular: true, visa_required: true },

  // North America
  { name: 'United States', code: 'US', continent: 'North America', region: 'Northern America', currency: 'USD', currency_symbol: '$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English'], is_popular: true, visa_required: false },
  { name: 'Canada', code: 'CA', continent: 'North America', region: 'Northern America', currency: 'CAD', currency_symbol: 'C$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English', 'French'], is_popular: true, visa_required: false },
  { name: 'Mexico', code: 'MX', continent: 'North America', region: 'Central America', currency: 'MXN', currency_symbol: '$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Spanish'], is_popular: true, visa_required: true },

  // South America
  { name: 'Brazil', code: 'BR', continent: 'South America', region: 'South America', currency: 'BRL', currency_symbol: 'R$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Portuguese'], is_popular: true, visa_required: true },
  { name: 'Argentina', code: 'AR', continent: 'South America', region: 'South America', currency: 'ARS', currency_symbol: '$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Spanish'], is_popular: true, visa_required: true },
  { name: 'Chile', code: 'CL', continent: 'South America', region: 'South America', currency: 'CLP', currency_symbol: '$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Spanish'], is_popular: true, visa_required: true },
  { name: 'Peru', code: 'PE', continent: 'South America', region: 'South America', currency: 'PEN', currency_symbol: 'S/', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Spanish'], is_popular: true, visa_required: true },
  { name: 'Colombia', code: 'CO', continent: 'South America', region: 'South America', currency: 'COP', currency_symbol: '$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Spanish'], is_popular: true, visa_required: true },
  { name: 'Ecuador', code: 'EC', continent: 'South America', region: 'South America', currency: 'USD', currency_symbol: '$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Spanish'], is_popular: true, visa_required: true },

  // Africa
  { name: 'South Africa', code: 'ZA', continent: 'Africa', region: 'Southern Africa', currency: 'ZAR', currency_symbol: 'R', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Afrikaans', 'English'], is_popular: true, visa_required: true },
  { name: 'Egypt', code: 'EG', continent: 'Africa', region: 'Northern Africa', currency: 'EGP', currency_symbol: '£', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: true },
  { name: 'Morocco', code: 'MA', continent: 'Africa', region: 'Northern Africa', currency: 'MAD', currency_symbol: 'DH', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic', 'French'], is_popular: true, visa_required: true },
  { name: 'Kenya', code: 'KE', continent: 'Africa', region: 'Eastern Africa', currency: 'KES', currency_symbol: 'KSh', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English', 'Swahili'], is_popular: true, visa_required: true },
  { name: 'Tanzania', code: 'TZ', continent: 'Africa', region: 'Eastern Africa', currency: 'TZS', currency_symbol: 'TSh', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English', 'Swahili'], is_popular: true, visa_required: true },

  // Oceania
  { name: 'Australia', code: 'AU', continent: 'Oceania', region: 'Australia and New Zealand', currency: 'AUD', currency_symbol: 'A$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English'], is_popular: true, visa_required: false },
  { name: 'New Zealand', code: 'NZ', continent: 'Oceania', region: 'Australia and New Zealand', currency: 'NZD', currency_symbol: 'NZ$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English'], is_popular: true, visa_required: false },
  { name: 'Fiji', code: 'FJ', continent: 'Oceania', region: 'Melanesia', currency: 'FJD', currency_symbol: 'FJ$', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['English', 'Fijian'], is_popular: true, visa_required: false },

  // Middle East
  { name: 'United Arab Emirates', code: 'AE', continent: 'Asia', region: 'Western Asia', currency: 'AED', currency_symbol: 'د.إ', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic', 'English'], is_popular: true, visa_required: false },
  { name: 'Saudi Arabia', code: 'SA', continent: 'Asia', region: 'Western Asia', currency: 'SAR', currency_symbol: '﷼', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: true },
  { name: 'Qatar', code: 'QA', continent: 'Asia', region: 'Western Asia', currency: 'QAR', currency_symbol: '﷼', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: false },
  { name: 'Kuwait', code: 'KW', continent: 'Asia', region: 'Western Asia', currency: 'KWD', currency_symbol: 'د.ك', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: true },
  { name: 'Bahrain', code: 'BH', continent: 'Asia', region: 'Western Asia', currency: 'BHD', currency_symbol: '.د.ب', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: false },
  { name: 'Oman', code: 'OM', continent: 'Asia', region: 'Western Asia', currency: 'OMR', currency_symbol: '﷼', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: true },
  { name: 'Jordan', code: 'JO', continent: 'Asia', region: 'Western Asia', currency: 'JOD', currency_symbol: 'د.ا', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic'], is_popular: true, visa_required: true },
  { name: 'Lebanon', code: 'LB', continent: 'Asia', region: 'Western Asia', currency: 'LBP', currency_symbol: '£', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Arabic', 'French'], is_popular: true, visa_required: true },
  { name: 'Israel', code: 'IL', continent: 'Asia', region: 'Western Asia', currency: 'ILS', currency_symbol: '₪', pricing_currency: 'USD', pricing_currency_symbol: '$', languages: ['Hebrew', 'Arabic'], is_popular: true, visa_required: true }
];

export async function seedCountriesData() {
  try {
    console.log('🌍 Starting countries data seeding...');
    
    // First, clear existing data
    console.log('🧹 Clearing existing countries data...');
    const { error: deleteError } = await supabaseAdmin
      .from('countries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.log('⚠️  Warning: Could not clear existing data:', deleteError.message);
    }
    
    // Insert new data in batches to avoid timeout
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < countriesData.length; i += batchSize) {
      const batch = countriesData.slice(i, i + batchSize);
      console.log(`📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(countriesData.length / batchSize)}...`);
      
      const { data, error } = await supabaseAdmin
        .from('countries')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }
      
      insertedCount += data?.length || 0;
      console.log(`✅ Inserted ${data?.length || 0} countries in this batch`);
    }
    
    console.log(`🎉 Successfully seeded ${insertedCount} countries!`);
    
    // Verify the data
    const { count } = await supabaseAdmin
      .from('countries')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total countries in database: ${count}`);
    
    // Show some sample data
    const { data: sampleCountries } = await supabaseAdmin
      .from('countries')
      .select('name, code, continent, currency')
      .limit(5);
    
    console.log('📋 Sample countries:');
    sampleCountries?.forEach(country => {
      console.log(`   ${country.name} (${country.code}) - ${country.continent} - ${country.currency}`);
    });
    
    return { success: true, count: insertedCount };
    
  } catch (error) {
    console.error('❌ Countries seeding failed:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  seedCountriesData()
    .then(() => {
      console.log('✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}