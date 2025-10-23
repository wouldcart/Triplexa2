
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from 'lucide-react';

export type SearchType = 'all' | 'name' | 'code' | 'currency';

interface CountriesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  continentFilter: string;
  setContinentFilter: (continent: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

const CountriesFilters: React.FC<CountriesFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  continentFilter,
  setContinentFilter,
  statusFilter,
  setStatusFilter,
}) => {
  const getSearchPlaceholder = () => {
    switch (searchType) {
      case 'name':
        return 'Search by country name...';
      case 'code':
        return 'Search by country code (e.g., US, GB)...';
      case 'currency':
        return 'Search by currency code (e.g., USD, EUR)...';
      default:
        return 'Search countries...';
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="md:col-span-2 space-y-2">
        <div className="flex gap-2">
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Search type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="name">Country Name</SelectItem>
              <SelectItem value="code">Country Code</SelectItem>
              <SelectItem value="currency">Currency Code</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={getSearchPlaceholder()}
              className="pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Select value={continentFilter} onValueChange={setContinentFilter}>
          <SelectTrigger className="w-full">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Filter by continent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Continents</SelectItem>
            {Array.from(new Set(["Asia", "Africa", "Europe", "North America", "South America", "Australia", "Antarctica"])).map((continent) => (
              <SelectItem key={continent} value={continent}>
                {continent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      

    </div>
  );
};

export default CountriesFilters;
