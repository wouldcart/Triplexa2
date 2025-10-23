import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  RefreshCw, AlertTriangle, CheckCircle, DollarSign, 
  Calculator, Settings, FileText, TrendingUp, Save,
  Database, Clock, Zap
} from 'lucide-react';
import { MarkupDataService } from '@/services/markupDataService';
import { PricingService } from '@/services/pricingService';
import { EnhancedMarkupData, AccommodationPricingOption } from '@/types/enhancedMarkup';
import { DataOverviewPanel } from './DataOverviewPanel';
import { MarkupConfigurationPanel } from './MarkupConfigurationPanel';
import { PricingCalculatorPanel } from './PricingCalculatorPanel';
import { FinalPricingSummaryPanel } from './FinalPricingSummaryPanel';

interface EnhancedMarkupTabModuleProps {
  queryId: string;
  query?: any;
  onMarkupUpdate?: (markup: any) => void;
}

interface DataLoadingState {
  isLoading: boolean;
  source: string;
  lastUpdated?: string;
  errors: string[];
  dataCount: number;
}

export const EnhancedMarkupTabModule: React.FC<EnhancedMarkupTabModuleProps> = ({
  queryId,
  query,
  onMarkupUpdate
}) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  
  // Core data state
  const [itineraryData, setItineraryData] = useState<any[]>([]);
  const [markupData, setMarkupData] = useState<EnhancedMarkupData>({
    options: [],
    selectedOption: 'standard',
    markupSettings: {
      type: 'percentage',
      percentage: 15
    },
    adults: query?.paxDetails?.adults || 1,
    children: query?.paxDetails?.children || 0,
    totalPax: (query?.paxDetails?.adults || 1) + (query?.paxDetails?.children || 0)
  });
  
  // Loading and sync state
  const [loadingState, setLoadingState] = useState<DataLoadingState>({
    isLoading: true,
    source: 'empty',
    errors: [],
    dataCount: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Load itinerary data
      const { data: itinerary, source, errors } = await MarkupDataService.loadItineraryData(queryId);
      
      // Load markup settings
      const markupSettings = MarkupDataService.loadProposalMarkupSettings(queryId);
      
      // Update state
      setItineraryData(itinerary);
      setMarkupData(prev => ({
        ...prev,
        markupSettings
      }));
      
      setLoadingState({
        isLoading: false,
        source,
        lastUpdated: new Date().toISOString(),
        errors,
        dataCount: itinerary.length
      });

      // Calculate pricing options
      if (itinerary.length > 0) {
        calculatePricingOptions(itinerary, markupSettings);
      }

      // Show success/warning based on data found
      if (itinerary.length > 0) {
        toast({
          title: "Data Loaded Successfully",
          description: `Found ${itinerary.length} days from ${source}`,
        });
      } else if (errors.length > 0) {
        toast({
          title: "No Data Found",
          description: "No itinerary data found. Please build your itinerary first.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        errors: [...prev.errors, `Loading error: ${error}`]
      }));
      
      toast({
        title: "Loading Error",
        description: "Failed to load itinerary data",
        variant: "destructive"
      });
    }
  }, [queryId, toast]);

  // Calculate pricing options based on loaded data
  const calculatePricingOptions = useCallback((
    itinerary: any[], 
    markupSettings: any
  ) => {
    const options: AccommodationPricingOption[] = ['standard', 'optional', 'alternative'].map(type => {
      const accommodations = MarkupDataService.extractAccommodationsByType(itinerary, type as any);
      const serviceCosts = MarkupDataService.calculateServiceCosts(
        itinerary, 
        markupData.adults, 
        markupData.children
      );
      
      const baseTotal = accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0) + 
                       serviceCosts.sightseeing.total + 
                       serviceCosts.transport.totalCost + 
                       serviceCosts.dining.total;
      
      const markup = MarkupDataService.calculateMarkup(baseTotal, markupSettings, markupData.totalPax);
      const finalTotal = baseTotal + markup;
      
      const distribution = {
        method: 'separate' as const,
        adultPrice: markupData.adults > 0 ? finalTotal / markupData.adults : 0,
        childPrice: markupData.children > 0 ? finalTotal * 0.75 / markupData.children : 0, // 25% discount for children
        totalPrice: finalTotal
      };

      return {
        type: type as any,
        accommodations,
        serviceCosts,
        baseTotal,
        markup,
        finalTotal,
        distribution
      };
    });

    setMarkupData(prev => ({ ...prev, options }));
    
    // Notify parent component
    onMarkupUpdate?.({
      markupData: { ...markupData, options },
      selectedOption: markupData.selectedOption,
      finalPricing: options.find(opt => opt.type === markupData.selectedOption)
    });
  }, [markupData.adults, markupData.children, markupData.totalPax, markupData.selectedOption, onMarkupUpdate]);

  // Handle markup settings update
  const handleMarkupSettingsUpdate = useCallback((newSettings: any) => {
    const updatedMarkupData = {
      ...markupData,
      markupSettings: newSettings
    };
    
    setMarkupData(updatedMarkupData);
    
    // Save settings
    const saved = MarkupDataService.saveProposalMarkupSettings(queryId, newSettings);
    if (saved) {
      setLastSavedAt(new Date());
      toast({
        title: "Settings Saved",
        description: "Markup configuration updated successfully"
      });
    }
    
    // Recalculate pricing
    if (itineraryData.length > 0) {
      calculatePricingOptions(itineraryData, newSettings);
    }
  }, [queryId, markupData, itineraryData, calculatePricingOptions, toast]);

  // Handle option selection
  const handleOptionSelect = useCallback((option: 'standard' | 'optional' | 'alternative') => {
    setMarkupData(prev => ({ ...prev, selectedOption: option }));
    
    const selectedPricing = markupData.options.find(opt => opt.type === option);
    onMarkupUpdate?.({
      markupData,
      selectedOption: option,
      finalPricing: selectedPricing
    });
  }, [markupData, onMarkupUpdate]);

  // Set up real-time data sync
  useEffect(() => {
    const cleanup = MarkupDataService.setupRealTimeSync(queryId, (data) => {
      if (data.length !== itineraryData.length) {
        setItineraryData(data);
        setLoadingState(prev => ({
          ...prev,
          dataCount: data.length,
          lastUpdated: new Date().toISOString()
        }));
        
        if (data.length > 0) {
          calculatePricingOptions(data, markupData.markupSettings);
        }
      }
    });

    return cleanup;
  }, [queryId, itineraryData.length, calculatePricingOptions, markupData.markupSettings]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
  const totalBaseCost = MarkupDataService.calculateTotalBaseCost(itineraryData);

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Enhanced Markup Management
          </h2>
          <p className="text-muted-foreground">
            Comprehensive pricing configuration with live data sync
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Data Status */}
          <Badge 
            variant={loadingState.dataCount > 0 ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <Database className="h-3 w-3" />
            {loadingState.dataCount} days
          </Badge>
          
          {/* Last Updated */}
          {loadingState.lastUpdated && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(loadingState.lastUpdated).toLocaleTimeString()}
            </Badge>
          )}
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loadingState.isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${loadingState.isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loadingState.isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading itinerary data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {loadingState.errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {loadingState.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
              {loadingState.errors.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{loadingState.errors.length - 3} more errors
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State - Data Found */}
      {!loadingState.isLoading && loadingState.dataCount > 0 && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Base Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(totalBaseCost)}</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Markup</p>
                    <p className="text-lg font-semibold">
                      {selectedOption ? formatCurrency(selectedOption.markup) : formatCurrency(0)}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Total</p>
                    <p className="text-lg font-semibold">
                      {selectedOption ? formatCurrency(selectedOption.finalTotal) : formatCurrency(0)}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Source</p>
                    <p className="text-sm font-medium">{loadingState.source.split('_')[0]}</p>
                  </div>
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Data Overview
              </TabsTrigger>
              <TabsTrigger value="markup" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Markup Config
              </TabsTrigger>
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Final Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DataOverviewPanel
                itineraryData={itineraryData}
                markupData={markupData}
                onOptionSelect={handleOptionSelect}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="markup" className="space-y-6">
              <MarkupConfigurationPanel
                queryId={queryId}
                markupSettings={markupData.markupSettings}
                onSettingsUpdate={handleMarkupSettingsUpdate}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="calculator" className="space-y-6">
              <PricingCalculatorPanel
                markupData={markupData}
                itineraryData={itineraryData}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <FinalPricingSummaryPanel
                markupData={markupData}
                selectedOption={selectedOption}
                formatCurrency={formatCurrency}
                onSave={() => {
                  setLastSavedAt(new Date());
                  toast({
                    title: "Pricing Saved",
                    description: "Final pricing configuration saved successfully"
                  });
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Auto-save Status */}
          {lastSavedAt && (
            <div className="flex justify-end">
              <Badge variant="secondary" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Auto-saved at {lastSavedAt.toLocaleTimeString()}
              </Badge>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loadingState.isLoading && loadingState.dataCount === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Itinerary Data Found</h3>
            <p className="text-muted-foreground mb-4">
              Please build your day-wise itinerary first before configuring markup settings.
            </p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};