import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Calculator, RefreshCw, CheckCircle, AlertCircle, 
  DollarSign, Users, TrendingUp, Database, Save
} from 'lucide-react';
import { UnifiedPricingService, PricingSnapshot } from '@/services/unifiedPricingService';

interface SimplifiedMarkupModuleProps {
  queryId: string;
  query?: any;
  onPricingUpdate?: (pricing: PricingSnapshot) => void;
}

interface LoadingState {
  isLoading: boolean;
  hasData: boolean;
  source: string;
  errors: string[];
}

export const SimplifiedMarkupModule: React.FC<SimplifiedMarkupModuleProps> = ({
  queryId,
  query,
  onPricingUpdate
}) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  // State management
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);
  const [markupPercentage, setMarkupPercentage] = useState(15);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    hasData: false,
    source: 'none',
    errors: []
  });
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Load and calculate pricing
  const loadPricingData = async () => {
    setLoadingState(prev => ({ ...prev, isLoading: true }));

    try {
      const { success, data, source, errors } = await UnifiedPricingService.loadPricingData(queryId);
      
      if (success && data) {
        // Load saved markup settings
        const markupSettings = UnifiedPricingService.loadMarkupSettings(queryId);
        setMarkupPercentage(markupSettings.percentage);

        // Calculate pricing snapshot
        const snapshot = UnifiedPricingService.calculatePricing(data, markupSettings.percentage);
        setPricingSnapshot(snapshot);
        onPricingUpdate?.(snapshot);

        setLoadingState({
          isLoading: false,
          hasData: true,
          source,
          errors: []
        });

        toast({
          title: "Pricing Data Loaded",
          description: `Found ${data.days.length} days of itinerary data`
        });
      } else {
        setLoadingState({
          isLoading: false,
          hasData: false,
          source,
          errors
        });

        if (errors.length > 0) {
          toast({
            title: "No Data Found",
            description: "Please build your itinerary first",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      setLoadingState({
        isLoading: false,
        hasData: false,
        source: 'error',
        errors: [`Loading error: ${error}`]
      });
    }
  };

  // Handle markup percentage change with debouncing
  const handleMarkupChange = useCallback((newPercentage: number) => {
    if (newPercentage < 0 || newPercentage > 100) return;
    
    setMarkupPercentage(newPercentage);

    // Debounced recalculation to prevent excessive updates
    const timeoutId = setTimeout(() => {
      if (pricingSnapshot) {
        UnifiedPricingService.loadPricingData(queryId).then(({ success, data }) => {
          if (success && data) {
            const newSnapshot = UnifiedPricingService.calculatePricing(data, newPercentage);
            
            // Only update if the snapshot actually changed
            const hasChanged = JSON.stringify(newSnapshot) !== JSON.stringify(pricingSnapshot);
            if (hasChanged) {
              setPricingSnapshot(newSnapshot);
              onPricingUpdate?.(newSnapshot);
            }
          }
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [queryId, pricingSnapshot, onPricingUpdate]);

  // Save markup settings
  const saveMarkupSettings = () => {
    const success = UnifiedPricingService.saveMarkupSettings(queryId, {
      percentage: markupPercentage,
      type: 'percentage'
    });

    if (success) {
      setLastSavedAt(new Date());
      toast({
        title: "Settings Saved",
        description: "Markup configuration saved successfully"
      });
    } else {
      toast({
        title: "Save Failed",
        description: "Could not save markup settings",
        variant: "destructive"
      });
    }
  };

  // Set up real-time sync
  useEffect(() => {
    const cleanup = UnifiedPricingService.setupRealtimeSync(queryId, (snapshot) => {
      if (snapshot) {
        setPricingSnapshot(snapshot);
        setMarkupPercentage(snapshot.markup.percentage);
        onPricingUpdate?.(snapshot);
        
        setLoadingState(prev => ({
          ...prev,
          hasData: true,
          isLoading: false
        }));
      }
    });

    return cleanup;
  }, [queryId, onPricingUpdate]);

  // Initial load
  useEffect(() => {
    loadPricingData();
  }, [queryId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Pricing & Markup
          </h2>
          <p className="text-muted-foreground">
            Simple and efficient pricing management with real-time sync
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Data Status Badge */}
          <Badge variant={loadingState.hasData ? "default" : "secondary"}>
            <Database className="h-3 w-3 mr-1" />
            {loadingState.hasData ? 'Data Loaded' : 'No Data'}
          </Badge>

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPricingData}
            disabled={loadingState.isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${loadingState.isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loadingState.isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading pricing data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {!loadingState.isLoading && !loadingState.hasData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">No pricing data available</p>
              <p className="text-sm">Please build your day-wise itinerary first, then return to configure pricing.</p>
              {loadingState.errors.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer">Technical details</summary>
                  <ul className="mt-1 space-y-1">
                    {loadingState.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State - Show Pricing Interface */}
      {!loadingState.isLoading && loadingState.hasData && pricingSnapshot && (
        <div className="space-y-6">
          
          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Base Cost</p>
                    <p className="text-xl font-bold">{formatCurrency(pricingSnapshot.totalBase)}</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Markup ({pricingSnapshot.markup.percentage}%)</p>
                    <p className="text-xl font-bold text-green-600">+{formatCurrency(pricingSnapshot.markup.amount)}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(pricingSnapshot.finalTotal)}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Markup Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Markup Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="markup-percentage">Markup Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="markup-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={markupPercentage}
                      onChange={(e) => handleMarkupChange(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Markup Amount</Label>
                  <p className="text-lg font-semibold text-green-600">
                    +{formatCurrency(pricingSnapshot.markup.amount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button onClick={saveMarkupSettings} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Service Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Accommodation</p>
                  <p className="font-semibold">{formatCurrency(pricingSnapshot.baseServices.accommodation)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="font-semibold">{formatCurrency(pricingSnapshot.baseServices.activities)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Transport</p>
                  <p className="font-semibold">{formatCurrency(pricingSnapshot.baseServices.transport)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Meals</p>
                  <p className="font-semibold">{formatCurrency(pricingSnapshot.baseServices.meals)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per Person Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Per Person Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Adult Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(pricingSnapshot.perPerson.adult)}</p>
                  <p className="text-xs text-muted-foreground">per person</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Child Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(pricingSnapshot.perPerson.child)}</p>
                  <p className="text-xs text-muted-foreground">per child (25% discount)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-save Status */}
          {lastSavedAt && (
            <div className="flex justify-end">
              <Badge variant="secondary" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Last saved: {lastSavedAt.toLocaleTimeString()}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};