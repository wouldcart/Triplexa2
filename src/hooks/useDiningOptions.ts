import { useState, useCallback } from 'react';
import { DiningOption } from '@/types/proposalOptions';

export const useDiningOptions = () => {
  const [options, setOptions] = useState<DiningOption[]>([]);

  const addDiningOption = useCallback((option: Partial<DiningOption>) => {
    const newOption: DiningOption = {
      id: `dining_${Date.now()}`,
      componentType: 'dining',
      name: option.name || '',
      description: option.description || '',
      type: option.type || 'optional',
      isSelected: false,
      isIncluded: option.type === 'standard',
      priority: option.priority || 1,
      pricing: {
        basePrice: 0,
        totalPrice: 0,
        ...option.pricing
      },
      dayId: option.dayId,
      conditions: option.conditions || [],
      metadata: {
        mealType: 'breakfast',
        cuisine: 'local',
        dietaryOptions: [],
        ...option.metadata
      }
    };
    setOptions(prev => [...prev, newOption]);
    return newOption.id;
  }, []);

  const updateDiningOption = useCallback((optionId: string, updates: Partial<DiningOption>) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  }, []);

  const removeDiningOption = useCallback((optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
  }, []);

  const getDiningByDay = useCallback((dayId: string) => {
    return options.filter(opt => opt.dayId === dayId);
  }, [options]);

  const getDiningByMealType = useCallback((mealType: string) => {
    return options.filter(opt => opt.metadata.mealType === mealType);
  }, [options]);

  const getSelectedDining = useCallback(() => {
    return options.filter(opt => opt.isSelected);
  }, [options]);

  const getTotalDiningCost = useCallback(() => {
    return getSelectedDining().reduce((total, opt) => total + opt.pricing.totalPrice, 0);
  }, [getSelectedDining]);

  const getDiningByVenue = useCallback((venue: string) => {
    return options.filter(opt => opt.metadata.venue === venue);
  }, [options]);

  return {
    options,
    addDiningOption,
    updateDiningOption,
    removeDiningOption,
    getDiningByDay,
    getDiningByMealType,
    getSelectedDining,
    getTotalDiningCost,
    getDiningByVenue
  };
};