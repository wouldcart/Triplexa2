
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { hotelAmenities } from '../../data/hotelData';
import { CheckedState } from '@radix-ui/react-checkbox';
import { Label } from '@/components/ui/label';

interface AmenitiesSectionProps {
  amenities: string[];
  handleCheckboxChange: (checked: CheckedState, amenityId: string) => void;
}

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  amenities,
  handleCheckboxChange,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Amenities</h3>
      <div className="grid grid-cols-3 gap-2">
        {hotelAmenities.map((amenity) => (
          <div key={amenity.id} className="flex items-center space-x-2">
            <Checkbox
              id={`amenity-${amenity.id}`}
              checked={amenities?.includes(amenity.id) || false}
              onCheckedChange={(checked) => handleCheckboxChange(checked, amenity.id)}
            />
            <Label htmlFor={`amenity-${amenity.id}`} className="font-normal">
              {amenity.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AmenitiesSection;
