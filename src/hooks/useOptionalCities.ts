import { useState, useCallback } from 'react';

export interface CityAllocation {
  cityId: string;
  allocation: number;
}

export interface UseOptionalCitiesReturn {
  cityAllocations: CityAllocation[];
  onCityAllocationsChange: (allocations: CityAllocation[]) => void;
  isOptionalEnabled: boolean;
  setOptionalEnabled: (enabled: boolean) => void;
  getCityAllocation: (cityId: string) => number;
  updateCityAllocation: (cityId: string, allocation: number) => void;
}

export const useOptionalCities = (): UseOptionalCitiesReturn => {
  const [cityAllocations, setCityAllocations] = useState<CityAllocation[]>([]);
  const [isOptionalEnabled, setOptionalEnabled] = useState(false);

  const onCityAllocationsChange = useCallback((allocations: CityAllocation[]) => {
    setCityAllocations(allocations);
  }, []);

  const getCityAllocation = useCallback((cityId: string): number => {
    const allocation = cityAllocations.find(alloc => alloc.cityId === cityId);
    return allocation?.allocation || 0;
  }, [cityAllocations]);

  const updateCityAllocation = useCallback((cityId: string, allocation: number) => {
    setCityAllocations(prev => {
      const existingIndex = prev.findIndex(alloc => alloc.cityId === cityId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { cityId, allocation };
        return updated;
      } else {
        return [...prev, { cityId, allocation }];
      }
    });
  }, []);

  return {
    cityAllocations,
    onCityAllocationsChange,
    isOptionalEnabled,
    setOptionalEnabled,
    getCityAllocation,
    updateCityAllocation,
  };
};

export default useOptionalCities;