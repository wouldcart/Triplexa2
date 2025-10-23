
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import TimePickerInput from './TimePickerInput';
import { Restaurant } from '../types/restaurantTypes';

interface RestaurantFeaturesFormProps {
  formData: Partial<Restaurant>;
  handleCheckboxChange: (name: string, checked: boolean) => void;
  handleTimeChange: (name: string, value: string) => void;
}

const RestaurantFeaturesForm: React.FC<RestaurantFeaturesFormProps> = ({
  formData,
  handleCheckboxChange,
  handleTimeChange,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="space-y-2">
          <Label htmlFor="openingTime" className="text-sm font-medium block">
            Opening Time
          </Label>
          <TimePickerInput
            value={formData.openingTime || '09:00'}
            onChange={(value) => handleTimeChange('openingTime', value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closingTime" className="text-sm font-medium block">
            Closing Time
          </Label>
          <TimePickerInput
            value={formData.closingTime || '22:00'}
            onChange={(value) => handleTimeChange('closingTime', value)}
          />
        </div>
      </div>
      
      <div>
        <Label className="text-sm font-medium block mb-3">
          Special Features
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="features.outdoorSeating"
              checked={formData.features?.outdoorSeating || false}
              onCheckedChange={(checked) => handleCheckboxChange('features.outdoorSeating', checked === true)}
            />
            <Label 
              htmlFor="features.outdoorSeating"
              className="text-sm cursor-pointer"
            >
              Outdoor Seating
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="features.parking"
              checked={formData.features?.parking || false}
              onCheckedChange={(checked) => handleCheckboxChange('features.parking', checked === true)}
            />
            <Label 
              htmlFor="features.parking"
              className="text-sm cursor-pointer"
            >
              Parking Available
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="features.wifi"
              checked={formData.features?.wifi || false}
              onCheckedChange={(checked) => handleCheckboxChange('features.wifi', checked === true)}
            />
            <Label 
              htmlFor="features.wifi"
              className="text-sm cursor-pointer"
            >
              Wi-Fi
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="features.liveMusic"
              checked={formData.features?.liveMusic || false}
              onCheckedChange={(checked) => handleCheckboxChange('features.liveMusic', checked === true)}
            />
            <Label 
              htmlFor="features.liveMusic"
              className="text-sm cursor-pointer"
            >
              Live Music
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="features.privateRooms"
              checked={formData.features?.privateRooms || false}
              onCheckedChange={(checked) => handleCheckboxChange('features.privateRooms', checked === true)}
            />
            <Label 
              htmlFor="features.privateRooms"
              className="text-sm cursor-pointer"
            >
              Private Dining
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="features.cardAccepted"
              checked={formData.features?.cardAccepted || false}
              onCheckedChange={(checked) => handleCheckboxChange('features.cardAccepted', checked === true)}
            />
            <Label 
              htmlFor="features.cardAccepted"
              className="text-sm cursor-pointer"
            >
              Card Accepted
            </Label>
          </div>
        </div>
      </div>
    </>
  );
};

export default RestaurantFeaturesForm;
