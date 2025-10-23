import { useState, useEffect } from 'react';
import { CountriesService } from '@/services/countriesService';
import { mapDbCountriesToFrontend } from '@/services/countryMapper';
import { Country } from '@/pages/inventory/countries/types/country';

interface UseRealTimeCountriesDataReturn {
  countries: Country[];
  activeCountries: Country[];
  loading: boolean;
  error: string | null;
  refreshCountries: () => Promise<void>;
  getCountryByCode: (code: string) => Country | undefined;
  getCountryByName: (name: string) => Country | undefined;
  getCountryById: (id: string) => Country | undefined;
}

/**
 * Centralized hook for accessing real-time countries data from Supabase
 * This replaces the need for static initialCountries data across the application
 */
export const useRealTimeCountriesData = (): UseRealTimeCountriesDataReturn => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CountriesService.getAllCountries();
      
      if (response.success && response.data) {
        const mappedCountries = mapDbCountriesToFrontend(response.data);
        setCountries(mappedCountries);
      } else {
        setError(response.error || 'Failed to load countries');
        setCountries([]);
      }
    } catch (err) {
      console.error('Error loading countries:', err);
      setError('An unexpected error occurred while loading countries');
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  // Derived data
  const activeCountries = countries.filter(country => country.status === 'active');

  // Helper functions
  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(country => 
      country.code.toLowerCase() === code.toLowerCase()
    );
  };

  const getCountryByName = (name: string): Country | undefined => {
    return countries.find(country => 
      country.name.toLowerCase() === name.toLowerCase()
    );
  };

  const getCountryById = (id: string): Country | undefined => {
    return countries.find(country => country.id === id);
  };

  const refreshCountries = async () => {
    await loadCountries();
  };

  return {
    countries,
    activeCountries,
    loading,
    error,
    refreshCountries,
    getCountryByCode,
    getCountryByName,
    getCountryById
  };
};

// Export a singleton instance for components that need immediate access
let cachedCountriesData: Country[] = [];
let isLoading = false;

export const getCachedCountriesData = async (): Promise<Country[]> => {
  if (cachedCountriesData.length > 0) {
    return cachedCountriesData;
  }

  if (isLoading) {
    // Wait for the current loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return cachedCountriesData;
  }

  try {
    isLoading = true;
    const response = await CountriesService.getAllCountries();
    
    if (response.success && response.data) {
      cachedCountriesData = mapDbCountriesToFrontend(response.data);
    }
    
    return cachedCountriesData;
  } catch (error) {
    console.error('Error loading cached countries data:', error);
    return [];
  } finally {
    isLoading = false;
  }
};

// Helper function to get active countries from cache
export const getCachedActiveCountries = async (): Promise<Country[]> => {
  const countries = await getCachedCountriesData();
  return countries.filter(country => country.status === 'active');
};