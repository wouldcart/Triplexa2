import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import { CentralItinerary } from '@/types/itinerary';
import ProposalService from '@/services/proposalService';
import { ItineraryService } from '@/services/itineraryService';
import { ItineraryTimeline } from './ItineraryTimeline';
import { EnhancedInventorySelector } from './EnhancedInventorySelector';
import { ItineraryExport } from './ItineraryExport';
import { ItineraryChat } from './ItineraryChat';
import { DayByDayProposalCreator } from './DayByDayProposalCreator';
import { OptionalRecords } from '@/types/optionalRecords';
import { supabase } from '@/lib/supabaseClient';
import { 
  Calendar, MapPin, Users, Clock, DollarSign, 
  Save, Send, Download, MessageCircle, Settings,
  Sparkles, ArrowLeft, FileText
} from 'lucide-react';

interface ItineraryProposalBuilderProps {
  queryId?: string;
}

const ItineraryProposalBuilder: React.FC<ItineraryProposalBuilderProps> = ({ queryId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [itinerary, setItinerary] = useState<CentralItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [saving, setSaving] = useState(false);
  const [optionalRecords, setOptionalRecords] = useState<OptionalRecords>({});

  // Helper function to check if a country is optional (derived from its cities)
  const isCountryOptional = (countryName: string) => {
    if (!optionalRecords?.cities || !query?.destination.cities) return false;
    
    // If any city in the country is optional, consider the country optional
    const optionalCities = optionalRecords.cities.filter((city: any) => city.isOptional);
    return optionalCities.length > 0;
  };

  const currentQueryId = queryId || id;

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!currentQueryId) {
          throw new Error('Query ID not provided');
        }

        const queryData = await ProposalService.getQueryByIdAsync(currentQueryId);
        if (!queryData) {
          throw new Error(`Query with ID ${currentQueryId} not found`);
        }

        setQuery(queryData);

        // Load optional records from proposals table
        try {
          const { data: proposalData, error } = await supabase
            .from('proposals')
            .select('optional_records')
            .eq('id', currentQueryId)
            .single();
          
          if (proposalData?.optional_records) {
            setOptionalRecords(proposalData.optional_records);
          }
        } catch (error) {
          console.error('Error loading optional records:', error);
        }

        // Try to load existing itinerary or generate new one
        const existingItinerary = await loadExistingItinerary(currentQueryId);
        if (existingItinerary) {
          setItinerary(existingItinerary);
        } else {
          await generateNewItinerary(queryData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error loading data",
          description: error instanceof Error ? error.message : "Failed to load query details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentQueryId, toast]);

  const loadExistingItinerary = async (queryId: string): Promise<CentralItinerary | null> => {
    try {
      const saved = localStorage.getItem(`itinerary_${queryId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading existing itinerary:', error);
      return null;
    }
  };

  const generateNewItinerary = async (queryData: Query) => {
    try {
      const request = {
        destinations: queryData.destination.cities,
        startDate: queryData.travelDates.from,
        endDate: queryData.travelDates.to,
        travelers: queryData.paxDetails,
        budget: {
          min: 1000,
          max: 5000,
          currency: 'USD'
        },
        preferences: {
          interests: [], // Default empty array since interests might not exist on Query
          accommodationType: 'mid-range' as const,
          transportPreference: 'economy' as const
        },
        context: 'proposal' as const,
        contextId: queryData.id
      };

      const newItinerary = await ItineraryService.generateItinerary(request);
      setItinerary(newItinerary);
      
      // Save to localStorage
      localStorage.setItem(`itinerary_${queryData.id}`, JSON.stringify(newItinerary));
      
      toast({
        title: "Itinerary Generated",
        description: `${newItinerary.duration.days}-day itinerary created successfully`
      });
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        title: "Error generating itinerary",
        description: "Failed to generate itinerary. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!itinerary || !query) return;
    
    try {
      setSaving(true);
      
      // Update itinerary
      const updatedItinerary = {
        ...itinerary,
        updatedAt: new Date().toISOString()
      };
      
      setItinerary(updatedItinerary);
      localStorage.setItem(`itinerary_${query.id}`, JSON.stringify(updatedItinerary));
      
      toast({
        title: "Itinerary Saved",
        description: "Your itinerary has been saved successfully"
      });
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast({
        title: "Error saving",
        description: "Failed to save itinerary",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendProposal = async () => {
    if (!itinerary || !query) return;
    
    try {
      // Mark as sent and save
      const proposalItinerary = {
        ...itinerary,
        status: 'approved' as const,
        updatedAt: new Date().toISOString()
      };
      
      setItinerary(proposalItinerary);
      localStorage.setItem(`itinerary_${query.id}`, JSON.stringify(proposalItinerary));
      
      toast({
        title: "Proposal Sent",
        description: "Itinerary proposal has been sent to the client"
      });
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: "Error sending proposal",
        description: "Failed to send proposal",
        variant: "destructive"
      });
    }
  };

  const handleProposalCreated = (proposalId: string) => {
    toast({
      title: "Success!",
      description: "Day-by-day proposal created successfully"
    });
    // Optionally navigate to the proposal view
    navigate(`/proposals/${proposalId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Enhanced Itinerary Builder...</h2>
        </div>
      </div>
    );
  }

  if (!query || !itinerary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Data Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Unable to load query or itinerary data.
            </p>
            <Button onClick={() => navigate('/queries')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Queries
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-6 w-6" />
                  <CardTitle className="text-2xl">Enhanced Day-to-Day Itinerary Builder</CardTitle>
                </div>
                <p className="text-blue-100 dark:text-blue-200">
                  {query.destination.cities.join(', ')}, {query.destination.country}
                  {isCountryOptional(query.destination.country) && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ml-1">
                      Optional Country
                    </Badge>
                  )}
                  {' • '}
                  {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} travelers
                </p>
                <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                  {query.travelDates.from} to {query.travelDates.to} • {itinerary.duration.days} days, {itinerary.duration.nights} nights
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handleSave} 
                  disabled={saving}
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleSendProposal}
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Send className="h-4 w-4" />
                  Send Proposal
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{itinerary.duration.days}</div>
              <div className="text-sm text-muted-foreground">Days</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{itinerary.destinations.length}</div>
              <div className="text-sm text-muted-foreground">Destinations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants}</div>
              <div className="text-sm text-muted-foreground">Travelers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">${itinerary.pricing.finalPrice.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Total Price</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg border">
          <TabsList className="grid grid-cols-6 w-full bg-gray-50">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Enhanced Inventory
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Create Proposal
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <ItineraryTimeline 
              itinerary={itinerary}
              onUpdate={setItinerary}
              query={query}
            />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <EnhancedInventorySelector 
              query={query}
              itinerary={itinerary}
              onUpdate={setItinerary}
            />
          </TabsContent>

          <TabsContent value="proposal" className="mt-6">
            <DayByDayProposalCreator
              query={query}
              itinerary={itinerary}
              onProposalCreated={handleProposalCreated}
            />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ItineraryExport 
              itinerary={itinerary}
              query={query}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <ItineraryChat 
              itinerary={itinerary}
              query={query}
              onUpdate={setItinerary}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Itinerary Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status: </span>
                    <Badge variant={itinerary.status === 'draft' ? 'secondary' : 'default'}>
                      {itinerary.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(itinerary.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated: {new Date(itinerary.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Version: Enhanced with real-time inventory data
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ItineraryProposalBuilder;
