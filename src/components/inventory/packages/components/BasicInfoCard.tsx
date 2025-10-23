
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PackageComponentProps } from '../types/packageTypes';

// Get cities from local storage if available
const getCitiesFromStorage = () => {
  try {
    const savedCities = localStorage.getItem('cities');
    if (savedCities) {
      return JSON.parse(savedCities);
    }
  } catch (error) {
    console.error('Error loading cities:', error);
  }
  return [];
};

const BasicInfoCard: React.FC<PackageComponentProps> = ({ packageData, updatePackageData }) => {
  const [popularCities, setPopularCities] = useState<string[]>([]);

  useEffect(() => {
    // Try to load cities from storage
    const citiesFromStorage = getCitiesFromStorage();
    if (citiesFromStorage && citiesFromStorage.length > 0) {
      // Extract city names for dropdown
      const cityNames = citiesFromStorage.map((city: any) => city.name || city.cityName || '');
      setPopularCities(cityNames.filter((city: string) => city));
    } else {
      // Fallback to some popular cities
      setPopularCities([
        'Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', // Thailand
        'Dubai', 'Abu Dhabi', // UAE
        'Delhi', 'Mumbai', 'Jaipur', 'Agra', // India
        'Singapore', 
        'Kuala Lumpur', 
        'Hong Kong',
        'Tokyo', 'Kyoto', // Japan
        'Paris', 'London', 'Rome', 'Barcelona', 'Amsterdam' // Europe
      ]);
    }
  }, []);

  const handleFixedDepartureChange = (checked: boolean) => {
    updatePackageData({ isFixedDeparture: checked });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="package-name" className="text-base font-medium">Package Name*</Label>
            <Input 
              id="package-name" 
              placeholder="Enter package name" 
              value={packageData.name || ''}
              onChange={(e) => updatePackageData({ name: e.target.value })}
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="package-summary">Summary (Short Description)</Label>
              <Input 
                id="package-summary" 
                placeholder="Brief summary of the package" 
                value={packageData.summary || ''}
                onChange={(e) => updatePackageData({ summary: e.target.value })}
              />
              <p className="text-sm text-gray-500">A short catchy description for marketing</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="package-type">Package Type*</Label>
              <Select 
                value={packageData.packageType || 'domestic'} 
                onValueChange={(value: "domestic" | "international" | "custom" | "inbound") => updatePackageData({ packageType: value })}
              >
                <SelectTrigger id="package-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">
                    <div className="flex items-center">
                      <span>Domestic</span>
                      <span className="ml-2 text-xs text-gray-500">(Within country)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="international">
                    <div className="flex items-center">
                      <span>International</span>
                      <span className="ml-2 text-xs text-gray-500">(Outside country)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inbound">
                    <div className="flex items-center">
                      <span>Inbound</span>
                      <span className="ml-2 text-xs text-gray-500">(Foreign tourists)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center">
                      <span>Custom</span>
                      <span className="ml-2 text-xs text-gray-500">(Tailored)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-pax">Minimum PAX*</Label>
              <Input 
                id="min-pax" 
                type="number" 
                min={1}
                value={packageData.minPax || 1}
                onChange={(e) => updatePackageData({ minPax: parseInt(e.target.value) || 1 })}
              />
              <p className="text-sm text-gray-500">Minimum number of guests</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-pax">Maximum PAX</Label>
              <Input 
                id="max-pax" 
                type="number" 
                min={1}
                value={packageData.maxPax || ''}
                onChange={(e) => updatePackageData({ maxPax: parseInt(e.target.value) || undefined })}
              />
              <p className="text-sm text-gray-500">Maximum number of guests (optional)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="days">Number of Days*</Label>
              <Input 
                id="days" 
                type="number" 
                min={1}
                value={packageData.days || 1}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 1;
                  updatePackageData({ 
                    days: days, 
                    nights: days > 0 ? days - 1 : 0 
                  });
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Duration of the package</p>
                <p className="text-sm">{packageData.nights || 0} nights</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Switch 
                id="fixed-departure"
                checked={packageData.isFixedDeparture || false}
                onCheckedChange={handleFixedDepartureChange}
              />
              <div>
                <Label htmlFor="fixed-departure" className="font-medium">Fixed Departure Package</Label>
                <p className="text-sm text-gray-500">Set specific departure dates for group tours</p>
              </div>
            </div>
            
            {packageData.isFixedDeparture && (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="space-y-2">
                  <Label>Total Seats</Label>
                  <Input 
                    type="number" 
                    min={1}
                    value={packageData.totalSeats || 1}
                    onChange={(e) => updatePackageData({ totalSeats: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !packageData.departureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {packageData.departureDate ? (
                          format(new Date(packageData.departureDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={packageData.departureDate ? new Date(packageData.departureDate) : undefined}
                        onSelect={(date) => updatePackageData({ 
                          departureDate: date ? date.toISOString() : undefined 
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="start-city">Start City*</Label>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400" />
                  <div className="hidden group-hover:block absolute z-10 p-2 bg-white dark:bg-gray-900 border rounded-md shadow-md w-60 text-xs">
                    The city where the tour begins. Guests will arrive at this city.
                  </div>
                </div>
              </div>
              <Select
                value={packageData.startCity || ''}
                onValueChange={(value) => updatePackageData({ startCity: value })}
              >
                <SelectTrigger id="start-city">
                  <SelectValue placeholder="Select start city" />
                </SelectTrigger>
                <SelectContent>
                  {packageData.startCity && !popularCities.includes(packageData.startCity) && (
                    <SelectItem value={packageData.startCity}>{packageData.startCity}</SelectItem>
                  )}
                  {popularCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="flex justify-between text-sm">
                <span>Can't find your city?</span>
                <button 
                  className="text-primary underline text-sm" 
                  onClick={() => {
                    const customCity = prompt("Enter custom start city name:");
                    if (customCity) updatePackageData({ startCity: customCity });
                  }}
                >
                  Add custom city
                </button>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="end-city">End City*</Label>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400" />
                  <div className="hidden group-hover:block absolute z-10 p-2 bg-white dark:bg-gray-900 border rounded-md shadow-md w-60 text-xs">
                    The city where the tour ends. Guests will depart from this city.
                  </div>
                </div>
              </div>
              <Select
                value={packageData.endCity || ''}
                onValueChange={(value) => updatePackageData({ endCity: value })}
              >
                <SelectTrigger id="end-city">
                  <SelectValue placeholder="Select end city" />
                </SelectTrigger>
                <SelectContent>
                  {packageData.endCity && !popularCities.includes(packageData.endCity) && (
                    <SelectItem value={packageData.endCity}>{packageData.endCity}</SelectItem>
                  )}
                  {popularCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="flex justify-between text-sm">
                <span>Can't find your city?</span>
                <button 
                  className="text-primary underline text-sm" 
                  onClick={() => {
                    const customCity = prompt("Enter custom end city name:");
                    if (customCity) updatePackageData({ endCity: customCity });
                  }}
                >
                  Add custom city
                </button>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoCard;
