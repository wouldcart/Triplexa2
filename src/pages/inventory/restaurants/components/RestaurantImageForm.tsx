
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Utensils } from 'lucide-react';
import { Restaurant } from '../types/restaurantTypes';

interface RestaurantImageFormProps {
  formData: Partial<Restaurant>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const RestaurantImageForm: React.FC<RestaurantImageFormProps> = ({
  formData,
  handleInputChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start">
      <div className="w-full md:w-1/3 aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
        {formData.imageUrl ? (
          <img 
            src={formData.imageUrl} 
            alt={formData.name || 'Restaurant preview'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <Utensils className="h-12 w-12 mb-2" />
            <span className="text-sm">No image</span>
          </div>
        )}
      </div>
      
      <div className="w-full md:w-2/3 space-y-4">
        <div>
          <Label htmlFor="imageUrl" className="text-sm font-medium block mb-2">
            Image URL
          </Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            placeholder="Enter image URL"
            value={formData.imageUrl || ''}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="text-center">
          <span className="text-sm text-gray-500">or</span>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
        
        <p className="text-xs text-gray-500">
          Recommended resolution: 1200×800 pixels. Max file size: 5MB.
          Supported formats: JPG, PNG, WebP.
        </p>
      </div>
    </div>
  );
};

export default RestaurantImageForm;
