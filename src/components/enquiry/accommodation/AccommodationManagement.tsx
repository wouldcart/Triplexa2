import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hotel, Plus, Edit, Trash2, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { Query } from '@/types/query';
import { CentralItinerary } from '@/types/itinerary';
import { extractAccommodationsFromDays } from '@/utils/accommodationUtils';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { useAccommodationMarkupIntegration } from '@/hooks/useAccommodationMarkupIntegration';

interface AccommodationManagementProps {
  query: Query;
  accommodations: any[];
  onUpdate: (accommodations: any[]) => void;
}

const AccommodationManagement: React.FC<AccommodationManagementProps> = ({
  query,
  accommodations,
  onUpdate
}) => {
  const [itineraryData, setItineraryData] = useState<CentralItinerary | null>(null);
  const [selectedAccommodations, setSelectedAccommodations] = useState<any[]>(accommodations);
  const [activeTab, setActiveTab] = useState('itinerary');
  
  // Integrate with markup persistence system
  const { updateAccommodationSelection, syncAccommodationData, importFromDayWiseItinerary } = useAccommodationMarkupIntegration(query.id, 'daywise');

  useEffect(() => {
    // Load itinerary data from Itinerary Builder
    loadItineraryData();
    // Trigger sync to import from day-wise if needed
    syncAccommodationData();
  }, [query.id, syncAccommodationData]);

  const loadItineraryData = () => {
    try {
      // Try to load from various possible storage keys
      const keys = [
        `itinerary_${query.id}`,
        `proposal_itinerary_${query.id}`,
        `central_itinerary_${query.id}`
      ];
      
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          setItineraryData(parsed);
          
          // Extract accommodations from itinerary
          if (parsed.days) {
            const extracted = extractAccommodationsFromDays(parsed.days);
            if (extracted.option1.length > 0) {
              setSelectedAccommodations(extracted.option1);
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error loading itinerary data:', error);
    }
  };

  const handleAddAccommodation = (accommodation: any) => {
    const newAccommodations = [...selectedAccommodations, {
      ...accommodation,
      id: Date.now().toString(),
      selected: true
    }];
    setSelectedAccommodations(newAccommodations);
    onUpdate(newAccommodations);
    
    // Update markup system as well
    updateAccommodationSelection(newAccommodations);
    
    toast.success('Accommodation added to proposal');
  };

  const handleRemoveAccommodation = (accommodationId: string) => {
    const filtered = selectedAccommodations.filter(acc => acc.id !== accommodationId);
    setSelectedAccommodations(filtered);
    onUpdate(filtered);
    
    // Update markup system as well
    updateAccommodationSelection(filtered);
    
    toast.success('Accommodation removed from proposal');
  };

  const renderAccommodationCard = (accommodation: any, isSelected: boolean = false) => (
    <Card key={accommodation.id} className={`${isSelected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Hotel className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">{accommodation.name}</h4>
              <Badge variant="secondary">{accommodation.type}</Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{accommodation.location?.city}, {accommodation.location?.country}</span>
              </div>
              
              {accommodation.checkIn && accommodation.checkOut && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(accommodation.checkIn).toLocaleDateString()} - 
                    {new Date(accommodation.checkOut).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {accommodation.price && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">{formatCurrency(accommodation.price)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSelected ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveAccommodation(accommodation.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddAccommodation(accommodation)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getItineraryAccommodations = () => {
    if (!itineraryData?.days) return [];
    
    return itineraryData.days
      .filter(day => day.accommodation)
      .map(day => ({
        ...day.accommodation,
        dayNumber: day.day,
        date: day.date
      }));
  };

  const itineraryAccommodations = getItineraryAccommodations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Hotel className="h-5 w-5 text-primary" />
            Accommodation Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Load accommodations from Itinerary Builder or manage them manually
          </p>
        </div>
        <Badge variant="outline">
          {selectedAccommodations.length} selected
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="itinerary">From Itinerary Builder</TabsTrigger>
          <TabsTrigger value="selected">Selected ({selectedAccommodations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary" className="space-y-4">
          {itineraryAccommodations.length > 0 ? (
            <div className="grid gap-4">
              {itineraryAccommodations.map(accommodation => 
                renderAccommodationCard(accommodation, false)
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No accommodations found</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  No accommodation data found from the Itinerary Builder for this enquiry.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={loadItineraryData}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Refresh from Itinerary Builder
                  </Button>
                  <Button
                    variant="default"
                    onClick={importFromDayWiseItinerary}
                    className="flex items-center gap-2"
                  >
                    <Hotel className="h-4 w-4" />
                    Import from Day-wise
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="selected" className="space-y-4">
          {selectedAccommodations.length > 0 ? (
            <div className="grid gap-4">
              {selectedAccommodations.map(accommodation => 
                renderAccommodationCard(accommodation, true)
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No accommodations selected</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select accommodations from the itinerary builder to include in your proposal.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('itinerary')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Browse Accommodations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary */}
      {selectedAccommodations.length > 0 && (
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Accommodation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{selectedAccommodations.length}</div>
                <div className="text-sm text-muted-foreground">Hotels Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedAccommodations.reduce((sum, acc) => sum + (acc.price || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {query.tripDuration.nights}
                </div>
                <div className="text-sm text-muted-foreground">Total Nights</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccommodationManagement;