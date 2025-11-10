
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Save, ArrowLeft, Users, MapPin, DollarSign, User, FileText, Plus, X, CheckCircle } from 'lucide-react';
import { AgentSelector as EnhancedAgentSelector } from '@/pages/queries/components/AgentSelector';
import { useSupabaseAgentsList } from '@/hooks/useSupabaseAgentsList';
import { toNumericAgentId } from '@/utils/supabaseAgentIds';
import { Query } from '@/types/query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, calculateTripDuration } from '@/utils/currencyUtils';
import { EnqIdGenerator } from '@/utils/enqIdGenerator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CountryCitySelector } from '@/pages/queries/components/CountryCitySelector';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
import { getCountryCodeByName } from '@/utils/countryUtils';
import ProposalService from '@/services/proposalService';
import { createEnquiry, updateEnquiry } from '@/services/enquiriesService';

interface EnquiryFormProps {
  mode: 'create' | 'edit';
  enquiryId?: string;
  onSave?: (enquiry: Query) => void;
}

const EnquiryForm: React.FC<EnquiryFormProps> = ({ mode, enquiryId, onSave }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);
  const [currentRequest, setCurrentRequest] = useState('');
  const [destination, setDestination] = useState<{ country: string; cities: string[] }>({ country: '', cities: [] });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<Query>();

  // Load real agents from Supabase for name resolution on selection
  const { agents: supabaseAgents } = useSupabaseAgentsList();

  // Load existing enquiry data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && enquiryId) {
      loadEnquiryData(enquiryId);
    }
  }, [mode, enquiryId]);

  const loadEnquiryData = async (id: string) => {
    try {
      setLoading(true);
      console.log('Loading enquiry data (async) for editing:', id);
      
      const enquiry = await ProposalService.getQueryByIdAsync(id);
      
      if (enquiry) {
        // Reset form with enquiry data
        reset(enquiry);
        
        // Set date objects for the date pickers
        if (enquiry.travelDates?.from) {
          setFromDate(new Date(enquiry.travelDates.from));
        }
        if (enquiry.travelDates?.to) {
          setToDate(new Date(enquiry.travelDates.to));
        }
        
        // Set special requests if they exist
        if (enquiry.specialRequests && Array.isArray(enquiry.specialRequests)) {
          setSpecialRequests(enquiry.specialRequests);
        }
        
        // Set destination state
        if (enquiry.destination) {
          setDestination({
            country: enquiry.destination.country || '',
            cities: enquiry.destination.cities || []
          });
        }
        
        // Set select values manually as reset doesn't always work with selects
        setTimeout(() => {
          setValue('packageType', enquiry.packageType);
          setValue('priority', enquiry.priority);
          setValue('communicationPreference', enquiry.communicationPreference);
          setValue('budget.currency', enquiry.budget?.currency || 'USD');
          setValue('hotelDetails.category', enquiry.hotelDetails?.category || 'standard');
          setValue('hotelDetails.rooms', enquiry.hotelDetails?.rooms || 1);
          setValue('inclusions.transfers', enquiry.inclusions?.transfers || 'airport');
          setValue('inclusions.mealPlan', enquiry.inclusions?.mealPlan || 'breakfast');
          setValue('inclusions.sightseeing', enquiry.inclusions?.sightseeing !== false);
          setValue('destination.country', enquiry.destination?.country || '');
          setValue('destination.cities', enquiry.destination?.cities || []);
          setValue('agentName', enquiry.agentName || '');
          // Prefill agent: prefer Supabase UUID mapped to numeric for selector
          const numericAgentId = enquiry.agentUuid
            ? toNumericAgentId(enquiry.agentUuid)
            : (typeof enquiry.agentId === 'number' ? enquiry.agentId : 0);
          setValue('agentUuid', enquiry.agentUuid || '');
          setValue('agentId', numericAgentId);
          setValue('paxDetails.adults', enquiry.paxDetails?.adults || 0);
          setValue('paxDetails.children', enquiry.paxDetails?.children || 0);
          setValue('paxDetails.infants', enquiry.paxDetails?.infants || 0);
          setValue('budget.min', enquiry.budget?.min || 0);
          setValue('budget.max', enquiry.budget?.max || 0);
          setValue('notes', enquiry.notes || '');
          setValue('travelDates.isEstimated', enquiry.travelDates?.isEstimated || false);
        }, 100);
        
      } else {
        console.warn('Enquiry not found (async):', id);
        toast({
          title: "Enquiry not found",
          description: "The requested enquiry could not be loaded.",
          variant: "destructive"
        });
        navigate('/queries');
      }
    } catch (error) {
      console.error('Error loading enquiry (async):', error);
      toast({
        title: "Error loading enquiry",
        description: "Failed to load enquiry data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<Query>) => {
    if (!fromDate || !toDate) {
      toast({
        title: "Validation Error",
        description: "Please select travel dates.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const tripDuration = calculateTripDuration(
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      );

      // Use destination state for cities
      const cities = destination.cities;
      // Map selected country name to code for enquiry ID generation using robust mapping
      const selectedCountryCode = getCountryCodeByName(destination.country);
      console.log('EnquiryForm: Mapped country name to code:', { 
        countryName: destination.country, 
        countryCode: selectedCountryCode 
      });
      // Ensure Supabase-backed enquiry configuration and country validation are ready
      await EnqIdGenerator.prepareConfig(selectedCountryCode);

      const enquiryData: Query = {
        id: mode === 'create' ? EnqIdGenerator.generateEnqId(selectedCountryCode) : enquiryId!,
        agentId: data.agentId || 0,
        agentName: data.agentName || '',
        agentUuid: (data as any).agentUuid || '',
        destination: {
          country: destination.country,
          cities: destination.cities
        },
        paxDetails: {
          adults: data.paxDetails?.adults || 0,
          children: data.paxDetails?.children || 0,
          infants: data.paxDetails?.infants || 0
        },
        travelDates: {
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0],
          isEstimated: !!(data.travelDates?.isEstimated)
        },
        tripDuration,
        packageType: data.packageType || 'full-package',
        specialRequests: specialRequests,
        budget: {
          min: data.budget?.min || 0,
          max: data.budget?.max || 0,
          currency: data.budget?.currency || 'USD'
        },
        status: data.status || 'new',
        assignedTo: data.assignedTo || null,
        createdAt: mode === 'create' ? new Date().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: data.priority || 'normal',
        notes: data.notes || '',
        communicationPreference: data.communicationPreference || 'email',
        hotelDetails: data.hotelDetails || { rooms: 1, category: 'standard' },
        inclusions: data.inclusions || {
          sightseeing: true,
          transfers: 'airport',
          mealPlan: 'breakfast'
        }
      };

      // Persist to Supabase (create or update)
      if (mode === 'create') {
        const { data: created, error } = await createEnquiry(enquiryData);
        if (error) throw error;
      } else {
        const { error } = await updateEnquiry(enquiryData.id, enquiryData);
        if (error) throw error;
      }

      toast({
        title: mode === 'create' ? "Enquiry Created" : "Enquiry Updated",
        description: `Enquiry ${enquiryData.id} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`
      });

      if (onSave) {
        onSave(enquiryData);
      }

      // Navigate to the details page after successful save
      navigate(`/queries/${encodeURIComponent(enquiryData.id)}`);
    } catch (error) {
      console.error('Error saving enquiry:', error);
      toast({
        title: "Error",
        description: `Failed to ${mode} enquiry. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cities = e.target.value.split(',').map(city => city.trim()).filter(city => city);
    setValue('destination.cities', cities);
  };

  const addSpecialRequest = () => {
    if (currentRequest.trim()) {
      setSpecialRequests(prev => [...prev, currentRequest.trim()]);
      setCurrentRequest('');
    }
  };

  const removeSpecialRequest = (index: number) => {
    setSpecialRequests(prev => prev.filter((_, i) => i !== index));
  };

  const getPreviewData = () => {
    const formData = watch();
    const paxCount = (formData.paxDetails?.adults || 0) + (formData.paxDetails?.children || 0) + (formData.paxDetails?.infants || 0);
    const fromStr = fromDate ? format(fromDate, 'dd/MM/yyyy') : '';
    const toStr = toDate ? format(toDate, 'dd/MM/yyyy') : '';
    const isEstimated = !!formData.travelDates?.isEstimated;
    const durationObj = fromDate && toDate ? calculateTripDuration(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]) : { days: 0 } as any;
    return {
      agent: formData.agentName || 'Not selected',
      passengers: `${paxCount} PAX`,
      destination: destination.country || 'Not selected',
      cities: destination.cities.length > 0 ? destination.cities.join(', ') : 'No cities selected',
      dates: fromStr && toStr ? `${fromStr} → ${toStr}${isEstimated ? ' (estimated)' : ''}` : 'Not selected',
      duration: durationObj.days ? `${durationObj.days} days` : 'Not calculated',
      budget: (formData.budget?.min || 0) || formData.budget?.max
        ? `${formatCurrency(formData.budget?.min || 0)} — ${formatCurrency(formData.budget?.max || 0)} ${formData.budget?.currency || 'USD'}`
        : 'Not specified',
      package: formData.packageType || 'Full Package',
      hotel: `${formData.hotelDetails?.rooms || 1} room, ${formData.hotelDetails?.category || 'standard'}`,
      contact: formData.communicationPreference || 'Email',
      notes: (formData.notes || '').trim(),
      inclusions: {
        sightseeing: formData.inclusions?.sightseeing !== false,
        transfers: formData.inclusions?.transfers || 'Airport',
        mealPlan: formData.inclusions?.mealPlan || 'Not selected'
      }
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="w-full max-w-none px-3 sm:px-4 lg:max-w-7xl lg:mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/queries')} className="self-start">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Queries
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {mode === 'create' ? 'Create New Query' : `Edit Query ${enquiryId}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Fill in the details to create a new travel query
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {(watch('paxDetails.adults') || 0) + (watch('paxDetails.children') || 0) + (watch('paxDetails.infants') || 0)} PAX
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-none px-3 sm:px-4 lg:max-w-7xl lg:mx-auto lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 py-4 lg:py-6">{/* Main Form */}
          <div className="lg:col-span-3">{/* Form Content */}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Agent Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                   <div>
                     <Label htmlFor="agentName">Select Agent *</Label>
                     <EnhancedAgentSelector
                       value={watch('agentId')?.toString() || ''}
                       onValueChange={(agentId) => {
                         const id = parseInt(agentId);
                         setValue('agentId', id);
                         // Prefer Supabase agents to set real agent name; fall back to enhanced data
                         const match = supabaseAgents.find(a => toNumericAgentId(a.id) === id);
                         if (match) {
                           setValue('agentName', match.name);
                           setValue('agentUuid', match.id);
                         } else {
                           import('@/hooks/useEnhancedAgentData').then(({ useEnhancedAgentData }) => {
                             const { getAgentById } = useEnhancedAgentData(enquiryId);
                             const agent = getAgentById(id);
                             if (agent) {
                               setValue('agentName', agent.name);
                             }
                           });
                         }
                       }}
                       placeholder="Search and select an agent..."
                       queryId={enquiryId}
                     />
                     {errors.agentName && (
                       <p className="text-sm text-red-500 mt-1">{errors.agentName.message}</p>
                     )}
                   </div>
                 </CardContent>
              </Card>

              {/* Budget Range */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Budget Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="minBudget">Minimum Budget</Label>
                      <Input
                        id="minBudget"
                        type="number"
                        min="0"
                        {...register('budget.min', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxBudget">Maximum Budget</Label>
                      <Input
                        id="maxBudget"
                        type="number"
                        min="0"
                        {...register('budget.max', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        onValueChange={(value) => setValue('budget.currency', value)}
                        defaultValue={watch('budget.currency')}
                        value={watch('budget.currency')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="THB">THB</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destination Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Travel Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Passenger Details */}
                  <div>
                    <Label className="text-base font-medium">Passenger Details</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="adults">Adults *</Label>
                        <Input
                          id="adults"
                          type="number"
                          min="1"
                          defaultValue="2"
                          {...register('paxDetails.adults', { valueAsNumber: true })}
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="children">Children</Label>
                        <Input
                          id="children"
                          type="number"
                          min="0"
                          {...register('paxDetails.children', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="infants">Infants</Label>
                        <Input
                          id="infants"
                          type="number"
                          min="0"
                          {...register('paxDetails.infants', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Travel Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Departure Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !fromDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? format(fromDate, "dd/MM/yyyy") : "Select departure date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Return Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !toDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? format(toDate, "dd/MM/yyyy") : "Select return date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                  </div>
                </div>
                {/* Estimated Dates Toggle (moved from Budget to Travel Information) */}
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="isEstimated">Dates are estimated</Label>
                  <Switch
                    id="isEstimated"
                    checked={!!watch('travelDates.isEstimated')}
                    onCheckedChange={(checked) => setValue('travelDates.isEstimated', !!checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Toggle if travel dates are tentative.</p>
              </CardContent>
            </Card>

              {/* Package Type & Inclusions */}
              <Card>
                <CardHeader>
                  <CardTitle>Package Type & Inclusions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Package Type */}
                  <div>
                    <Label className="text-base font-medium">Package Type</Label>
                    <RadioGroup 
                      defaultValue="full-package" 
                      className="mt-2"
                      onValueChange={(value) => setValue('packageType', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transport-only" id="transport-only" />
                        <Label htmlFor="transport-only">Transport Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hotel-only" id="hotel-only" />
                        <Label htmlFor="hotel-only">Hotel Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full-package" id="full-package" />
                        <Label htmlFor="full-package">Full Package (Includes Hotel + Transport + Sightseeing)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Inclusions */}
                  <div>
                    <Label className="text-base font-medium">Inclusions</Label>
                    <div className="mt-2">
                      <Label>Sightseeing Required</Label>
                      <RadioGroup 
                        defaultValue="yes" 
                        className="mt-1"
                        onValueChange={(value) => setValue('inclusions.sightseeing', value === 'yes')}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="sightseeing-yes" />
                          <Label htmlFor="sightseeing-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="sightseeing-no" />
                          <Label htmlFor="sightseeing-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Transfer Types */}
                  <div>
                    <Label className="text-base font-medium">Transfer Types (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">You can select one or both transfer types, or leave unselected if not needed</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox id="private" />
                        <div>
                          <Label htmlFor="private" className="font-medium">Private</Label>
                          <p className="text-sm text-muted-foreground">Dedicated vehicle</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox id="sic" />
                        <div>
                          <Label htmlFor="sic" className="font-medium">SIC</Label>
                          <p className="text-sm text-muted-foreground">Shared in Coach</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meal Plan */}
                  <div>
                    <Label htmlFor="mealPlan">Meal Plan</Label>
                    <Select 
                      value={watch('inclusions.mealPlan') || 'breakfast'}
                      onValueChange={(value) => setValue('inclusions.mealPlan', value)}
                      defaultValue="breakfast"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="half-board">Half Board</SelectItem>
                        <SelectItem value="full-board">Full Board</SelectItem>
                        <SelectItem value="all-inclusive">All Inclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Accommodation Preferences */}
                  <div>
                    <Label className="text-base font-medium">Accommodation Preferences</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="rooms">Number of Rooms</Label>
                        <Input
                          id="rooms"
                          type="number"
                          min="1"
                          defaultValue="1"
                          {...register('hotelDetails.rooms', { valueAsNumber: true })}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotelCategory">Hotel Category</Label>
                        <Select 
                          value={watch('hotelDetails.category') || 'standard'}
                          onValueChange={(value) => setValue('hotelDetails.category', value)}
                          defaultValue="standard"
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select hotel category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="deluxe">Deluxe</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Communication */}
                  <div>
                    <Label htmlFor="communicationPreference">Preferred Communication</Label>
                    <Select 
                      value={watch('communicationPreference') || 'email'}
                      onValueChange={(value) => setValue('communicationPreference', value)}
                      defaultValue="email"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select communication preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Special Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={currentRequest}
                      onChange={(e) => setCurrentRequest(e.target.value)}
                      placeholder="Enter special request"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialRequest())}
                    />
                    <Button type="button" onClick={addSpecialRequest} size="sm">
                      Add Request
                    </Button>
                  </div>
                  {specialRequests.length > 0 && (
                    <div className="space-y-2">
                      {specialRequests.map((request, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="text-sm">{request}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecialRequest(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...register('notes')}
                    placeholder="Any additional notes or special requirements..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/queries')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="min-w-[140px]">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (mode === 'create' ? 'Create Query' : 'Update Query')}
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Preview Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const preview = getPreviewData();
                    return (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Agent</span>
                            <span className="text-sm font-medium">{preview.agent}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Passengers</span>
                            <span className="text-sm font-medium">{preview.passengers}</span>
                          </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-muted-foreground">Destination</span>
                             <span className="text-sm font-medium">{preview.destination}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-muted-foreground">Cities</span>
                             <span className="text-sm font-medium text-right">{preview.cities}</span>
                           </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Travel Dates</span>
                            <span className="text-sm font-medium">{preview.dates}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Duration</span>
                            <span className="text-sm font-medium">{preview.duration}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Package</span>
                            <span className="text-sm font-medium">{preview.package}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Budget</span>
                            <span className="text-sm font-medium">{preview.budget}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Hotel</span>
                            <span className="text-sm font-medium">{preview.hotel}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Contact</span>
                            <span className="text-sm font-medium">{preview.contact}</span>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Inclusions</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              {preview.inclusions.sightseeing ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <X className="h-3 w-3 text-red-600" />
                              )}
                              <span>Sightseeing</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>Transfers: {preview.inclusions.transfers}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>Meal Plan: {preview.inclusions.mealPlan}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Communication:</h4>
                          <Badge variant="outline" className="text-xs">{preview.contact}</Badge>
                        </div>

                        <Separator />

                        {/* Notes Preview */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Notes</h4>
                          {preview.notes ? (
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap border rounded-md p-2 bg-muted/30">
                              {preview.notes}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">No notes provided.</div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryForm;
