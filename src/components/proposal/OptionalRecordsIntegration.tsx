import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Car, Info, Eye, Activity } from 'lucide-react';
import { Query } from '@/types/query';

interface OptionalRecordsIntegrationProps {
  query: Query;
}

export const OptionalRecordsIntegration: React.FC<OptionalRecordsIntegrationProps> = ({ query }) => {
  if (!query) return null;

  // Get optional cities from city allocations
  const optionalCities = query.cityAllocations
    ?.filter(alloc => alloc.isOptional)
    .map(alloc => alloc.cityId) || [];

  const requiredCities = query.destination.cities.filter(city => 
    !optionalCities.includes(city)
  );

  // Check if there are any optional components
  const hasOptionalCities = optionalCities.length > 0;
  const hasOptionalSightseeing = query.optionalSightseeingOptions?.some(option => option.isOptional) || false;
  const hasOptionalTransport = query.optionalTransportOptions?.some(option => option.isOptional) || false;

  if (!hasOptionalCities && !hasOptionalSightseeing && !hasOptionalTransport) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
          <Info className="h-4 w-4" />
          Optional Components from Enquiry
        </CardTitle>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          These optional components were selected during enquiry creation and should be considered for proposal planning
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Optional Cities */}
        {hasOptionalCities && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Optional Cities</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {optionalCities.map(city => (
                <Badge key={city} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                  {city}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Optional Sightseeing Options */}
        {hasOptionalSightseeing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Optional Sightseeing Options</span>
            </div>
            <div className="space-y-2">
              {query.optionalSightseeingOptions
                ?.filter(option => option.isOptional)
                .map((option, index) => (
                  <div key={`sightseeing-${option.id}`} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Badge key={`badge-${option.id}`} variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-300">
                        Option {index + 1}
                      </Badge>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge key={`count-${option.id}`} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {option.activities.length} activities
                      </Badge>
                      <Eye className="h-3 w-3 text-green-600" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Optional Transport Options */}
        {hasOptionalTransport && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Car className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Optional Transport Options</span>
            </div>
            <div className="space-y-2">
              {query.optionalTransportOptions
                ?.filter(option => option.isOptional)
                .map((option, index) => (
                  <div key={`transport-${option.id}`} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <Badge key={`badge-${option.id}`} variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                        Option {index + 1}
                      </Badge>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge key={`cost-${option.id}`} variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        ${option.cost}
                      </Badge>
                      <Activity className="h-3 w-3 text-purple-600" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">Total Optional Components:</span>
            {hasOptionalCities && <span className="ml-2">{optionalCities.length} cities</span>}
            {hasOptionalSightseeing && <span className="ml-2">{query.optionalSightseeingOptions?.filter(o => o.isOptional).length} sightseeing</span>}
            {hasOptionalTransport && <span className="ml-2">{query.optionalTransportOptions?.filter(o => o.isOptional).length} transport</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};