import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CountryCurrencyRow {
  currency: string | null;
  currency_symbol: string | null;
  pricing_currency: string | null;
  pricing_currency_symbol: string | null;
  pricing_currency_override: boolean | null;
}

export interface HotelCurrencyInfo {
  currency: string;
  symbol: string;
  displayText: string; // e.g., "USD ($)"
}

export const useHotelCurrency = (countryName?: string) => {
  const [currencyInfo, setCurrencyInfo] = useState<HotelCurrencyInfo | null>(null);
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
        console.error('Hotel: Error fetching country currency:', fetchError);
        setError(`Failed to fetch currency data for ${country}`);
        setCurrencyInfo(null);
        return;
      }

      if (data) {
        const row = data as CountryCurrencyRow;
        const override = !!row.pricing_currency_override;

        const currency = override
          ? (row.pricing_currency || row.currency || 'USD')
          : (row.currency || 'USD');

        const symbol = override
          ? (row.pricing_currency_symbol || row.currency_symbol || '$')
          : (row.currency_symbol || '$');

        const info: HotelCurrencyInfo = {
          currency,
          symbol,
          displayText: `${currency} (${symbol})`
        };

        setCurrencyInfo(info);
      } else {
        setError(`No currency data found for ${country}`);
        setCurrencyInfo(null);
      }
    } catch (err) {
      console.error('Hotel: Unexpected error fetching currency:', err);
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