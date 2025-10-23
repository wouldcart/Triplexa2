
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ItineraryGenerationRequest } from '@/types/itinerary';

const formSchema = z.object({
  destinations: z.array(z.string()).min(1, { message: 'At least one destination is required' }),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  adults: z.coerce.number().min(1, { message: 'At least 1 adult is required' }),
  children: z.coerce.number().min(0),
  infants: z.coerce.number().min(0),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
  currency: z.string().min(1),
  interests: z.array(z.string()),
  accommodationType: z.enum(['budget', 'mid-range', 'luxury']),
  transportPreference: z.enum(['economy', 'business', 'first-class']),
});

type FormValues = z.infer<typeof formSchema>;

interface ItineraryGenerationFormProps {
  onGenerate: (request: ItineraryGenerationRequest) => void;
  isGenerating: boolean;
  countries: Array<{ name: string; code: string }>;
  cities: Array<{ name: string; country: string; id: string }>;
  context: 'query' | 'proposal' | 'package';
}

const ItineraryGenerationForm: React.FC<ItineraryGenerationFormProps> = ({
  onGenerate,
  isGenerating,
  countries,
  cities,
  context,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinations: [],
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      adults: 2,
      children: 0,
      infants: 0,
      budgetMin: 1000,
      budgetMax: 5000,
      currency: 'USD',
      interests: [],
      accommodationType: 'mid-range',
      transportPreference: 'economy',
    },
  });

  const watchDestinations = form.watch('destinations');
  const watchInterests = form.watch('interests');

  const availableInterests = [
    'Adventure', 'Culture', 'History', 'Nature', 'Beach', 'City Tours',
    'Food & Dining', 'Photography', 'Shopping', 'Nightlife', 'Relaxation',
    'Museums', 'Architecture', 'Wildlife', 'Sports', 'Art'
  ];

  const addDestination = (destination: string) => {
    if (!watchDestinations.includes(destination)) {
      form.setValue('destinations', [...watchDestinations, destination]);
    }
  };

  const removeDestination = (destination: string) => {
    form.setValue('destinations', watchDestinations.filter(d => d !== destination));
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = watchInterests || [];
    if (currentInterests.includes(interest)) {
      form.setValue('interests', currentInterests.filter(i => i !== interest));
    } else {
      form.setValue('interests', [...currentInterests, interest]);
    }
  };

  const onSubmit = (data: FormValues) => {
    const request: ItineraryGenerationRequest = {
      destinations: data.destinations,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
      travelers: {
        adults: data.adults,
        children: data.children,
        infants: data.infants,
      },
      budget: {
        min: data.budgetMin,
        max: data.budgetMax,
        currency: data.currency,
      },
      preferences: {
        interests: data.interests,
        accommodationType: data.accommodationType,
        transportPreference: data.transportPreference,
      },
      context,
    };
    
    onGenerate(request);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate AI Itinerary</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Destinations */}
            <div className="space-y-4">
              <FormLabel>Destinations</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select onValueChange={addDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem 
                        key={city.id} 
                        value={`${city.name}, ${city.country}`}
                        disabled={watchDestinations.includes(`${city.name}, ${city.country}`)}
                      >
                        {city.name}, {city.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2">
                  {watchDestinations.map((dest) => (
                    <Badge 
                      key={dest} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeDestination(dest)}
                    >
                      {dest} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
                          disabled={(date) => date < form.getValues("startDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Travelers */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="adults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adults</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="children"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Children</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="infants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Infants</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="budgetMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Budget</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budgetMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Budget</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accommodationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="mid-range">Mid-range</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="transportPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transport Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="first-class">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <FormLabel>Travel Interests</FormLabel>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={watchInterests?.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                className="w-full max-w-md" 
                disabled={isGenerating || watchDestinations.length === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate AI Itinerary'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ItineraryGenerationForm;
