
import React from 'react';
import { Input } from '@/components/ui/input';

interface LocationSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Latitude</label>
          <Input
            type="number"
            name="latitude"
            value={formData.latitude || 0}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Longitude</label>
          <Input
            type="number"
            name="longitude"
            value={formData.longitude || 0}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <label className="block text-sm font-medium">Google Map Link</label>
        <Input
          type="text"
          name="googleMapLink"
          value={formData.googleMapLink || ''}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
};

export default LocationSection;
