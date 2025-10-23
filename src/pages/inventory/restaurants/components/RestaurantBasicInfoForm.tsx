
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CountryOption, CityOption, Restaurant } from '../types/restaurantTypes';

interface RestaurantBasicInfoFormProps {
  formData: Partial<Restaurant>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleCheckboxChange: (name: string, checked: boolean) => void;
  countryOptions: CountryOption[];
  filteredCityOptions: CityOption[];
}

const RestaurantBasicInfoForm: React.FC<RestaurantBasicInfoFormProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  handleCheckboxChange,
  countryOptions,
  filteredCityOptions,
}) => {
  // For debugging
  useEffect(() => {
    console.log("Current form country:", formData.country);
    console.log("Current form city:", formData.city || "No city selected");
    console.log("Available countries:", countryOptions.length);
    console.log("Available cities for selected country:", filteredCityOptions.length);
    
    // Check if country exists in available options
    if (formData.country) {
      const countryExists = countryOptions.some(c => c.name === formData.country);
      console.log(`Country "${formData.country}" exists in options: ${countryExists}`);
    }
    
    // Check if city exists in available options for the selected country
    if (formData.city && formData.country) {
      const cityExists = filteredCityOptions.some(c => c.name === formData.city);
      console.log(`City "${formData.city}" exists in filtered options: ${cityExists}`);
      
      if (!cityExists && filteredCityOptions.length > 0) {
        console.warn(`City "${formData.city}" not found in filtered options despite being set in form data!`);
      }
      
      // Log all available city options for the selected country
      console.log("Available cities:", filteredCityOptions.map(c => c.name).join(", "));
    }
  }, [formData.country, formData.city, countryOptions, filteredCityOptions]);

  // This effect runs once when the component mounts to verify the city is available
  useEffect(() => {
    if (formData.city && formData.country && filteredCityOptions.length > 0) {
      const cityExists = filteredCityOptions.some(c => c.name === formData.city);
      if (!cityExists) {
        console.warn(`On mount: City "${formData.city}" not found in filtered options!`);
      } else {
        console.log(`On mount: City "${formData.city}" verified in filtered options.`);
      }
    }
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Restaurant Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter restaurant name"
            value={formData.name || ''}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            Country <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.country || ''}
            onValueChange={(value) => handleSelectChange('country', value)}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {countryOptions.map((country) => (
                <SelectItem key={country.id} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {countryOptions.length === 0 && (
            <p className="text-xs text-amber-500">
              No countries available. Please add countries in the Countries Management module.
            </p>
          )}
        </div>
      </div>

      {/* External ID is now auto-generated and hidden; field removed from UI */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">
            City <span className="text-red-500">*</span>
          </Label>
          <Select
            key={`city-select-${formData.country || 'no-country'}`}
            value={formData.city || ''}
            onValueChange={(value) => handleSelectChange('city', value)}
            disabled={!formData.country}
          >
            <SelectTrigger id="city">
              <SelectValue placeholder={
                !formData.country 
                  ? "Select Country First" 
                  : filteredCityOptions.length === 0 
                  ? "No cities available for this country" 
                  : "Select City"
              } />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {filteredCityOptions.map((city) => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.city && (
            <p className="text-xs text-blue-500">
              Selected city: {formData.city}
            </p>
          )}
          {formData.country && filteredCityOptions.length === 0 && (
            <p className="text-xs text-amber-500">
              No cities available for {formData.country}. Please add cities in the Cities Management module.
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="area" className="text-sm font-medium">
            Restaurant Area
          </Label>
          <Input
            id="area"
            name="area"
            placeholder="e.g., Downtown, West Side"
            value={formData.area || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">
          Location
        </Label>
        <Input
          id="location"
          name="location"
          placeholder="Auto-computed from City, Country"
          value={formData.location || ''}
          onChange={handleInputChange}
        />
        <p className="text-xs text-gray-500">Auto-fills from city/country; editable if needed.</p>
      </div>
      
      <div className="mt-4 space-y-2">
        <Label htmlFor="address" className="text-sm font-medium">
          Address <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          name="address"
          placeholder="Enter complete address"
          value={formData.address || ''}
          onChange={handleInputChange}
          className="resize-none"
          rows={3}
          required
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the restaurant, ambiance, and specialties"
          value={formData.description || ''}
          onChange={handleInputChange}
          className="resize-none"
          rows={4}
        />
      </div>

      {/* Contact & Ratings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="contact" className="text-sm font-medium">
            Contact
          </Label>
          <Input
            id="contact"
            name="contact"
            placeholder="Phone, email, or website"
            value={formData.contact || ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating" className="text-sm font-medium">
            Rating
          </Label>
          <Input
            id="rating"
            name="rating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            placeholder="0 - 5"
            value={typeof formData.rating === 'number' ? formData.rating : ''}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reviewCount" className="text-sm font-medium">
            Review Count
          </Label>
          <Input
            id="reviewCount"
            name="reviewCount"
            type="number"
            min={0}
            step={1}
            placeholder="Number of reviews"
            value={typeof formData.reviewCount === 'number' ? formData.reviewCount : ''}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPreferred"
            checked={formData.isPreferred || false}
            onCheckedChange={(checked) => handleCheckboxChange('isPreferred', checked === true)}
          />
          <Label htmlFor="isPreferred" className="text-sm font-medium cursor-pointer">
            Mark as Preferred Restaurant
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="status"
            checked={formData.status === 'active'}
            onCheckedChange={(checked) => 
              handleSelectChange('status', checked ? 'active' : 'inactive')
            }
          />
          <Label htmlFor="status" className="text-sm font-medium cursor-pointer">
            Active Status
          </Label>
        </div>
      </div>
    </div>
  );
};

export default RestaurantBasicInfoForm;
