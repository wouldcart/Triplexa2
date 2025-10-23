
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Download, Upload, MapPin, Bus, Search, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RouteFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  countryFilter: string;
  setCountryFilter: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  availableCountries: string[];
  availableCities: string[];
  transferTypes: string[];
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  onAddRoute: () => void;
  onImport: () => void;
  onExport: () => void;
  onLocationCodes?: () => void;
  onTransportTypes?: () => void;
}

const RouteFilters: React.FC<RouteFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  countryFilter,
  setCountryFilter,
  cityFilter,
  setCityFilter,
  typeFilter,
  setTypeFilter,
  availableCountries,
  availableCities,
  transferTypes,
  currentTab = "all",
  setCurrentTab = () => {},
  onAddRoute,
  onImport,
  onExport,
  onLocationCodes,
  onTransportTypes
}) => {
  // Handler to clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setCountryFilter('All Countries');
    setCityFilter('All Cities');
    setTypeFilter('All Types');
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transport Routes</h1>
          <p className="text-muted-foreground">Manage transport routes, pricing, and availability</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* Only render location codes and transport types buttons if the handlers are provided */}
          {onLocationCodes && onTransportTypes && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="h-9"
                onClick={onLocationCodes}
              >
                <MapPin className="h-4 w-4 mr-2 hidden sm:inline" />
                Locations
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                className="h-9"
                onClick={onTransportTypes}
              >
                <Bus className="h-4 w-4 mr-2 hidden sm:inline" />
                Transports
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="h-9"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              className="h-9"
              onClick={onImport}
            >
              <Upload className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </div>
          
          <Button 
            size="sm"
            className="h-9"
            onClick={onAddRoute}
          >
            <Plus className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Add Route</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Tabs moved to filter section */}
      <div className="w-full">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full mb-4">
          <TabsList className="w-full md:w-auto grid grid-cols-4 md:flex">
            <TabsTrigger value="all">All Routes</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="disabled">Disabled</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search routes, locations, codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {availableCountries.map((country, index) => (
              <SelectItem key={`country-${index}-${country}`} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={cityFilter} 
          onValueChange={setCityFilter}
          disabled={countryFilter === 'All Countries'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city, index) => (
              <SelectItem key={`city-${index}-${city}`} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {transferTypes.map((type, index) => (
              <SelectItem key={`type-${index}-${type}`} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Filter clear button - show only when filters are active */}
        {(searchQuery || countryFilter !== 'All Countries' || cityFilter !== 'All Cities' || typeFilter !== 'All Types') && (
          <div className="md:col-span-5 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="text-sm text-muted-foreground"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteFilters;
