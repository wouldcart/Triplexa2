
import { useState, useEffect } from 'react';
import { CitiesService, CityRow } from '@/services/citiesService';
import { CountriesService, CountryRow } from '@/services/countriesService';

export interface City {
  id: string;
  name: string;
  region: string;
  country: string;
  has_airport: boolean;
  is_popular: boolean;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
  // Legacy compatibility fields
  hasAirport?: boolean;
  isPopular?: boolean;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export const useCitiesData = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load cities from CitiesService
        const citiesResponse = await CitiesService.getActiveCities();
        if (citiesResponse.success && citiesResponse.data) {
          const transformedCities: City[] = citiesResponse.data.map((city: CityRow) => ({
            id: city.id,
            name: city.name,
            region: city.region,
            country: city.country,
            has_airport: city.has_airport,
            is_popular: city.is_popular,
            status: city.status,
            created_at: city.created_at,
            updated_at: city.updated_at,
            // Legacy compatibility
            hasAirport: city.has_airport,
            isPopular: city.is_popular
          }));
          setCities(transformedCities);
        }

        // Load active countries from CitiesService
        const countriesResponse = await CitiesService.getActiveCountries();
        if (countriesResponse.success && countriesResponse.data) {
          const transformedCountries: Country[] = countriesResponse.data.map((country: CountryRow) => ({
            id: country.id,
            name: country.name,
            code: country.code,
            status: country.status as "active" | "inactive"
          }));
          setCountries(transformedCountries);
        }
      } catch (error) {
        console.error('Error loading cities and countries data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get active cities for a specific region/country
  const getCitiesByCountry = (countryName: string): City[] => {
    return cities.filter(city => 
      (city.country === countryName || city.region === countryName) && 
      city.status === 'active'
    );
  };

  // Get all active cities
  const getActiveCities = (): City[] => {
    return cities.filter(city => city.status === 'active');
  };

  // Get all active countries
  const getActiveCountries = (): Country[] => {
    return countries.filter(country => country.status === 'active');
  };

  return {
    cities,
    countries,
    loading,
    getCitiesByCountry,
    getActiveCities,
    getActiveCountries,
    setCities,
    setCountries
  };
};
