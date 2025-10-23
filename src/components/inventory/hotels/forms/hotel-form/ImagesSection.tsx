
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HotelImage } from '../../types/hotel';

interface ImagesSectionProps {
  images: HotelImage[];
  handleImageChange: (index: number, field: string, value: string) => void;
  handleSetPrimary: (index: number) => void;
  handleRemoveImage: (index: number) => void;
  handleAddImage: () => void;
}

const ImagesSection: React.FC<ImagesSectionProps> = ({
  images,
  handleImageChange,
  handleSetPrimary,
  handleRemoveImage,
  handleAddImage,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Images</h3>
      {images && images.map((image, index) => (
        <div key={image.id} className="flex items-center space-x-4">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium">Image URL</label>
            <Input
              type="text"
              name={`images[${index}].url`}
              value={image.url || ''}
              onChange={(e) => handleImageChange(index, 'url', e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={() => handleSetPrimary(index)}>
            {image.isPrimary ? 'Primary' : 'Set Primary'}
          </Button>
          <Button type="button" variant="outline" onClick={() => handleRemoveImage(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAddImage}>
        Add Image
      </Button>
    </div>
  );
};

export default ImagesSection;
