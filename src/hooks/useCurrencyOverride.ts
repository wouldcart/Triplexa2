import { useState } from 'react';
import { CountriesService } from '@/services/countriesService';
import { useToast } from '@/hooks/use-toast';

export interface CurrencyOverrideData {
  pricingCurrency: string;
  pricingCurrencySymbol: string;
}

export interface UseCurrencyOverrideReturn {
  isLoading: boolean;
  overridePricingCurrency: (countryId: string, currencyData: CurrencyOverrideData) => Promise<boolean>;
  removePricingCurrencyOverride: (countryId: string) => Promise<boolean>;
  bulkOverridePricingCurrency: (countryIds: string[], currencyData: CurrencyOverrideData) => Promise<boolean>;
  getCountriesWithOverrides: () => Promise<any[]>;
}

export const useCurrencyOverride = (): UseCurrencyOverrideReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const overridePricingCurrency = async (
    countryId: string, 
    currencyData: CurrencyOverrideData
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await CountriesService.overridePricingCurrency(
        countryId,
        currencyData.pricingCurrency,
        currencyData.pricingCurrencySymbol
      );

      if (response.success) {
        toast({
          title: "Currency Override Applied",
          description: `Pricing currency updated to ${currencyData.pricingCurrency}`,
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to override pricing currency",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error overriding pricing currency:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removePricingCurrencyOverride = async (countryId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await CountriesService.removePricingCurrencyOverride(countryId);

      if (response.success) {
        toast({
          title: "Currency Override Removed",
          description: "Pricing currency override has been removed",
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to remove pricing currency override",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error removing pricing currency override:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkOverridePricingCurrency = async (
    countryIds: string[], 
    currencyData: CurrencyOverrideData
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await CountriesService.bulkOverridePricingCurrency(
        countryIds,
        currencyData.pricingCurrency,
        currencyData.pricingCurrencySymbol
      );

      if (response.success) {
        toast({
          title: "Bulk Currency Override Applied",
          description: `Pricing currency updated to ${currencyData.pricingCurrency} for ${countryIds.length} countries`,
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to apply bulk pricing currency override",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error applying bulk pricing currency override:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCountriesWithOverrides = async (): Promise<any[]> => {
    setIsLoading(true);
    try {
      const response = await CountriesService.getCountriesWithPricingOverrides();

      if (response.success) {
        return response.data || [];
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch countries with pricing overrides",
          variant: "destructive"
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching countries with overrides:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    overridePricingCurrency,
    removePricingCurrencyOverride,
    bulkOverridePricingCurrency,
    getCountriesWithOverrides
  };
};