
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MapPin, ChevronDown } from 'lucide-react';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';

interface OperationalCountriesSelectorProps {
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  label?: string;
  placeholder?: string;
}

const OperationalCountriesSelector: React.FC<OperationalCountriesSelectorProps> = ({
  selectedCountries,
  onCountriesChange,
  label = "Operational Countries",
  placeholder = "Select countries..."
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { activeCountries } = useRealTimeCountriesData();

  // Filter countries based on search query
  const filteredCountries = activeCountries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountryToggle = (countryId: string) => {
    const updatedCountries = selectedCountries.includes(countryId)
      ? selectedCountries.filter(id => id !== countryId)
      : [...selectedCountries, countryId];
    
    onCountriesChange(updatedCountries);
  };

  const removeCountry = (countryId: string) => {
    onCountriesChange(selectedCountries.filter(id => id !== countryId));
  };

  const getCountryById = (id: string) => {
    return activeCountries.find(country => country.id === id);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}*</Label>
      
      {/* Selected Countries Display */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCountries.map(countryId => {
            const country = getCountryById(countryId);
            if (!country) return null;
            
            return (
              <Badge key={countryId} variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {country.name}
                <button
                  type="button"
                  onClick={() => removeCountry(countryId)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Country Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {selectedCountries.length > 0
              ? `${selectedCountries.length} countries selected`
              : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50" align="start">
          <div className="p-3 bg-white dark:bg-gray-800">
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredCountries.map(country => (
                  <div key={country.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Checkbox
                      id={country.id}
                      checked={selectedCountries.includes(country.id)}
                      onCheckedChange={() => handleCountryToggle(country.id)}
                      className="border-gray-300 dark:border-gray-600"
                    />
                    <label
                      htmlFor={country.id}
                      className="flex items-center space-x-2 cursor-pointer flex-grow text-gray-900 dark:text-gray-100"
                    >
                      <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm">{country.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({country.code})</span>
                    </label>
                  </div>
                ))}
                
                {filteredCountries.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No active countries found
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default OperationalCountriesSelector;
