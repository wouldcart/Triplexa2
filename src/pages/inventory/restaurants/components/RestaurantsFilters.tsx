
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Search, Filter, Utensils } from 'lucide-react';

interface RestaurantsFiltersProps {
  searchQuery: string;
  locationFilter: string;
  priceRangeFilter: string;
  cuisineFilter: string;
  locations: string[];
  cuisineTypes: string[];
  onSearchChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPriceRangeChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onReset: () => void;
}

const RestaurantsFilters: React.FC<RestaurantsFiltersProps> = ({
  searchQuery,
  locationFilter,
  priceRangeFilter,
  cuisineFilter,
  locations,
  cuisineTypes,
  onSearchChange,
  onLocationChange,
  onPriceRangeChange,
  onCuisineChange,
  onReset
}) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-10"
            placeholder="Search restaurants, cuisines, or location" 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="md:col-span-2">
          <Select 
            value={locationFilter} 
            onValueChange={onLocationChange}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-2">
          <Select 
            value={priceRangeFilter} 
            onValueChange={onPriceRangeChange}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Price Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="Budget">Budget</SelectItem>
              <SelectItem value="Mid-Range">Mid-Range</SelectItem>
              <SelectItem value="Fine Dining">Fine Dining</SelectItem>
              <SelectItem value="Luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-2">
          <Select 
            value={cuisineFilter} 
            onValueChange={onCuisineChange}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Utensils className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Cuisine Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {cuisineTypes.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-1">
          <Button 
            variant="outline" 
            onClick={onReset}
            className="w-full"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantsFilters;
