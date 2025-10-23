import { useState, useEffect } from 'react';
import { CountriesService, CountryRow } from '@/services/countriesService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Country } from '@/pages/inventory/countries/types/country';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

interface UseRealTimeCountriesReturn {
  countries: Country[];
  activeCountries: Country[];
  popularCountries: Country[];
  currencies: CurrencyOption[];
  loading: boolean;
  error: string | null;
  refreshCountries: () => Promise<void>;
  updateCountryCurrency: (countryId: string, currency: string, symbol: string) => Promise<boolean>;
  overridePricingCurrency: (countryId: string, currency: string, symbol: string) => Promise<boolean>;
}

// Map Supabase country row to frontend Country interface
const mapCountryRow = (row: CountryRow): Country => ({
  id: row.id,
  name: row.name,
  code: row.code,
  region: row.region,
  continent: row.continent,
  currency: row.currency,
  currency_symbol: row.currency_symbol,
  status: row.status,
  flag_url: row.flag_url || null,
  is_popular: row.is_popular || false,
  visa_required: row.visa_required || false,
  languages: Array.isArray(row.languages) ? row.languages : [],
  pricing_currency_override: row.pricing_currency_override || false,
  pricing_currency: row.pricing_currency || null,
  pricing_currency_symbol: row.pricing_currency_symbol || null,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || new Date().toISOString(),
});

export const useRealTimeCountries = (): UseRealTimeCountriesReturn => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await CountriesService.getAllCountries();
      
      if (response.success && response.data) {
        const mappedCountries = response.data.map(mapCountryRow);
        setCountries(mappedCountries);
      } else {
        setError(response.error || 'Failed to fetch countries');
        console.error('Error fetching countries:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Unexpected error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCountries = async () => {
    await fetchCountries();
  };

  const updateCountryCurrency = async (countryId: string, currency: string, symbol: string): Promise<boolean> => {
    try {
      const response = await CountriesService.updateCountry(countryId, {
        currency,
        currency_symbol: symbol,
        updated_at: new Date().toISOString(),
      });

      if (response.success) {
        // Update local state
        setCountries(prev => prev.map(country => 
          country.id === countryId 
            ? { ...country, currency, currency_symbol: symbol }
            : country
        ));
        
        toast({
          title: "Currency Updated",
          description: `Country currency updated to ${currency} (${symbol})`,
        });
        
        return true;
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update currency",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const overridePricingCurrency = async (countryId: string, currency: string, symbol: string): Promise<boolean> => {
    try {
      const response = await CountriesService.updateCountry(countryId, {
        pricing_currency_override: true,
        pricing_currency: currency,
        pricing_currency_symbol: symbol,
        updated_at: new Date().toISOString(),
      });

      if (response.success) {
        // Update local state
        setCountries(prev => prev.map(country => 
          country.id === countryId 
            ? { 
                ...country, 
                pricing_currency_override: true,
                pricing_currency: currency,
                pricing_currency_symbol: symbol
              }
            : country
        ));
        
        toast({
          title: "Pricing Currency Override Set",
          description: `Pricing currency override set to ${currency} (${symbol})`,
        });
        
        return true;
      } else {
        toast({
          title: "Override Failed",
          description: response.error || "Failed to set pricing currency override",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: "Override Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Derived data
  const activeCountries = countries.filter(country => country.status === 'active');
  const popularCountries = countries.filter(country => country.is_popular && country.status === 'active');
  
  // Extract unique currencies from countries
  const currencies: CurrencyOption[] = Array.from(
    new Map(
      countries.map(country => [
        country.currency,
        {
          code: country.currency,
          name: country.currency, // You might want to add full currency names to the database
          symbol: country.currency_symbol,
        }
      ])
    ).values()
  );

  useEffect(() => {
    fetchCountries();

    // Set up real-time subscription for countries table
    const subscription = supabase
      .channel('countries-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'countries'
        },
        (payload) => {
          console.log('Real-time countries update:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Add new country
            const newCountry = mapCountryRow(payload.new as CountryRow);
            setCountries(prev => [...prev, newCountry]);
            
            // Note: Toast messages for new countries are handled by useCountryActions
            // to prevent duplicate notifications
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Update existing country
            const updatedCountry = mapCountryRow(payload.new as CountryRow);
            setCountries(prev => prev.map(country => 
              country.id === updatedCountry.id ? updatedCountry : country
            ));
            
            // Note: Toast messages for status changes are handled by useCountryActions
            // to prevent duplicate notifications
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Remove deleted country
            setCountries(prev => prev.filter(country => country.id !== payload.old.id));
            
            // Note: Toast messages for deleted countries are handled by useCountryActions
            // to prevent duplicate notifications
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return {
    countries,
    activeCountries,
    popularCountries,
    currencies,
    loading,
    error,
    refreshCountries,
    updateCountryCurrency,
    overridePricingCurrency,
  };
};

// Export common currencies for backward compatibility
export const commonCurrencies: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];