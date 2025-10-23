import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash, Check, Calendar } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupabaseHotelsData } from '../../hooks/useSupabaseHotelsData';
import { hotelAmenities } from '../../data/hotelData';
import { MealPlan, RoomImage, Hotel } from '../../types/hotel';
import PricingSection from './FormSections/PricingSection';

// Updated room type schema with proper number validation
const roomTypeSchema = z.object({
  name: z.string().min(3, 'Room type name must be at least 3 characters'),
  capacity: z.object({
    adults: z.string().min(1, 'Adult capacity is required'),
    children: z.string(),
  }),
  configuration: z.string().min(1, 'Room configuration is required'),
  mealPlan: z.string().min(1, 'Meal plan is required'),
  validFrom: z.date(),
  validTo: z.date(),
  adultPrice: z.number().min(0.01, 'Adult price must be greater than 0'),
  childPrice: z.number().min(0, 'Child price must be 0 or greater'),
  extraBedPrice: z.number().min(0, 'Extra bed price must be 0 or greater').optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  amenities: z.array(z.string()),
  images: z.array(z.object({
    id: z.string(),
    url: z.string().url('Please enter a valid image URL'),
    isPrimary: z.boolean().optional(),
    alt: z.string().optional(),
  })).min(1, 'At least one image is required'),
  status: z.enum(['active', 'inactive', 'draft']),
  inventory: z.number().min(0, 'Inventory must be 0 or greater').optional(),
});

type RoomTypeFormValues = z.infer<typeof roomTypeSchema>;

interface RoomTypeFormProps {
  hotelId: string;
  hotel: Hotel;
  roomTypeId?: string;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const RoomTypeForm: React.FC<RoomTypeFormProps> = ({ 
  hotelId, 
  hotel, 
  roomTypeId, 
  onCancel, 
  isSubmitting = false 
}) => {
  const { hotels, addRoomType, updateRoomType } = useSupabaseHotelsData();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date | undefined }>({
    from: new Date(),
    to: undefined,
  });

