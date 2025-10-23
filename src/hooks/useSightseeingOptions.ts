import { useState, useCallback } from 'react';
import { SightseeingOption } from '@/types/proposalOptions';

export const useSightseeingOptions = () => {
  const [options, setOptions] = useState<SightseeingOption[]>([]);

  const addSightseeingOption = useCallback((option: Partial<SightseeingOption>) => {
    const newOption: SightseeingOption = {
      id: `sightseeing_${Date.now()}`,
      componentType: 'sightseeing',
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
        duration: '2 hours',
        category: 'cultural',
        inclusions: [],
        exclusions: [],
        ...option.metadata
      }
    };
    setOptions(prev => [...prev, newOption]);
    return newOption.id;
  }, []);

  const updateSightseeingOption = useCallback((optionId: string, updates: Partial<SightseeingOption>) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  }, []);

  const removeSightseeingOption = useCallback((optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
  }, []);

  const getSightseeingByDay = useCallback((dayId: string) => {
    return options.filter(opt => opt.dayId === dayId);
  }, [options]);

  const getSightseeingByCategory = useCallback((category: string) => {
    return options.filter(opt => opt.metadata.category === category);
  }, [options]);

  const getSelectedSightseeing = useCallback(() => {
    return options.filter(opt => opt.isSelected);
  }, [options]);

  const getTotalSightseeingCost = useCallback(() => {
    return getSelectedSightseeing().reduce((total, opt) => total + opt.pricing.totalPrice, 0);
  }, [getSelectedSightseeing]);

  return {
    options,
    addSightseeingOption,
    updateSightseeingOption,
    removeSightseeingOption,
    getSightseeingByDay,
    getSightseeingByCategory,
    getSelectedSightseeing,
    getTotalSightseeingCost
  };
};