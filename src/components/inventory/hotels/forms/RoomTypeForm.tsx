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
import { useSupabaseHotelsData } from '../hooks/useSupabaseHotelsData';
import { hotelAmenities } from '../data/hotelData';
import { MealPlan, RoomImage } from '../types/hotel';

// Room type schema
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
  adultPrice: z.string().min(1, 'Adult price is required'),
  childPrice: z.string().min(1, 'Child price is required'),
  extraBedPrice: z.string(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  amenities: z.array(z.string()),
  images: z.array(z.object({
    id: z.string(),
    url: z.string().url('Please enter a valid image URL'),
    isPrimary: z.boolean().optional(),
    alt: z.string().optional(),
  })).min(1, 'At least one image is required'),
  status: z.enum(['active', 'inactive', 'draft']),
  inventory: z.string().optional(),
});

type RoomTypeFormValues = z.infer<typeof roomTypeSchema>;

interface RoomTypeFormProps {
  hotelId: string;
  roomTypeId?: string;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const RoomTypeForm: React.FC<RoomTypeFormProps> = ({ hotelId, roomTypeId, onCancel, isSubmitting = false }) => {
  const { hotels, addRoomType, updateRoomType } = useSupabaseHotelsData();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date | undefined }>({
    from: new Date(),
    to: undefined,
  });

  // Initialize form
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
      adultPrice: '',
      childPrice: '',
      extraBedPrice: '',
      description: '',
      amenities: [],
      images: [{ id: `img-${Date.now()}`, url: '' }],
      status: 'active',
      inventory: '10',
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
      const hotel = hotels.find(h => h.id === hotelId);
      if (hotel) {
        const roomType = hotel.roomTypes.find(r => r.id === roomTypeId);
        if (roomType) {
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
            adultPrice: roomType.adultPrice.toString(),
            childPrice: roomType.childPrice.toString(),
            extraBedPrice: roomType.extraBedPrice.toString(),
            description: roomType.description,
            amenities: roomType.amenities,
            images: roomType.images,
            status: roomType.status,
            inventory: roomType.inventory?.toString() || '10',
          });
          setDateRange({
            from: new Date(roomType.validFrom),
            to: new Date(roomType.validTo),
          });
        }
      }
    }
  }, [hotelId, roomTypeId, hotels, form]);

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

  // Handle room type submission
  const onSubmit = (values: RoomTypeFormValues) => {
    // Ensure each image has a valid id
    const processedImages: RoomImage[] = values.images.map(img => ({
      id: img.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: img.url,
      alt: img.alt || '',
      isPrimary: img.isPrimary || false
    }));
    
    const adultCapacity = parseInt(values.capacity.adults);
    
    const formattedValues = {
      name: values.name,
      capacity: {
        adults: parseInt(values.capacity.adults),
        children: parseInt(values.capacity.children || '0'),
      },
      configuration: values.configuration,
      mealPlan: values.mealPlan as MealPlan,
      validFrom: values.validFrom.toISOString(),
      validTo: values.validTo.toISOString(),
      adultPrice: parseFloat(values.adultPrice),
      childPrice: parseFloat(values.childPrice),
      extraBedPrice: parseFloat(values.extraBedPrice || '0'),
      description: values.description,
      amenities: values.amenities,
      images: processedImages,
      status: values.status,
      // Add the new required properties with default values
      maxOccupancy: adultCapacity + parseInt(values.capacity.children || '0'),
      bedType: values.configuration.split(' ')[0] || 'King',
      seasonStart: values.validFrom.toISOString(),
      seasonEnd: values.validTo.toISOString(),
      adultRate: parseFloat(values.adultPrice),
      childRate: parseFloat(values.childPrice),
      inventory: parseInt(values.inventory || '10'),
    };

    if (roomTypeId) {
      // Update existing room type (include hotelId in payload)
      updateRoomType(roomTypeId, { ...formattedValues, hotelId });
    } else {
      // Add new room type (include hotelId in payload)
      addRoomType({ ...formattedValues, hotelId });
    }
    
    onCancel();
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
    'EP (European Plan)',
    'CP (Continental Plan)',
    'MAP (Modified American Plan)',
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

          {/* Adult Price */}
          <FormField
            control={form.control}
            name="adultPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adult Price (per night)*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Child Price */}
          <FormField
            control={form.control}
            name="childPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Child Price (per night)*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Extra Bed Price */}
          <FormField
            control={form.control}
            name="extraBedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Extra Bed Charge (per night)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    render={({ field: urlField }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="Enter image URL" {...urlField} />
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-shrink-0"
                              onClick={() => handleSetPrimary(index)}
                            >
                              {form.getValues(`images.${index}.isPrimary`) ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : null}
                              Primary
                            </Button>
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-shrink-0"
                                onClick={() => removeImage(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={handleAddImage}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Image
            </Button>
          </div>

          {/* Add Inventory field */}
          <FormField
            control={form.control}
            name="inventory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Rooms Available</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="1" 
                    placeholder="10" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  The total number of this room type available for booking
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {roomTypeId ? 'Update Room Type' : 'Add Room Type'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RoomTypeForm;
