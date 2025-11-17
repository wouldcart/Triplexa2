
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCitiesData } from '@/hooks/useCitiesData';
import { CityCheckboxSelector } from './CityCheckboxSelector';
import { CityAllocation } from '@/hooks/useOptionalCities';

interface CountryCitySelectorProps {
  destination: {
    country: string;
    cities: string[];
  };
  onDestinationChange: (destination: { country: string; cities: string[] }) => void;
  cityAllocations?: CityAllocation[];
  onCityAllocationsChange?: (allocations: CityAllocation[]) => void;
  isOptionalEnabled?: boolean;
  onOptionalToggle?: (enabled: boolean) => void;
  cityOptionalFlags?: Record<string, boolean>;
  onCityOptionalChange?: (cityName: string, optional: boolean) => void;
}

export const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({
  destination,
  onDestinationChange,
  cityAllocations,
  onCityAllocationsChange,
  isOptionalEnabled,
  onOptionalToggle,
  cityOptionalFlags,
  onCityOptionalChange
}) => {
  const { getActiveCountries } = useCitiesData();
  const activeCountries = getActiveCountries();

  const handleCountryChange = (country: string) => {
    onDestinationChange({
      country,
      cities: []
    });
  };

  const handleCitiesChange = (cities: string[]) => {
    onDestinationChange({
      ...destination,
      cities
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="country" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Destination Country *
        </Label>
        <Select value={destination.country} onValueChange={handleCountryChange}>
          <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            <SelectValue placeholder="Select destination country" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            {activeCountries.map((country) => (
              <SelectItem key={country.id} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {destination.country && (
        <CityCheckboxSelector
          country={destination.country}
          selectedCities={destination.cities}
          onCitiesChange={handleCitiesChange}
          cityAllocations={cityAllocations}
          onCityAllocationsChange={onCityAllocationsChange}
          isOptionalEnabled={isOptionalEnabled}
          onOptionalToggle={onOptionalToggle}
          cityOptionalFlags={cityOptionalFlags}
          onCityOptionalChange={onCityOptionalChange}
        />
      )}
    </div>
  );
};
