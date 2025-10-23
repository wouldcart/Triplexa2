
// Country mapping service for assignment logic - integrated with Countries Management module
import { initialCountries } from '../pages/inventory/countries/data/countryData';

export interface Country {
  id: string;
  name: string;
  code: string;
}

// Use countries from the centralized Countries Management module instead of hardcoded list
export const countries: Country[] = initialCountries
  .filter(country => country.status === 'active')
  .map(country => ({
    id: country.id,
    name: country.name,
    code: country.code
  }));

export const getCountryById = (id: string): Country | undefined => {
  return countries.find(country => country.id === id);
};

export const getCountryByName = (name: string): Country | undefined => {
  return countries.find(country => 
    country.name.toLowerCase() === name.toLowerCase() ||
    (name.toLowerCase() === 'uae' && country.name === 'United Arab Emirates') ||
    (name.toLowerCase() === 'usa' && country.name === 'United States') ||
    (name.toLowerCase() === 'uk' && country.name === 'United Kingdom')
  );
};

export const getCountriesByIds = (ids: string[]): Country[] => {
  return ids.map(id => getCountryById(id)).filter(Boolean) as Country[];
};

export const getStaffOperationalCountries = (operationalCountries: string[]): string[] => {
  return operationalCountries
    .map(id => getCountryById(id)?.name)
    .filter(Boolean) as string[];
};
