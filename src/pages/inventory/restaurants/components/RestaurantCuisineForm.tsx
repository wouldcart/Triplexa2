
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CuisineType, Restaurant } from '../types/restaurantTypes';

interface RestaurantCuisineFormProps {
  formData: Partial<Restaurant>;
  cuisineOptions: CuisineType[];
  handleCuisineTypeChange: (cuisine: CuisineType, checked: boolean) => void;
  handleCheckboxChange: (name: string, checked: boolean) => void;
}

const RestaurantCuisineForm: React.FC<RestaurantCuisineFormProps> = ({
  formData,
  cuisineOptions,
  handleCuisineTypeChange,
  handleCheckboxChange,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium block mb-3">
          Cuisine Types <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cuisineOptions.map((cuisine) => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={(formData.cuisineTypes || []).includes(cuisine)}
                onCheckedChange={(checked) => handleCuisineTypeChange(cuisine, checked === true)}
              />
              <Label 
                htmlFor={`cuisine-${cuisine}`}
                className="text-sm cursor-pointer"
              >
                {cuisine}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div>
        <Label className="text-sm font-medium block mb-3">
          Meal Types
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mealTypes.breakfast"
              checked={formData.mealTypes?.breakfast || false}
              onCheckedChange={(checked) => handleCheckboxChange('mealTypes.breakfast', checked === true)}
            />
            <Label 
              htmlFor="mealTypes.breakfast"
              className="text-sm cursor-pointer"
            >
              Breakfast
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mealTypes.lunch"
              checked={formData.mealTypes?.lunch || false}
              onCheckedChange={(checked) => handleCheckboxChange('mealTypes.lunch', checked === true)}
            />
            <Label 
              htmlFor="mealTypes.lunch"
              className="text-sm cursor-pointer"
            >
              Lunch
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mealTypes.dinner"
              checked={formData.mealTypes?.dinner || false}
              onCheckedChange={(checked) => handleCheckboxChange('mealTypes.dinner', checked === true)}
            />
            <Label 
              htmlFor="mealTypes.dinner"
              className="text-sm cursor-pointer"
            >
              Dinner
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mealTypes.snacks"
              checked={formData.mealTypes?.snacks || false}
              onCheckedChange={(checked) => handleCheckboxChange('mealTypes.snacks', checked === true)}
            />
            <Label 
              htmlFor="mealTypes.snacks"
              className="text-sm cursor-pointer"
            >
              Snacks
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mealTypes.beverages"
              checked={formData.mealTypes?.beverages || false}
              onCheckedChange={(checked) => handleCheckboxChange('mealTypes.beverages', checked === true)}
            />
            <Label 
              htmlFor="mealTypes.beverages"
              className="text-sm cursor-pointer"
            >
              Beverages
            </Label>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label className="text-sm font-medium block mb-3">
            Vegetarian Options
          </Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dietaryOptions.pureVeg"
                checked={formData.dietaryOptions?.pureVeg || false}
                onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.pureVeg', checked === true)}
              />
              <Label 
                htmlFor="dietaryOptions.pureVeg"
                className="text-sm cursor-pointer"
              >
                Pure Vegetarian
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dietaryOptions.veganFriendly"
                checked={formData.dietaryOptions?.veganFriendly || false}
                onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.veganFriendly', checked === true)}
              />
              <Label 
                htmlFor="dietaryOptions.veganFriendly"
                className="text-sm cursor-pointer"
              >
                Vegan-friendly Options
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dietaryOptions.vegetarian"
                checked={formData.dietaryOptions?.vegetarian || false}
                onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.vegetarian', checked === true)}
              />
              <Label 
                htmlFor="dietaryOptions.vegetarian"
                className="text-sm cursor-pointer"
              >
                Vegetarian Options
              </Label>
            </div>
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium block mb-3">
            Non-vegetarian Options
          </Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dietaryOptions.seafood"
                checked={formData.dietaryOptions?.seafood || false}
                onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.seafood', checked === true)}
              />
              <Label 
                htmlFor="dietaryOptions.seafood"
                className="text-sm cursor-pointer"
              >
                Seafood
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dietaryOptions.poultry"
                checked={formData.dietaryOptions?.poultry || false}
                onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.poultry', checked === true)}
              />
              <Label 
                htmlFor="dietaryOptions.poultry"
                className="text-sm cursor-pointer"
              >
                Poultry
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dietaryOptions.redMeat"
                checked={formData.dietaryOptions?.redMeat || false}
                onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.redMeat', checked === true)}
              />
              <Label 
                htmlFor="dietaryOptions.redMeat"
                className="text-sm cursor-pointer"
              >
                Red Meat
              </Label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="dietaryOptions.aLaCarte"
          checked={formData.dietaryOptions?.aLaCarte || false}
          onCheckedChange={(checked) => handleCheckboxChange('dietaryOptions.aLaCarte', checked === true)}
        />
        <Label 
          htmlFor="dietaryOptions.aLaCarte"
          className="text-sm cursor-pointer"
        >
          À la carte Available
        </Label>
      </div>
    </div>
  );
};

export default RestaurantCuisineForm;
