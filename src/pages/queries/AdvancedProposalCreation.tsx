import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Eye, Plus, Settings } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Query } from '@/types/query';
import { mockQueries } from '@/data/queryData';
import ProposalService from '@/services/proposalService';
import { PricingService } from '@/services/pricingService';
import { useToast } from '@/hooks/use-toast';
import { EnhancedDayPlanningInterface } from '@/components/proposal/EnhancedDayPlanningInterface';
import { ProposalSummaryView } from '@/components/proposal/ProposalSummaryView';
import { useProposalBuilder } from '@/hooks/useProposalBuilder';
import { calculateTripDuration, getCurrencyByCountry, formatCurrency } from '@/utils/currencyUtils';
import { SmartSuggestion } from '@/hooks/useSmartSuggestions';

// Enhanced conversion functions with better type handling
const convertItineraryDayToProposalDay = (day: any) => ({
  ...day,
  activities: day.activities?.map((activity: any) => ({
    id: activity.id,
    name: activity.name,
    price: activity.cost || activity.price || 0,
    duration: activity.duration,
    description: activity.description || '',
    type: activity.type || 'activity',
    category: activity.category || 'afternoon',
    location: activity.location || '',
    timeSlot: activity.timeSlot || '1:00 PM - 5:00 PM',
    popularity: activity.popularity || 75,
    seasonalScore: activity.seasonalScore || 50,
    budgetFit: activity.budgetFit || 50,
    travelerTypeScore: activity.travelerTypeScore || 50,
    data: activity.data || activity
  })) || []
});

const AdvancedProposalCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'planning' | 'summary'>('planning');
  const [pricingSettings, setPricingSettings] = useState(PricingService.getSettings());

  // Extract URL parameters
  const draftId = searchParams.get('draftId');
  const loadDraft = searchParams.get('loadDraft') === 'true';
  const urlTab = searchParams.get('tab');
  const draftType = searchParams.get('draftType') as 'daywise' | 'enhanced' | null;

  const {
    days,
    totalCost,
    addDay,
    updateDay,
    removeDay,
    reorderDay,
    saveDraft,
    generateProposal,
    loading: proposalLoading,
    loadSpecificDraft
  } = useProposalBuilder(query?.id, {
    draftType,
    autoLoadDraft: loadDraft && !!draftId,
    initialTab: urlTab || 'planning'
  });

  // Calculate trip duration automatically
  const tripDuration = query ? calculateTripDuration(query.travelDates.from, query.travelDates.to) : null;
  const currencyInfo = query ? getCurrencyByCountry(query.destination.country) : null;

  // Load query and handle draft loading
  useEffect(() => {
    const loadQuery = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('Query ID not provided');
        }

        // Try to load from ProposalService first, then fallback to mockQueries
        let queryData = ProposalService.getQueryById(id);
        
        if (!queryData) {
          queryData = mockQueries.find(q => q.id === id) || null;
        }

        if (!queryData) {
          throw new Error(`Query with ID ${id} not found`);
        }

        setQuery(queryData);

        // Load specific draft if requested
        if (loadDraft && draftId && loadSpecificDraft) {
          try {
            await loadSpecificDraft(draftId, draftType || 'daywise');
            console.log(`Loaded ${draftType} draft:`, draftId);
          } catch (error) {
            console.error('Error loading specific draft:', error);
            toast({
              title: "Draft Loading Warning",
              description: "Could not load the specified draft. Starting fresh.",
              variant: "default"
            });
          }
        }

        // Update URL tab if specified
        if (urlTab && ['planning', 'summary'].includes(urlTab)) {
          setActiveView(urlTab as 'planning' | 'summary');
        }

      } catch (error) {
        console.error('Error loading query:', error);
        toast({
          title: "Error loading query",
          description: error instanceof Error ? error.message : "Failed to load query details",
          variant: "destructive"
        });
        
        setTimeout(() => navigate('/queries'), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadQuery();
  }, [id, navigate, toast, draftId, loadDraft, draftType, urlTab, loadSpecificDraft]);

  // Update pricing settings when they change
  useEffect(() => {
    const handlePricingUpdate = () => {
      setPricingSettings(PricingService.getSettings());
    };

    // Listen for pricing settings updates (could be from settings page)
    window.addEventListener('pricing-settings-updated', handlePricingUpdate);
    
    return () => {
      window.removeEventListener('pricing-settings-updated', handlePricingUpdate);
    };
  }, []);

  // Update URL when view changes
  useEffect(() => {
    if (query?.id) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', activeView);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeView, query?.id, searchParams, setSearchParams]);

  const handleSaveDraft = async () => {
    try {
      const savedDraftId = await saveDraft(draftType || 'daywise');
      
      // Update URL with draft information
      const newParams = new URLSearchParams(searchParams);
      newParams.set('draftId', savedDraftId);
      newParams.set('draftType', draftType || 'daywise');
      newParams.set('loadDraft', 'true');
      setSearchParams(newParams, { replace: true });
      
      toast({
        title: "Draft Saved",
        description: `${draftType || 'Daywise'} draft saved successfully`,
      });
      
      console.log('Draft saved successfully:', savedDraftId);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error saving draft",
        description: "Failed to save proposal draft",
        variant: "destructive"
      });
    }
  };

  const handleGenerateProposal = async () => {
    try {
      const proposalId = await generateProposal();
      toast({
        title: "Proposal created",
        description: "Your proposal has been generated successfully",
      });
      navigate(`/proposals/${proposalId}`);
    } catch (error) {
      toast({
        title: "Error generating proposal",
        description: "Failed to generate proposal",
        variant: "destructive"
      });
    }
  };

  // Enhanced day update handler with pricing integration
  const handleUpdateDay = (dayId: string, updates: any) => {
    // Convert SmartSuggestion activities back to ItineraryActivity format
    const convertedUpdates = updates.activities ? {
      ...updates,
      activities: updates.activities.map((activity: SmartSuggestion) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description || '',
        duration: activity.duration,
        cost: activity.price || 0,
        type: activity.type || 'activity' as const,
        startTime: activity.timeSlot?.split(' - ')[0],
        endTime: activity.timeSlot?.split(' - ')[1]
      }))
    } : updates;

    // Apply pricing calculations if enabled
    if (convertedUpdates.activities && query) {
      const paxCount = query.paxDetails.adults + query.paxDetails.children;
      const currency = getCurrencyByCountry(query.destination.country)?.code || 'USD';
      
      convertedUpdates.activities = convertedUpdates.activities.map((activity: any) => {
        if (activity.cost && pricingSettings.useSlabPricing) {
          const pricing = PricingService.calculateMarkup(activity.cost, paxCount, currency);
          return {
            ...activity,
            cost: pricing.finalPrice,
            originalCost: activity.cost,
            markup: pricing.markup,
            markupType: pricing.markupType
          };
        }
        return activity;
      });
    }
    
    updateDay(dayId, convertedUpdates);
  };

  const handleReorderDay = (dayId: string, direction: 'up' | 'down') => {
    if (reorderDay) {
      reorderDay(dayId, direction);
    }
  };

  // Auto-add days based on trip duration
  const autoAddDaysForDuration = () => {
    if (!tripDuration || days.length >= tripDuration.days) return;

    const startDate = new Date(query!.travelDates.from);
    for (let i = days.length; i < tripDuration.days; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      addDay();
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="text-xl font-semibold">Loading Enhanced Proposal Builder...</h2>
          </div>
        </div>
      </PageLayout>
    );
  };

  if (!query) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Query Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                The query with ID "{id}" could not be found.
              </p>
              <Button onClick={() => navigate('/queries')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Queries
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/queries')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Queries
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">AI-Enhanced Day-by-Day Proposal</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Query: {query.id}</Badge>
                <Badge variant="secondary">{query.destination.country}</Badge>
                <Badge variant="outline">
                  {query.paxDetails.adults + query.paxDetails.children} PAX
                </Badge>
                {tripDuration && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {tripDuration.days} Days / {tripDuration.nights} Nights
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tripDuration && days.length < tripDuration.days && (
              <Button 
                variant="outline" 
                onClick={autoAddDaysForDuration}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Auto-Add {tripDuration.days - days.length} Days
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings/pricing')}
              className="gap-2"
              title="Configure pricing settings"
            >
              <Settings className="h-4 w-4" />
              Pricing
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveView(activeView === 'planning' ? 'summary' : 'planning')}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {activeView === 'planning' ? 'Preview' : 'Edit'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={proposalLoading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save {draftType || 'Daywise'} Draft
            </Button>
            <Button 
              onClick={handleGenerateProposal}
              disabled={proposalLoading || days.length === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Generate Proposal
            </Button>
          </div>
        </div>

        {/* Enhanced Query Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Query Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-700">Destination</p>
                <p className="text-sm text-blue-600">{query.destination.country}</p>
                <p className="text-xs text-blue-500">{query.destination.cities.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Travel Dates</p>
                <p className="text-sm text-blue-600">
                  {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                </p>
                {tripDuration && (
                  <p className="text-xs text-blue-500">
                    {tripDuration.days} days, {tripDuration.nights} nights
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Travelers</p>
                <p className="text-sm text-blue-600">
                  {query.paxDetails.adults} Adults
                  {query.paxDetails.children > 0 && `, ${query.paxDetails.children} Children`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Currency</p>
                <p className="text-sm text-blue-600">
                  {currencyInfo ? `${currencyInfo.code} (${currencyInfo.symbol})` : 'USD ($)'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Cost</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalCost, query.destination.country)}
                </p>
                <p className="text-xs text-blue-500">
                  {formatCurrency(totalCost / (query.paxDetails.adults + query.paxDetails.children), query.destination.country)} per person
                </p>
                {pricingSettings.useSlabPricing && (
                  <p className="text-xs text-orange-500 font-medium">
                    ✓ Slab pricing applied
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Main Content */}
        {activeView === 'planning' ? (
          <EnhancedDayPlanningInterface
            query={query}
            days={days.map(convertItineraryDayToProposalDay)}
            onAddDay={addDay}
            onUpdateDay={handleUpdateDay}
            onRemoveDay={removeDay}
            onReorderDay={handleReorderDay}
          />
        ) : (
          <ProposalSummaryView
            query={query}
            days={days.map(convertItineraryDayToProposalDay)}
            totalCost={totalCost}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AdvancedProposalCreation;
