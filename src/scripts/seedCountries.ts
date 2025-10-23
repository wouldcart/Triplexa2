import { CountriesService } from '@/services/countriesService';

// Sample countries data for seeding
const sampleCountries = [
  {
    name: "United States",
    code: "US",
    region: "North America",
    continent: "North America",
    currency: "USD",
    currency_symbol: "$",
    status: "active" as const,
    flag_url: "https://flagcdn.com/us.svg",
    is_popular: true,
    visa_required: false,
    languages: ["English"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "United Kingdom",
    code: "GB",
    region: "Europe",
    continent: "Europe",
    currency: "GBP",
    currency_symbol: "£",
    status: "active" as const,
    flag_url: "https://flagcdn.com/gb.svg",
    is_popular: true,
    visa_required: false,
    languages: ["English"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "Germany",
    code: "DE",
    region: "Europe",
    continent: "Europe",
    currency: "EUR",
    currency_symbol: "€",
    status: "active" as const,
    flag_url: "https://flagcdn.com/de.svg",
    is_popular: true,
    visa_required: false,
    languages: ["German"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "Japan",
    code: "JP",
    region: "Asia",
    continent: "Asia",
    currency: "JPY",
    currency_symbol: "¥",
    status: "active" as const,
    flag_url: "https://flagcdn.com/jp.svg",
    is_popular: true,
    visa_required: true,
    languages: ["Japanese"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "Australia",
    code: "AU",
    region: "Oceania",
    continent: "Oceania",
    currency: "AUD",
    currency_symbol: "A$",
    status: "active" as const,
    flag_url: "https://flagcdn.com/au.svg",
    is_popular: true,
    visa_required: true,
    languages: ["English"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "Canada",
    code: "CA",
    region: "North America",
    continent: "North America",
    currency: "CAD",
    currency_symbol: "C$",
    status: "active" as const,
    flag_url: "https://flagcdn.com/ca.svg",
    is_popular: true,
    visa_required: false,
    languages: ["English", "French"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "France",
    code: "FR",
    region: "Europe",
    continent: "Europe",
    currency: "EUR",
    currency_symbol: "€",
    status: "active" as const,
    flag_url: "https://flagcdn.com/fr.svg",
    is_popular: true,
    visa_required: false,
    languages: ["French"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "Brazil",
    code: "BR",
    region: "South America",
    continent: "South America",
    currency: "BRL",
    currency_symbol: "R$",
    status: "active" as const,
    flag_url: "https://flagcdn.com/br.svg",
    is_popular: true,
    visa_required: true,
    languages: ["Portuguese"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "India",
    code: "IN",
    region: "Asia",
    continent: "Asia",
    currency: "INR",
    currency_symbol: "₹",
    status: "active" as const,
    flag_url: "https://flagcdn.com/in.svg",
    is_popular: true,
    visa_required: true,
    languages: ["Hindi", "English"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  },
  {
    name: "China",
    code: "CN",
    region: "Asia",
    continent: "Asia",
    currency: "CNY",
    currency_symbol: "¥",
    status: "inactive" as const,
    flag_url: "https://flagcdn.com/cn.svg",
    is_popular: false,
    visa_required: true,
    languages: ["Chinese"],
    pricing_currency_override: false,
    pricing_currency: null,
    pricing_currency_symbol: null,
  }
];

export async function seedCountries() {
  console.log('Starting countries seeding...');
  
  try {
    // Check if countries already exist
    const existingCountries = await CountriesService.getAllCountries();
    
    if (existingCountries.success && existingCountries.data && existingCountries.data.length > 0) {
      console.log(`Found ${existingCountries.data.length} existing countries. Skipping seeding.`);
      return {
        success: true,
        message: `Database already contains ${existingCountries.data.length} countries`,
        data: existingCountries.data
      };
    }
    
    // Bulk insert sample countries
    const result = await CountriesService.bulkInsertCountries(sampleCountries);
    
    if (result.success) {
      console.log(`Successfully seeded ${result.data?.length || 0} countries`);
      return {
        success: true,
        message: `Successfully seeded ${result.data?.length || 0} countries`,
        data: result.data
      };
    } else {
      console.error('Failed to seed countries:', result.error);
      return {
        success: false,
        message: result.error || 'Failed to seed countries',
        data: null
      };
    }
  } catch (error) {
    console.error('Error during seeding:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during seeding',
      data: null
    };
  }
}

// Export for use in other scripts
export { sampleCountries };