import { CountryRow, CountryInsert } from './countriesService';
import { Country } from '@/pages/inventory/countries/types/country';

/**
 * Maps a database country row to the frontend Country type
 */
export function mapDbCountryToFrontend(dbCountry: any): Country {
  return {
    id: String(dbCountry.id),
    name: dbCountry.name,
    code: dbCountry.code,
    continent: dbCountry.continent || '',
    region: dbCountry.region || '',
    currency: dbCountry.currency,
    currency_symbol: dbCountry.currency_symbol || '',
    status: dbCountry.status as "active" | "inactive",
    flag_url: dbCountry.flag_url || null,
    is_popular: dbCountry.is_popular || false,
    visa_required: dbCountry.visa_required || false,
    languages: dbCountry.languages || [],
    pricing_currency_override: dbCountry.pricing_currency_override || false,
    pricing_currency: dbCountry.pricing_currency || null,
    pricing_currency_symbol: dbCountry.pricing_currency_symbol || null,
    created_at: dbCountry.created_at,
    updated_at: dbCountry.updated_at,
  };
}

/**
 * Maps a frontend Country to database insert format
 */
export function mapFrontendCountryToDbInsert(country: Omit<Country, 'id' | 'created_at' | 'updated_at'>): any {
  return {
    name: country.name,
    code: country.code,
    continent: country.continent,
    region: country.region,
    currency: country.currency,
    currency_symbol: country.currency_symbol,
    status: country.status,
    flag_url: country.flag_url || null,
    is_popular: country.is_popular,
    visa_required: country.visa_required,
    languages: country.languages,
    pricing_currency_override: country.pricing_currency_override || false,
    pricing_currency: country.pricing_currency || null,
    pricing_currency_symbol: country.pricing_currency_symbol || null,
  };
}

/**
 * Maps a frontend Country to database update format
 */
export function mapFrontendCountryToDbUpdate(country: Partial<Country>) {
  const update: any = {};
  
  if (country.name !== undefined) update.name = country.name;
  if (country.code !== undefined) update.code = country.code;
  if (country.continent !== undefined) update.continent = country.continent;
  if (country.region !== undefined) update.region = country.region;
  if (country.currency !== undefined) update.currency = country.currency;
  if (country.currency_symbol !== undefined) update.currency_symbol = country.currency_symbol;
  if (country.status !== undefined) update.status = country.status;
  if (country.flag_url !== undefined) update.flag_url = country.flag_url || null;
  if (country.is_popular !== undefined) update.is_popular = country.is_popular;
  if (country.visa_required !== undefined) update.visa_required = country.visa_required;
  if (country.languages !== undefined) update.languages = country.languages;
  if (country.pricing_currency_override !== undefined) update.pricing_currency_override = country.pricing_currency_override;
  if (country.pricing_currency !== undefined) update.pricing_currency = country.pricing_currency || null;
  if (country.pricing_currency_symbol !== undefined) update.pricing_currency_symbol = country.pricing_currency_symbol || null;
  
  return update;
}

/**
 * Maps multiple database countries to frontend format
 */
export function mapDbCountriesToFrontend(dbCountries: CountryRow[]): Country[] {
  return dbCountries.map(mapDbCountryToFrontend);
}