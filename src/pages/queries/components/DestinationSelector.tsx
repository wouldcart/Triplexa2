
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCitiesData } from '@/hooks/useCitiesData';
import { CityCheckboxSelector } from './CityCheckboxSelector';

interface DestinationSelectorProps {
  selectedDestinations: {
    country: string;
    cities: string[];
  }[];
  onDestinationsChange: (destinations: { country: string; cities: string[] }[]) => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  selectedDestinations,
  onDestinationsChange
}) => {
  const { getActiveCountries } = useCitiesData();
  const activeCountries = getActiveCountries();

  const handleCountryChange = (country: string) => {
    const newDestinations = [{
      country,
      cities: []
    }];
    onDestinationsChange(newDestinations);
  };

  const handleCitiesChange = (cities: string[]) => {
    if (selectedDestinations.length > 0) {
      const updatedDestinations = [{
        ...selectedDestinations[0],
        cities
      }];
      onDestinationsChange(updatedDestinations);
    }
  };

  const currentDestination = selectedDestinations.length > 0 ? selectedDestinations[0] : { country: '', cities: [] };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="country" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Destination Country *
        </Label>
        <Select value={currentDestination.country} onValueChange={handleCountryChange}>
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
      
      {currentDestination.country && (
        <CityCheckboxSelector
          country={currentDestination.country}
          selectedCities={currentDestination.cities}
          onCitiesChange={handleCitiesChange}
        />
      )}
    </div>
  );
};
