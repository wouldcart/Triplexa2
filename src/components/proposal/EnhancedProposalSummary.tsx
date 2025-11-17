import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Hotel, 
  Car, 
  Calculator, 
  Eye, 
  EyeOff,
  TrendingUp,
  TrendingDown,
  Package,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { useOptionalRecords } from '@/hooks/useOptionalRecords';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types for enhanced summary
interface EnhancedProposalSummaryProps {
  query: any;
  accommodations: any[];
  transportRoutes: any[];
  activities: any[];
  proposalId: string;
  className?: string;
  showToggleControls?: boolean;
  onOptionalToggle?: (itemId: string, itemType: 'activity' | 'transport' | 'sightseeing', isOptional: boolean) => void;
}

interface PackageCalculation {
  mandatoryTotal: number;
  optionalTotal: number;
  combinedTotal: number;
  optionalItems: OptionalItem[];
  mandatoryItems: MandatoryItem[];
}

interface OptionalItem {
  id: string;
  name: string;
  type: 'activity' | 'transport' | 'sightseeing';
  cost: number;
  isOptional: boolean;
  city?: string;
  day?: number;
}

interface MandatoryItem {
  id: string;
  name: string;
  type: 'activity' | 'transport' | 'sightseeing';
  cost: number;
  city?: string;
  day?: number;
}

interface CityOptionalSummary {
  cityName: string;
  mandatoryCount: number;
  optionalCount: number;
  mandatoryCost: number;
  optionalCost: number;
}

