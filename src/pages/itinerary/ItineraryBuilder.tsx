
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HotelSelectionCard } from '@/components/proposal/itinerary/HotelSelectionCard';
import { 
  CalendarRange, Map, Plus, Hotel, Car, Landmark, Utensils, 
  ArrowRight, Download, Share2, Calculator, Sparkles, MapPin, Users
} from 'lucide-react';

interface ItineraryDay {
  id: string;
  day: number;
  city: string;
  country: string;
  hotels: any[];
  activities: any[];
  transport: any[];
  totalCost: number;
}

interface TripDetails {
  destination: string;
  country: string;
  cities: string[];
  startDate: string;
  endDate: string;
  days: number;
  nights: number;
  adults: number;
  children: number;
  budget: {
    min: number;
    max: number;
  };
}

const ItineraryBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    destination: '',
    country: '',
    cities: [],
    startDate: '',
    endDate: '',
    days: 0,
    nights: 0,
    adults: 2,
    children: 0,
    budget: { min: 0, max: 0 }
  });
  
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Sample cities for demonstration
  const availableCities = ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi'];
  const availableCountries = ['Thailand', 'Vietnam', 'Malaysia', 'Singapore', 'Indonesia'];

  const handleTripDetailsChange = (field: keyof TripDetails, value: any) => {
    setTripDetails(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate days when dates change
    if (field === 'startDate' || field === 'endDate') {
      const start = new Date(field === 'startDate' ? value : tripDetails.startDate);
      const end = new Date(field === 'endDate' ? value : tripDetails.endDate);
      
      if (start && end && end > start) {
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const nights = days - 1;
        
        setTripDetails(prev => ({
          ...prev,
          days,
          nights
        }));

        // Generate initial itinerary structure
        generateItineraryDays(days);
      }
    }
  };

  const generateItineraryDays = (numDays: number) => {
    const days: ItineraryDay[] = [];
    
    for (let i = 1; i <= numDays; i++) {
      days.push({
        id: `day-${i}`,
        day: i,
        city: selectedCity || availableCities[0],
        country: tripDetails.country || 'Thailand',
        hotels: [],
        activities: [],
        transport: [],
        totalCost: 0
      });
    }
    
    setItineraryDays(days);
  };

  const handleHotelSelect = (hotelData: any) => {
    setItineraryDays(prev => {
      const updated = [...prev];
      
      // Add hotel to multiple days based on night selection
      for (let day = hotelData.startDay; day <= hotelData.endDay; day++) {
        const dayIndex = day - 1;
        if (dayIndex >= 0 && dayIndex < updated.length) {
          // Remove existing hotels for these days first
          updated[dayIndex].hotels = updated[dayIndex].hotels.filter(
            (h: any) => h.hotel.id !== hotelData.hotel.id
          );
          
          // Add the new hotel
          updated[dayIndex].hotels.push({
            ...hotelData,
            daySpecific: {
              isFirstNight: day === hotelData.startDay,
              isLastNight: day === hotelData.endDay,
              nightNumber: day - hotelData.startDay + 1
            }
          });

          // Update total cost for the day
          updated[dayIndex].totalCost = updated[dayIndex].hotels.reduce(
            (sum: number, hotel: any) => sum + (hotel.totalPrice / hotel.selection.numberOfNights), 
            0
          );
        }
      }
      
      return updated;
    });
  };

  const getTotalItineraryCost = () => {
    return itineraryDays.reduce((sum, day) => sum + day.totalCost, 0);
  };

  return (
    <PageLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI Itinerary Builder</h1>
            <p className="text-muted-foreground">Create custom travel itineraries with real-time pricing</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Itinerary
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="builder">
              <Sparkles className="mr-2 h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <CalendarRange className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="costs">
              <Calculator className="mr-2 h-4 w-4" />
              Costs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6 pt-4">
            {/* Trip Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Country</label>
                      <Select 
                        value={tripDetails.country} 
                        onValueChange={(value) => handleTripDetailsChange('country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCountries.map(country => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Travel Dates</label>
                      <div className="flex gap-2">
                        <Input 
                          type="date" 
                          value={tripDetails.startDate}
                          onChange={(e) => handleTripDetailsChange('startDate', e.target.value)}
                        />
                        <ArrowRight className="h-4 w-4 self-center" />
                        <Input 
                          type="date" 
                          value={tripDetails.endDate}
                          onChange={(e) => handleTripDetailsChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Travelers</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs">Adults</label>
                          <Input 
                            type="number" 
                            min={1} 
                            value={tripDetails.adults}
                            onChange={(e) => handleTripDetailsChange('adults', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-xs">Children</label>
                          <Input 
                            type="number" 
                            min={0} 
                            value={tripDetails.children}
                            onChange={(e) => handleTripDetailsChange('children', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    {tripDetails.days > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                        <div className="text-sm">
                          <strong>Trip Duration:</strong> {tripDetails.days} days, {tripDetails.nights} nights
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Selection */}
            {itineraryDays.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5" />
                    Hotel Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm font-medium">Select City</label>
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose city for hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Starting Day</label>
                      <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {itineraryDays.map(day => (
                            <SelectItem key={day.day} value={day.day.toString()}>
                              Day {day.day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedCity && (
                    <HotelSelectionCard
                      city={selectedCity}
                      country={tripDetails.country}
                      dayNumber={selectedDay}
                      onHotelSelect={handleHotelSelect}
                      query={{
                        paxDetails: {
                          adults: tripDetails.adults,
                          children: tripDetails.children
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Itinerary Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {itineraryDays.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Set up trip details first to view timeline</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itineraryDays.map(day => (
                      <Card key={day.id} className={day.hotels.length > 0 ? 'border-green-200 bg-green-50/30' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Day {day.day}</Badge>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-sm font-medium">{day.city}</span>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              ${day.totalCost.toFixed(2)}
                            </div>
                          </div>
                          
                          {day.hotels.length > 0 ? (
                            <div className="space-y-2">
                              {day.hotels.map((hotel, idx) => (
                                <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-md border">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Hotel className="h-4 w-4 text-primary" />
                                      <span className="font-medium">{hotel.hotel.name}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {hotel.selection.roomType}
                                      </Badge>
                                    </div>
                                    <div className="text-sm">
                                      Night {hotel.daySpecific.nightNumber} of {hotel.selection.numberOfNights}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {hotel.selection.numberOfRooms} room(s) • ${(hotel.totalPrice / hotel.selection.numberOfNights).toFixed(2)} per night
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No hotels selected for this day
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Hotel className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">
                          ${itineraryDays.reduce((sum, day) => sum + day.totalCost, 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Hotels</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold">
                          ${(getTotalItineraryCost() / (tripDetails.adults + tripDetails.children)).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Per Person</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <CalendarRange className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold">
                          ${tripDetails.nights > 0 ? (getTotalItineraryCost() / tripDetails.nights).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-muted-foreground">Per Night</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ItineraryBuilder;
