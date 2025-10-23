import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CountryCurrency {
  currency: string;
  currency_symbol: string;
  pricing_currency: string;
  pricing_currency_symbol: string;
  pricing_currency_override: boolean;
}

export interface CurrencyInfo {
  currency: string;
  symbol: string;
  displayText: string; // e.g., "USD ($)"
}

export const useSightseeingCurrency = (countryName?: string) => {
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrencyData = async (country: string) => {
    if (!country) {
      setCurrencyInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('countries')
        .select('currency, currency_symbol, pricing_currency, pricing_currency_symbol, pricing_currency_override')
        .eq('name', country)
        .eq('status', 'active')
        .single();

      if (fetchError) {
        console.error('Error fetching country currency:', fetchError);
        setError(`Failed to fetch currency data for ${country}`);
        setCurrencyInfo(null);
        return;
      }

      if (data) {
        const countryCurrency = data as CountryCurrency;
        
        // Determine which currency to use based on pricing_currency_override
        const currency = countryCurrency.pricing_currency_override 
          ? countryCurrency.pricing_currency 
          : countryCurrency.currency;
          
        const symbol = countryCurrency.pricing_currency_override 
          ? countryCurrency.pricing_currency_symbol 
          : countryCurrency.currency_symbol;

        const currencyInfo: CurrencyInfo = {
          currency,
          symbol,
          displayText: `${currency} (${symbol})`
        };

        setCurrencyInfo(currencyInfo);
      } else {
        setError(`No currency data found for ${country}`);
        setCurrencyInfo(null);
      }
    } catch (err) {
      console.error('Error in fetchCurrencyData:', err);
      setError('An unexpected error occurred while fetching currency data');
      setCurrencyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countryName) {
      fetchCurrencyData(countryName);
    } else {
      setCurrencyInfo(null);
      setError(null);
    }
  }, [countryName]);

  return {
    currencyInfo,
    loading,
    error,
    refetch: () => countryName && fetchCurrencyData(countryName)
  };
};