import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Info } from 'lucide-react';
import { Query } from '@/types/query';

interface OptionalCitiesIntegrationProps {
  query: Query;
}

export const OptionalCitiesIntegration: React.FC<OptionalCitiesIntegrationProps> = ({ query }) => {
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

  if (optionalCities.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
          <Info className="h-4 w-4" />
          Optional Cities from Enquiry
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Required Cities
            </div>
            <div className="flex flex-wrap gap-2">
              {requiredCities.map(city => (
                <Badge key={city} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Optional Cities
            </div>
            <div className="flex flex-wrap gap-2">
              {optionalCities.map(city => (
                <Badge key={city} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city} (Optional)
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          These optional cities were selected during enquiry creation and should be considered for the proposal planning.
        </div>
      </CardContent>
    </Card>
  );
};