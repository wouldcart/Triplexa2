

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Hotel } from '../../../types/hotel';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHotelCurrencyData } from '../../../hooks/useHotelCurrencyData';

interface PricingSectionProps {
  hotel?: Hotel;
}

const PricingSection: React.FC<PricingSectionProps> = ({ hotel }) => {
  const form = useFormContext();
  const { formatPriceWithCurrency } = useCurrency();
  
  // Get currency information directly from hotel record
  const { currencyData, loading, error } = useHotelCurrencyData(hotel?.id);
  
  // Use hotel currency data if available, otherwise fallback to defaults
  const currencySymbol = currencyData?.currencySymbol || hotel?.currencySymbol || '$';
  const currencyCode = currencyData?.currency || hotel?.currency || 'USD';

  console.log('PricingSection - Hotel ID:', hotel?.id, 'Currency:', currencyCode, 'Symbol:', currencySymbol, 'Loading:', loading, 'Error:', error);

  // Watch form values for pricing preview
  const adultPrice = form.watch('adultPrice');
  const childPrice = form.watch('childPrice');
  const extraBedPrice = form.watch('extraBedPrice');

  // Debug form values
  console.log('PricingSection - Form values:', { adultPrice, childPrice, extraBedPrice });

  return (
    <>
      {/* Adult Price */}
      <FormField
        control={form.control}
        name="adultPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adult Price (per night)* ({currencySymbol})</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder={`0.00 ${currencyCode}`} 
                {...field}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : 0;
                  console.log('Adult price changed:', value);
                  field.onChange(value);
                }}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Base adult rate per room per night in {currencyCode}
            </FormDescription>
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
            <FormLabel>Child Price (per night)* ({currencySymbol})</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder={`0.00 ${currencyCode}`} 
                {...field}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : 0;
                  console.log('Child price changed:', value);
                  field.onChange(value);
                }}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Child rate per child per night in {currencyCode} (typically 50% of adult rate)
            </FormDescription>
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
            <FormLabel>Extra Bed Charge (per night) ({currencySymbol})</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder={`50.00 ${currencyCode}`}
                {...field}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : 0;
                  console.log('Extra bed price changed:', value);
                  field.onChange(value);
                }}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Additional charge for extra bed per night in {currencyCode}
            </FormDescription>
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
            <FormLabel>Number of Rooms Available</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="1" 
                placeholder="10" 
                {...field}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : 0;
                  console.log('Inventory changed:', value);
                  field.onChange(value);
                }}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
            <FormDescription>
              The total number of this room type available for booking
            </FormDescription>
          </FormItem>
        )}
      />

      {/* Pricing Preview */}
      {(adultPrice || childPrice || extraBedPrice) && (
        <div
          id="room-type-pricing-preview"
          data-testid="room-type-pricing-preview"
          data-selected="true"
          aria-label="Room Type Pricing Preview"
          className="md:col-span-2 p-4 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ring-1 ring-primary/20 dark:ring-primary/30 transition-colors"
        >
          <h4 className="font-medium mb-2">Pricing Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Adult Rate:</span>
              <div className="font-medium">
                {currencySymbol}{(adultPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Child Rate:</span>
              <div className="font-medium">
                {currencySymbol}{(childPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Extra Bed:</span>
              <div className="font-medium">
                {currencySymbol}{(extraBedPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PricingSection;

