
import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from "@/lib/utils";
import { RoomType, MealPlan } from '../types/hotel';

interface AddRoomTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (roomType: RoomType) => void;
  hotelCurrency?: string;
  currencySymbol?: string;
  initialData?: any;
  mode?: 'add' | 'edit';
}

const roomTypeSchema = z.object({
  name: z.string().min(3, 'Room type name is required'),
  capacity: z.object({
    adults: z.number().min(1, 'At least 1 adult is required'),
    children: z.number().min(0),
  }),
  configuration: z.string().min(3, 'Bed configuration is required'),
  mealPlan: z.string().min(1, 'Meal plan is required'),
  validFrom: z.date(),
  validTo: z.date(),
  adultPrice: z.number().min(0, 'Price must be 0 or higher'),
  childPrice: z.number().min(0, 'Price must be 0 or higher'),
  extraBedPrice: z.number().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.object({
    id: z.string(),
    url: z.string().url('Please enter a valid image URL'),
    isPrimary: z.boolean().optional(),
    alt: z.string().optional(),
  })).optional(),
  status: z.enum(['active', 'inactive', 'draft']),
  inventory: z.number().min(0, 'Inventory must be 0 or higher').optional(),
});

type FormValues = z.infer<typeof roomTypeSchema>;

const AddRoomTypeDialog: React.FC<AddRoomTypeDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  hotelCurrency = 'USD',
  currencySymbol = '$',
  initialData,
  mode = 'add',
}) => {
  const isEditing = mode === 'edit' && !!initialData;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: '',
      capacity: {
        adults: 2,
        children: 0,
      },
      configuration: '',
      mealPlan: 'Bed & Breakfast',
      validFrom: new Date(),
      validTo: new Date(new Date().setMonth(new Date().getMonth() + 12)), // Default to 1 year validity
      adultPrice: 0,
      childPrice: 0,
      extraBedPrice: 0,
      description: '',
      status: 'active',
      inventory: 10,
      images: [{ id: `room-img-${Date.now()}`, url: '' }],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        name: initialData.name,
        capacity: {
          adults: initialData.capacity.adults,
          children: initialData.capacity.children,
        },
        configuration: initialData.configuration,
        mealPlan: initialData.mealPlan,
        validFrom: new Date(initialData.validFrom),
        validTo: new Date(initialData.validTo),
        adultPrice: initialData.adultPrice,
        childPrice: initialData.childPrice,
        extraBedPrice: initialData.extraBedPrice,
        description: initialData.description,
        status: initialData.status,
        inventory: initialData.inventory || 10,
        images: initialData.images || [{ id: `room-img-${Date.now()}`, url: '' }],
        amenities: initialData.amenities,
      });
    } else {
      // Reset form when adding new room type
      form.reset({
        name: '',
        capacity: {
          adults: 2,
          children: 0,
        },
        configuration: '',
        mealPlan: 'Bed & Breakfast',
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 12)),
        adultPrice: 0,
        childPrice: 0,
        extraBedPrice: 0,
        description: '',
        status: 'active',
        inventory: 10,
        images: [{ id: `room-img-${Date.now()}`, url: '' }],
      });
    }
  }, [initialData, isEditing, form]);

  const onSubmit = (data: FormValues) => {
    const newRoomType: RoomType = {
      id: initialData?.id || `room-${Date.now()}`,
      name: data.name,
      capacity: {
        adults: data.capacity.adults,
        children: data.capacity.children,
      },
      configuration: data.configuration,
      mealPlan: data.mealPlan as MealPlan,
      validFrom: data.validFrom.toISOString(),
      validTo: data.validTo.toISOString(),
      adultPrice: data.adultPrice,
      childPrice: data.childPrice,
      extraBedPrice: data.extraBedPrice || 0,
      description: data.description,
      amenities: data.amenities || [],
      images: (data.images || []).map(img => ({
        id: img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: img.url || '',
        isPrimary: img.isPrimary || false,
        alt: img.alt || '',
      })),
      status: data.status,
      adultRate: data.adultPrice,
      childRate: data.childPrice,
      maxOccupancy: data.capacity.adults + data.capacity.children,
      bedType: data.configuration.split(' ')[0] || 'King',
      seasonStart: data.validFrom.toISOString(),
      seasonEnd: data.validTo.toISOString(),
      inventory: data.inventory || 10,
      currency: hotelCurrency,
      currencySymbol,
    };

    onSave(newRoomType);
  };

  // Configuration options
  const roomConfigurations = [
    'King Bed',
    'Queen Bed',
    'Twin/Double',
    'Twin Beds',
    'Double Bed',
    'Single Bed',
    'Suite',
    'Family Room',
    'Connecting Rooms',
    'Villa'
  ];

  // Meal plan options
  const mealPlans: MealPlan[] = [
    'Room Only',
    'Bed & Breakfast',
    'Half Board',
    'Full Board',
    'All Inclusive',
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Room Type' : 'Add Room Type'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
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
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
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
              
              {/* Inventory */}
              <FormField
                control={form.control}
                name="inventory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Rooms</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of rooms of this type available
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Valid From Date */}
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid From*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Valid To Date */}
              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid To*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < form.getValues('validFrom')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Adult Price */}
              <FormField
                control={form.control}
                name="adultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adult Price ({currencySymbol})*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
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
                    <FormLabel>Child Price ({currencySymbol})*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
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
                    <FormLabel>Extra Bed Price ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional charge for extra beds
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status Switch */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Enable this room type for booking
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'active'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'active' : 'inactive')
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Room Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the room details, size, view, and amenities" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Room Image URL */}
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Controller
                name="images.0.url"
                control={form.control}
                render={({ field }) => (
                  <Input 
                    placeholder="Enter image URL" 
                    {...field} 
                  />
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Room Type' : 'Add Room Type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoomTypeDialog;
