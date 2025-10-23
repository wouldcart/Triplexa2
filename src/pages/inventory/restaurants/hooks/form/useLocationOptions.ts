
import { useState, useEffect } from 'react';
import { CountryOption, CityOption } from '../../types/restaurantTypes';
import { CitiesService } from '@/services/citiesService';
import { CountriesService } from '@/services/countriesService';


export const useLocationOptions = () => {
  // Countries and cities options
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [filteredCityOptions, setFilteredCityOptions] = useState<CityOption[]>([]);
  
  // Initialize country and city options
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        console.log('Initializing country and city options');
        
        // Get active countries from CitiesService
        const countriesResponse = await CitiesService.getActiveCountries();
        if (countriesResponse.success && countriesResponse.data) {
          const updatedCountries = countriesResponse.data.map(country => ({
            id: country.id,
            name: country.name,
            code: country.code,
            currency: country.currency || '',
            currencySymbol: country.currency_symbol || ''
          }));
          
          console.log('Available countries:', updatedCountries.length);
          setCountryOptions(updatedCountries);
        }
        
        // Get active cities from CitiesService
        const citiesResponse = await CitiesService.getActiveCities();
        if (citiesResponse.success && citiesResponse.data) {
          const allCities = citiesResponse.data.map(city => ({
            id: city.id,
            name: city.name,
            country: city.country
          }));
          
          console.log('Available cities:', allCities.length);
          setCityOptions(allCities);
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    };

    loadLocationData();
  }, []);

  const filterCitiesByCountry = (country: string) => {
    if (country) {
      console.log('Filtering cities for country:', country);
      const filtered = cityOptions.filter(city => city.country === country);
      console.log('Filtered cities:', filtered.length, filtered.map(c => c.name).join(', '));
      setFilteredCityOptions(filtered);
    } else {
      setFilteredCityOptions([]);
    }
  };

  return {
    countryOptions,
    cityOptions,
    filteredCityOptions,
    setFilteredCityOptions,
    filterCitiesByCountry
  };
};
