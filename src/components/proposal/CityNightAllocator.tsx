import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { Query } from '@/types/query';

interface CityAllocation {
  id: string;
  city: string;
  nights: number;
  isOptional: boolean;
  estimatedCost: number;
}

interface CityNightAllocatorProps {
  query: Query;
  onAllocationsChange: (allocations: CityAllocation[]) => void;
  onGenerateDays: (allocations: CityAllocation[]) => void;
}

const commonCities = [
  'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Koh Samui',
  'Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Mount Fuji',
  'Dubai', 'Abu Dhabi', 'Sharjah',
  'Singapore', 'Kuala Lumpur', 'Penang', 'Langkawi'
];

export const CityNightAllocator: React.FC<CityNightAllocatorProps> = ({
  query,
  onAllocationsChange,
  onGenerateDays
}) => {
  const [allocations, setAllocations] = useState<CityAllocation[]>([]);
  const [isSmartAllocated, setIsSmartAllocated] = useState(false);

  // Calculate trip duration and total nights
  const tripStartDate = new Date(query.travelDates.from);
  const tripEndDate = new Date(query.travelDates.to);
  const totalNights = Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

  // Smart allocation algorithm
  const generateSmartAllocations = React.useCallback(() => {
    const cities = query.destination.cities;
    const totalCities = cities.length;
    
    if (totalCities === 0) return [];
    
    const newAllocations: CityAllocation[] = [];
    
    if (totalCities === 1) {
      // Single city - allocate all nights
      newAllocations.push({
        id: '1',
        city: cities[0],
        nights: totalNights,
        isOptional: false,
        estimatedCost: totalNights * 150
      });
    } else if (totalCities === 2) {
      // Two cities - allocate based on preference (slightly favor first city)
      const firstCityNights = Math.ceil(totalNights * 0.6);
      const secondCityNights = totalNights - firstCityNights;
      
      newAllocations.push({
        id: '1',
        city: cities[0],
        nights: firstCityNights,
        isOptional: false,
        estimatedCost: firstCityNights * 150
      });
      
      if (secondCityNights > 0) {
        newAllocations.push({
          id: '2',
          city: cities[1],
          nights: secondCityNights,
          isOptional: false,
          estimatedCost: secondCityNights * 150
        });
      }
    } else {
      // Three or more cities - distribute evenly
      const baseNights = Math.floor(totalNights / totalCities);
      const remainingNights = totalNights % totalCities;
      
      cities.forEach((city, index) => {
        const extraNight = index < remainingNights ? 1 : 0;
        const nightsForCity = baseNights + extraNight;
        
        if (nightsForCity > 0) {
          newAllocations.push({
            id: (index + 1).toString(),
            city,
            nights: nightsForCity,
            isOptional: false, // Don't make any city optional by default
            estimatedCost: nightsForCity * 150
          });
        }
      });
    }
    
    setAllocations(newAllocations);
    setIsSmartAllocated(true);
    onAllocationsChange(newAllocations);
  }, [query.destination.cities, totalNights, onAllocationsChange]);

  // Real-time update when destination cities change
  React.useEffect(() => {
    const selectedCities = query.destination.cities;
    
    if (selectedCities.length === 0) {
      // Clear allocations if no cities selected
      setAllocations([]);
      setIsSmartAllocated(false);
      onAllocationsChange([]);
      return;
    }

    if (selectedCities.length === 1) {
      // Auto-allocate for single city
      generateSmartAllocations();
    } else if (allocations.length === 0) {
      // Generate smart allocations for multiple cities if none exist
      generateSmartAllocations();
    } else {
      // Update existing allocations to match selected cities
      const updatedAllocations = allocations.filter(allocation => 
        selectedCities.includes(allocation.city)
      );
      
      // Add missing cities
      selectedCities.forEach((city, index) => {
        if (!updatedAllocations.find(a => a.city === city)) {
          const remainingNights = Math.max(0, totalNights - updatedAllocations.reduce((sum, a) => sum + a.nights, 0));
          const nightsToAllocate = Math.max(1, Math.floor(remainingNights / (selectedCities.length - updatedAllocations.length)));
          
          updatedAllocations.push({
            id: (Date.now() + index).toString(),
            city,
            nights: Math.min(nightsToAllocate, remainingNights),
            isOptional: false,
            estimatedCost: 150
          });
        }
      });
      
      if (updatedAllocations.length !== allocations.length || 
          !updatedAllocations.every(ua => allocations.find(a => a.city === ua.city))) {
        setAllocations(updatedAllocations);
        onAllocationsChange(updatedAllocations);
      }
    }
  }, [query.destination.cities, totalNights, generateSmartAllocations, allocations, onAllocationsChange]);

  // Handle manual allocation changes
  const updateAllocation = (id: string, field: keyof CityAllocation, value: any) => {
    const updatedAllocations = allocations.map(allocation =>
      allocation.id === id ? { ...allocation, [field]: value } : allocation
    );
    setAllocations(updatedAllocations);
    onAllocationsChange(updatedAllocations);
  };

  // Add new city allocation
  const addCityAllocation = () => {
    const newId = (allocations.length + 1).toString();
    const remainingNights = Math.max(0, totalNights - allocations.reduce((sum, a) => sum + a.nights, 0));
    
    const newAllocation: CityAllocation = {
      id: newId,
      city: '',
      nights: Math.min(1, remainingNights),
      isOptional: true,
      estimatedCost: 150
    };
    
    const updatedAllocations = [...allocations, newAllocation];
    setAllocations(updatedAllocations);
    onAllocationsChange(updatedAllocations);
  };

  // Remove city allocation
  const removeAllocation = (id: string) => {
    const updatedAllocations = allocations.filter(allocation => allocation.id !== id);
    setAllocations(updatedAllocations);
    onAllocationsChange(updatedAllocations);
  };

  // Calculate total allocated nights
  const totalAllocatedNights = allocations.reduce((sum, allocation) => sum + allocation.nights, 0);
  const remainingNights = totalNights - totalAllocatedNights;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/10 border-primary/20 dark:from-primary/10 dark:to-accent/20 dark:border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="h-4 w-4" />
            City & Night Allocation
          </div>
          <Badge variant={remainingNights === 0 ? "default" : "secondary"}>
            {totalAllocatedNights}/{totalNights} Nights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Smart Allocation Button */}
        {!isSmartAllocated && (
          <div className="text-center p-2 border border-dashed border-primary/30 rounded-lg bg-primary/5 dark:bg-primary/10">
            <Button 
              onClick={generateSmartAllocations}
              variant="default"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Auto Allocate {totalNights} Nights
            </Button>
          </div>
        )}

        {/* Simple Allocation List */}
        {allocations.length > 0 && (
          <div className="space-y-2">
            {allocations.map((allocation) => (
              <div key={allocation.id} className={`flex items-center gap-2 p-2 border rounded-lg transition-all ${
                allocation.isOptional && allocation.nights > 0
                  ? 'border-amber-300/50 bg-amber-50/50 dark:border-amber-400/30 dark:bg-amber-900/20' 
                  : 'border-border bg-card dark:bg-card'
              }`}>
                
                <div className="flex-1">
                  <Select 
                    value={allocation.city} 
                    onValueChange={(value) => updateAllocation(allocation.id, 'city', value)}
                    disabled={allocation.isOptional && allocation.nights === 0}
                  >
                    <SelectTrigger className={allocation.isOptional && allocation.nights === 0 ? 'opacity-50' : ''}>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {query.destination.cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                      {commonCities.filter(city => !query.destination.cities.includes(city)).map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-24">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={totalNights}
                      value={allocation.nights}
                      onChange={(e) => updateAllocation(allocation.id, 'nights', parseInt(e.target.value) || 0)}
                      className="text-center h-8"
                      disabled={allocation.isOptional && allocation.nights === 0}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">nights</span>
                  </div>
                </div>

                {/* Optional City Toggle - only show if actually optional */}
                {allocation.isOptional && (
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      checked={allocation.nights > 0}
                      onCheckedChange={(checked) => {
                        const newNights = checked ? Math.min(1, remainingNights + allocation.nights) : 0;
                        updateAllocation(allocation.id, 'nights', newNights);
                      }}
                    />
                    <Label className="text-xs text-amber-600 dark:text-amber-400">Optional</Label>
                  </div>
                )}

                {allocations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAllocation(allocation.id)}
                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Generate Days Button */}
        {allocations.length > 0 && remainingNights === 0 && (
          <div className="pt-3 border-t border-border">
            <Button
              onClick={() => onGenerateDays(allocations)}
              className="w-full"
              variant="default"
              size="default"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Generate {totalNights + 1} Days from City Allocation
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              This will create {totalNights + 1} days based on your city & night allocations
            </p>
          </div>
        )}

        {/* Add Additional City */}
        {allocations.length > 0 && remainingNights > 0 && (
          <Button
            variant="outline"
            onClick={addCityAllocation}
            className="w-full border-dashed"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another City ({remainingNights} nights left)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};