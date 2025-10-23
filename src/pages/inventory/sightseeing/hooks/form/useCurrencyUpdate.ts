
import { useEffect } from 'react';
import { Sightseeing } from '@/types/sightseeing';
import { useSightseeingCurrency } from '@/hooks/useSightseeingCurrency';

export interface CurrencyUpdateProps {
  formData: Sightseeing;
  setFormData: React.Dispatch<React.SetStateAction<Sightseeing>>;
}

export const useCurrencyUpdate = ({ formData, setFormData }: CurrencyUpdateProps) => {
  const { currencyInfo, loading } = useSightseeingCurrency(formData.country);

  useEffect(() => {
    if (currencyInfo && formData.country && !loading) {
      console.log('Sightseeing: Updating currency for country:', formData.country);
      console.log('Sightseeing: Currency info:', currencyInfo);
      
      setFormData(prev => ({
        ...prev,
        currency: currencyInfo.currency,
        currencySymbol: currencyInfo.symbol,
        pricing_currency: currencyInfo.currency,
        pricing_currency_symbol: currencyInfo.symbol
      }));
      
      console.log('Sightseeing: Updated currency to:', currencyInfo);
    }
  }, [currencyInfo, formData.country, loading, setFormData]);
};
