
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const DescriptionSection = () => {
  const form = useFormContext();

  return (
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
  );
};

export default DescriptionSection;
