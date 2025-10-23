import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarRange, Map, Plus, Hotel, Car, Landmark, Utensils, 
  ArrowRight, Download, Share2, Calculator, Sparkles, Save,
  MapPin, Clock, DollarSign, Users, Globe, RefreshCw
} from 'lucide-react';
import { useItineraryContext } from '@/contexts/ItineraryContext';
import { ItineraryGenerationRequest } from '@/types/itinerary';
import { ItineraryService } from '@/services/itineraryService';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import { formatCurrency } from '@/lib/formatters';
import ItineraryGenerationForm from './ItineraryGenerationForm';
import ItineraryTimeline from './ItineraryTimeline';
import ItineraryCostBreakdown from './ItineraryCostBreakdown';

interface CentralItineraryBuilderProps {
  context: 'query' | 'proposal' | 'package';
  contextId?: string;
  onItineraryChange?: (itinerary: any) => void;
  onSave?: (itinerary: any) => void;
}

const CentralItineraryBuilder: React.FC<CentralItineraryBuilderProps> = ({
  context,
  contextId,
  onItineraryChange,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState('generator');
  const { hotels, sightseeing, restaurants, transportRoutes, cities, countries } = useInventoryData();
  
  const {
    itinerary,
    isLoading,
    error,
    updateItinerary,
    updateDay,
    addDay,
    removeDay,
    clearItinerary,
    saveItinerary,
  } = useItineraryContext();

  // Set inventory data for the service
  useEffect(() => {
    ItineraryService.setInventoryData({
      hotels,
      sightseeing,
      restaurants,
      transportRoutes,
    });
  }, [hotels, sightseeing, restaurants, transportRoutes]);

  // Notify parent of itinerary changes
  useEffect(() => {
    if (itinerary && onItineraryChange) {
      onItineraryChange(itinerary);
    }
  }, [itinerary, onItineraryChange]);

  const handleGenerateItinerary = async (request: ItineraryGenerationRequest) => {
    try {
      const newItinerary = await ItineraryService.generateItinerary({
        ...request,
        context,
        contextId,
      });
      
      updateItinerary(newItinerary);
    } catch (error) {
      console.error('Error generating itinerary:', error);
    }
  };

  const handleSave = async () => {
    if (itinerary) {
      if (onSave) {
        onSave(itinerary);
      } else {
        await saveItinerary();
      }
    }
  };

  const exportItinerary = (format: 'pdf' | 'excel') => {
    if (!itinerary) return;
    
    console.log(`Exporting itinerary as ${format}:`, itinerary);
  };

  // Convert cities to the expected format
  const convertedCities = cities.map(city => ({
    id: String(city.id),
    name: city.name,
    country: city.country,
  }));

  const getContextTitle = () => {
    switch (context) {
      case 'query':
        return 'Query Itinerary Builder';
      case 'proposal':
        return 'Proposal Itinerary Builder';
      case 'package':
        return 'Package Itinerary Builder';
      default:
        return 'AI Itinerary Builder';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'query':
        return 'Create a detailed itinerary for customer inquiry';
      case 'proposal':
        return 'Build a comprehensive proposal with real-time pricing';
      case 'package':
        return 'Design a reusable travel package template';
      default:
        return 'Create custom travel itineraries with AI assistance';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {getContextTitle()}
            {itinerary && (
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Real-time
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">{getContextDescription()}</p>
        </div>
        
        <div className="flex gap-2">
          {itinerary && (
            <>
              <Button variant="outline" onClick={() => exportItinerary('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
          <Button onClick={clearItinerary} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Itinerary
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="generator">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="timeline" disabled={!itinerary}>
            <CalendarRange className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="costs" disabled={!itinerary}>
            <Calculator className="mr-2 h-4 w-4" />
            Costs & Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6 pt-4">
          <ItineraryGenerationForm
            onGenerate={handleGenerateItinerary}
            isGenerating={isLoading}
            countries={countries}
            cities={convertedCities}
            context={context}
          />

          {itinerary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated Itinerary Overview</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{itinerary.status}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last updated: {new Date(itinerary.updatedAt).toLocaleTimeString()}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {itinerary.duration.days} days, {itinerary.duration.nights} nights
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {itinerary.preferences.travelers.adults} adults
                      {itinerary.preferences.travelers.children > 0 && 
                        `, ${itinerary.preferences.travelers.children} children`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatCurrency(itinerary.pricing.finalPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Destinations:</h4>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.destinations.map((dest) => (
                      <Badge key={dest.id} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {dest.city}, {dest.country}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <ScrollArea className="h-48">
                    {itinerary.days.map((day) => (
                      <div key={day.id} className="flex items-center justify-between p-3 border rounded mb-2">
                        <div>
                          <div className="font-medium">Day {day.day} - {typeof day.location === 'string' ? day.location : day.location?.city || day.location?.name || 'Location'}</div>
                          <div className="text-sm text-muted-foreground">
                            {day.activities.length} activities • {day.meals.length} meals
                            {day.accommodation && ' • Accommodation included'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(day.totalCost)}</div>
                          <div className="text-xs text-muted-foreground">per day</div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 pt-4">
          {itinerary && (
            <ItineraryTimeline
              itinerary={itinerary}
              onUpdateDay={updateDay}
              onAddDay={addDay}
              onRemoveDay={removeDay}
              context={context}
            />
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-4 pt-4">
          {itinerary && (
            <ItineraryCostBreakdown
              itinerary={itinerary}
              onUpdatePricing={(pricing) => updateItinerary({ pricing })}
              context={context}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CentralItineraryBuilder;
