
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Restaurant } from '../types/restaurantTypes';

interface RestaurantPricingFormProps {
  formData: Partial<Restaurant>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

const RestaurantPricingForm: React.FC<RestaurantPricingFormProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
}) => {
  // Default currency symbol if not provided
  const currencySymbol = formData.currencySymbol || '$';
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="averagePrice" className="text-sm font-medium block mb-2">
          Average Price per Person <span className="ml-1 text-xs text-gray-500">({currencySymbol})</span>
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {currencySymbol}
          </div>
          <Input
            id="averagePrice"
            name="averagePrice"
            type="number"
            placeholder="Enter amount"
            value={formData.averagePrice || ''}
            onChange={handleInputChange}
            className="pl-8"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional: per-person average price in {formData.currencyCode || 'USD'}
        </p>
      </div>
      <div>
        <Label htmlFor="averageCost" className="text-sm font-medium block mb-2">
          Average Cost for Two 
          <span className="ml-1 text-xs text-gray-500">
            ({currencySymbol})
          </span>
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {currencySymbol}
          </div>
          <Input
            id="averageCost"
            name="averageCost"
            type="number"
            placeholder="Enter amount"
            value={formData.averageCost || ''}
            onChange={handleInputChange}
            className="pl-8"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Enter the average cost for two people in {formData.currencyCode || 'USD'}
        </p>
      </div>
      
      <div>
        <Label className="text-sm font-medium block mb-2">
          Price Category
        </Label>
        <RadioGroup 
          value={formData.priceCategory || '$'} 
          onValueChange={(value) => handleSelectChange('priceCategory', value)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="$" id="price-budget" />
            <Label htmlFor="price-budget" className="cursor-pointer">
              Budget ({currencySymbol})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="$$" id="price-midrange" />
            <Label htmlFor="price-midrange" className="cursor-pointer">
              Mid-range ({currencySymbol}{currencySymbol})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="$$$" id="price-finedining" />
            <Label htmlFor="price-finedining" className="cursor-pointer">
              Fine Dining ({currencySymbol}{currencySymbol}{currencySymbol})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="$$$$" id="price-luxury" />
            <Label htmlFor="price-luxury" className="cursor-pointer">
              Luxury ({currencySymbol}{currencySymbol}{currencySymbol}{currencySymbol})
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-sm font-medium block mb-2">
          Price Range Label
        </Label>
        <RadioGroup 
          value={formData.priceRange || 'Mid-Range'} 
          onValueChange={(value) => handleSelectChange('priceRange', value)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Budget" id="pricerange-budget" />
            <Label htmlFor="pricerange-budget" className="cursor-pointer">
              Budget
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Mid-Range" id="pricerange-midrange" />
            <Label htmlFor="pricerange-midrange" className="cursor-pointer">
              Mid-Range
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Fine Dining" id="pricerange-finedining" />
            <Label htmlFor="pricerange-finedining" className="cursor-pointer">
              Fine Dining
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Luxury" id="pricerange-luxury" />
            <Label htmlFor="pricerange-luxury" className="cursor-pointer">
              Luxury
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current currency: {formData.currencyCode || 'USD'} ({currencySymbol})
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Currency is automatically set based on the selected country
        </p>
      </div>
    </div>
  );
};

export default RestaurantPricingForm;