  // Initialize form with proper default values
  const form = useForm<RoomTypeFormValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: '',
      capacity: {
        adults: '2',
        children: '1',
      },
      configuration: '1 King Bed',
      mealPlan: 'Bed & Breakfast',
      validFrom: new Date(),
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      adultPrice: 0,
      childPrice: 0,
      extraBedPrice: 0,
      description: '',
      amenities: [],
      images: [{ id: `img-${Date.now()}`, url: '' }],
      status: 'active',
      inventory: 10,
    },
  });

  // Setup field array for images
  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  // Load room type data if editing
  React.useEffect(() => {
    if (hotelId && roomTypeId) {
      const roomType = hotel.roomTypes.find(r => r.id === roomTypeId);
      if (roomType) {
        console.log('Loading room type for editing:', roomType);
        form.reset({
          name: roomType.name,
          capacity: {
            adults: roomType.capacity.adults.toString(),
            children: roomType.capacity.children.toString(),
          },
          configuration: roomType.configuration,
          mealPlan: roomType.mealPlan,
          validFrom: new Date(roomType.validFrom),
          validTo: new Date(roomType.validTo),
          adultPrice: roomType.adultPrice,
          childPrice: roomType.childPrice,
          extraBedPrice: roomType.extraBedPrice,
          description: roomType.description,
          amenities: roomType.amenities || [],
          images: roomType.images,
          status: roomType.status,
          inventory: roomType.inventory || 10,
        });
        setDateRange({
          from: new Date(roomType.validFrom),
          to: new Date(roomType.validTo),
        });
      }
    }
  }, [hotelId, roomTypeId, hotel, form]);

  // Handle adding a new image field
  const handleAddImage = () => {
    appendImage({ id: `img-${Date.now()}`, url: '' });
  };

  // Set primary image
  const handleSetPrimary = (index: number) => {
    const newImages = form.getValues('images').map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    form.setValue('images', newImages);
  };

  // Handle room type submission with proper data conversion
  const onSubmit = (values: RoomTypeFormValues) => {
    console.log('Form submission started with values:', values);
    console.log('Hotel country:', hotel?.country, 'Hotel currency:', hotel?.currency);
    
    try {
      // Ensure each image has a valid id
      const processedImages: RoomImage[] = values.images.map(img => ({
        id: img.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: img.url,
        alt: img.alt || '',
        isPrimary: img.isPrimary || false
      }));
      
      // Values are already numbers from the form validation
      const adultPrice = values.adultPrice;
      const childPrice = values.childPrice;
      const extraBedPrice = values.extraBedPrice || 0;
      const inventory = values.inventory || 10;
      
      console.log('Pricing values:', { adultPrice, childPrice, extraBedPrice, inventory });
      
      // Validate values are valid numbers
      if (isNaN(adultPrice) || adultPrice <= 0) {
        throw new Error('Adult price must be a valid positive number');
      }
      if (isNaN(childPrice) || childPrice < 0) {
        throw new Error('Child price must be a valid number (0 or greater)');
      }
      if (isNaN(extraBedPrice) || extraBedPrice < 0) {
        throw new Error('Extra bed price must be a valid number (0 or greater)');
      }
      if (isNaN(inventory) || inventory < 0) {
        throw new Error('Inventory must be a valid number (0 or greater)');
      }
      
      const adultCapacity = parseInt(values.capacity.adults);
      const childCapacity = parseInt(values.capacity.children || '0');
      
      const formattedValues = {
        name: values.name,
        capacity: {
          adults: adultCapacity,
          children: childCapacity,
        },
        configuration: values.configuration,
        mealPlan: values.mealPlan as MealPlan,
        validFrom: values.validFrom.toISOString(),
        validTo: values.validTo.toISOString(),
        adultPrice: adultPrice,
        childPrice: childPrice,
        extraBedPrice: extraBedPrice,
        description: values.description,
        amenities: values.amenities,
        images: processedImages,
        status: values.status,
        // Add the new required properties with calculated values
        maxOccupancy: adultCapacity + childCapacity,
        bedType: values.configuration.split(' ')[0] || 'King',
        seasonStart: values.validFrom.toISOString(),
        seasonEnd: values.validTo.toISOString(),
        adultRate: adultPrice,
        childRate: childPrice,
        inventory: inventory,
      };

      console.log('Final formatted values for submission:', formattedValues);

      if (roomTypeId) {
        // Update existing room type (ensure hotelId is included in payload)
        console.log('Updating room type:', roomTypeId);
        updateRoomType(roomTypeId, { ...formattedValues, hotelId });
      } else {
        // Add new room type (include hotelId in payload for Supabase mapping)
        console.log('Adding new room type to hotel:', hotelId);
        addRoomType({ ...formattedValues, hotelId });
      }
      
      onCancel();
    } catch (error) {
      console.error('Error during form submission:', error);
      throw error;
    }
  };

  // Room configuration options
  const roomConfigurations = [
    '1 King Bed',
    '1 Queen Bed',
    '2 Twin Beds',
    '2 Single Beds',
    '1 Double Bed',
    '2 Queen Beds',
    '1 King Bed + 1 Sofa Bed',
    '1 Queen Bed + 1 Sofa Bed',
    '1 King Bed with Separate Living Area',
    '2 Bedrooms with 1 King Bed and 2 Twin Beds',
    '2 Bedrooms with 1 Queen Bed and 2 Single Beds',
    '3 Single Beds',
  ];

  // Meal plan options
  const mealPlans: MealPlan[] = [
    'Room Only',
    'Bed & Breakfast',
    'Half Board',
    'Full Board',
    'All Inclusive',
  ];

  // Get room-specific amenities
  const roomAmenities = hotelAmenities.filter(
    amenity => amenity.category === 'room' || amenity.category === 'bathroom'
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Type Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Type Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Deluxe Room" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Room Configuration */}
          <FormField
            control={form.control}
            name="configuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Configuration*</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bed configuration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roomConfigurations.map((config) => (
                      <SelectItem key={config} value={config}>
                        {config}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Adult Capacity */}
          <FormField
            control={form.control}
            name="capacity.adults"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adult Capacity*</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Adult' : 'Adults'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Child Capacity */}
          <FormField
            control={form.control}
            name="capacity.children"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Child Capacity</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Child' : 'Children'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meal Plan */}
          <FormField
            control={form.control}
            name="mealPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Plan*</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mealPlans.map((plan) => (
                      <SelectItem key={plan} value={plan}>
                        {plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valid Dates */}
          <div className="md:col-span-2">
            <FormLabel>Validity Period*</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => 
                            date < form.getValues('validFrom')
                          }
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Pricing Section */}
          <PricingSection hotel={hotel} />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange as (value: string) => void}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Room Description*</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter a detailed description of the room" 
                    {...field} 
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amenities */}
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

          {/* Room Images */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <FormLabel>Room Images*</FormLabel>
              <FormDescription>
                Add images of the room. The first image will be used as the primary image.
              </FormDescription>
            </div>

            <div className="space-y-4">
              {imageFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`images.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter image URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(index)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(index)}
                    disabled={imageFields.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImage}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : roomTypeId ? 'Update Room Type' : 'Create Room Type'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RoomTypeForm;
