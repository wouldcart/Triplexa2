
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Country } from '../../types/packageTypes';

interface CountrySelectorProps {
  countries: Country[];
  selectedCountry: string | null;
  onCountryChange: (countryId: string) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCountry,
  onCountryChange
}) => {
  return (
    <div>
      <Label htmlFor="country">Select Country</Label>
      <Select 
        value={selectedCountry || ''} 
        onValueChange={onCountryChange}
      >
        <SelectTrigger id="country">
          <SelectValue placeholder="Select a country" />
        </SelectTrigger>
        <SelectContent>
          {countries.length > 0 ? (
            countries.map(country => (
              <SelectItem key={country.id} value={country.id}>
                {country.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="loading-countries" disabled>
              Loading countries...
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CountrySelector;
