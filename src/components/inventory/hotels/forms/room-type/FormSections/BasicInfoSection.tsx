
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MealPlan } from '../../../types/hotel';

const BasicInfoSection = () => {
  const form = useFormContext();

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

  return (
    <>
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
    </>
  );
};

export default BasicInfoSection;
