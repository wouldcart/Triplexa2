import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { ProposalOptionsManager } from '@/components/proposal/options/ProposalOptionsManager';
import { DayByDayItineraryBuilder } from '@/components/proposal/DayByDayItineraryBuilder';
import { RedesignedPricingSection } from '@/components/proposal/pricing/RedesignedPricingSection';
import { ProposalComponentOption } from '@/types/proposalOptions';
import { 
  ArrowLeft, Save, Send, Package, Calendar, 
  Calculator, Settings, Eye, FileText 
} from 'lucide-react';

interface AdvancedProposalPageProps {
  queryId?: string;
}

const AdvancedProposalPage: React.FC<AdvancedProposalPageProps> = ({ queryId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('options');
  const [saving, setSaving] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<ProposalComponentOption[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

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
        
        // Load any existing proposal options
        const existingOptions = loadExistingOptions(currentQueryId);
        if (existingOptions.length > 0) {
          setSelectedOptions(existingOptions);
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

  const loadExistingOptions = (queryId: string): ProposalComponentOption[] => {
    try {
      const saved = localStorage.getItem(`proposal_options_${queryId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading existing options:', error);
      return [];
    }
  };

  const saveProposalOptions = async () => {
    if (!currentQueryId) return;
    
    try {
      setSaving(true);
      
      const proposalData = {
        queryId: currentQueryId,
        options: selectedOptions,
        totalPrice,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(`proposal_options_${currentQueryId}`, JSON.stringify(selectedOptions));
      localStorage.setItem(`proposal_data_${currentQueryId}`, JSON.stringify(proposalData));
      
      toast({
        title: "Proposal Saved",
        description: "Your proposal options have been saved successfully"
      });
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Error saving",
        description: "Failed to save proposal options",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const sendProposal = async () => {
    if (!currentQueryId || !query) return;
    
    try {
      setSaving(true);
      
      // Save current state first
      await saveProposalOptions();
      
      // Mark as sent
      const proposalData = {
        queryId: currentQueryId,
        query,
        options: selectedOptions,
        totalPrice,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      
      localStorage.setItem(`proposal_sent_${currentQueryId}`, JSON.stringify(proposalData));
      
      toast({
        title: "Proposal Sent",
        description: "Advanced proposal has been sent to the client"
      });
      
      // Navigate to proposals list or query details
      navigate(`/queries/${encodeURIComponent(currentQueryId)}`);
      
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: "Error sending proposal",
        description: "Failed to send proposal",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOptionsChange = (options: ProposalComponentOption[]) => {
    setSelectedOptions(options);
  };

  const handlePriceChange = (price: number) => {
    setTotalPrice(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Advanced Proposal Builder...</h2>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Query Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Unable to load query data for ID: {currentQueryId}
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
                  <Package className="h-6 w-6" />
                  <CardTitle className="text-2xl">Advanced Options-Based Proposal Builder</CardTitle>
                </div>
                <p className="text-blue-100 dark:text-blue-200">
                  {query.destination.cities.join(', ')}, {query.destination.country} • {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} travelers
                </p>
                <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                  {query.travelDates.from} to {query.travelDates.to} • Query ID: {currentQueryId}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={saveProposalOptions} 
                  disabled={saving}
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={sendProposal}
                  disabled={saving || selectedOptions.length === 0}
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
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{selectedOptions.length}</div>
              <div className="text-sm text-muted-foreground">Options Selected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">${totalPrice.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Total Price</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">
                {selectedOptions.filter(opt => opt.type === 'optional').length}
              </div>
              <div className="text-sm text-muted-foreground">Optional Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">
                {selectedOptions.filter(opt => opt.isSelected).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Options</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg border">
          <TabsList className="grid grid-cols-4 w-full bg-gray-50">
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Options Manager
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Day-by-Day
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="mt-6">
            <ProposalOptionsManager
              queryId={currentQueryId}
              onOptionsChange={handleOptionsChange}
              onPriceChange={handlePriceChange}
              formatCurrency={(amount) => `$${amount.toFixed(2)}`}
              initialOptions={selectedOptions}
            />
          </TabsContent>

          <TabsContent value="itinerary" className="mt-6">
            <DayByDayItineraryBuilder
              queryId={currentQueryId}
              query={query}
              onDataChange={(days) => {
                // Update any day-specific options
                console.log('Itinerary updated:', days);
              }}
            />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <RedesignedPricingSection
              query={query}
              onPricingUpdate={(pricing) => {
                console.log('Pricing updated:', pricing);
              }}
              useEnhancedMarkup={true}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Query Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Trip Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Destination:</strong> {query.destination.cities.join(', ')}, {query.destination.country}</div>
                        <div><strong>Dates:</strong> {query.travelDates.from} to {query.travelDates.to}</div>
                        <div><strong>Travelers:</strong> {query.paxDetails.adults} Adults, {query.paxDetails.children} Children, {query.paxDetails.infants} Infants</div>
                        <div><strong>Budget:</strong> {query.budget?.min && query.budget?.max ? `$${query.budget.min} - $${query.budget.max}` : 'Not specified'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Selected Options</h3>
                      <div className="space-y-2">
                        {selectedOptions.filter(opt => opt.isSelected).map((option) => (
                          <div key={option.id} className="flex justify-between text-sm">
                            <span>{option.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {option.type}
                              </Badge>
                              <span className="font-medium">${option.pricing.totalPrice}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Pricing Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Package Price:</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Based on {selectedOptions.filter(opt => opt.isSelected).length} selected options
                      </div>
                    </div>
                  </div>

                  {/* Package Variations */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Package Variations</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Basic Package</h4>
                        <div className="text-sm text-muted-foreground mb-2">
                          Essential services only
                        </div>
                        <div className="font-semibold">
                          ${selectedOptions.filter(opt => opt.type === 'standard').reduce((sum, opt) => sum + opt.pricing.totalPrice, 0).toFixed(2)}
                        </div>
                      </Card>
                      
                      <Card className="p-4 border-primary">
                        <h4 className="font-medium mb-2">Standard Package</h4>
                        <div className="text-sm text-muted-foreground mb-2">
                          With selected options
                        </div>
                        <div className="font-semibold">
                          ${totalPrice.toFixed(2)}
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Premium Package</h4>
                        <div className="text-sm text-muted-foreground mb-2">
                          All options included
                        </div>
                        <div className="font-semibold">
                          ${selectedOptions.reduce((sum, opt) => sum + opt.pricing.totalPrice, 0).toFixed(2)}
                        </div>
                      </Card>
                    </div>
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

export default AdvancedProposalPage;