export const EnhancedProposalSummary: React.FC<EnhancedProposalSummaryProps> = ({
  query,
  accommodations,
  transportRoutes,
  activities,
  proposalId,
  className = '',
  showToggleControls = true,
  onOptionalToggle
}) => {
  const { toast } = useToast();
  const [showOptionalOnly, setShowOptionalOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'calculations']));

  // Get optional records from the hook
  const {
    optionalRecords,
    isLoading: isOptionalLoading,
    updateOptionalItem,
    getOptionalStatus
  } = useOptionalRecords(proposalId, {
    enableRealTimeSync: true,
    enableDebouncing: true
  });

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Enhanced calculation logic that separates mandatory and optional items
  const packageCalculations = useMemo((): PackageCalculation => {
    if (!query) {
      return {
        mandatoryTotal: 0,
        optionalTotal: 0,
        combinedTotal: 0,
        optionalItems: [],
        mandatoryItems: []
      };
    }

    const optionalItems: OptionalItem[] = [];
    const mandatoryItems: MandatoryItem[] = [];

    // Process activities
    activities.forEach((activity: any) => {
      const isOptional = getOptionalStatus(activity.id, 'sightseeing');
      const item = {
        id: activity.id,
        name: activity.name || activity.title || 'Unnamed Activity',
        type: 'sightseeing' as const,
        cost: activity.cost || 0,
        isOptional,
        city: activity.city,
        day: activity.day
      };

      if (isOptional) {
        optionalItems.push(item);
      } else {
        mandatoryItems.push(item);
      }
    });

    // Process transport routes
    transportRoutes.forEach((route: any) => {
      const isOptional = getOptionalStatus(route.id, 'transport');
      const item = {
        id: route.id,
        name: route.name || `${route.from} → ${route.to}`,
        type: 'transport' as const,
        cost: route.price || 0,
        isOptional,
        city: route.from
      };

      if (isOptional) {
        optionalItems.push(item);
      } else {
        mandatoryItems.push(item);
      }
    });

    // Calculate totals
    const mandatoryTotal = mandatoryItems.reduce((sum, item) => sum + item.cost, 0);
    const optionalTotal = optionalItems.reduce((sum, item) => sum + item.cost, 0);
    const combinedTotal = mandatoryTotal + optionalTotal;

    return {
      mandatoryTotal,
      optionalTotal,
      combinedTotal,
      optionalItems,
      mandatoryItems
    };
  }, [activities, transportRoutes, getOptionalStatus]);

  // Calculate city-wise optional summary
  const cityOptionalSummaries = useMemo((): CityOptionalSummary[] => {
    const cityMap = new Map<string, CityOptionalSummary>();

    // Process all items by city
    [...packageCalculations.mandatoryItems, ...packageCalculations.optionalItems].forEach(item => {
      if (item.city) {
        if (!cityMap.has(item.city)) {
          cityMap.set(item.city, {
            cityName: item.city,
            mandatoryCount: 0,
            optionalCount: 0,
            mandatoryCost: 0,
            optionalCost: 0
          });
        }

        const summary = cityMap.get(item.city)!;
        if (item.isOptional) {
          summary.optionalCount++;
          summary.optionalCost += item.cost;
        } else {
          summary.mandatoryCount++;
          summary.mandatoryCost += item.cost;
        }
      }
    });

    return Array.from(cityMap.values());
  }, [packageCalculations]);

  // Handle optional item toggle
  const handleOptionalToggle = useCallback(async (itemId: string, itemType: 'activity' | 'transport' | 'sightseeing', newOptional: boolean) => {
    try {
      await updateOptionalItem(itemId, itemType, newOptional);
      
      // Call external callback if provided
      if (onOptionalToggle) {
        onOptionalToggle(itemId, itemType, newOptional);
      }

      toast({
        title: "Updated",
        description: `Item marked as ${newOptional ? 'optional' : 'included'}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update item status",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [updateOptionalItem, onOptionalToggle, toast]);

  // Calculate accommodation pricing with optional handling
  const accommodationCalculations = useMemo(() => {
    if (!accommodations || !query) return [];

    return accommodations.map((acc, index) => {
      const adults = query.paxDetails?.adults || 1;
      const children = query.paxDetails?.children || 0;
      const totalNights = acc.nights || 1;
      
      const basePrice = acc.price || 0;
      const adultPrice = basePrice * adults * totalNights;
      const childPrice = children > 0 ? (basePrice * 0.5 * children * totalNights) : 0; // 50% discount for children
      const totalPrice = adultPrice + childPrice;

      return {
        optionNumber: index + 1,
        hotelName: acc.name || acc.hotelName || 'Unnamed Hotel',
        category: acc.category || 'Standard',
        nights: totalNights,
        adultPrice,
        childPrice,
        totalPrice,
        perPersonRate: totalPrice / (adults + children)
      };
    });
  }, [accommodations, query]);

  // Format currency helper
  const formatPrice = useCallback((amount: number) => {
    return formatCurrency(amount, query?.destination?.country || 'USA');
  }, [query]);

  // Loading state
  if (isOptionalLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading optional records...</span>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Enhanced Summary Overview */}
        <Card className="p-6 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Enhanced Package Summary</h3>
                <p className="text-sm text-muted-foreground">Mandatory + Optional Components</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                <Calculator className="h-3 w-3 mr-1" />
                {packageCalculations.mandatoryItems.length} Mandatory
              </Badge>
              <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                <Eye className="h-3 w-3 mr-1" />
                {packageCalculations.optionalItems.length} Optional
              </Badge>
            </div>
          </div>

          {/* Dynamic Range Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Base Package (Mandatory Only) */}
            <div className="p-4 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-200 dark:bg-blue-800 rounded">
                  <Package className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Base Package</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatPrice(packageCalculations.mandatoryTotal)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Mandatory components only</div>
            </div>

            {/* Optional Range */}
            <div className="p-4 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-amber-200 dark:bg-amber-800 rounded">
                  <TrendingUp className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Optional Add-ons</span>
              </div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                +{formatPrice(packageCalculations.optionalTotal)}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                {packageCalculations.optionalItems.length} optional items
              </div>
            </div>

            {/* Combined Total */}
            <div className="p-4 bg-green-100/50 dark:bg-green-900/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-200 dark:bg-green-800 rounded">
                  <DollarSign className="h-4 w-4 text-green-700 dark:text-green-300" />
                </div>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Complete Package</span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatPrice(packageCalculations.combinedTotal)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Base + All optional items
              </div>
            </div>
          </div>

          {/* Package Range Summary */}
          <div className="p-4 bg-gradient-to-r from-blue-50/30 via-amber-50/30 to-green-50/30 dark:from-blue-950/20 dark:via-amber-950/20 dark:to-green-950/20 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Package Range</div>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(packageCalculations.mandatoryTotal)} → {formatPrice(packageCalculations.combinedTotal)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(packageCalculations.mandatoryTotal)} - {formatPrice(packageCalculations.combinedTotal)}
                </div>
                <div className="text-xs text-muted-foreground">Flexible pricing range</div>
              </div>
            </div>
          </div>
        </Card>

        {/* City-wise Optional Summary */}
        {cityOptionalSummaries.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">City-wise Optional Breakdown</h4>
                  <p className="text-sm text-muted-foreground">Optional components by destination</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('cities')}
                className="text-muted-foreground"
              >
                {expandedSections.has('cities') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {expandedSections.has('cities') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityOptionalSummaries.map((city) => (
                  <div key={city.cityName} className="p-4 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-purple-900 dark:text-purple-100">{city.cityName}</span>
                      <Badge variant="outline" className="text-xs">
                        {city.mandatoryCount + city.optionalCount} items
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Mandatory:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{city.mandatoryCount} items</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">{formatPrice(city.mandatoryCost)}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Optional:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{city.optionalCount} items</div>
                          <div className="text-xs text-amber-600 dark:text-amber-400">{formatPrice(city.optionalCost)}</div>
                        </div>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between items-center font-semibold">
                        <span>City Total:</span>
                        <span className="text-purple-700 dark:text-purple-300">
                          {formatPrice(city.mandatoryCost + city.optionalCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Optional Items Management */}
        {showToggleControls && packageCalculations.optionalItems.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Optional Components</h4>
                  <p className="text-sm text-muted-foreground">Toggle optional items on/off</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showOptionalOnly}
                  onCheckedChange={setShowOptionalOnly}
                />
                <span className="text-sm text-muted-foreground">Show optional only</span>
              </div>
            </div>

            <div className="space-y-3">
              {packageCalculations.optionalItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50/30 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!item.isOptional} // Inverted because switch shows "included" when checked
                      onCheckedChange={(checked) => handleOptionalToggle(item.id, item.type, !checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.city && `${item.city} • `}
                        {item.type === 'transport' ? 'Transport' : item.type === 'sightseeing' ? 'Activity' : 'Service'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(item.cost)}</div>
                    <Badge 
                      variant={item.isOptional ? "outline" : "default"}
                      className={item.isOptional 
                        ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs" 
                        : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs"
                      }
                    >
                      {item.isOptional ? 'Optional' : 'Included'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Accommodation Options with Optional Integration */}
        {accommodationCalculations.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Hotel className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Accommodation Options</h4>
                  <p className="text-sm text-muted-foreground">Hotel options with optional components</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('accommodations')}
                className="text-muted-foreground"
              >
                {expandedSections.has('accommodations') ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {expandedSections.has('accommodations') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accommodationCalculations.map((option) => (
                  <div key={option.optionNumber} className="p-4 bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-green-900 dark:text-green-100">Option {option.optionNumber}</div>
                        <div className="text-sm text-muted-foreground">{option.hotelName}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">{option.category} • {option.nights} nights</div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        {option.nights}N
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Accommodation:</span>
                        <span className="font-medium">{formatPrice(option.totalPrice)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Services & Activities:</span>
                        <span className="font-medium">{formatPrice(packageCalculations.mandatoryTotal)}</span>
                      </div>

                      {packageCalculations.optionalTotal > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Optional Add-ons:</span>
                          <span className="font-medium text-amber-700 dark:text-amber-300">+{formatPrice(packageCalculations.optionalTotal)}</span>
                        </div>
                      )}
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between items-center font-semibold">
                        <span>Package Total:</span>
                        <span className="text-green-700 dark:text-green-300">
                          {formatPrice(option.totalPrice + packageCalculations.mandatoryTotal + packageCalculations.optionalTotal)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-right">
                        {formatPrice(option.perPersonRate + (packageCalculations.combinedTotal / (query?.paxDetails?.adults + query?.paxDetails?.children || 1)))} per person
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50 text-center">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {packageCalculations.mandatoryItems.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Mandatory Items</div>
          </div>
          
          <div className="p-4 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50 text-center">
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {packageCalculations.optionalItems.length}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">Optional Items</div>
          </div>
          
          <div className="p-4 bg-green-100/50 dark:bg-green-900/30 rounded-lg border border-green-200/50 dark:border-green-800/50 text-center">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {cityOptionalSummaries.length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Cities with Options</div>
          </div>
          
          <div className="p-4 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg border border-purple-200/50 dark:border-purple-800/50 text-center">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {accommodationCalculations.length}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Hotel Options</div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EnhancedProposalSummary;