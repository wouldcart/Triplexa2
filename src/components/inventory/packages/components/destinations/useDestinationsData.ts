
import { useState, useEffect } from 'react';
import { City, Country } from '../../types/packageTypes';
import { initialCities } from '@/pages/inventory/cities/data/cityData';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';

export const useDestinationsData = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [citiesByCountry, setCitiesByCountry] = useState<Record<string, City[]>>({});
  
  useEffect(() => {
    // Get only active countries from the centralized Countries Management module
    const activeCountries = initialCountries
      .filter(country => country.status === 'active')
      .map(country => ({
        id: country.id,
        name: country.name
      }));
      
    setCountries(activeCountries);
    
    // Create a mapping of country ID to cities from the Cities management module
    const cityGroups: Record<string, City[]> = {};
    
    // Iterate through active countries to group cities by country
    activeCountries.forEach(country => {
      // Filter cities from the Cities management module data
      // Only include active cities for the current country
      const countryCities = initialCities
        .filter(city => city.country === country.name && city.status === 'active')
        .map(city => ({
          id: city.id.toString(),
          name: city.name
        }));
      
      cityGroups[country.id] = countryCities;
    });
    
    setCitiesByCountry(cityGroups);
  }, []);

  return {
    countries,
    citiesByCountry
  };
};
