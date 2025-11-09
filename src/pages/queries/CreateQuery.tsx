import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Users, MapPin, Calendar as CalendarDays, DollarSign, Car, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AgentSelector } from '@/components/queries/AgentSelector';
import { CountryCitySelector } from './components/CountryCitySelector';
import { CityNightAllocator } from '@/components/proposal/CityNightAllocator';
import { Query } from '@/types/query';
import { createEnquiry } from '@/services/enquiriesService';
import { EnqIdGenerator } from '@/utils/enqIdGenerator';
import { getCountryCodeByName } from '@/utils/countryUtils';
import { findSupabaseAgentByNumericId } from '@/utils/supabaseAgentIds';
import { useAgentData } from '@/hooks/useAgentData';
import { useSupabaseAgentsList } from '@/hooks/useSupabaseAgentsList';
import { toNumericAgentId } from '@/utils/supabaseAgentIds';

const CreateQuery: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAgentById } = useAgentData();
  const { agents } = useSupabaseAgentsList();

  // Form state
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedAgentName, setSelectedAgentName] = useState('');
  const [destination, setDestination] = useState({ country: '', cities: [] as string[] });
  const [paxDetails, setPaxDetails] = useState({ adults: 2, children: 0, infants: 0 });
  const [travelDates, setTravelDates] = useState({ from: null as Date | null, to: null as Date | null, isEstimated: false });
  const [packageType, setPackageType] = useState('full-package');
  const [specialRequests, setSpecialRequests] = useState(['']);
  const [budget, setBudget] = useState({ min: 0, max: 0, currency: 'USD' });
  const [notes, setNotes] = useState('');
  const [communicationPreference, setCommunicationPreference] = useState('email');
  const [hotelDetails, setHotelDetails] = useState({ rooms: 1, category: 'standard' });
  const [inclusions, setInclusions] = useState({
    sightseeing: true,
    transfers: '',
    mealPlan: 'breakfast',
    transportTypes: [] as string[]
  });
  
  // Manual trip duration override
  const [manualDuration, setManualDuration] = useState({ days: 0, nights: 0 });
  const [isManualDuration, setIsManualDuration] = useState(false);
  
  // City night allocations
  const [cityAllocations, setCityAllocations] = useState([]);

  const calculateTripDuration = () => {
    if (isManualDuration) {
      return manualDuration;
    }
    
    if (travelDates.from && travelDates.to) {
      const timeDiff = travelDates.to.getTime() - travelDates.from.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      const nights = days - 1;
      return { days, nights };
    }
    return { days: 0, nights: 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgentId || !destination.country || !travelDates.from || !travelDates.to) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const tripDuration = calculateTripDuration();
    
    // Prepare enquiry ID based on destination country
    const selectedCountryCode = getCountryCodeByName(destination.country);
    try {
      await EnqIdGenerator.prepareConfig(selectedCountryCode || undefined);
    } catch {}
    const enquiryId = EnqIdGenerator.generateEnqId(selectedCountryCode || undefined);
    
    // Resolve Supabase agent UUID from numeric selection
    const numericAgentId = Number.parseInt(selectedAgentId);
    const supabaseAgent = findSupabaseAgentByNumericId(agents, numericAgentId);
    const agentUuid = supabaseAgent?.id;
    
    const queryData: Omit<Query, 'createdAt' | 'updatedAt'> = {
      id: enquiryId,
      agentId: numericAgentId,
      agentUuid: agentUuid,
      agentName: selectedAgentName,
      destination: {
        country: destination.country,
        cities: destination.cities.filter(city => city.trim() !== '')
      },
      paxDetails,
      travelDates: {
        from: travelDates.from!.toISOString(),
        to: travelDates.to!.toISOString(),
        isEstimated: !!travelDates.isEstimated
      },
      tripDuration,
      packageType,
      specialRequests: specialRequests.filter(req => req.trim() !== ''),
      budget,
      status: 'new',
      assignedTo: null,
      priority: 'normal',
      notes,
      communicationPreference,
      hotelDetails,
      inclusions,
      cityAllocations: cityAllocations // Include city allocations in the query data
    };

    try {
      const { data: created, error } = await createEnquiry(queryData as Query);
      if (error) throw error;
      const newQuery = created || (queryData as Query);
      toast({
        title: "Query Created",
        description: `Enquiry ${newQuery.id} has been created successfully.`,
      });
      navigate('/queries');
    } catch (error) {
      console.error('Error creating query:', error);
      toast({
        title: "Error",
        description: "There was an error creating the query.",
        variant: "destructive",
      });
    }
  };

  const handleAgentChange = (agentId: string, agentName: string) => {
    setSelectedAgentId(agentId);
    // Prefer the provided name; if missing, resolve from Supabase; otherwise fall back to local data
    if (agentName && agentName.trim().length > 0) {
      setSelectedAgentName(agentName);
      return;
    }

    const numeric = Number.parseInt(agentId || '');
    const supabaseAgent = agents.find(a => toNumericAgentId(a.id) === numeric);
    if (supabaseAgent) {
      setSelectedAgentName(supabaseAgent.name);
      return;
    }

    const localAgent = getAgentById(numeric);
    if (localAgent) {
      setSelectedAgentName(localAgent.name);
    }
  };

  const addSpecialRequest = () => {
    setSpecialRequests(prev => [...prev, '']);
  };

  const updateSpecialRequest = (index: number, value: string) => {
    setSpecialRequests(prev => prev.map((req, i) => i === index ? value : req));
  };

  const removeSpecialRequest = (index: number) => {
    setSpecialRequests(prev => prev.filter((_, i) => i !== index));
  };

  const handleTransportTypeChange = (transportType: string, checked: boolean) => {
    setInclusions(prev => {
      const nextTransportTypes = checked
        ? [...prev.transportTypes, transportType]
        : prev.transportTypes.filter(type => type !== transportType);
      const transfersText = nextTransportTypes.length === 0 ? '' : nextTransportTypes.join(',');
      return {
        ...prev,
        transportTypes: nextTransportTypes,
        transfers: transfersText,
      };
    });
  };

  const toggleManualDuration = () => {
    if (!isManualDuration) {
      // Switch to manual mode, initialize with calculated duration
      const calculatedDuration = calculateTripDuration();
      setManualDuration(calculatedDuration);
    }
    setIsManualDuration(!isManualDuration);
  };

  const handleManualDurationChange = (field: 'days' | 'nights', value: string) => {
    const numValue = parseInt(value) || 0;
    setManualDuration(prev => ({
      ...prev,
      [field]: numValue,
      // Auto-adjust the other field
      ...(field === 'days' ? { nights: Math.max(0, numValue - 1) } : { days: numValue + 1 })
    }));
  };

  const duration = calculateTripDuration();
  const totalPax = paxDetails.adults + paxDetails.children + paxDetails.infants;
  const today = new Date();

  return (
    <PageLayout>
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/queries')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queries
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Query</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Fill in the details to create a new travel query</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {totalPax > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{totalPax} PAX</span>
              </div>
            )}
            {duration.days > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarDays className="h-4 w-4" />
                <span>{duration.days}D/{duration.nights}N</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Agent Selection */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Users className="h-5 w-5 text-blue-600" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AgentSelector
                    selectedAgentId={selectedAgentId}
                    onAgentChange={handleAgentChange}
                  />
                </CardContent>
              </Card>

              {/* Destination */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Destination Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CountryCitySelector
                    destination={destination}
                    onDestinationChange={setDestination}
                  />
                </CardContent>
              </Card>

              {/* Travel Information */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                    Travel Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Passenger Details */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block text-gray-900 dark:text-gray-100">Passenger Details</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adults" className="text-sm text-gray-700 dark:text-gray-300">Adults *</Label>
                        <Input
                          id="adults"
                          type="number"
                          min="1"
                          value={paxDetails.adults}
                          onChange={(e) => setPaxDetails(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                          className="text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="children" className="text-sm text-gray-700 dark:text-gray-300">Children</Label>
                        <Input
                          id="children"
                          type="number"
                          min="0"
                          value={paxDetails.children}
                          onChange={(e) => setPaxDetails(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                          className="text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="infants" className="text-sm text-gray-700 dark:text-gray-300">Infants</Label>
                        <Input
                          id="infants"
                          type="number"
                          min="0"
                          value={paxDetails.infants}
                          onChange={(e) => setPaxDetails(prev => ({ ...prev, infants: parseInt(e.target.value) || 0 }))}
                          className="text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Travel Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Departure Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100",
                              !travelDates.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {travelDates.from ? format(travelDates.from, "PPP") : "Select departure date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" align="start">
                          <Calendar
                            mode="single"
                            selected={travelDates.from}
                            onSelect={(date) => setTravelDates(prev => ({ ...prev, from: date }))}
                            initialFocus
                            modifiers={{
                              today: today
                            }}
                            modifiersStyles={{
                              today: {
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontWeight: 'bold'
                              }
                            }}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Return Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100",
                              !travelDates.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {travelDates.to ? format(travelDates.to, "PPP") : "Select return date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" align="start">
                          <Calendar
                            mode="single"
                            selected={travelDates.to}
                            onSelect={(date) => setTravelDates(prev => ({ ...prev, to: date }))}
                            initialFocus
                            disabled={(date) => travelDates.from ? date < travelDates.from : false}
                            modifiers={{
                              departureDate: travelDates.from ? [travelDates.from] : []
                            }}
                            modifiersStyles={{
                              departureDate: {
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontWeight: 'bold'
                              }
                            }}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Date Estimated Toggle */}
                  <div className="flex items-center gap-3 mt-2">
                    <Switch
                      checked={!!travelDates.isEstimated}
                      onCheckedChange={(checked) => setTravelDates(prev => ({ ...prev, isEstimated: !!checked }))}
                    />
                    <Label className="text-sm text-gray-700 dark:text-gray-300">Dates are estimated</Label>
                  </div>

                  {duration.days > 0 && (
                    <div className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-md border border-primary/20 dark:border-primary/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-foreground">
                            Trip Duration
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={toggleManualDuration}
                          className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {isManualDuration ? 'Auto' : 'Edit'}
                        </Button>
                      </div>
                      
                      {isManualDuration ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Days</Label>
                            <Input
                              type="number"
                              min="1"
                              value={manualDuration.days}
                              onChange={(e) => handleManualDurationChange('days', e.target.value)}
                              className="h-7 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground">Nights</Label>
                            <Input
                              type="number"
                              min="0"
                              value={manualDuration.nights}
                              onChange={(e) => handleManualDurationChange('nights', e.target.value)}
                              className="h-7 text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-background/50 rounded border border-border/50">
                          <span className="text-sm font-medium text-foreground">
                            {duration.days} days, {duration.nights} nights
                          </span>
                        </div>
                      )}
                     </div>
                   )}
                 </CardContent>
               </Card>

               {/* City Night Allocator - Show when dates and cities are selected */}
               {travelDates.from && travelDates.to && destination.cities.length > 0 && duration.nights > 0 && (
                 <CityNightAllocator
                   query={{
                     destination,
                     travelDates: {
                       from: travelDates.from.toISOString(),
                       to: travelDates.to.toISOString(),
                       isEstimated: !!travelDates.isEstimated
                     },
                     tripDuration: duration
                   } as Query}
                   onAllocationsChange={setCityAllocations}
                   onGenerateDays={(allocations) => {
                     // This will be used for itinerary generation later
                     console.log('City allocations ready for itinerary generation:', allocations);
                   }}
                 />
               )}

              {/* Package Type & Inclusions */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-900 dark:text-gray-100">Package Type & Inclusions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Package Type */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Package Type</Label>
                    <RadioGroup value={packageType} onValueChange={setPackageType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transport-only" id="transport-only" />
                        <Label htmlFor="transport-only" className="text-gray-700 dark:text-gray-300">Transport Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hotel-only" id="hotel-only" />
                        <Label htmlFor="hotel-only" className="text-gray-700 dark:text-gray-300">Hotel Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full-package" id="full-package" />
                        <Label htmlFor="full-package" className="text-gray-700 dark:text-gray-300">Full Package (Includes Hotel + Transport + Sightseeing)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Inclusions */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Inclusions</Label>
                    
                    {/* Sightseeing Required */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block text-gray-900 dark:text-gray-100">Sightseeing Required</Label>
                      <RadioGroup 
                        value={inclusions.sightseeing ? "yes" : "no"} 
                        onValueChange={(value) => setInclusions(prev => ({ ...prev, sightseeing: value === "yes" }))}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="sightseeing-yes" />
                          <Label htmlFor="sightseeing-yes" className="text-gray-700 dark:text-gray-300">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="sightseeing-no" />
                          <Label htmlFor="sightseeing-no" className="text-gray-700 dark:text-gray-300">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Transfer Types */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Transfer Types (Optional)</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">You can select one or both transfer types, or leave unselected if not needed</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="private-transfer"
                            checked={inclusions.transportTypes.includes('private')}
                            onCheckedChange={(checked) => handleTransportTypeChange('private', checked as boolean)}
                          />
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            <div>
                              <Label htmlFor="private-transfer" className="text-gray-700 dark:text-gray-300 font-medium">Private</Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Dedicated vehicle</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="sic-transfer"
                            checked={inclusions.transportTypes.includes('sic')}
                            onCheckedChange={(checked) => handleTransportTypeChange('sic', checked as boolean)}
                          />
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-green-600" />
                            <div>
                              <Label htmlFor="sic-transfer" className="text-gray-700 dark:text-gray-300 font-medium">SIC</Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Shared in Coach</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meal Plan */}
                    <div className="space-y-2">
                      <Label htmlFor="mealPlan" className="text-gray-700 dark:text-gray-300">Meal Plan</Label>
                      <Select value={inclusions.mealPlan} onValueChange={(value) => setInclusions(prev => ({ ...prev, mealPlan: value }))}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="halfboard">Half Board</SelectItem>
                          <SelectItem value="fullboard">Full Board</SelectItem>
                          <SelectItem value="allinclusive">All Inclusive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block text-gray-900 dark:text-gray-100">Accommodation Preferences</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rooms" className="text-gray-700 dark:text-gray-300">Number of Rooms</Label>
                        <Input
                          id="rooms"
                          type="number"
                          min="1"
                          value={hotelDetails.rooms}
                          onChange={(e) => setHotelDetails(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">Hotel Category</Label>
                        <Select value={hotelDetails.category} onValueChange={(value) => setHotelDetails(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                            <SelectItem value="budget">Budget</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="deluxe">Deluxe</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="communicationPreference" className="text-gray-700 dark:text-gray-300">Preferred Communication</Label>
                    <Select value={communicationPreference} onValueChange={setCommunicationPreference}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Budget & Additional Info */}
            <div className="space-y-6">
              {/* Budget Information */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Budget Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minBudget" className="text-gray-700 dark:text-gray-300">Minimum Budget</Label>
                      <Input
                        id="minBudget"
                        type="number"
                        min="0"
                        value={budget.min}
                        onChange={(e) => setBudget(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxBudget" className="text-gray-700 dark:text-gray-300">Maximum Budget</Label>
                      <Input
                        id="maxBudget"
                        type="number"
                        min="0"
                        value={budget.max}
                        onChange={(e) => setBudget(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-gray-700 dark:text-gray-300">Currency</Label>
                      <Select value={budget.currency} onValueChange={(value) => setBudget(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="THB">THB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requests */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-900 dark:text-gray-100">Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {specialRequests.map((request, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={request}
                          onChange={(e) => updateSpecialRequest(index, e.target.value)}
                          placeholder="Enter special request"
                          className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                        {specialRequests.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => removeSpecialRequest(index)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addSpecialRequest} className="w-full">
                      Add Request
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-900 dark:text-gray-100">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes or special requirements..."
                    rows={4}
                    className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </CardContent>
              </Card>

              {/* Query Summary Preview */}
              <Card className="shadow-lg border-blue-200 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20">
                <CardHeader className="pb-3 border-b border-blue-200 dark:border-blue-700">
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Edit3 className="h-5 w-5 text-blue-600" />
                    Preview Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {/* Top Row - Key Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Agent</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedAgentName || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Passengers</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {totalPax} PAX
                        </span>
                      </div>
                    </div>

                    {/* Destination with Nights */}
                    <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1">Destination</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {destination.country ? (
                          cityAllocations.length > 0 ? (
                            cityAllocations.map((allocation: any, index: number) => (
                              <span key={index}>
                                {typeof allocation.city === 'string' ? allocation.city : (allocation.city as any)?.name || (allocation.city as any)?.city || 'City'} {allocation.nights}N
                                {index < cityAllocations.length - 1 ? ' + ' : ''}
                              </span>
                            ))
                          ) : (
                            destination.cities.map((city: any, index: number) => (
                              <span key={index}>
                                {typeof city === 'string' ? city : (city as any)?.name || (city as any)?.city || 'City'} {duration.nights > 0 ? `${Math.floor(duration.nights / destination.cities.length)}N` : ''}
                                {index < destination.cities.length - 1 ? ' + ' : ''}
                              </span>
                            ))
                          )
                        ) : 'Not selected'}
                      </span>
                    </div>

                    {/* Travel Dates & Duration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Travel Dates</span>
                        <span className="text-xs text-gray-900 dark:text-gray-100">
                          {travelDates.from && travelDates.to 
                            ? `${format(travelDates.from, "dd MMM")} - ${format(travelDates.to, "dd MMM yyyy")}`
                            : 'Not selected'}
                        </span>
                      </div>
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Duration</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {duration.days > 0 ? `${duration.days}D/${duration.nights}N` : 'Not calculated'}
                        </span>
                      </div>
                    </div>

                    {/* Package & Budget */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Package</span>
                        <span className="text-xs text-gray-900 dark:text-gray-100 capitalize">
                          {packageType.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Budget</span>
                        <span className="text-xs text-gray-900 dark:text-gray-100">
                          {budget.min > 0 || budget.max > 0 
                            ? `${budget.currency} ${budget.min.toLocaleString()}-${budget.max.toLocaleString()}`
                            : 'Not specified'}
                        </span>
                      </div>
                    </div>

                    {/* Hotel & Communication */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Hotel</span>
                        <span className="text-xs text-gray-900 dark:text-gray-100">
                          {hotelDetails.rooms}R, {hotelDetails.category}
                        </span>
                      </div>
                      <div className="flex flex-col p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Contact</span>
                        <span className="text-xs text-gray-900 dark:text-gray-100 capitalize">{communicationPreference}</span>
                      </div>
                    </div>

                    {/* Inclusions Grid */}
                    <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-blue-200 dark:border-blue-700">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-2">Inclusions</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Sightseeing:</span>
                          <span className="text-gray-900 dark:text-gray-100">{inclusions.sightseeing ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Transfers:</span>
                          <span className="text-gray-900 dark:text-gray-100 capitalize">{inclusions.transfers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Meals:</span>
                          <span className="text-gray-900 dark:text-gray-100 capitalize">{inclusions.mealPlan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Transport:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {inclusions.transportTypes.length > 0 ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {specialRequests.some(req => req.trim() !== '') && (
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Special Requests:</span>
                        <ul className="text-xs space-y-1">
                          {specialRequests.filter(req => req.trim() !== '').map((request, index) => (
                            <li key={index} className="text-gray-900 dark:text-gray-100">• {request}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {notes.trim() !== '' && (
                      <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Additional Notes:</span>
                        <p className="text-xs text-gray-900 dark:text-gray-100">{notes}</p>
                      </div>
                    )}

                    {/* Communication Preference */}
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Communication:</span>
                      <span className="text-gray-900 dark:text-gray-100 capitalize">{communicationPreference}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => navigate('/queries')}>
              Cancel
            </Button>
            <Button type="submit" className="px-8">
              Create Query
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateQuery;
