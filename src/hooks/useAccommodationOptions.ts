
import { useState, useCallback } from 'react';

interface AccommodationOption {
  id: string;
  hotel: any;
  roomType: string;
  numberOfRooms: number;
  numberOfNights: number;
  pricePerNight: number;
  totalPrice: number;
  isSelected: boolean;
  isAlternative: boolean;
  priority: number;
}

export const useAccommodationOptions = () => {
  const [options, setOptions] = useState<AccommodationOption[]>([]);

  const addOption = useCallback((option: AccommodationOption) => {
    setOptions(prev => [...prev, option]);
  }, []);

  const removeOption = useCallback((optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
  }, []);

  const updateOption = useCallback((optionId: string, updates: Partial<AccommodationOption>) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  }, []);

  const getSelectedOptions = useCallback(() => {
    return options.filter(opt => opt.isSelected);
  }, [options]);

  const getPrimaryOptions = useCallback(() => {
    return options.filter(opt => !opt.isAlternative && opt.isSelected);
  }, [options]);

  const getAlternativeOptions = useCallback(() => {
    return options.filter(opt => opt.isAlternative && opt.isSelected);
  }, [options]);

  const getTotalCost = useCallback(() => {
    return getSelectedOptions().reduce((total, opt) => total + opt.totalPrice, 0);
  }, [getSelectedOptions]);

  const clearOptions = useCallback(() => {
    setOptions([]);
  }, []);

  return {
    options,
    addOption,
    removeOption,
    updateOption,
    getSelectedOptions,
    getPrimaryOptions,
    getAlternativeOptions,
    getTotalCost,
    clearOptions
  };
};
