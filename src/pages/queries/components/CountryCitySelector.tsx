
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCitiesData } from '@/hooks/useCitiesData';
import { CityCheckboxSelector } from './CityCheckboxSelector';

interface CountryCitySelectorProps {
  destination: {
    country: string;
    cities: string[];
  };
  onDestinationChange: (destination: { country: string; cities: string[] }) => void;
}

export const CountryCitySelector: React.FC<CountryCitySelectorProps> = ({
  destination,
  onDestinationChange
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
        />
      )}
    </div>
  );
};
