
import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCitiesData } from '@/hooks/useCitiesData';
import { CityAllocation } from '@/hooks/useOptionalCities';
import { Switch } from "@/components/ui/switch";

interface CityCheckboxSelectorProps {
  country: string;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  cityAllocations?: CityAllocation[];
  onCityAllocationsChange?: (allocations: CityAllocation[]) => void;
  isOptionalEnabled?: boolean;
  onOptionalToggle?: (enabled: boolean) => void;
  cityOptionalFlags?: Record<string, boolean>;
  onCityOptionalChange?: (cityName: string, optional: boolean) => void;
}

export const CityCheckboxSelector: React.FC<CityCheckboxSelectorProps> = ({
  country,
  selectedCities,
  onCitiesChange,
  cityAllocations = [],
  onCityAllocationsChange,
  isOptionalEnabled = false,
  onOptionalToggle,
  cityOptionalFlags,
  onCityOptionalChange
}) => {
  const { getCitiesByCountry } = useCitiesData();
  const availableCities = country ? getCitiesByCountry(country) : [];
  const [optionalCities, setOptionalCities] = React.useState<Set<string>>(new Set());

  const handleCityToggle = (cityName: string, checked: boolean) => {
    if (checked) {
      onCitiesChange([...selectedCities, cityName]);
    } else {
      onCitiesChange(selectedCities.filter(city => city !== cityName));
      // Remove allocation when city is deselected
      if (onCityAllocationsChange) {
        onCityAllocationsChange(cityAllocations.filter(alloc => alloc.cityId !== cityName));
      }
    }
  };

  const handleAllocationChange = (cityName: string, allocation: number) => {
    if (onCityAllocationsChange) {
      const existingIndex = cityAllocations.findIndex(alloc => alloc.cityId === cityName);
      if (existingIndex >= 0) {
        const updated = [...cityAllocations];
        updated[existingIndex] = { cityId: cityName, allocation };
        onCityAllocationsChange(updated);
      } else {
        onCityAllocationsChange([...cityAllocations, { cityId: cityName, allocation }]);
      }
    }
  };

  const getCityAllocation = (cityName: string): number => {
    const allocation = cityAllocations.find(alloc => alloc.cityId === cityName);
    return allocation?.allocation || 0;
  };

  const handleCityOptionalToggle = (cityName: string, optional: boolean) => {
    if (onCityOptionalChange) {
      onCityOptionalChange(cityName, optional);
      return;
    }
    const newOptionalCities = new Set(optionalCities);
    if (optional) {
      newOptionalCities.add(cityName);
    } else {
      newOptionalCities.delete(cityName);
    }
    setOptionalCities(newOptionalCities);
  };

  const isCityOptional = (cityName: string): boolean => {
    if (cityOptionalFlags && cityName in cityOptionalFlags) {
      return !!cityOptionalFlags[cityName];
    }
    return optionalCities.has(cityName);
  };

  if (!country) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Cities to Visit
      </Label>
      

      
      {availableCities.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          {availableCities.map((city) => {
            const isSelected = selectedCities.includes(city.name);
            const isOptional = isCityOptional(city.name);
            
            return (
              <div key={city.id} className="flex items-center justify-between space-x-3 p-2 rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`city-${city.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleCityToggle(city.name, checked as boolean)}
                    className="border-gray-400 dark:border-gray-500"
                  />
                  <Label 
                    htmlFor={`city-${city.id}`} 
                    className={`text-sm font-medium cursor-pointer ${
                      isSelected 
                        ? isOptional 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {city.name}
                  </Label>
                </div>
                {isSelected && (
                  <div className="flex items-center space-x-1">
                    <Switch
                      id={`optional-${city.id}`}
                      checked={isOptional}
                      onCheckedChange={(checked) => handleCityOptionalToggle(city.name, checked as boolean)}
                      className="scale-75"
                    />
                    <Label 
                      htmlFor={`optional-${city.id}`} 
                      className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                      Optional
                    </Label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          No cities available for {country}
        </div>
      )}
      
      {selectedCities.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'}

        </div>
      )}
    </div>
  );
};
