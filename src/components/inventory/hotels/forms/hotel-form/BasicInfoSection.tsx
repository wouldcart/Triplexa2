
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '../../types/hotel';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Building, Star } from 'lucide-react';
import { Country } from '@/pages/inventory/countries/types/country';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
// Use countries table currency with override instead of static map
import { useCitiesData } from '@/hooks/useCitiesData';

interface BasicInfoSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleStarRatingChange: (value: StarRating) => void;
  defaultRating: string;
  activeCountries?: Country[];
  handleCountryChange?: (countryName: string) => void;
  availableCities?: string[];
  handleCityChange?: (city: string) => void;
  externalId?: number | null;
  isGeneratingExternalId?: boolean;
  onRegenerateExternalId?: () => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  handleInputChange,
  handleStarRatingChange,
  defaultRating,
  activeCountries = [],
  handleCountryChange,
  availableCities = [],
  handleCityChange,
  externalId,
  isGeneratingExternalId,
  onRegenerateExternalId,
}) => {
  const hotelCategories = [
    "Luxury", "Business", "Resort", "Boutique", "Family", "Budget", 
    "Spa & Wellness", "Beach", "Airport", "Casino", "Extended Stay", "Historic"
  ];
  
  const [selectedCurrency, setSelectedCurrency] = useState<{ code: string, symbol: string }>({
    code: formData.currency || 'USD',
    symbol: formData.currencySymbol || '$'
  });
  
  const { getCitiesByCountry } = useCitiesData();
  const [citiesForCountry, setCitiesForCountry] = useState<string[]>(availableCities);
  
  // Update currency display when country changes
  useEffect(() => {
    if (formData.country) {
      const selected = activeCountries.find(c => c.name === formData.country);
      if (selected) {
        let code = selected.currency || 'USD';
        let symbol = selected.currency_symbol || '$';
        if (selected.pricing_currency_override === true) {
          code = selected.pricing_currency || code;
          symbol = selected.pricing_currency_symbol || symbol;
        }
        setSelectedCurrency({ code, symbol });
      }
      
      // Update cities based on selected country using the hook
      const cities = getCitiesByCountry(formData.country).map(city => city.name);
      setCitiesForCountry([...new Set(cities)]);
    } else {
      setCitiesForCountry([]);
    }
  }, [formData.country, getCitiesByCountry]);

  return (
    <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Basic Information</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-base font-medium">Hotel Name *</label>
            <Input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Enter hotel name"
              className="border-gray-300 dark:border-gray-600"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter the full official name of the hotel
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">External ID (Auto-Generated)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={externalId || ''}
                readOnly
                placeholder={isGeneratingExternalId ? "Generating..." : "Auto-generated ID"}
                className="border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
              />
              {onRegenerateExternalId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRegenerateExternalId}
                  disabled={isGeneratingExternalId}
                  className="whitespace-nowrap"
                >
                  {isGeneratingExternalId ? "Generating..." : "Regenerate"}
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unique identifier automatically generated for this hotel
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">Star Rating *</label>
            <Select
              onValueChange={(value) => handleStarRatingChange(parseInt(value) as StarRating)}
              defaultValue={defaultRating}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select a rating">
                  {defaultRating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {defaultRating} Star
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {rating} Star
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select the official star rating of the hotel
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">Category *</label>
            <Select
              onValueChange={(value) => {
                handleInputChange({ target: { name: 'category', value } } as React.ChangeEvent<HTMLInputElement>);
              }}
              value={formData.category || ''}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {hotelCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose the category that best describes this hotel
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">Country *</label>
            <Select
              onValueChange={(value) => handleCountryChange && handleCountryChange(value)}
              value={formData.country || ''}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {activeCountries.map((country) => {
                  const code = country.pricing_currency_override
                    ? (country.pricing_currency || country.currency || 'USD')
                    : (country.currency || 'USD');
                  return (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name} ({code})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select the country where the hotel is located (Sets currency to {selectedCurrency.code})
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">City *</label>
            <Select
              onValueChange={(value) => handleCityChange && handleCityChange(value)}
              value={formData.city || ''}
              disabled={citiesForCountry.length === 0}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600">
                <SelectValue placeholder={citiesForCountry.length === 0 ? "Select a country first" : "Select a city"} />
              </SelectTrigger>
              <SelectContent>
                {citiesForCountry.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select the city where the hotel is located
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">Location *</label>
            <Input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              placeholder="Enter specific location (e.g., Downtown, Beachfront)"
              className="border-gray-300 dark:border-gray-600"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter the specific area or neighborhood
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium">Currency</label>
            <div className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
              {selectedCurrency.symbol} {selectedCurrency.code}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Currency is automatically set based on the selected country
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoSection;
