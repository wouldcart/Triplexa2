import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Eye, Car, Hotel, MapPin, Calendar, DollarSign, Clock, Users, CheckCircle2, Activity } from "lucide-react";
import { formatCurrency } from '@/utils/currencyUtils';
import { Query } from '@/types/query';
import { AccommodationStay } from '@/utils/accommodationCalculations';
import { calculateAccommodationOptionsPricing } from '@/utils/accommodationPricingUtils';
import { AccommodationPricingBreakdown } from './pricing/AccommodationPricingBreakdown';
import { ItineraryDay } from './DayByDayItineraryBuilder';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';
import { useDebounce } from '@/hooks/useDebounce';
import { computeProposalSummarySnapshot, snapshotToEnhancedMarkupData, dispatchProposalSummaryUpdate } from '@/utils/markupSync';
interface CompactProposalSummaryProps {
  days: ItineraryDay[];
  query: Query;
  accommodations: AccommodationStay[];
  accommodationsByDay: {
    [dayNumber: number]: AccommodationStay[];
  };
}
export const CompactProposalSummary: React.FC<CompactProposalSummaryProps> = ({
  days,
  query,
  accommodations,
  accommodationsByDay
}) => {
  const queryId = query?.id || '';
  const { updateAccommodationData } = useProposalPersistence(queryId, 'enhanced');
  const { debouncedFn: debouncedUpdate } = useDebounce(updateAccommodationData, 1000);

  // Compute and persist pricing snapshot whenever data changes - with proper debouncing
  useEffect(() => {
    if (days.length > 0 && query) {
      const snapshot = computeProposalSummarySnapshot(days, accommodations, query);
      const markupData = snapshotToEnhancedMarkupData(snapshot, query);
      
      // Debounced update to persistence data
      debouncedUpdate({
        selectedAccommodations: [],
        markupData
      });
      
      // Dispatch real-time sync event (immediate)
      dispatchProposalSummaryUpdate(queryId, snapshot);
    }
  }, [days, accommodations, query, queryId, debouncedUpdate]);

  if (days.length === 0) return null;

  // Aggregate all activities by type
  const allActivities = days.flatMap(day => day.activities.map(activity => ({
    ...activity,
    dayNumber: day.dayNumber,
    city: day.city,
    date: day.date
  })));
  const sightseeingActivities = allActivities.filter(activity => activity.type === 'sightseeing' || activity.type === 'activity');
  const transportActivities = allActivities.filter(activity => activity.transportType && activity.transportType !== 'none' && activity.transportType !== 'walking');

  // Calculate totals
  const totalCost = allActivities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
  
  // Calculate transport routes cost
  const allTransportRoutes = days.flatMap(day => day.transport.map(transport => ({
    ...transport,
    dayNumber: day.dayNumber,
    date: day.date,
    city: day.city
  })));
  const transportRoutesCost = allTransportRoutes.reduce((sum, route) => sum + (route.price || 0), 0);
  
  // Calculate base cost (services & activities + transport) - same across all options
  const baseCost = totalCost + transportRoutesCost;

  // Calculate enhanced accommodation pricing using new utilities
  const accommodationOptions = calculateAccommodationOptionsPricing(
    accommodations, 
    query
  );

  // Get unique accommodations (for backward compatibility with stats)
  const uniqueAccommodations = [...new Map(accommodations.map(acc => [acc.hotelId, acc])).values()];
  return <Card className="card-gradient shadow-elegant border-border/40 transition-smooth hover:shadow-medium">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <span className="text-responsive-lg">Proposal Summary</span>
          </div>
          <Badge variant="secondary" className="self-start sm:ml-auto text-xs px-2 py-1">
            {days.length} Day{days.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quick Stats Grid - Mobile Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 glass-effect rounded-xl">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-foreground">{sightseeingActivities.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Activities</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-foreground">{transportActivities.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Transfers</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-foreground">{uniqueAccommodations.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Hotels</div>
          </div>
          <div className="text-center">
            {(() => {
              const accommodationOptions = calculateAccommodationOptionsPricing(accommodations, query);
              if (accommodationOptions.length === 0) {
                return (
                  <>
                    <div className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(baseCost, query?.destination.country || 'USA')}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Base Cost</div>
                  </>
                );
              } else if (accommodationOptions.length === 1) {
                const grandTotal = baseCost + accommodationOptions[0].totalCost;
                return (
                  <>
                    <div className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(grandTotal, query?.destination.country || 'USA')}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
                  </>
                );
              } else {
                const minTotal = baseCost + Math.min(...accommodationOptions.map(opt => opt.totalCost));
                const maxTotal = baseCost + Math.max(...accommodationOptions.map(opt => opt.totalCost));
                return (
                  <>
                    <div className="text-lg sm:text-xl font-bold text-primary">
                      {formatCurrency(minTotal, query?.destination.country || 'USA')} - {formatCurrency(maxTotal, query?.destination.country || 'USA')}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Package Range</div>
                  </>
                );
              }
            })()}
          </div>
        </div>

        {/* Adult/Child Pricing Breakup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Services & Activities Pricing */}
          <Card className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Activity className="h-4 w-4" />
                Services & Activities
              </h4>
              <div className="space-y-2">
                {(() => {
                  const adults = query?.paxDetails.adults || 1;
                  const children = query?.paxDetails.children || 0;
                  const totalPax = adults + children;
                  const serviceTotal = totalCost + transportRoutesCost;
                  const adultServicePrice = (serviceTotal / totalPax) * adults;
                  const childServicePrice = children > 0 ? (serviceTotal / totalPax) * children : 0; // No discount for children
                  const adjustedTotal = adultServicePrice + childServicePrice;
                  
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Adults ({adults}):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(adultServicePrice, query?.destination.country || 'USA')}
                        </span>
                      </div>
                      {children > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Children ({children}):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(childServicePrice, query?.destination.country || 'USA')}
                          </span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Subtotal:</span>
                        <span className="text-blue-700 dark:text-blue-300">
                          {formatCurrency(adjustedTotal, query?.destination.country || 'USA')}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </Card>

          {/* Enhanced Hotel Pricing Breakdown - Using New Component */}
          <Card className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-green-800 dark:text-green-200">
                <Hotel className="h-4 w-4" />
                Accommodation Options Summary
              </h4>
              <div className="space-y-2">
                {(() => {
                  // Calculate accommodation options pricing
                  const accommodationOptions = calculateAccommodationOptionsPricing(
                    accommodations, 
                    query
                  );
                  
                  if (accommodationOptions.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground">
                        No accommodations configured
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {accommodationOptions.map((option) => {
                        const { adults: adultPricing, children: childPricing, totalPrice } = option.pricingBreakdown;
                        return (
                          <div key={option.optionNumber} className="p-3 bg-background/60 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Option {option.optionNumber}
                              </span>
                              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                {formatCurrency(totalPrice, query?.destination.country || 'USA')}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span>Adults ({adultPricing.count}):</span>
                                <span>{formatCurrency(adultPricing.totalPrice, query?.destination.country || 'USA')}</span>
                              </div>
                              {childPricing.count > 0 && (
                                <div className="flex justify-between">
                                  <span>Children ({childPricing.count}):</span>
                                  <span>{formatCurrency(childPricing.totalPrice, query?.destination.country || 'USA')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                   );
                })()}
              </div>
            </div>
          </Card>
        </div>

        {/* Grand Total Summary with Separate Adult/Child Accommodation Pricing */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Package Total Breakdown</h4>
            
            {/* Services & Activities Total */}
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <div>
                <span className="font-medium">Services & Activities</span>
                <p className="text-sm text-muted-foreground">
                  For {query?.paxDetails.adults || 1} adult{(query?.paxDetails.adults || 1) > 1 ? 's' : ''}
                  {query?.paxDetails.children > 0 && ` and ${query.paxDetails.children} child${query.paxDetails.children > 1 ? 'ren' : ''}`}
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">
                  {formatCurrency(baseCost, query?.destination.country || 'USA')}
                </div>
              </div>
            </div>

            {/* Package Options - Separate Grand Totals per Accommodation Option */}
            {(() => {
              const accommodationOptions = calculateAccommodationOptionsPricing(
                accommodations, 
                query
              );
              
              return accommodationOptions.map((option) => {
                const { adults: adultPricing, children: childPricing, totalPrice } = option.pricingBreakdown;
                const packageGrandTotal = baseCost + totalPrice;
                const perPersonRate = packageGrandTotal / ((query?.paxDetails.adults || 1) + (query?.paxDetails.children || 0));
                
                return (
                  <div key={option.optionNumber} className="space-y-3 pb-4 border-b border-border/50 last:border-b-0">
                    {/* Option Header */}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Package Option {option.optionNumber}</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(packageGrandTotal, query?.destination.country || 'USA')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(perPersonRate, query?.destination.country || 'USA')} per person
                        </div>
                      </div>
                    </div>
                    
                    {/* Option Breakdown */}
                    <div className="ml-4 space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>• Services & Activities:</span>
                        <span>{formatCurrency(baseCost, query?.destination.country || 'USA')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Accommodation Option {option.optionNumber}:</span>
                        <span>{formatCurrency(totalPrice, query?.destination.country || 'USA')}</span>
                      </div>
                      {adultPricing.count > 0 && (
                        <div className="flex justify-between ml-4 text-xs">
                          <span>- Adults ({adultPricing.count}):</span>
                          <span>{formatCurrency(adultPricing.totalPrice, query?.destination.country || 'USA')}</span>
                        </div>
                      )}
                      {childPricing.count > 0 && (
                        <div className="flex justify-between ml-4 text-xs">
                          <span>- Children ({childPricing.count}):</span>
                          <span>{formatCurrency(childPricing.totalPrice, query?.destination.country || 'USA')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>

        {/* Enhanced Accommodation Summary - Separate Options with Adult/Child Pricing */}
        {(() => {
          const accommodationOptions = calculateAccommodationOptionsPricing(
            accommodations, 
            query
          );
          
          return accommodationOptions.map((optionBreakdown) => (
            <AccommodationPricingBreakdown
              key={optionBreakdown.optionNumber}
              optionBreakdown={optionBreakdown}
              query={query}
              showDetailedBreakdown={true}
            />
          ));
        })()}

        {/* Enhanced Activities Summary */}
        {sightseeingActivities.length > 0 && <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary shrink-0" />
                <h4 className="font-medium text-foreground text-responsive">
                  Activities & Sightseeing ({sightseeingActivities.length})
                </h4>
              </div>
              <Badge variant="outline" className="self-start sm:ml-auto text-xs px-2 py-1">
                {formatCurrency(sightseeingActivities.reduce((sum, act) => sum + (act.cost || 0), 0), query?.destination.country || 'USA')}
              </Badge>
            </div>
            <div className="space-y-2">
              {sightseeingActivities.map((activity, idx) => <div key={`activity-${activity.id || `${activity.name}-${idx}`}`} className="glass-effect p-3 rounded-lg transition-smooth hover:shadow-md border-l-4 border-l-primary/30">
                  {/* Enhanced Header with icons and visual hierarchy */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Activity Type Icon */}
                      <div className="bg-primary/10 text-primary rounded-lg p-2 shrink-0">
                        {activity.type === 'sightseeing' ? (
                          <Eye className="h-4 w-4" />
                        ) : activity.type === 'activity' ? (
                          <Activity className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        {/* Activity Number Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            #{idx + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 capitalize">
                            {activity.type}
                          </Badge>
                        </div>
                        <h5 className="text-sm font-semibold text-foreground leading-tight">
                          {activity.name || `Activity ${idx + 1}`}
                        </h5>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 shrink-0">
                      Day {activity.dayNumber}
                    </Badge>
                  </div>

                  {/* Compact description */}
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-4">
                      {activity.description}
                    </p>
                  )}

                  {/* Consolidated Info Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Activity className="h-3 w-3 shrink-0" />
                      <span className="truncate">{activity.type === 'sightseeing' ? 'Culture' : activity.type === 'activity' ? 'Adventure' : 'General'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{activity.city}</span>
                    </div>
                    {activity.duration && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{activity.duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Package Options Display */}
                  {activity.selectedOptions && activity.selectedOptions.length > 0 ? (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Package className="h-3 w-3 text-green-600 shrink-0" />
                        <span className="text-xs font-medium text-green-600">Package Includes:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activity.selectedOptions.slice(0, 2).map((option: any, i: number) => (
                          <Badge key={`option-${activity.id || activity.name}-${i}-${typeof option === 'object' ? (option.id || option.name || option.title) : option}`} variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
                            {typeof option === 'object' ? (option.name || option.title || option.id) : option}
                          </Badge>
                        ))}
                        {activity.selectedOptions.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            +{activity.selectedOptions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mb-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
                        {activity.name || 'Experience'} Included
                      </Badge>
                    </div>
                  )}

                  {/* Compact Transport Info */}
                  {activity.transportType && activity.transportType !== 'none' && activity.transportType !== 'walking' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Car className="h-3 w-3 text-blue-600 shrink-0" />
                      <span className="text-xs text-blue-600">
                        {(() => {
                          // Helper function to convert type indicators to proper vehicle names
                          const getVehicleNameFromType = (vehicleType: string): string => {
                            const type = vehicleType.toLowerCase().trim();
                            switch (type) {
                              case 'private':
                                return 'Private Car';
                              case 'sic':
                                return 'Shared Vehicle';
                              case 'private_car':
                                return 'Private Car';
                              case 'private_van':
                                return 'Private Van';
                              case 'shared_car':
                                return 'Shared Car';
                              case 'bus':
                                return 'Tour Bus';
                              case 'minibus':
                                return 'Mini Bus';
                              case 'suv':
                                return 'SUV';
                              case 'taxi':
                                return 'Taxi';
                              case 'tuk_tuk':
                                return 'Tuk Tuk';
                              case 'songthaew':
                                return 'Red Songthaew';
                              default:
                                return vehicleType;
                            }
                          };

                          // Get vehicle name
                          let vehicleName = 'Standard Vehicle';
                          if (activity.vehicleType && activity.vehicleType.trim() !== '' && activity.vehicleType !== 'Standard Vehicle' && activity.vehicleType !== 'standard') {
                            vehicleName = getVehicleNameFromType(activity.vehicleType);
                          } else if (activity.selectedOptions && typeof activity.selectedOptions === 'object' && !Array.isArray(activity.selectedOptions) && (activity.selectedOptions as any).transferOption?.vehicleType && (activity.selectedOptions as any).transferOption.vehicleType.trim() !== '') {
                            vehicleName = getVehicleNameFromType((activity.selectedOptions as any).transferOption.vehicleType);
                          } else if (activity.transportType === 'private_car' || activity.transportType === 'private' || (activity.transportLabel && activity.transportLabel.toLowerCase().includes('private'))) {
                            vehicleName = 'Private Car';
                          } else if (activity.transportType === 'private_van') vehicleName = 'Private Van';
                          else if (activity.transportType === 'shared_car') vehicleName = 'Shared Car';
                          else if (activity.transportType === 'bus') vehicleName = 'Tour Bus';
                          else if (activity.transportType === 'minibus') vehicleName = 'Mini Bus';
                          else if (activity.transportType === 'suv') vehicleName = 'SUV';
                          else if (activity.transportType === 'taxi') vehicleName = 'Taxi';
                          else if (activity.transportType === 'tuk_tuk') vehicleName = 'Tuk Tuk';
                          else if (activity.transportType === 'songthaew') vehicleName = 'Red Songthaew';
                          else if (activity.transportType && (activity.transportType.toLowerCase().includes('private') || activity.transportType === 'suv')) vehicleName = 'Private Car';

                          // Get vehicle capacity (default values based on vehicle type)
                          const getVehicleCapacity = (vehicleName: string): number => {
                            switch (vehicleName.toLowerCase()) {
                              case 'private car':
                                return 4;
                              case 'private van':
                                return 8;
                              case 'suv':
                                return 6;
                              case 'mini bus':
                                return 15;
                              case 'tour bus':
                                return 45;
                              case 'taxi':
                                return 4;
                              case 'tuk tuk':
                                return 3;
                              case 'red songthaew':
                                return 10;
                              case 'shared vehicle':
                                return 12;
                              case 'shared car':
                                return 4;
                              default:
                                return 4;
                            }
                          };
                          
                          const vehicleCapacity = activity.seatingCapacity || getVehicleCapacity(vehicleName);
                          const totalPax = activity.effectivePax || query?.paxDetails?.adults || 2;
                          const vehicleCount = activity.vehicleCount || Math.ceil(totalPax / vehicleCapacity);

                          // Transfer type determination
                          const getTransferType = () => {
                            if (activity.transportType && (activity.transportType.toLowerCase().includes('private') || activity.transportType === 'private_car' || activity.transportType === 'private_van' || activity.transportType === 'suv')) {
                              return 'PVT';
                            }
                            if (activity.transportType && (activity.transportType.toLowerCase().includes('shared') || activity.transportType.toLowerCase().includes('sic') || activity.transportType === 'bus' || activity.transportType === 'minibus')) {
                              return 'SIC';
                            }
                            if (activity.transportLabel && activity.transportLabel.toLowerCase().includes('private')) {
                              return 'PVT';
                            }
                            if (activity.transportLabel && activity.transportLabel.toLowerCase().includes('sic')) {
                              return 'SIC';
                            }
                            if (activity.vehicleType && activity.vehicleType.toLowerCase().includes('private')) {
                              return 'PVT';
                            }
                            return 'SIC';
                          };

                          return `${vehicleName} | ${getTransferType()} | ${vehicleCapacity} pax | ${vehicleCount} vehicle${vehicleCount > 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Standalone Transport Activities within Sightseeing */}
                  {transportActivities.filter(ta => ta.dayNumber === activity.dayNumber).length > 0}

                  {/* Compact Price */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(activity.cost || 0, query?.destination.country || 'USA')}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>}


        {/* Package Includes Section */}
        

        {/* Transport Routes Section */}
        {(() => {
        // Get all transport routes from days
        const allTransportRoutes = days.flatMap(day => day.transport.map(transport => ({
          ...transport,
          dayNumber: day.dayNumber,
          date: day.date,
          city: day.city
        })));
        const transportRoutesCost = allTransportRoutes.reduce((sum, route) => sum + (route.price || 0), 0);
        return allTransportRoutes.length > 0 && <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-foreground">Transport Routes ({allTransportRoutes.length})</h4>
                <Badge variant="outline" className="ml-auto text-xs">
                  {formatCurrency(transportRoutesCost, query?.destination.country || 'USA')}
                </Badge>
              </div>
              <div className="space-y-2">
                {allTransportRoutes.map((route, idx) => <div key={`transport-route-${route.id || `${route.from}-${route.to}-${idx}`}`} className="p-3 bg-blue-50/30 dark:bg-blue-950/10 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Day {route.dayNumber}
                        </Badge>
                        {route.routeCode && <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400">
                            {route.routeCode}
                          </Badge>}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {formatCurrency(route.price || 0, query?.destination.country || 'USA')}
                      </div>
                    </div>
                    
                    {/* Route Path */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">{route.from}</span>
                      </div>
                      <div className="flex-1 border-t border-blue-300 dark:border-blue-700 border-dashed"></div>
                      <Car className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      <div className="flex-1 border-t border-blue-300 dark:border-blue-700 border-dashed"></div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium text-blue-900 dark:text-blue-100">{route.to}</span>
                        <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        {route.name && <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Service:</span>
                            <span className="text-gray-800 dark:text-gray-200">{route.name}</span>
                          </div>}
                        {route.type && <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Type:</span>
                            <Badge variant="secondary" className="text-xs">
                              {route.type === 'private' ? 'Private Transfer' : route.type === 'shared' ? 'Shared Transfer' : route.type}
                            </Badge>
                          </div>}
                      </div>
                      
                      <div className="space-y-1">
                        {route.vehicleType && <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Vehicle:</span>
                            <span className="text-gray-800 dark:text-gray-200">{route.vehicleType}</span>
                          </div>}
                        {route.pickupTime && route.dropTime && <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-800 dark:text-gray-200">
                              {route.pickupTime} - {route.dropTime}
                            </span>
                          </div>}
                      </div>
                    </div>

                    {/* Vehicle Summary Details */}
                    {route.vehicleSummary && <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Vehicle Configuration:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {route.vehicleSummary.split(' + ').map((vehicle, vehicleIdx) => <Badge key={`vehicle-${route.id || `${route.from}-${route.to}`}-${idx}-${vehicleIdx}-${vehicle.replace(/\s+/g, '-')}`} variant="outline" className="text-xs border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50">
                              {vehicle}
                            </Badge>)}
                        </div>
                        {route.totalCapacity && route.totalPax && <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            <span className="font-medium">Capacity:</span> {route.totalCapacity} seats for {route.totalPax} passengers
                          </div>}
                      </div>}

                    {/* Pickup/Drop Locations */}
                    {(route.pickupLocation || route.dropLocation) && <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {route.pickupLocation && <div className="flex items-center gap-1">
                              <span className="text-gray-500 dark:text-gray-400 font-medium">Pickup:</span>
                              <span className="text-gray-800 dark:text-gray-200">{route.pickupLocation}</span>
                            </div>}
                          {route.dropLocation && <div className="flex items-center gap-1">
                              <span className="text-gray-500 dark:text-gray-400 font-medium">Drop:</span>
                              <span className="text-gray-800 dark:text-gray-200">{route.dropLocation}</span>
                            </div>}
                        </div>
                      </div>}
                  </div>)}
              </div>
            </div>;
      })()}


        {/* Package Options Summary */}
        <Separator />
        {(() => {
          const accommodationOptions = calculateAccommodationOptionsPricing(accommodations, query);
          
          if (accommodationOptions.length === 0) {
            return (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Base Package Total</span>
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(baseCost, query?.destination.country || 'USA')}
                </div>
              </div>
            );
          } else if (accommodationOptions.length === 1) {
            const packageTotal = baseCost + accommodationOptions[0].totalCost;
            return (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Package Total</span>
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(packageTotal, query?.destination.country || 'USA')}
                </div>
              </div>
            );
          } else {
            const minTotal = baseCost + Math.min(...accommodationOptions.map(opt => opt.totalCost));
            const maxTotal = baseCost + Math.max(...accommodationOptions.map(opt => opt.totalCost));
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Package Options Range</span>
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(minTotal, query?.destination.country || 'USA')} - {formatCurrency(maxTotal, query?.destination.country || 'USA')}
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Choose your preferred accommodation option above for final pricing
                </div>
              </div>
            );
          }
        })()}

        {/* Destination Info */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {query?.destination.country}
          </Badge>
          {query?.destination.cities.length > 0 && <Badge variant="secondary" className="text-xs">
              {query.destination.cities.slice(0, 2).join(', ')}
              {query.destination.cities.length > 2 && ` +${query.destination.cities.length - 2}`}
            </Badge>}
          {query?.travelDates?.from && query?.travelDates?.to && <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(query.travelDates.from).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })} - {new Date(query.travelDates.to).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
            </Badge>}
        </div>
      </CardContent>
    </Card>;
};