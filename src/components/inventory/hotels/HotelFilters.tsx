
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  HotelFilters as HotelFiltersType, 
  FilterStarRating, 
  FilterHotelStatus 
} from './types/hotel';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface HotelFiltersProps {
  filters: HotelFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<HotelFiltersType>>;
}

// Mock data for countries, cities, room types, etc.
const initialCountries = ['India', 'Thailand', 'UAE', 'Singapore', 'Malaysia'];
const initialCities = [
  { name: 'Mumbai', country: 'India' },
  { name: 'Delhi', country: 'India' },
  { name: 'Bangkok', country: 'Thailand' },
  { name: 'Phuket', country: 'Thailand' },
  { name: 'Dubai', country: 'UAE' },
  { name: 'Abu Dhabi', country: 'UAE' },
  { name: 'Singapore', country: 'Singapore' },
  { name: 'Kuala Lumpur', country: 'Malaysia' },
];
const initialLocations = [
  { name: 'Bur Dubai', city: 'Dubai' },
  { name: 'Deira', city: 'Dubai' },
  { name: 'Marina', city: 'Dubai' },
  { name: 'Palm Jumeirah', city: 'Dubai' },
  { name: 'South Mumbai', city: 'Mumbai' },
  { name: 'Andheri', city: 'Mumbai' },
  { name: 'Bandra', city: 'Mumbai' },
  { name: 'Pratunam', city: 'Bangkok' },
  { name: 'Sukhumvit', city: 'Bangkok' },
  { name: 'Silom', city: 'Bangkok' },
];
const initialCategories = ['Luxury', 'Business', 'Budget', 'Resort', 'Boutique', 'Family', 'Beach', 'City Center'];
const initialRoomTypes = ['Standard', 'Deluxe', 'Suite', 'Villa', 'Penthouse', 'Apartment', 'Studio'];
const initialFacilities = [
  'Swimming Pool', 
  'Gym', 
  'Restaurant', 
  'Bar', 
  'Spa', 
  'WiFi', 
  'Parking', 
  'Room Service',
  'Airport Transfer',
  'Beach Access',
  'Business Center',
  'Conference Room',
];

