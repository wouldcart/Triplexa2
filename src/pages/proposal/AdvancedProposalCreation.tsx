
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Send, Eye, Plus, Clock, CheckCircle, AlertCircle, Calendar, MapPin, Users, Shield } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { useToast } from '@/hooks/use-toast';
import { EnhancedDayPlanningInterface } from '@/components/proposal/EnhancedDayPlanningInterface';
import { ProposalSummaryView } from '@/components/proposal/ProposalSummaryView';
import { useProposalBuilder } from '@/hooks/useProposalBuilder';
import { calculateTripDuration, getCurrencyByCountry, formatCurrency } from '@/utils/currencyUtils';
import { SmartSuggestion } from '@/hooks/useSmartSuggestions';
import { DayByDayItineraryBuilder } from '@/components/proposal/DayByDayItineraryBuilder';
import ProposalManagement from '@/components/enquiry/ProposalManagement';
import { ItineraryDay as CoreItineraryDay, ItineraryActivity as CoreItineraryActivity } from '@/types/itinerary';
import { ItineraryDay as BuilderItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { cn } from '@/lib/utils';
import EnhancedValidationDialog from '@/components/proposal/validation/EnhancedValidationDialog';
import GenerationProgressDialog from '@/components/proposal/enhanced/GenerationProgressDialog';
import { useProposalValidation } from '@/hooks/useProposalValidation';
import { useProposalGeneration } from '@/hooks/useProposalGeneration';
import { TabErrorBoundary } from '@/components/common/TabErrorBoundary';

// Activity type mapping functions - fixed to handle the correct type mappings
const mapBuilderActivityTypeToCore = (builderType: 'sightseeing' | 'transport' | 'meal' | 'accommodation' | 'activity'): CoreItineraryActivity['type'] => {
  switch (builderType) {
    case 'sightseeing':
      return 'sightseeing';
    case 'transport':
      return 'sightseeing'; // Map transport to sightseeing as fallback
    case 'meal':
      return 'dining';
    case 'accommodation':
      return 'relaxation'; // Map accommodation to relaxation as fallback
    case 'activity':
    default:
      return 'adventure'; // Map generic activity to adventure
  }
};

const mapCoreActivityTypeToBuilder = (coreType: CoreItineraryActivity['type']): 'sightseeing' | 'transport' | 'meal' | 'accommodation' | 'activity' => {
  switch (coreType) {
    case 'sightseeing':
      return 'sightseeing';
    case 'dining':
      return 'meal';
    case 'adventure':
    case 'cultural':
    case 'relaxation':
    default:
      return 'activity'; // Map adventure, cultural, relaxation to generic activity
  }
};

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

// Convert between different ItineraryDay types with proper type mapping
const convertCoreToBuilder = (coreDays: CoreItineraryDay[]): BuilderItineraryDay[] => {
  return coreDays.map(day => ({
    id: day.id,
    dayNumber: day.day || 1,
    title: `Day ${day.day || 1}`,
    city: day.location?.city || '',
    description: day.notes || '',
    date: day.date,
    activities: day.activities?.map(activity => ({
      id: activity.id,
      name: activity.name,
      description: activity.description || '',
      duration: activity.duration,
      cost: activity.price,
      type: mapCoreActivityTypeToBuilder(activity.type)
    })) || [],
    transport: day.transport?.map(transport => ({
      id: transport.id,
      name: `${transport.from.name} to ${transport.to.name}`,
      from: transport.from.name,
      to: transport.to.name,
      price: transport.price,
      type: transport.type
    })) || [],
    accommodations: day.accommodation ? [{
      id: day.accommodation.id,
      name: day.accommodation.name,
      type: day.accommodation.type,
      price: day.accommodation.price,
      hotel: day.accommodation.name,
      roomType: day.accommodation.roomType
    }] : [],
    meals: {
      breakfast: day.meals?.some(meal => meal.type === 'breakfast') || false,
      lunch: day.meals?.some(meal => meal.type === 'lunch') || false,
      dinner: day.meals?.some(meal => meal.type === 'dinner') || false
    },
    totalCost: day.totalCost
  }));
};

const convertBuilderToCore = (builderDays: BuilderItineraryDay[]): CoreItineraryDay[] => {
  return builderDays.map(day => ({
    id: day.id,
    day: day.dayNumber,
    date: day.date,
    location: {
      id: `loc_${day.city}`,
      name: day.city,
      country: '',
      city: day.city
    },
    accommodation: day.accommodations?.[0] ? {
      id: day.accommodations[0].id,
      name: day.accommodations[0].name,
      type: day.accommodations[0].type as 'hotel' | 'resort' | 'guesthouse' | 'apartment',
      location: {
        id: `loc_${day.city}`,
        name: day.city,
        country: '',
        city: day.city
      },
      checkIn: day.date,
      checkOut: day.date,
      nights: 1,
      roomType: day.accommodations[0].roomType || 'Standard Room',
      price: day.accommodations[0].price,
      starRating: 3,
      amenities: []
    } : undefined,
    transport: day.transport?.map(transport => ({
      id: transport.id,
      type: transport.type as 'flight' | 'car' | 'bus' | 'train' | 'boat',
      from: {
        id: `loc_${transport.from}`,
        name: transport.from,
        country: '',
        city: transport.from
      },
      to: {
        id: `loc_${transport.to}`,
        name: transport.to,
        country: '',
        city: transport.to
      },
      duration: '2 hours',
      price: transport.price,
      details: ''
    })) || [],
    activities: day.activities?.map(activity => ({
      id: activity.id,
      name: activity.name,
      type: mapBuilderActivityTypeToCore(activity.type),
      location: {
        id: `loc_${day.city}`,
        name: day.city,
        country: '',
        city: day.city
      },
      startTime: '09:00',
      endTime: '17:00',
      duration: activity.duration,
      price: activity.cost,
      description: activity.description,
      inclusions: []
    })) || [],
    meals: [],
    totalCost: day.totalCost,
    notes: day.description
  }));
};

const AdvancedProposalCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'planning' | 'summary'>('planning');
  
  // Initialize activeTab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'itinerary';
  const [activeTab, setActiveTab] = useState<'itinerary' | 'proposal'>(initialTab as 'itinerary' | 'proposal');
  
  const [itineraryData, setItineraryData] = useState<BuilderItineraryDay[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [hasShownDraftLoadedToast, setHasShownDraftLoadedToast] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [skippedRules, setSkippedRules] = useState<string[]>([]);

  // Enhanced useProposalBuilder with URL parameter support
  const {
    days,
    totalCost,
    addDay,
    updateDay,
    removeDay,
    saveDraft,
    generateProposal,
    loading: proposalLoading
  } = useProposalBuilder(query?.id, {
    draftType: urlParams.get('draftType') as 'daywise' | 'enhanced' || 'daywise',
    autoLoadDraft: urlParams.get('loadDraft') === 'true',
    initialTab: initialTab
  });

  // Get proposal management data for validation
  const [proposalManagementData, setProposalManagementData] = useState<any>(null);
  
  // Load proposal management data when needed for validation
  const loadProposalManagementData = useCallback(() => {
    if (!query?.id) return null;
    
    try {
      // Load persistent proposal data from storage
      const persistentDataKey = `proposal_persistence_${query.id}`;
      const savedData = localStorage.getItem(persistentDataKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return {
          termsConditions: parsedData.termsConditions || {},
          emailData: parsedData.emailData || {},
          pricingConfig: parsedData.pricingConfig || {},
          hasProposalManagementData: Object.keys(parsedData).some(key => 
            parsedData[key] && typeof parsedData[key] === 'object' && Object.keys(parsedData[key]).length > 0
          )
        };
      }
    } catch (error) {
      console.error('Error loading proposal management data:', error);
    }
    
    return null;
  }, [query?.id]);

  // Update proposal management data when tab changes or component mounts
  useEffect(() => {
    const managementData = loadProposalManagementData();
    setProposalManagementData(managementData);
  }, [loadProposalManagementData, activeTab]);

  // Validation for proposal generation - includes both itinerary and proposal management data
  const { validationRules, hasErrors, isValid } = useProposalValidation({
    query: query,
    days: itineraryData,
    totalCost,
    skippedRules,
    proposalManagementData
  });

  // Enhanced proposal generation with progress
  const {
    isGenerating,
    currentProgress,
    generationSteps,
    handleGenerateWithProgress,
    resetGeneration
  } = useProposalGeneration({ generateProposal });

  // Calculate trip duration automatically
  const tripDuration = query ? calculateTripDuration(query.travelDates.from, query.travelDates.to) : null;
  const currencyInfo = query ? getCurrencyByCountry(query.destination.country) : null;

  // Load saved itinerary data without auto-save
  const loadSavedItineraryData = useCallback((): { data: BuilderItineraryDay[], hasSavedData: boolean } => {
    if (!query?.id) return { data: [], hasSavedData: false };
    
    try {
      const saveKey = `itinerary_builder_${query.id}`;
      const saved = localStorage.getItem(saveKey);
      
      if (saved) {
        const parsedData = JSON.parse(saved);
        if (parsedData.queryId === query.id && parsedData.data && parsedData.data.length > 0) {
          setLastSaved(new Date(parsedData.lastSaved));
          console.log('Loaded saved itinerary data:', parsedData.data.length, 'days');
          return { data: parsedData.data, hasSavedData: true };
        }
      }
    } catch (error) {
      console.error('Error loading saved itinerary data:', error);
      const saveKey = `itinerary_builder_${query.id}`;
      localStorage.removeItem(saveKey);
    }
    
    return { data: [], hasSavedData: false };
  }, [query?.id]);

  // Manual save function - only triggered by user action
  const saveItineraryData = useCallback((data: BuilderItineraryDay[], actionType: string) => {
    if (!query?.id || data.length === 0) return false;
    
    try {
      const saveKey = `itinerary_builder_${query.id}`;
      const saveData = {
        data,
        lastSaved: new Date().toISOString(),
        queryId: query.id,
        version: Date.now(),
        actionType
      };
      
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      setLastSaved(new Date());
      
      console.log(`Itinerary saved after action: ${actionType}`, 'at', new Date().toLocaleTimeString());
      return true;
    } catch (error) {
      console.error('Error saving itinerary data:', error);
      return false;
    }
  }, [query?.id]);

  // Simplified tab change handler - instant switching
  const handleTabChange = useCallback((newTab: string) => {
    if (newTab === activeTab) return;
    
    console.log('Switching tab from', activeTab, 'to', newTab);
    setActiveTab(newTab as 'itinerary' | 'proposal');
    console.log(`✅ Switched to tab: ${newTab}`);
  }, [activeTab]);

  // Enhanced day update handler with proper type conversion
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
    
    updateDay(dayId, convertedUpdates);
  };

  // Handle itinerary data changes - no auto-save
  const handleItineraryDataChange = useCallback((newData: BuilderItineraryDay[], actionType?: string) => {
    setItineraryData(newData);
    // Remove auto-save - data will only be saved on manual save
  }, []);

  // Manual save handler - only save when user explicitly clicks save
  const handleItinerarySave = async (data: BuilderItineraryDay[]) => {
    const saveSuccess = saveItineraryData(data, 'manual-save');
    // No toast message - silent save
    return saveSuccess;
  };

  useEffect(() => {
    const loadQuery = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('Query ID not provided');
        }

        // Load using async ProposalService with Supabase fallback
        const queryData = await ProposalService.getQueryByIdAsync(id);

        if (!queryData) {
          throw new Error(`Query with ID ${id} not found`);
        }

        setQuery(queryData);
        
        // Load saved itinerary data after query is loaded - with URL parameter support
        setTimeout(() => {
          // Check if we should auto-load a draft from URL parameters
          const shouldLoadDraft = urlParams.get('loadDraft') === 'true';
          const draftType = urlParams.get('draftType') || 'daywise';
          const draftId = urlParams.get('draftId') || id;
          
          if (shouldLoadDraft && draftId) {
            console.log('Loading draft from URL parameters:', { draftId, draftType });
            // Draft loading will be handled by useProposalBuilder with URL parameters
          }
          
          const { data: savedData, hasSavedData } = loadSavedItineraryData();
          if (hasSavedData) {
            setItineraryData(savedData);
            if (!hasShownDraftLoadedToast) {
              toast({
                title: "Draft loaded",
                description: "Your saved itinerary draft has been loaded successfully",
              });
              setHasShownDraftLoadedToast(true);
            }
          }
          
          // If direct-linking to proposal tab, ensure data is ready
          if (initialTab === 'proposal') {
            setTimeout(() => {
              const managementData = loadProposalManagementData();
              setProposalManagementData(managementData);
            }, 200);
          }
        }, 100);
        
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

    if (id && !hasShownDraftLoadedToast) {
      loadQuery();
    }
  }, [id, navigate, toast, loadSavedItineraryData, hasShownDraftLoadedToast]);

  const handleSaveDraft = async () => {
    if (!query?.id) {
      toast({
        title: "Error saving draft",
        description: "No query ID found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading('save');
      
      // Only save itinerary data if there's meaningful content
      if (activeTab === 'itinerary' && itineraryData.length > 0) {
        const hasContent = itineraryData.some(day => 
          day.activities.length > 0 || 
          day.accommodations.length > 0 || 
          day.transport.length > 0 ||
          Object.values(day.meals).some(Boolean)
        );
        
        if (hasContent) {
          saveItineraryData(itineraryData, 'manual-draft-save');
        }
      }
      
      const savedDraftId = await saveDraft();
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
      toast({
        title: "Draft saved",
        description: `Your proposal draft has been saved successfully (ID: ${savedDraftId})`,
      });
      
      console.log('Draft saved successfully:', savedDraftId);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error saving draft",
        description: error instanceof Error ? error.message : "Failed to save proposal draft",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Enhanced proposal generation with validation
  const handleValidateAndGenerate = () => {
    if (!query) return;
    
    // Refresh proposal management data before validation
    const latestManagementData = loadProposalManagementData();
    setProposalManagementData(latestManagementData);
    
    console.log('Validating proposal with data:', {
      itinerarDays: itineraryData.length,
      managementData: latestManagementData ? 'Available' : 'Not found',
      totalCost
    });
    
    // Show validation dialog
    setShowValidationDialog(true);
  };

  const handleProceedWithGeneration = async () => {
    setShowValidationDialog(false);
    setShowProgressDialog(true);
    
    try {
      await handleGenerateWithProgress();
    } finally {
      setShowProgressDialog(false);
    }
  };

  const handleSkipRule = (ruleId: string) => {
    setSkippedRules(prev => [...prev, ruleId]);
    toast({
      title: "Rule Skipped",
      description: "Validation rule has been skipped for this generation",
    });
  };

  const handleGenerateProposal = async () => {
    try {
      setActionLoading('generate');
      
      const proposalId = await generateProposal();
      
      toast({
        title: "Proposal created",
        description: "Your proposal has been generated successfully",
      });
      
      navigate(`/proposals/${proposalId}`);
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast({
        title: "Error generating proposal",
        description: "Failed to generate proposal",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <PageLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="text-xl font-semibold">Loading Enhanced Proposal Builder...</h2>
            </div>
          </div>
        </PageLayout>
      </div>
    );
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PageLayout>
        <div className="space-y-6">
          {/* Improved Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/queries')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Create Proposal</h1>
                  <p className="text-muted-foreground">Query ID: {query.id}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {tripDuration && days.length < tripDuration.days && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={autoAddDaysForDuration}
                  className="gap-2"
                  disabled={!!actionLoading}
                >
                  <Plus className="h-4 w-4" />
                  Auto-Add {tripDuration.days - days.length} Days
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveView(activeView === 'planning' ? 'summary' : 'planning')}
                className="gap-2"
                disabled={!!actionLoading}
              >
                <Eye className="h-4 w-4" />
                {activeView === 'planning' ? 'Preview' : 'Edit'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveDraft}
                disabled={proposalLoading || actionLoading === 'save'}
                className="gap-2"
              >
                {actionLoading === 'save' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={handleValidateAndGenerate}
                disabled={!query || proposalLoading || itineraryData.length === 0 || isGenerating}
                className="gap-2"
                variant={query && hasErrors ? "destructive" : "default"}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Generate Proposal
                  </>
                )}
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
                  <p className="text-xs text-blue-500">
                    {query.cityAllocations && query.cityAllocations.length > 0 
                      ? query.cityAllocations.map((allocation: any, index: number) => (
                          <span key={index}>
                            {typeof allocation.city === 'string' ? allocation.city : (allocation.city as any)?.name || (allocation.city as any)?.city || 'City'} {allocation.nights}N
                            {index < query.cityAllocations.length - 1 ? ' + ' : ''}
                          </span>
                        ))
                      : query.destination.cities.map((city: any, index: number) => (
                          <span key={index}>
                            {typeof city === 'string' ? city : (city as any)?.name || (city as any)?.city || 'City'} {tripDuration ? Math.floor(tripDuration.nights / query.destination.cities.length) : 0}N
                            {index < query.destination.cities.length - 1 ? ' + ' : ''}
                          </span>
                        ))
                    }
                  </p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs with improved switching */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="itinerary" className="flex items-center gap-2">
                <span>Day Wise Itinerary</span>
              </TabsTrigger>
              <TabsTrigger value="proposal" className="flex items-center gap-2">
                <span>Proposal Management</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="itinerary" className="mt-6">
              <TabErrorBoundary tabName="Day Wise Itinerary">
                {query && (
                  <DayByDayItineraryBuilder
                    queryId={query.id}
                    query={query}
                    initialDays={itineraryData}
                    onDataChange={(newData) => handleItineraryDataChange(newData, 'tab-switch')}
                    onSave={handleItinerarySave}
                  />
                )}
              </TabErrorBoundary>
            </TabsContent>

            <TabsContent value="proposal" className="mt-6">
              <TabErrorBoundary tabName="Proposal Management">
                {query && (
                  <ProposalManagement query={query} />
                )}
              </TabErrorBoundary>
            </TabsContent>
          </Tabs>

          {/* Enhanced Main Content - Legacy view toggle */}
          {activeView === 'planning' ? (
            <div className="hidden">
              <EnhancedDayPlanningInterface
                query={query}
                days={days.map(convertItineraryDayToProposalDay)}
                onAddDay={addDay}
                onUpdateDay={handleUpdateDay}
                onRemoveDay={removeDay}
              />
            </div>
          ) : (
            <div className="hidden">
              <ProposalSummaryView
                query={query}
                days={days.map(convertItineraryDayToProposalDay)}
                totalCost={totalCost}
              />
            </div>
          )}
        </div>

        {/* Enhanced Validation Dialog */}
        <EnhancedValidationDialog
          isOpen={showValidationDialog}
          onClose={() => setShowValidationDialog(false)}
          onProceed={handleProceedWithGeneration}
          onSkipRule={handleSkipRule}
          validationRules={validationRules}
          queryId={query?.id}
          title="Proposal Generation Validation"
        />

        {/* Progress Dialog */}
        <GenerationProgressDialog
          isOpen={showProgressDialog}
          steps={generationSteps}
          currentProgress={currentProgress}
          title="Generating Your Proposal"
        />
      </PageLayout>
    </div>
  );
};

export default AdvancedProposalCreation;
