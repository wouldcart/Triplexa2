import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Info } from 'lucide-react';
import { Query } from '@/types/query';

interface OptionalCitiesAccommodationProps {
  query: Query;
  onAccommodationUpdate?: (cities: string[]) => void;
}

export const OptionalCitiesAccommodation: React.FC<OptionalCitiesAccommodationProps> = ({ 
  query, 
  onAccommodationUpdate 
}) => {
  if (!query?.destination?.cities?.length) {
    return null;
  }

  // Get optional cities from city allocations
  const optionalCities = query.cityAllocations
    ?.filter(alloc => alloc.isOptional)
    .map(alloc => alloc.cityId) || [];

  const requiredCities = query.destination.cities.filter(city => 
    !optionalCities.includes(city)
  );

  const allCities = [...requiredCities, ...optionalCities];

  if (optionalCities.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
          <Info className="h-4 w-4" />
          Optional Cities Accommodation Planning
        </CardTitle>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Consider accommodation options for both required and optional cities
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Required Cities (Must Include)
            </div>
            <div className="flex flex-wrap gap-2">
              {requiredCities.map(city => (
                <Badge key={city} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Optional Cities (Plan Alternatives)
            </div>
            <div className="flex flex-wrap gap-2">
              {optionalCities.map(city => (
                <Badge key={city} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city} (Optional)
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <span className="font-medium">Planning Tip:</span> Create accommodation options for both scenarios - with and without optional cities. This allows flexible pricing in your proposal.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};