const HotelFilters: React.FC<HotelFiltersProps> = ({ filters, setFilters }) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // State for price range slider
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceRange.min,
    filters.priceRange.max
  ]);
  
  // Derived state for active filter count
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateRange') {
      return value.from !== null && value.to !== null;
    }
    if (key === 'roomTypes' || key === 'facilities') {
      return value.length > 0;
    }
    if (key === 'priceRange') {
      return value.min > 0 || value.max < 10000;
    }
    if (key === 'starRating' || key === 'status') {
      return value !== 'all';
    }
    return value !== '' && value !== 'all';
  }).length;

  // Update available cities when country changes
  useEffect(() => {
    if (filters.country && filters.country !== 'all') {
      const citiesInCountry = initialCities
        .filter(city => city.country === filters.country)
        .map(city => city.name);
      setAvailableCities([...new Set(citiesInCountry)]);
      
      // Reset city if not in available cities
      if (filters.city && !citiesInCountry.includes(filters.city) && filters.city !== 'all') {
        setFilters(prev => ({ ...prev, city: 'all' }));
      }
    } else {
      setAvailableCities([...new Set(initialCities.map(city => city.name))]);
    }
  }, [filters.country, setFilters]);

  // Update available locations when city changes
  useEffect(() => {
    if (filters.city && filters.city !== 'all') {
      const locationsInCity = initialLocations
        .filter(location => location.city === filters.city)
        .map(location => location.name);
      setAvailableLocations([...new Set(locationsInCity)]);
      
      // Reset location if not in available locations
      if (filters.location && !locationsInCity.includes(filters.location) && filters.location !== 'all') {
        setFilters(prev => ({ ...prev, location: 'all' }));
      }
    } else {
      setAvailableLocations([...new Set(initialLocations.map(location => location.name))]);
    }
  }, [filters.city, setFilters]);

  // Handle price range change
  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    setFilters(prev => ({
      ...prev,
      priceRange: { min: value[0], max: value[1] }
    }));
  };

  // Handle room type toggle
  const handleRoomTypeToggle = (roomType: string) => {
    setFilters(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(roomType)
        ? prev.roomTypes.filter(type => type !== roomType)
        : [...prev.roomTypes, roomType]
    }));
  };

  // Handle facility toggle
  const handleFacilityToggle = (facility: string) => {
    setFilters(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(fac => fac !== facility)
        : [...prev.facilities, facility]
    }));
  };

  // Handle clearing a single filter
  const handleClearFilter = (filterName: string) => {
    setFilters(prev => {
      if (filterName === 'dateRange') {
        return {
          ...prev,
          dateRange: { from: null, to: null }
        };
      } else if (filterName === 'roomTypes') {
        return {
          ...prev,
          roomTypes: []
        };
      } else if (filterName === 'facilities') {
        return {
          ...prev,
          facilities: []
        };
      } else if (filterName === 'priceRange') {
        setPriceRange([0, 10000]);
        return {
          ...prev,
          priceRange: { min: 0, max: 10000 }
        };
      } else if (filterName === 'starRating') {
        return {
          ...prev,
          starRating: 'all' as FilterStarRating
        };
      } else if (filterName === 'status') {
        return {
          ...prev,
          status: 'all' as FilterHotelStatus
        };
      } else {
        return {
          ...prev,
          [filterName]: 'all'
        };
      }
    });
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    setPriceRange([0, 10000]);
    setFilters({
      country: 'all',
      city: 'all',
      location: 'all',
      starRating: 'all' as FilterStarRating,
      status: 'all' as FilterHotelStatus,
      category: 'all',
      dateRange: {
        from: null,
        to: null,
      },
      roomTypes: [],
      facilities: [],
      priceRange: {
        min: 0,
        max: 10000
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Active Filters Section */}
      {activeFilterCount > 0 && (
        <div className="lg:col-span-4 -mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Filters:
            </span>
            
            {filters.country && filters.country !== 'all' && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Country: {filters.country}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('country')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.city && filters.city !== 'all' && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                City: {filters.city}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('city')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.location && filters.location !== 'all' && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Location: {filters.location}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('location')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.category && filters.category !== 'all' && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Category: {filters.category}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('category')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.starRating !== 'all' && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Rating: {filters.starRating} Star
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('starRating')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.status !== 'all' && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Status: {filters.status}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('status')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.dateRange.from && filters.dateRange.to && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Dates: {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('dateRange')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {(filters.priceRange.min > 0 || filters.priceRange.max < 10000) && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Price: ${filters.priceRange.min} - ${filters.priceRange.max}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('priceRange')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.roomTypes.length > 0 && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Room Types: {filters.roomTypes.length}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('roomTypes')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {filters.facilities.length > 0 && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Facilities: {filters.facilities.length}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                  onClick={() => handleClearFilter('facilities')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={handleClearAllFilters}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
      
      <div>
        <Label htmlFor="country-filter">Country</Label>
        <Select 
          value={filters.country} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
        >
          <SelectTrigger id="country-filter">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {initialCountries.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="city-filter">City</Label>
        <Select 
          value={filters.city} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
        >
          <SelectTrigger id="city-filter">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {availableCities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="location-filter">Location</Label>
        <Select 
          value={filters.location} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
        >
          <SelectTrigger id="location-filter">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {availableLocations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="star-rating-filter">Star Rating</Label>
        <Select
          value={String(filters.starRating)}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            starRating: value === "all" ? "all" : Number(value) as FilterStarRating 
          }))}
        >
          <SelectTrigger id="star-rating-filter">
            <SelectValue placeholder="All Ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            status: value as FilterHotelStatus 
          }))}
        >
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="category-filter">Hotel Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {initialCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Date Range</Label>
        <DateRangePicker
          value={{
            from: filters.dateRange.from,
            to: filters.dateRange.to
          }}
          onChange={({ from, to }) => 
            setFilters(prev => ({ 
              ...prev, 
              dateRange: { from, to } 
            }))
          }
        />
      </div>
      
      <div className="lg:col-span-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="price-range">
            <AccordionTrigger className="text-sm font-medium">
              Price Range (${filters.priceRange.min} - ${filters.priceRange.max})
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-1 pt-2 pb-6">
                <Slider
                  value={priceRange}
                  min={0}
                  max={10000}
                  step={100}
                  onValueChange={handlePriceRangeChange}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="room-types">
            <AccordionTrigger className="text-sm font-medium">
              Room Types {filters.roomTypes.length > 0 && `(${filters.roomTypes.length})`}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {initialRoomTypes.map(roomType => (
                  <div className="flex items-center space-x-2" key={roomType}>
                    <Checkbox
                      id={`room-type-${roomType}`}
                      checked={filters.roomTypes.includes(roomType)}
                      onCheckedChange={() => handleRoomTypeToggle(roomType)}
                    />
                    <label
                      htmlFor={`room-type-${roomType}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {roomType}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="facilities">
            <AccordionTrigger className="text-sm font-medium">
              Facilities {filters.facilities.length > 0 && `(${filters.facilities.length})`}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {initialFacilities.map(facility => (
                  <div className="flex items-center space-x-2" key={facility}>
                    <Checkbox
                      id={`facility-${facility}`}
                      checked={filters.facilities.includes(facility)}
                      onCheckedChange={() => handleFacilityToggle(facility)}
                    />
                    <label
                      htmlFor={`facility-${facility}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {facility}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default HotelFilters;
