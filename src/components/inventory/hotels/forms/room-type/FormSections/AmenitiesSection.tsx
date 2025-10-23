
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { hotelAmenities } from '../../../data/hotelData';

const AmenitiesSection = () => {
  const form = useFormContext();
  
  // Get room-specific amenities
  const roomAmenities = hotelAmenities.filter(
    amenity => amenity.category === 'room' || amenity.category === 'bathroom'
  );

  return (
    <div className="md:col-span-2">
      <FormField
        control={form.control}
        name="amenities"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel>Room Amenities</FormLabel>
              <FormDescription>
                Select all the amenities available in this room type
              </FormDescription>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {roomAmenities.map((amenity) => (
                <FormField
                  key={amenity.id}
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem
                      key={amenity.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(amenity.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, amenity.id]);
                            } else {
                              field.onChange(
                                current.filter((value) => value !== amenity.id)
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {amenity.name}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage className="mt-2" />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AmenitiesSection;
