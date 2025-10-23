
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Wand2 } from 'lucide-react';
import { Query } from '@/types/query';
import { calculateTripDuration } from '@/utils/currencyUtils';
import { CityNightAllocator } from './CityNightAllocator';

interface AutoDayGeneratorProps {
  query: Query;
  currentDayCount: number;
  onGenerateDays: (dayCount: number) => void;
  onGenerateDaysFromCityAllocations?: (query: Query, allocations: any[]) => void;
  onAddSingleDay: () => void;
}

export const AutoDayGenerator: React.FC<AutoDayGeneratorProps> = ({
  query,
  currentDayCount,
  onGenerateDays,
  onGenerateDaysFromCityAllocations,
  onAddSingleDay
}) => {
  const tripDuration = calculateTripDuration(query.travelDates.from, query.travelDates.to);
  const suggestedDays = tripDuration?.days || 1;
  const missingDays = Math.max(0, suggestedDays - currentDayCount);

  const handleCityAllocations = (allocations: any[]) => {
    // Store allocations for use in day generation
    console.log('City allocations updated:', allocations);
  };

  const handleGenerateFromAllocations = (allocations: any[]) => {
    if (onGenerateDaysFromCityAllocations) {
      onGenerateDaysFromCityAllocations(query, allocations);
    } else {
      const totalNights = allocations.reduce((sum: number, allocation: any) => sum + allocation.nights, 0);
      onGenerateDays(totalNights);
    }
  };

  const renderCompleteMessage = () => {
    if (currentDayCount >= suggestedDays) {
      return (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-green-800 mb-2">Itinerary Complete!</h3>
              <p className="text-sm text-green-600 mb-3">
                You have created all {currentDayCount} days for this trip
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddSingleDay}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extra Day
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <CityNightAllocator
        query={query}
        onAllocationsChange={handleCityAllocations}
        onGenerateDays={handleGenerateFromAllocations}
      />
      
      {/* {renderCompleteMessage()} */}
      
      <Card className="hidden bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Wand2 className="h-5 w-5" />
            Quick Day Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Trip Duration</p>
              <p className="text-xs text-purple-600">
                {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              {suggestedDays} Days Total
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Current Progress</p>
              <p className="text-xs text-purple-600">
                {currentDayCount} of {suggestedDays} days created
              </p>
            </div>
            <div className="flex gap-2">
              {missingDays > 0 && (
                <Button 
                  onClick={() => onGenerateDays(missingDays)}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add {missingDays} Days
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddSingleDay}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add 1 Day
              </Button>
            </div>
          </div>

          {missingDays > 0 && (
            <div className="text-center pt-2 border-t border-purple-200">
              <p className="text-xs text-purple-600">
                Generate all remaining days with suggested structure based on your travel dates
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
