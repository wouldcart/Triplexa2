
import { useState, useEffect, useCallback } from 'react';
import { useItineraryContext } from '@/contexts/ItineraryContext';
import { ItineraryTransform, ProposalItineraryData } from '@/utils/itineraryTransform';
import { CentralItinerary } from '@/types/itinerary';
import { useToast } from '@/hooks/use-toast';

interface UseRealTimeItineraryReturn {
  proposalData: ProposalItineraryData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  syncWithItinerary: (itinerary: CentralItinerary) => void;
  updateProposalDay: (dayId: string, updates: any) => void;
}

export const useRealTimeItinerary = (queryId: string): UseRealTimeItineraryReturn => {
  const { itinerary, isLoading, error, updateItinerary } = useItineraryContext();
  const [proposalData, setProposalData] = useState<ProposalItineraryData | null>(null);
  const { toast } = useToast();

  // Transform central itinerary to proposal format whenever it changes
  useEffect(() => {
    if (itinerary && itinerary.days) {
      try {
        // Convert CentralItinerary.days to the expected format
        const centralDays = itinerary.days.map(day => ({
          id: day.id,
          dayNumber: day.day,
          title: `Day ${day.day}`,
          city: day.location.city,
          description: day.notes || `Day ${day.day} in ${day.location.city}`,
          date: day.date,
          activities: day.activities.map(activity => ({
            id: activity.id,
            name: activity.name,
            description: activity.description || '',
            duration: activity.duration,
            price: activity.price,
            type: activity.type,
          })),
          transport: day.transport?.map(transport => ({
            id: transport.id,
            name: `${transport.type} from ${transport.from.name} to ${transport.to.name}`,
            from: transport.from.name,
            to: transport.to.name,
            price: transport.price,
            type: transport.type,
            duration: transport.duration,
          })),
          accommodation: day.accommodation ? {
            id: day.accommodation.id,
            name: day.accommodation.name,
            type: day.accommodation.type,
            price: day.accommodation.price,
            roomType: day.accommodation.roomType,
            checkIn: day.accommodation.checkIn,
            checkOut: day.accommodation.checkOut,
            nights: day.accommodation.nights,
          } : undefined,
          totalCost: day.totalCost,
        }));

        const transformed = ItineraryTransform.centralToProposal(centralDays);
        setProposalData(transformed);
      } catch (err) {
        console.error('Error transforming itinerary data:', err);
        toast({
          title: "Data Transform Error",
          description: "Failed to transform itinerary data for proposal view",
          variant: "destructive",
        });
      }
    } else {
      setProposalData(null);
    }
  }, [itinerary, toast]);

  const refreshData = useCallback(() => {
    // Force refresh by clearing and reloading
    if (itinerary && itinerary.days) {
      const centralDays = itinerary.days.map(day => ({
        id: day.id,
        dayNumber: day.day,
        title: `Day ${day.day}`,
        city: day.location.city,
        description: day.notes || `Day ${day.day} in ${day.location.city}`,
        date: day.date,
        activities: day.activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          description: activity.description || '',
          duration: activity.duration,
          price: activity.price,
          type: activity.type,
        })),
        transport: day.transport?.map(transport => ({
          id: transport.id,
          name: `${transport.type} from ${transport.from.name} to ${transport.to.name}`,
          from: transport.from.name,
          to: transport.to.name,
          price: transport.price,
          type: transport.type,
          duration: transport.duration,
        })),
        accommodation: day.accommodation ? {
          id: day.accommodation.id,
          name: day.accommodation.name,
          type: day.accommodation.type,
          price: day.accommodation.price,
          roomType: day.accommodation.roomType,
          checkIn: day.accommodation.checkIn,
          checkOut: day.accommodation.checkOut,
          nights: day.accommodation.nights,
        } : undefined,
        totalCost: day.totalCost,
      }));

      const transformed = ItineraryTransform.centralToProposal(centralDays);
      setProposalData(transformed);
    }
  }, [itinerary]);

  const syncWithItinerary = useCallback((newItinerary: CentralItinerary) => {
    // Sync external itinerary changes back to context
    updateItinerary(newItinerary);
  }, [updateItinerary]);

  const updateProposalDay = useCallback((dayId: string, updates: any) => {
    if (!itinerary || !proposalData) return;

    // Find the day index in the central itinerary
    const dayIndex = itinerary.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) return;

    // Transform proposal updates back to central format
    const centralUpdates = {
      ...updates,
      totalCost: updates.totalCost || 0,
    };

    // Update through the context
    const { updateDay } = useItineraryContext();
    updateDay(dayIndex, centralUpdates);
  }, [itinerary, proposalData]);

  return {
    proposalData,
    isLoading,
    error,
    refreshData,
    syncWithItinerary,
    updateProposalDay,
  };
};
