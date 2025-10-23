
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'react-router-dom';
import { Query } from '@/types/query';
import { getQueryById } from '@/data/queryData';
import { PricingService } from '@/services/pricingService';
import { formatCurrency } from '@/lib/formatters';
import { useRealTimeItinerary } from '@/hooks/useRealTimeItinerary';
import { ItineraryProvider } from '@/contexts/ItineraryContext';
import { 
  Car, Hotel, Landmark, Utensils, Plus, Settings, 
  Users, Calendar, MapPin, DollarSign, Calculator,
  RefreshCw, Activity
} from 'lucide-react';
import TransportModule from './modules/TransportModule';
import HotelModule from './modules/HotelModule';
import SightseeingModule from './modules/SightseeingModule';
import RestaurantModule from './modules/RestaurantModule';
import AdditionalServicesModule from './modules/AdditionalServicesModule';
import PricingSummary from './PricingSummary';

interface ProposalBuilderProps {
  context?: 'enhanced';
  onDataUpdate?: (data: any) => void;
}

interface SelectedModule {
  id: string;
  type: 'transport' | 'hotel' | 'sightseeing' | 'restaurant' | 'additional';
  data: any;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
  };
}

const EnhancedProposalBuilderContent: React.FC<ProposalBuilderProps> = ({ onDataUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState<Query | null>(null);
  const [activeTab, setActiveTab] = useState('transport');
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [totalPricing, setTotalPricing] = useState({
    subtotal: 0,
    markup: 0,
    total: 0,
    perPerson: 0,
    currency: 'THB'
  });

  // Real-time itinerary integration
  const {
    proposalData,
    isLoading: itineraryLoading,
    error: itineraryError,
    refreshData,
    syncWithItinerary
  } = useRealTimeItinerary(id || '');

  useEffect(() => {
    if (id) {
      const queryData = getQueryById(id);
      setQuery(queryData || null);
    }
  }, [id]);

  // Integrate real-time itinerary data with modules
  useEffect(() => {
    if (proposalData && proposalData.days.length > 0) {
      // Convert itinerary days to modules
      const itineraryModules: SelectedModule[] = proposalData.days.flatMap(day => {
        const modules: SelectedModule[] = [];
        
        // Add accommodation modules
        if (day.accommodation) {
          modules.push({
            id: `hotel-${day.id}`,
            type: 'hotel',
            data: {
              dayNumber: day.day,
              hotel: day.accommodation,
              city: day.location.city,
            },
            pricing: {
              basePrice: day.accommodation.price,
              finalPrice: day.accommodation.price,
              currency: 'USD'
            }
          });
        }
        
        // Add transport modules
        day.transport?.forEach(transport => {
          modules.push({
            id: `transport-${transport.id}`,
            type: 'transport',
            data: {
              dayNumber: day.day,
              transport,
              from: transport.from || transport.startLocation || 'Unknown',
              to: transport.to || transport.endLocation || 'Unknown',
            },
            pricing: {
              basePrice: transport.price,
              finalPrice: transport.price,
              currency: 'USD'
            }
          });
        });
        
        // Add activity modules
        day.activities.forEach(activity => {
          modules.push({
            id: `activity-${activity.id}`,
            type: 'sightseeing',
            data: {
              dayNumber: day.day,
              activity,
              city: day.location.city,
            },
            pricing: {
              basePrice: activity.price,
              finalPrice: activity.price,
              currency: 'USD'
            }
          });
        });
        
        return modules;
      });
      
      setSelectedModules(itineraryModules);
    }
  }, [proposalData]);

  useEffect(() => {
    calculateTotalPricing();
  }, [selectedModules, query, proposalData]);

  useEffect(() => {
    if (onDataUpdate && proposalData) {
      onDataUpdate({
        days: proposalData.days,
        totalCost: proposalData.totalCost,
        modules: selectedModules,
        pricing: totalPricing
      });
    }
  }, [proposalData, selectedModules, totalPricing, onDataUpdate]);

  const calculateTotalPricing = () => {
    if (!query) return;

    // Use real-time data if available
    const subtotal = proposalData?.totalCost || selectedModules.reduce((sum, module) => sum + module.pricing.basePrice, 0);
    const paxCount = query.paxDetails.adults + query.paxDetails.children;
    
    const pricing = PricingService.calculateMarkup(subtotal, paxCount, totalPricing.currency);
    
    setTotalPricing({
      subtotal: pricing.basePrice,
      markup: pricing.markup,
      total: pricing.finalPrice,
      perPerson: pricing.perPersonPrice || 0,
      currency: pricing.currency
    });
  };

  const addModule = (moduleData: SelectedModule) => {
    setSelectedModules(prev => [...prev, moduleData]);
  };

  const removeModule = (moduleId: string) => {
    setSelectedModules(prev => prev.filter(m => m.id !== moduleId));
  };

  const updateModulePricing = (moduleId: string, newPricing: any) => {
    setSelectedModules(prev => 
      prev.map(m => 
        m.id === moduleId 
          ? { ...m, pricing: { ...m.pricing, ...newPricing } }
          : m
      )
    );
  };

  if (!query) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading query details...</p>
        </div>
      </div>
    );
  }

  const paxCount = query.paxDetails.adults + query.paxDetails.children;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Proposal Builder</h1>
          <p className="text-muted-foreground">Query ID: {query.id}</p>
          {proposalData && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Real-time sync active
              </Badge>
              <Badge variant="outline">
                {proposalData.days.length} days loaded
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={itineraryLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${itineraryLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {paxCount} PAX
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {query.tripDuration.days} Days
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {query.destination.cities.join(', ')}
          </Badge>
        </div>
      </div>

      {/* Real-time status indicator */}
      {itineraryError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading real-time data: {itineraryError}</p>
          </CardContent>
        </Card>
      )}

      {/* Query Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Query Details</span>
            {proposalData && (
              <Badge variant="secondary">
                Real-time: ${proposalData.totalCost.toFixed(2)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Destination</p>
              <p className="text-sm text-muted-foreground">{query.destination.country}</p>
              <p className="text-xs text-muted-foreground">{query.destination.cities.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Travel Dates</p>
              <p className="text-sm text-muted-foreground">
                {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">PAX Details</p>
              <p className="text-sm text-muted-foreground">
                {query.paxDetails.adults} Adults
                {query.paxDetails.children > 0 && `, ${query.paxDetails.children} Children`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Package Type</p>
              <p className="text-sm text-muted-foreground capitalize">{query.packageType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Selection */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="transport" className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Transport</span>
              </TabsTrigger>
              <TabsTrigger value="hotels" className="flex items-center gap-1">
                <Hotel className="h-4 w-4" />
                <span className="hidden sm:inline">Hotels</span>
              </TabsTrigger>
              <TabsTrigger value="sightseeing" className="flex items-center gap-1">
                <Landmark className="h-4 w-4" />
                <span className="hidden sm:inline">Sightseeing</span>
              </TabsTrigger>
              <TabsTrigger value="restaurants" className="flex items-center gap-1">
                <Utensils className="h-4 w-4" />
                <span className="hidden sm:inline">Restaurants</span>
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Additional</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transport" className="mt-4">
              <TransportModule 
                query={query}
                onAddModule={addModule}
                selectedModules={selectedModules.filter(m => m.type === 'transport')}
              />
            </TabsContent>

            <TabsContent value="hotels" className="mt-4">
              <HotelModule 
                query={query}
                onAddModule={addModule}
                selectedModules={selectedModules.filter(m => m.type === 'hotel')}
                onUpdatePricing={updateModulePricing}
              />
            </TabsContent>

            <TabsContent value="sightseeing" className="mt-4">
              <SightseeingModule 
                query={query}
                onAddModule={addModule}
                selectedModules={selectedModules.filter(m => m.type === 'sightseeing')}
                onUpdatePricing={updateModulePricing}
              />
            </TabsContent>

            <TabsContent value="restaurants" className="mt-4">
              <RestaurantModule 
                query={query}
                onAddModule={addModule}
                selectedModules={selectedModules.filter(m => m.type === 'restaurant')}
              />
            </TabsContent>

            <TabsContent value="additional" className="mt-4">
              <AdditionalServicesModule 
                query={query}
                onAddModule={addModule}
                selectedModules={selectedModules.filter(m => m.type === 'additional')}
                onUpdatePricing={updateModulePricing}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Pricing Summary */}
        <div className="lg:col-span-1">
          <PricingSummary 
            selectedModules={selectedModules}
            totalPricing={totalPricing}
            query={query}
            onRemoveModule={removeModule}
            onUpdatePricing={updateModulePricing}
          />
        </div>
      </div>
    </div>
  );
};

const EnhancedProposalBuilder: React.FC<ProposalBuilderProps> = (props) => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <ItineraryProvider queryId={id}>
      <EnhancedProposalBuilderContent onDataUpdate={props.onDataUpdate} />
    </ItineraryProvider>
  );
};

export default EnhancedProposalBuilder;
