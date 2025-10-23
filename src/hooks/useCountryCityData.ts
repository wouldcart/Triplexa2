
import { useState, useEffect, useMemo } from 'react';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { initialCities } from '@/pages/inventory/cities/data/cityData';

interface CountryCityData {
  countries: string[];
  cities: string[];
  getCitiesByCountry: (country: string) => string[];
  loading: boolean;
}

let cachedData: { countries: string[]; citiesMap: Map<string, string[]> } | null = null;

export const useCountryCityData = (): CountryCityData => {
  const [loading, setLoading] = useState(false);

  // Memoized data preparation
  const data = useMemo(() => {
    if (cachedData) {
      return cachedData;
    }

    console.log('Preparing country and city data (one-time initialization)');
    setLoading(true);

    // Get unique countries
    const countries = Array.from(new Set([
      ...initialCountries.map(c => c.name),
      ...initialCities.map(c => c.country)
    ])).sort();

    // Create cities map for efficient lookup
    const citiesMap = new Map<string, string[]>();
    
    // Group cities by country
    initialCities.forEach(city => {
      const country = city.country;
      if (!citiesMap.has(country)) {
        citiesMap.set(country, []);
      }
      citiesMap.get(country)!.push(city.name);
    });

    // Sort cities for each country
    citiesMap.forEach((cities, country) => {
      citiesMap.set(country, cities.sort());
    });

    cachedData = { countries, citiesMap };
    setLoading(false);
    
    return cachedData;
  }, []);

  const getCitiesByCountry = useMemo(() => {
    return (country: string) => {
      return data.citiesMap.get(country) || [];
    };
  }, [data.citiesMap]);

  return {
    countries: data.countries,
    cities: Array.from(data.citiesMap.values()).flat().sort(),
    getCitiesByCountry,
    loading
  };
};
