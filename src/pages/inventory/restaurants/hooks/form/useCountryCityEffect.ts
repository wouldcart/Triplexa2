
import { useEffect, useState } from 'react';
import { Restaurant } from '../../types/restaurantTypes';

export interface CountryCityEffectProps {
  formData: Partial<Restaurant>;
  cityOptions: any[];
  filterCitiesByCountry: (country: string) => void;
}

export const useCountryCityEffect = ({
  formData,
  cityOptions,
  filterCitiesByCountry
}: CountryCityEffectProps) => {
  const [previousCountry, setPreviousCountry] = useState<string | undefined>(undefined);
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // Filter cities when country changes
  useEffect(() => {
    console.log('Country changed to:', formData.country);
    console.log('Current city value:', formData.city);
    
    // Skip first render to avoid unnecessary city resets
    if (isFirstRender) {
      setIsFirstRender(false);
      if (formData.country) {
        setPreviousCountry(formData.country);
        filterCitiesByCountry(formData.country);
      }
      return;
    }
    
    if (formData.country) {
      // Check if country has actually changed
      if (previousCountry !== formData.country) {
        console.log('Filtering cities for country:', formData.country);
        filterCitiesByCountry(formData.country);
        setPreviousCountry(formData.country);
        
        // Reset city selection if country changes and city isn't in the new country
        if (formData.city && previousCountry) {
          const cityBelongsToNewCountry = cityOptions.some(
            city => city.name === formData.city && city.country === formData.country
          );
          
          if (!cityBelongsToNewCountry) {
            console.log('City reset because it does not belong to the new country');
          }
        }
      }
    }
  }, [formData.country, filterCitiesByCountry, previousCountry, formData.city, cityOptions, isFirstRender]);
  
  // Log when city is set for debugging purposes
  useEffect(() => {
    if (formData.city) {
      console.log('City set to:', formData.city);
    }
  }, [formData.city]);
  
  // Validate if city belongs to selected country
  useEffect(() => {
    if (formData.country && formData.city && cityOptions.length > 0) {
      const cityValid = cityOptions.some(
        city => city.name === formData.city
      );
      
      if (!cityValid) {
        console.log('Selected city is not valid for the current country');
      }
    }
  }, [formData.country, formData.city, cityOptions]);
};
