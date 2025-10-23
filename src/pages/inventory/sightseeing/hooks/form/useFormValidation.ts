import { useState, useEffect } from 'react';
import { Sightseeing } from '@/types/sightseeing';

export interface FormValidationProps {
  formData: Sightseeing;
}

export const useFormValidation = ({ formData }: FormValidationProps) => {
  const [isFormValid, setIsFormValid] = useState(false);
  
  useEffect(() => {
    // Basic required fields validation
    const isBasicValid = !!formData.name && !!formData.country && !!formData.city;
    // Operational required fields
    const hasActivities = Array.isArray(formData.activities) && formData.activities.length > 0;
    const hasPickupTime = !!(formData.pickupTime && formData.pickupTime.trim().length > 0);
    
    // Pricing validation - check all possible pricing sources including SIC
    const hasPricing = 
      (formData.isFree) || 
      (formData.price && (formData.price.adult > 0 || formData.price.child > 0)) || 
      (formData.sicAvailable && formData.sicPricing && (formData.sicPricing.adult > 0 || formData.sicPricing.child > 0)) ||
      (formData.pricingOptions && formData.pricingOptions.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0))) || 
      (formData.transferOptions && formData.transferOptions.some(o => o.isEnabled && o.price > 0)) ||
      (formData.packageOptions && formData.packageOptions.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0))) ||
      (formData.groupSizeOptions && formData.groupSizeOptions.some(o => (o.adultPrice > 0 || o.childPrice > 0)));
    
    setIsFormValid(isBasicValid && hasActivities && hasPickupTime && hasPricing);
  }, [
    formData.name,
    formData.country,
    formData.city,
    formData.activities,
    formData.pickupTime,
    formData.isFree,
    formData.price,
    formData.sicAvailable,
    formData.sicPricing,
    formData.pricingOptions,
    formData.transferOptions,
    formData.packageOptions,
    formData.groupSizeOptions
  ]);
  
  return { isFormValid };
};