import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HotelCurrencyData {
  currency: string;
  currencySymbol: string;
  displayText: string; // e.g., "USD ($)"
}

export const useHotelCurrencyData = (hotelId?: string) => {
  const [currencyData, setCurrencyData] = useState<HotelCurrencyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHotelCurrency = async (id: string) => {
    if (!id) {
      setCurrencyData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('hotels')
        .select('currency, currency_symbol')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching hotel currency:', fetchError);
        setError(`Failed to fetch currency data for hotel ${id}`);
        setCurrencyData(null);
        return;
      }

      if (data) {
        // Handle case where currency columns might not exist yet
        const currency = (data as any).currency || 'USD';
        const currencySymbol = (data as any).currency_symbol || '$';

        const currencyInfo: HotelCurrencyData = {
          currency,
          currencySymbol,
          displayText: `${currency} (${currencySymbol})`
        };

        setCurrencyData(currencyInfo);
      } else {
        setError(`No currency data found for hotel ${id}`);
        setCurrencyData(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching hotel currency:', err);
      setError('An unexpected error occurred while fetching hotel currency data');
      setCurrencyData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchHotelCurrency(hotelId);
    } else {
      setCurrencyData(null);
      setError(null);
    }
  }, [hotelId]);

  return {
    currencyData,
    loading,
    error,
    refetch: () => hotelId && fetchHotelCurrency(hotelId)
  };
};