
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LocationCodesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  countryFilter: string;
  setCountryFilter: (country: string) => void;
  availableCountries: string[];
}

const LocationCodesFilters: React.FC<LocationCodesFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  currentTab,
  setCurrentTab,
  countryFilter,
  setCountryFilter,
  availableCountries
}) => {
  return (
    <div className="space-y-4">
      {/* Tabs in filter section */}
      <div className="w-full">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full mb-4">
          <TabsList className="w-full grid grid-cols-4 md:flex">
            <TabsTrigger value="all">All Locations</TabsTrigger>
            <TabsTrigger value="airport">Airports</TabsTrigger>
            <TabsTrigger value="hotel">Hotels</TabsTrigger>
            <TabsTrigger value="pier">Piers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search location codes..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-64">
          <select 
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            {availableCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LocationCodesFilters;
