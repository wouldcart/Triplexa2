
import React from 'react';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCitiesData } from '@/hooks/useCitiesData';

interface CityCheckboxSelectorProps {
  country: string;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
}

export const CityCheckboxSelector: React.FC<CityCheckboxSelectorProps> = ({
  country,
  selectedCities,
  onCitiesChange
}) => {
  const { getCitiesByCountry } = useCitiesData();
  const availableCities = country ? getCitiesByCountry(country) : [];

  const handleCityToggle = (cityName: string, checked: boolean) => {
    if (checked) {
      onCitiesChange([...selectedCities, cityName]);
    } else {
      onCitiesChange(selectedCities.filter(city => city !== cityName));
    }
  };

  if (!country) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Cities to Visit *
      </Label>
      
      {availableCities.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          {availableCities.map((city) => (
            <div key={city.id} className="flex items-center space-x-3">
              <Checkbox
                id={`city-${city.id}`}
                checked={selectedCities.includes(city.name)}
                onCheckedChange={(checked) => handleCityToggle(city.name, checked as boolean)}
                className="border-gray-400 dark:border-gray-500"
              />
              <Label 
                htmlFor={`city-${city.id}`} 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {city.name}
              </Label>
            </div>
          ))}
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
