import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Query } from '@/types/query';
import { useAgentData } from '@/hooks/useAgentData';
import { useToast } from '@/hooks/use-toast';
import { EnqIdGenerator } from '@/utils/enqIdGenerator';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
import { getCountryCodeByName } from '@/utils/countryUtils';

interface QuickCreateQueryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (query: Query) => void;
}

const QuickCreateQuery: React.FC<QuickCreateQueryProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeAgents } = useAgentData();
  const { activeCountries } = useRealTimeCountriesData();
  const { toast } = useToast();
  
  // Form state
  const [agentId, setAgentId] = useState('');
  const [destination, setDestination] = useState({ country: '', cities: [''] });
  const [paxDetails, setPaxDetails] = useState({ adults: 2, children: 0, infants: 0 });
  const [travelDates, setTravelDates] = useState({ from: null as Date | null, to: null as Date | null });
  const [packageType, setPackageType] = useState('full-package');
  const [budget, setBudget] = useState({ min: 0, max: 0, currency: 'USD' });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateQueryId = () => {
    const selectedCountryCode = getCountryCodeByName(destination.country);
    console.log('QuickCreateQuery: Mapped country name to code:', { 
      countryName: destination.country, 
      countryCode: selectedCountryCode 
    });
    
    // Debug: Check localStorage settings
    const savedSettings = localStorage.getItem('applicationSettings');
    console.log('QuickCreateQuery: Current application settings:', savedSettings ? JSON.parse(savedSettings) : 'No settings found');
    
    const enquiryId = EnqIdGenerator.generateEnqId(selectedCountryCode);
    console.log('QuickCreateQuery: Generated enquiry ID:', enquiryId);
    return enquiryId;
  };

  const calculateTripDuration = () => {
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
    
    if (!agentId || !destination.country || !travelDates.from || !travelDates.to) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedAgent = activeAgents.find(agent => agent.id === parseInt(agentId));
      const tripDuration = calculateTripDuration();
      
      const newQuery: Query = {
        id: generateQueryId(),
        agentId: parseInt(agentId),
        agentName: selectedAgent?.name || 'Unknown Agent',
        destination: {
          country: destination.country,
          cities: destination.cities.filter(city => city.trim() !== '')
        },
        paxDetails,
        travelDates: {
          from: travelDates.from!.toISOString(),
          to: travelDates.to!.toISOString(),
          isEstimated: false
        },
        tripDuration,
        packageType,
        specialRequests: [],
        budget,
        status: 'new',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 'medium',
        notes,
        communicationPreference: 'email',
        hotelDetails: {
          rooms: Math.ceil((paxDetails.adults + paxDetails.children) / 2),
          category: 'standard'
        },
        inclusions: {
          sightseeing: true,
          transfers: 'airport',
          mealPlan: 'breakfast'
        }
      };

      // Save to localStorage
      const existingQueries = JSON.parse(localStorage.getItem('travel_queries') || '[]');
      const updatedQueries = [newQuery, ...existingQueries];
      localStorage.setItem('travel_queries', JSON.stringify(updatedQueries));

      // Call success callback
      if (onSuccess) {
        onSuccess(newQuery);
      }

      // Reset form
      setAgentId('');
      setDestination({ country: '', cities: [''] });
      setPaxDetails({ adults: 2, children: 0, infants: 0 });
      setTravelDates({ from: null, to: null });
      setPackageType('full-package');
      setBudget({ min: 0, max: 0, currency: 'USD' });
      setNotes('');

      toast({
        title: "Quick Query Created",
        description: `Enquiry ${newQuery.id} has been created successfully`,
      });

    } catch (error) {
      console.error('Error creating query:', error);
      toast({
        title: "Error",
        description: "Failed to create query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCity = () => {
    setDestination(prev => ({
      ...prev,
      cities: [...prev.cities, '']
    }));
  };

  const updateCity = (index: number, value: string) => {
    setDestination(prev => ({
      ...prev,
      cities: prev.cities.map((city, i) => i === index ? value : city)
    }));
  };

  const removeCity = (index: number) => {
    setDestination(prev => ({
      ...prev,
      cities: prev.cities.filter((_, i) => i !== index)
    }));
  };

  const totalPax = paxDetails.adults + paxDetails.children + paxDetails.infants;
  const duration = calculateTripDuration();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Quick Create Enquiry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Selection */}
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent *</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {activeAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name} - {agent.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <Label className="text-base font-medium">Destination *</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={destination.country} onValueChange={(value) => setDestination(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination country" />
                </SelectTrigger>
                <SelectContent>
                  {activeCountries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cities</Label>
              {destination.cities.map((city, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={city}
                    onChange={(e) => updateCity(index, e.target.value)}
                    placeholder="Enter city name"
                    className="flex-1"
                  />
                  {destination.cities.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCity(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addCity} className="w-full">
                Add City
              </Button>
            </div>
          </div>

          {/* Travel Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Passenger Details</Label>
              <div className="space-y-2">
                <Label htmlFor="adults">Adults *</Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  value={paxDetails.adults}
                  onChange={(e) => setPaxDetails(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={paxDetails.children}
                  onChange={(e) => setPaxDetails(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infants">Infants</Label>
                <Input
                  id="infants"
                  type="number"
                  min="0"
                  value={paxDetails.infants}
                  onChange={(e) => setPaxDetails(prev => ({ ...prev, infants: parseInt(e.target.value) || 0 }))}
                />
              </div>
              {totalPax > 0 && (
                <div className="text-sm text-blue-600 font-medium">
                  Total PAX: {totalPax}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Travel Dates *</Label>
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !travelDates.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {travelDates.from ? format(travelDates.from, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={travelDates.from}
                      onSelect={(date) => setTravelDates(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !travelDates.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {travelDates.to ? format(travelDates.to, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={travelDates.to}
                      onSelect={(date) => setTravelDates(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {duration.days > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Duration: {duration.days}D/{duration.nights}N
                </div>
              )}
            </div>
          </div>

          {/* Package Type & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packageType">Package Type</Label>
              <Select value={packageType} onValueChange={setPackageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transport-only">Transport Only</SelectItem>
                  <SelectItem value="hotel-only">Hotel Only</SelectItem>
                  <SelectItem value="full-package">Full Package</SelectItem>
                  <SelectItem value="luxury">Luxury Package</SelectItem>
                  <SelectItem value="business">Business Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Budget Range
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={budget.min || ''}
                  onChange={(e) => setBudget(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={budget.max || ''}
                  onChange={(e) => setBudget(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                />
                <Select value={budget.currency} onValueChange={(value) => setBudget(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={3}
            />
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {isSubmitting ? 'Creating...' : 'Create Quick Enquiry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCreateQuery;
