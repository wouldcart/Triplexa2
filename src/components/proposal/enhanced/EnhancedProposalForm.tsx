
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { AdvancedProposalModule } from '@/types/advancedProposal';
import EnhancedItinerarySummaryPanel from './EnhancedItinerarySummaryPanel';
import { 
  Car, Hotel, Landmark, Utensils, Plus, Users, 
  Calendar, MapPin, ArrowLeft, FileText, Share
} from 'lucide-react';

const EnhancedProposalForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [selectedModules, setSelectedModules] = useState<AdvancedProposalModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (id) {
      const queryData = ProposalService.getQueryById(id);
      if (queryData) {
        setQuery(queryData);
        // Load any existing modules from localStorage
        const savedModules = localStorage.getItem(`enhanced_proposal_modules_${id}`);
        if (savedModules) {
          try {
            setSelectedModules(JSON.parse(savedModules));
          } catch (error) {
            console.error('Error loading saved modules:', error);
          }
        }
      } else {
        toast({
          title: "Query not found",
          description: "The requested query could not be found.",
          variant: "destructive"
        });
        navigate('/queries');
      }
      setLoading(false);
    }
  }, [id, navigate, toast]);

  const handleSaveProposal = (proposalData: any) => {
    // Save modules to localStorage for persistence
    localStorage.setItem(`enhanced_proposal_modules_${id}`, JSON.stringify(selectedModules));
    
    toast({
      title: "Success",
      description: "Enhanced proposal has been saved successfully!",
    });
  };

  const handleShareProposal = () => {
    // Implementation for sharing proposal
    toast({
      title: "Share Proposal",
      description: "Proposal sharing feature will be implemented soon.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p>Loading enhanced proposal builder...</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Query Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The requested query could not be found.
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

  const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">Enhanced Proposal Builder</CardTitle>
                <p className="text-blue-100">
                  {query.destination.cities.join(', ')}, {query.destination.country}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {totalPax} PAX
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {query.tripDuration.days} Days
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {query.destination.cities.length} Cities
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handleShareProposal}
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/queries')}
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Query Details */}
        <Card>
          <CardHeader>
            <CardTitle>Query Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Travel Dates</p>
                <p className="text-sm text-gray-600">
                  {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">PAX Details</p>
                <p className="text-sm text-gray-600">
                  {query.paxDetails.adults} Adults
                  {query.paxDetails.children > 0 && `, ${query.paxDetails.children} Children`}
                  {query.paxDetails.infants > 0 && `, ${query.paxDetails.infants} Infants`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Package Type</p>
                <Badge variant="outline" className="capitalize">
                  {query.packageType}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Query ID</p>
                <p className="text-sm text-gray-600 font-mono">{query.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Module Selection Area */}
          <div className="xl:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="summary" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="transport" className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  Transport
                </TabsTrigger>
                <TabsTrigger value="hotels" className="flex items-center gap-1">
                  <Hotel className="h-4 w-4" />
                  Hotels
                </TabsTrigger>
                <TabsTrigger value="sightseeing" className="flex items-center gap-1">
                  <Landmark className="h-4 w-4" />
                  Sightseeing
                </TabsTrigger>
                <TabsTrigger value="restaurants" className="flex items-center gap-1">
                  <Utensils className="h-4 w-4" />
                  Restaurants
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enhanced proposal summary will be displayed here</p>
                      <p className="text-sm">Add modules from other tabs to see the summary</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transport" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transport Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Transport module will be integrated here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hotels" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hotel Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Hotel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Hotel module will be integrated here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sightseeing" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sightseeing Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Sightseeing module will be integrated here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="restaurants" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Restaurant Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Restaurant module will be integrated here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Enhanced Summary Panel */}
          <div className="xl:col-span-1">
            <EnhancedItinerarySummaryPanel
              query={query}
              selectedModules={selectedModules}
              onSaveProposal={handleSaveProposal}
              className="sticky top-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProposalForm;
