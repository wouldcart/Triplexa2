import { useState, useCallback } from 'react';
import { TransferOption } from '@/types/proposalOptions';

export const useTransferOptions = () => {
  const [options, setOptions] = useState<TransferOption[]>([]);

  const addTransferOption = useCallback((option: Partial<TransferOption>) => {
    const newOption: TransferOption = {
      id: `transfer_${Date.now()}`,
      componentType: 'transfer',
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
        vehicleType: 'sedan',
        capacity: 4,
        route: {
          from: '',
          to: '',
          distance: 0,
          duration: '1 hour'
        },
        ...option.metadata
      }
    };
    setOptions(prev => [...prev, newOption]);
    return newOption.id;
  }, []);

  const updateTransferOption = useCallback((optionId: string, updates: Partial<TransferOption>) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  }, []);

  const removeTransferOption = useCallback((optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
  }, []);

  const getTransfersByDay = useCallback((dayId: string) => {
    return options.filter(opt => opt.dayId === dayId);
  }, [options]);

  const getTransfersByVehicleType = useCallback((vehicleType: string) => {
    return options.filter(opt => opt.metadata.vehicleType === vehicleType);
  }, [options]);

  const getSelectedTransfers = useCallback(() => {
    return options.filter(opt => opt.isSelected);
  }, [options]);

  const getTotalTransferCost = useCallback(() => {
    return getSelectedTransfers().reduce((total, opt) => total + opt.pricing.totalPrice, 0);
  }, [getSelectedTransfers]);

  const getTransfersByRoute = useCallback((from: string, to: string) => {
    return options.filter(opt => 
      opt.metadata.route.from === from && opt.metadata.route.to === to
    );
  }, [options]);

  return {
    options,
    addTransferOption,
    updateTransferOption,
    removeTransferOption,
    getTransfersByDay,
    getTransfersByVehicleType,
    getSelectedTransfers,
    getTotalTransferCost,
    getTransfersByRoute
  };
};