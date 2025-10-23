import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Plus, Trash2, ArrowRight, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useInventoryData } from '../queries/hooks/useInventoryData';
import { Hotel } from '@/components/inventory/hotels/types/hotel';
import { Sightseeing } from '@/types/sightseeing';
import { Restaurant } from '../inventory/restaurants/types/restaurantTypes';
import { TransportRoute } from './types/proposalTypes';
import { formatCurrency } from '@/lib/formatters';

// Define the schema for the form
const formSchema = z.object({
  clientName: z.string().min(2, { message: 'Client name is required' }),
  clientEmail: z.string().email({ message: 'Invalid email address' }),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  adults: z.coerce.number().min(1, { message: 'At least 1 adult is required' }),
  children: z.coerce.number().min(0),
  country: z.string().min(1, { message: 'Country is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  notes: z.string().optional(),
  includeHotels: z.boolean().default(true),
  includeSightseeing: z.boolean().default(true),
  includeRestaurants: z.boolean().default(false),
  includeTransport: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Define the proposal item types
interface ProposalItem {
  id: string;
  type: 'hotel' | 'sightseeing' | 'restaurant' | 'transport';
  name: string;
  price: number;
  quantity: number;
  days?: number;
  notes?: string;
}

const EnhancedCreateProposal: React.FC = () => {
  const { toast } = useToast();
  const { hotels, sightseeing, restaurants, transportRoutes, cities, countries } = useInventoryData();
  
  // State for the proposal items
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('hotels');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Helper function to get price from sightseeing item
  const getPrice = (price: number | { adult: number; child: number; }): number => {
    if (typeof price === 'number') {
      return price;
    } else if (price && typeof price === 'object' && 'adult' in price) {
      return price.adult;
    }
    return 0;
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      adults: 2,
      children: 0,
      country: '',
      city: '',
      notes: '',
      includeHotels: true,
      includeSightseeing: true,
      includeRestaurants: false,
      includeTransport: true,
    },
  });

  // Watch for form value changes
  const watchCountry = form.watch('country');
  const watchCity = form.watch('city');
  const watchIncludeHotels = form.watch('includeHotels');
  const watchIncludeSightseeing = form.watch('includeSightseeing');
  const watchIncludeRestaurants = form.watch('includeRestaurants');
  const watchIncludeTransport = form.watch('includeTransport');
  
  // Update available cities when country changes
  useEffect(() => {
    if (watchCountry) {
      const citiesForCountry = cities.filter(city => city.country === watchCountry);
      if (citiesForCountry.length > 0 && !citiesForCountry.some(city => city.name === watchCity)) {
        form.setValue('city', citiesForCountry[0].name);
        setSelectedCity(citiesForCountry[0].name);
      }
    }
  }, [watchCountry, cities, form, watchCity]);

  // Update selected city when city changes in form
  useEffect(() => {
    if (watchCity) {
      setSelectedCity(watchCity);
    }
  }, [watchCity]);

  // Filter inventory items based on selected city and search query
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => 
      (!selectedCity || hotel.city === selectedCity) &&
      (!searchQuery || hotel.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [hotels, selectedCity, searchQuery]);

  const filteredSightseeing = useMemo(() => {
    return sightseeing.filter(item => 
      (!selectedCity || item.city === selectedCity) &&
      (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sightseeing, selectedCity, searchQuery]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => 
      (!selectedCity || restaurant.city === selectedCity) &&
      (!searchQuery || restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [restaurants, selectedCity, searchQuery]);

  const filteredTransport = useMemo(() => {
    return transportRoutes.filter(route => 
      (!selectedCity || route.from === selectedCity || route.to === selectedCity) &&
      (!searchQuery || route.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [transportRoutes, selectedCity, searchQuery]);

  // Add item to proposal
  const addItemToProposal = (item: Hotel | Sightseeing | Restaurant | TransportRoute, type: 'hotel' | 'sightseeing' | 'restaurant' | 'transport') => {
    const newItem: ProposalItem = {
      id: `${type}-${item.id}`,
      type,
      name: item.name,
      price: type === 'sightseeing' 
        ? getPrice((item as Sightseeing).price || 0)
        : (item as any).price || 0,
      quantity: 1,
      days: type === 'hotel' ? 1 : undefined,
    };
    
    setProposalItems(prev => [...prev, newItem]);
    
    toast({
      title: "Item added",
      description: `${item.name} has been added to your proposal.`,
    });
  };

  // Remove item from proposal
  const removeItemFromProposal = (id: string) => {
    setProposalItems(prev => prev.filter(item => item.id !== id));
  };

  // Update item quantity
  const updateItemQuantity = (id: string, quantity: number) => {
    setProposalItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Update item days (for hotels)
  const updateItemDays = (id: string, days: number) => {
    setProposalItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, days } : item
      )
    );
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    return proposalItems.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity * (item.days || 1);
      return sum + itemTotal;
    }, 0);
  }, [proposalItems]);

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (proposalItems.length === 0) {
      toast({
        title: "No items added",
        description: "Please add at least one item to your proposal.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would send the data to an API
    console.log('Form data:', data);
    console.log('Proposal items:', proposalItems);
    
    toast({
      title: "Proposal created",
      description: `Proposal for ${data.clientName} has been created successfully.`,
    });
    
    // Reset form and items
    form.reset();
    setProposalItems([]);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Proposal</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Enter the client details and trip information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="client@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                                disabled={(date) =>
                                  date < new Date()
                                }
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
                                disabled={(date) =>
                                  date < form.getValues("startDate")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Adults</FormLabel>
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
                          <FormLabel>Number of Children</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.name}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!watchCountry}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cities
                                .filter(city => city.country === watchCountry)
                                .map((city) => (
                                  <SelectItem key={city.id} value={city.name}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special requirements or preferences..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="includeHotels"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Hotels</FormLabel>
                            <FormDescription>
                              Include accommodation
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeSightseeing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Sightseeing</FormLabel>
                            <FormDescription>
                              Include attractions
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeRestaurants"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Restaurants</FormLabel>
                            <FormDescription>
                              Include dining options
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeTransport"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Transport</FormLabel>
                            <FormDescription>
                              Include transportation
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="w-full md:w-auto">
                      Create Proposal
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Inventory Selection */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add Items to Proposal</CardTitle>
              <CardDescription>Select items to include in your proposal</CardDescription>
              <div className="mt-2">
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hotels" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger 
                    value="hotels" 
                    disabled={!watchIncludeHotels}
                    className={!watchIncludeHotels ? "opacity-50" : ""}
                  >
                    Hotels
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sightseeing" 
                    disabled={!watchIncludeSightseeing}
                    className={!watchIncludeSightseeing ? "opacity-50" : ""}
                  >
                    Sightseeing
                  </TabsTrigger>
                  <TabsTrigger 
                    value="restaurants" 
                    disabled={!watchIncludeRestaurants}
                    className={!watchIncludeRestaurants ? "opacity-50" : ""}
                  >
                    Restaurants
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transport" 
                    disabled={!watchIncludeTransport}
                    className={!watchIncludeTransport ? "opacity-50" : ""}
                  >
                    Transport
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[400px] pr-4">
                  <TabsContent value="hotels" className="space-y-4">
                    {filteredHotels.length > 0 ? (
                      filteredHotels.map((hotel) => (
                        <Card key={hotel.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/4 h-40 md:h-auto">
                              <img 
                                src={hotel.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                                alt={hotel.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold">{hotel.name}</h3>
                                  <p className="text-sm text-gray-500">{hotel.city}, {hotel.country}</p>
                                </div>
                                <Badge>{hotel.starRating} Stars</Badge>
                              </div>
                              <p className="text-sm mt-2 line-clamp-2">{hotel.description}</p>
                              <div className="mt-auto pt-4 flex justify-between items-center">
                                <div className="font-semibold">
                                  {formatCurrency(hotel.price || 0)} <span className="text-sm font-normal">per night</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => addItemToProposal(hotel, 'hotel')}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add to Proposal
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No hotels found for the selected criteria
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="sightseeing" className="space-y-4">
                    {filteredSightseeing.length > 0 ? (
                      filteredSightseeing.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/4 h-40 md:h-auto">
                              <img 
                                src={
                                  item.images && item.images.length > 0 
                                    ? item.images[0].url 
                                    : (item.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image')
                                } 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold">{item.name}</h3>
                                  <p className="text-sm text-gray-500">{item.city}, {item.country}</p>
                                </div>
                                {item.category && <Badge>{item.category}</Badge>}
                              </div>
                              <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
                              <div className="mt-auto pt-4 flex justify-between items-center">
                                <div className="font-semibold">
                                  {formatCurrency(getPrice(item.price || 0))} <span className="text-sm font-normal">per person</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => addItemToProposal(item, 'sightseeing')}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add to Proposal
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No sightseeing attractions found for the selected criteria
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="restaurants" className="space-y-4">
                    {filteredRestaurants.length > 0 ? (
                      filteredRestaurants.map((restaurant) => (
                        <Card key={restaurant.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/4 h-40 md:h-auto">
                              <img 
                                src={restaurant.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
                                alt={restaurant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                                  <p className="text-sm text-gray-500">{restaurant.city}, {restaurant.country}</p>
                                </div>
                                <Badge>{restaurant.cuisine}</Badge>
                              </div>
                              <p className="text-sm mt-2 line-clamp-2">{restaurant.description}</p>
                              <div className="mt-auto pt-4 flex justify-between items-center">
                                <div className="font-semibold">
                                  {formatCurrency(restaurant.averageCost || 0)} <span className="text-sm font-normal">avg. per person</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => addItemToProposal(restaurant, 'restaurant')}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add to Proposal
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No restaurants found for the selected criteria
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transport" className="space-y-4">
                    {filteredTransport.length > 0 ? (
                      filteredTransport.map((route) => (
                        <Card key={route.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold">{route.name}</h3>
                                <div className="flex items-center mt-1">
                                  <span className="text-sm">{route.from}</span>
                                  <ArrowRight className="h-3 w-3 mx-2" />
                                  <span className="text-sm">{route.to}</span>
                                </div>
                              </div>
                              <Badge>{route.transportType}</Badge>
                            </div>
                            <div className="mt-2 text-sm">
                              <div className="flex justify-between">
                                <span>Distance:</span>
                                <span>{route.distance} km</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span>{route.duration}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="font-semibold">
                                {formatCurrency(route.price || 0)} <span className="text-sm font-normal">per trip</span>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => addItemToProposal(route, 'transport')}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Proposal
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No transport routes found for the selected criteria
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Proposal Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Proposal Summary</CardTitle>
              <CardDescription>Items in your proposal</CardDescription>
            </CardHeader>
            <CardContent>
              {proposalItems.length > 0 ? (
                <div className="space-y-4">
                  {proposalItems.map((item) => (
                    <div key={item.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant="outline" className="mt-1">
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => removeItemFromProposal(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Quantity</label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="h-8 mt-1"
                          />
                        </div>
                        
                        {item.type === 'hotel' && (
                          <div>
                            <label className="text-xs text-gray-500">Nights</label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={item.days} 
                              onChange={(e) => updateItemDays(item.id, parseInt(e.target.value) || 1)}
                              className="h-8 mt-1"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 flex justify-between text-sm">
                        <span>Price:</span>
                        <span className="font-medium">
                          {formatCurrency(item.price * item.quantity * (item.days || 1))}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No items added yet</p>
                  <p className="text-sm mt-1">Select items from the tabs below</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setProposalItems([])}>
                Clear All
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>
                Create Proposal
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreateProposal;
