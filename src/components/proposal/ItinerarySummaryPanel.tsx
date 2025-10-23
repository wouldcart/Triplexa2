import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Calendar, MapPin, Activity, Users, ChevronUp, ChevronDown, Save, Settings, Clock, CheckCircle2, Loader2, Eye, EyeOff, Hotel } from "lucide-react";
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';
import { AccommodationStay, calculateTotalAccommodationCostByOption } from '@/utils/accommodationCalculations';
import { ItineraryDay } from './DayByDayItineraryBuilder';
import EnhancedProposalService from '@/services/enhancedProposalService';
interface ItinerarySummaryPanelProps {
  query: Query;
  days: ItineraryDay[];
  accommodations: AccommodationStay[];
}
export const ItinerarySummaryPanel: React.FC<ItinerarySummaryPanelProps> = ({
  query,
  days,
  accommodations
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Hidden by default
  const [isSaving, setIsSaving] = useState(false);
  const totalItineraryCost = days.reduce((sum, day) => sum + day.totalCost, 0);
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  // Auto-save integration
  const {
    lastSaved,
    isOnline,
    isSaving: isAutoSaving,
    manualSave
  } = useAutoSave({
    key: `itinerary_${query.id}`,
    data: {
      days,
      accommodations,
      totalItineraryCost
    },
    interval: 30000,
    // 30 seconds
    onSave: async data => {
      if (data.days && data.days.length > 0) {
        try {
          const itineraryModules = data.days.map(day => ({
            id: `day-${day.id}`,
            type: 'sightseeing' as const,
            name: day.title,
            category: 'itinerary',
            data: {
              dayNumber: day.dayNumber,
              title: day.title,
              city: day.city,
              description: day.description,
              date: day.date,
              activities: day.activities,
              transport: day.transport,
              accommodations: day.accommodations,
              meals: day.meals,
              totalCost: day.totalCost
            },
            pricing: {
              basePrice: day.totalCost,
              finalPrice: day.totalCost,
              currency: query.destination.country === 'Thailand' ? 'THB' : 'USD'
            },
            status: 'active' as const,
            metadata: {
              supplier: 'Internal',
              confirmationRequired: false,
              tags: ['itinerary', day.city.toLowerCase()]
            }
          }));

          // Auto-save as draft
          const existingProposals = EnhancedProposalService.getProposalsByQuery(query.id);
          const draftProposal = existingProposals.find(p => p.metadata.status === 'draft');
          if (draftProposal) {
            EnhancedProposalService.updateProposal(draftProposal.id, {
              modules: itineraryModules,
              totals: {
                subtotal: data.totalItineraryCost,
                discountAmount: 0,
                total: data.totalItineraryCost,
                moduleCount: itineraryModules.length
              }
            }, 'Auto-saved itinerary changes');
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }
  });

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSaveProposal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const handleSaveProposal = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      console.log('Starting proposal save process...');
      if (days.length === 0) {
        throw new Error('No itinerary days to save. Please add some days to your itinerary first.');
      }
      const itineraryModules = days.map(day => ({
        id: `day-${day.id}`,
        type: 'sightseeing' as const,
        name: day.title,
        category: 'itinerary',
        data: {
          dayNumber: day.dayNumber,
          title: day.title,
          city: day.city,
          description: day.description,
          date: day.date,
          activities: day.activities,
          transport: day.transport,
          accommodations: day.accommodations,
          meals: day.meals,
          totalCost: day.totalCost
        },
        pricing: {
          basePrice: day.totalCost,
          finalPrice: day.totalCost,
          currency: query.destination.country === 'Thailand' ? 'THB' : 'USD'
        },
        status: 'active' as const,
        metadata: {
          supplier: 'Internal',
          confirmationRequired: false,
          tags: ['itinerary', day.city.toLowerCase()]
        }
      }));
      const proposalId = EnhancedProposalService.createProposal(query.id, {
        query,
        modules: itineraryModules,
        totals: {
          subtotal: totalItineraryCost,
          discountAmount: 0,
          total: totalItineraryCost,
          moduleCount: itineraryModules.length
        }
      });
      toast({
        title: "Proposal Created",
        description: `Proposal ${proposalId} saved successfully. Redirecting...`
      });

      // Navigate to proposal management after short delay
      setTimeout(() => {
        navigate(`/queries/${encodeURIComponent(query.id)}?tab=proposals`);
      }, 1000);
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleManageProposals = () => {
    navigate(`/queries/${encodeURIComponent(query.id)}?tab=proposals`);
  };

  // Auto-save status component
  const AutoSaveStatus = () => {
    if (isAutoSaving) {
      return <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </div>;
    }
    if (lastSaved) {
      return <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Auto-saved {new Date(lastSaved).toLocaleTimeString()}</span>
        </div>;
    }
    return <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Not saved</span>
      </div>;
  };

  // If hidden, show only a minimal floating toggle button
  if (isHidden) {
    return;
  }
  return <div className="w-full max-w-full">
      <Card className="w-full border border-border/40 dark:border-border bg-card">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold">Itinerary Summary</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Complete trip breakdown
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline" className="text-xs px-2 py-0.5 whitespace-nowrap">
                {days.length} days • {totalPax} pax
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsHidden(true)} className="h-6 w-6 p-0 flex-shrink-0" title="Hide Summary">
                <EyeOff className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-6 w-6 p-0 flex-shrink-0">
                {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isCollapsed && <CardContent className="p-3 space-y-3">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3 w-3 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold">Land Package Overview</h3>
              </div>
              
              {days.length === 0 ? <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No itinerary days added</p>
                  <p className="text-xs">Start building your itinerary to see the breakdown</p>
                </div> : <div className="space-y-2">
                  {days.map(day => <div key={day.id} className="border rounded-md p-2 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-950/10 dark:to-orange-900/10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5 flex-shrink-0">
                            Day {day.dayNumber}
                          </Badge>
                          {day.city && <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300 min-w-0">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{day.city}</span>
                            </div>}
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                            {formatCurrency(day.totalCost, query.destination.country)}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1 text-xs">
                        {day.title}
                      </h4>
                      
                      <div className="flex flex-wrap gap-1">
                        {day.activities.length > 0 && <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-1.5 py-0.5">
                            <Activity className="h-2 w-2 mr-1" />
                            {day.activities.length} activities
                          </Badge>}
                        {day.transport && day.transport.length > 0 && <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-1.5 py-0.5">
                            <Activity className="h-2 w-2 mr-1" />
                            {day.transport.length} transport
                          </Badge>}
                      </div>
                    </div>)}
                  
                  <div className="bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/10 p-2 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Land Package Total
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(totalItineraryCost, query.destination.country)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(totalItineraryCost / totalPax, query.destination.country)} per person
                    </p>
                  </div>
                </div>}
            </div>

            <Separator className="dark:border-border" />

            {/* Accommodation Planning Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Hotel className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold">Accommodation Planning</h3>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/10 dark:to-blue-900/10 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Total Nights: {days.length > 0 ? days.length - 1 : 0}
                    </span>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Cities: {[...new Set(days.map(day => day.city))].length}
                    </span>
                  </div>
                  
                  {/* Selected Hotels Details */}
                  {accommodations.length > 0 && <div className="space-y-2">
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700 pb-1">
                        Selected Hotels:
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {accommodations.map(accommodation => <div key={accommodation.id} className="bg-white/50 dark:bg-gray-800/30 p-2 rounded border border-blue-100 dark:border-blue-800">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 space-y-1">
                                <div className="font-medium text-xs text-blue-800 dark:text-blue-200">
                                  {accommodation.hotelName}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {accommodation.city} • {accommodation.hotelCategory}
                                </div>
                                <div className="text-xs text-blue-500 dark:text-blue-400">
                                  {accommodation.roomType} • {accommodation.numberOfRooms} room(s) • {accommodation.numberOfNights} night(s)
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    Days {accommodation.checkInDay}-{accommodation.checkOutDay}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {formatCurrency(accommodation.totalPrice, query.destination.country)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>)}
                      </div>
                    </div>}
                  
                  {/* Accommodation Summary by City */}
                  {days.length > 0 && <div className="space-y-1">
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700 pb-1">
                        City Overview:
                      </div>
                      {[...new Set(days.map(day => day.city))].map(city => {
                  const cityDays = days.filter(day => day.city === city);
                  const cityAccommodations = accommodations.filter(acc => acc.city === city);
                  const totalNights = cityDays.length > 0 ? cityDays.length - 1 : 0;
                  const bookedNights = cityAccommodations.reduce((sum, acc) => sum + acc.numberOfNights, 0);
                  return <div key={city} className="text-xs text-blue-600 dark:text-blue-400">
                            <div className="flex justify-between">
                              <span className="font-medium">{city}:</span>
                              <span>{bookedNights} / {totalNights} nights booked</span>
                            </div>
                            {cityAccommodations.length > 0 && <div className="ml-2 text-xs text-blue-500 dark:text-blue-500">
                                {cityAccommodations.map(acc => acc.hotelName).join(', ')}
                              </div>}
                          </div>;
                })}
                    </div>}
                  
                  {/* Cost Summary */}
                  {accommodations.length > 0 && <div className="pt-1 border-t border-blue-200 dark:border-blue-700 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          Total Accommodation:
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0), query.destination.country)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Avg per night:
                        </span>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {formatCurrency(accommodations.length > 0 ? accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0) / accommodations.reduce((sum, acc) => sum + acc.numberOfNights, 0) : 0, query.destination.country)}
                        </span>
                      </div>
                    </div>}
                  
                  <div className="pt-1 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                        Overall Progress:
                      </span>
                       <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                         {accommodations.reduce((sum, acc) => sum + acc.numberOfNights, 0)} / {days.length > 0 ? days.length - 1 : 0} nights
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="dark:border-border" />

            {/* Compact Action Section */}
            <div className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/10 dark:to-blue-900/10 p-2 rounded-md border border-blue-200 dark:border-blue-800">
              {/* Auto-save status and actions row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <AutoSaveStatus />
                <div className="flex items-center gap-1">
                  <Button size="sm" className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleSaveProposal} disabled={isSaving || days.length === 0}>
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs border-blue-200 text-blue-600 hover:bg-blue-50" onClick={handleManageProposals}>
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
              
              {/* Status message */}
              <div className="text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {days.length > 0 ? `${days.length} days ready • Ctrl+S to save • Auto-saves every 30s` : 'Add itinerary days to create a proposal'}
                </p>
              </div>
            </div>
          </CardContent>}
      </Card>
    </div>;
};