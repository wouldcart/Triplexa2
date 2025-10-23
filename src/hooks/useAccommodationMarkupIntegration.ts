import { useCallback, useEffect } from 'react';
import { useAccommodationStore } from '@/stores/useAccommodationStore';
import { useProposalPersistence } from './useProposalPersistence';
import { AccommodationOption } from '@/types/enhancedMarkup';
import { accommodationSync } from '@/services/accommodationSync';

export const useAccommodationMarkupIntegration = (queryId: string, draftType: 'daywise' | 'enhanced' = 'enhanced') => {
  const accommodationStore = useAccommodationStore(queryId);
  const proposalPersistence = useProposalPersistence(queryId, draftType);

  // Enhanced sync with day-wise itinerary import
  const syncAccommodationData = useCallback(() => {
    const { selectedAccommodations } = accommodationStore;
    const persistenceAccommodations = proposalPersistence.data.accommodationData.selectedAccommodations;

    console.log('🏨 [AccommodationSync] Current state:', {
      storeCount: selectedAccommodations.length,
      persistenceCount: persistenceAccommodations.length,
      queryId
    });

    // If persistence has more recent data, update store
    if (persistenceAccommodations.length > 0 && 
        persistenceAccommodations.length !== selectedAccommodations.length) {
      console.log('🏨 [AccommodationSync] Updating store from persistence');
      accommodationStore.saveSelectedAccommodations(persistenceAccommodations);
      return;
    }
    
    // If store has data but persistence doesn't, update persistence
    if (selectedAccommodations.length > 0 && persistenceAccommodations.length === 0) {
      console.log('🏨 [AccommodationSync] Updating persistence from store');
      proposalPersistence.updateAccommodationData({
        selectedAccommodations,
        markupData: proposalPersistence.data.accommodationData.markupData
      });
      return;
    }

    // If both are empty, try to import from day-wise itinerary
    if (selectedAccommodations.length === 0 && persistenceAccommodations.length === 0) {
      console.log('🏨 [AccommodationSync] Both empty, attempting day-wise import');
      importFromDayWiseItinerary();
    }
  }, [accommodationStore, proposalPersistence, queryId]);

  // Import accommodations from day-wise itinerary
  const importFromDayWiseItinerary = useCallback(() => {
    try {
      // Try different storage keys for day-wise itinerary
      const itineraryKeys = [
        `proposal_persistence_${queryId}_daywise`,
        `proposal_persistence_${queryId}`,
        `itinerary_${queryId}`,
        `central_itinerary_${queryId}`
      ];

      for (const key of itineraryKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          const days = data.itineraryData || data.days || [];
          
          if (days.length > 0) {
            console.log(`🏨 [AccommodationSync] Found itinerary data in ${key}:`, days);
            
            // Extract accommodations using service
            const extractedAccommodations = accommodationSync.extractFromItinerary(days, 'standard');
            
            if (extractedAccommodations.length > 0) {
              console.log('🏨 [AccommodationSync] Extracted accommodations:', extractedAccommodations);
              
              // Update both store and persistence
              accommodationStore.saveSelectedAccommodations(extractedAccommodations);
              proposalPersistence.updateAccommodationData({
                selectedAccommodations: extractedAccommodations,
                markupData: proposalPersistence.data.accommodationData.markupData
              });
              
              console.log('🏨 [AccommodationSync] Successfully imported from day-wise itinerary');
              return;
            }
          }
        }
      }
      
      console.log('🏨 [AccommodationSync] No suitable day-wise itinerary data found');
    } catch (error) {
      console.error('🏨 [AccommodationSync] Error importing from day-wise itinerary:', error);
    }
  }, [queryId, accommodationStore, proposalPersistence]);

  // Update accommodation selection and sync both systems
  const updateAccommodationSelection = useCallback((accommodations: AccommodationOption[]) => {
    // Update store
    accommodationStore.saveSelectedAccommodations(accommodations);
    
    // Update persistence
    proposalPersistence.updateAccommodationData({
      selectedAccommodations: accommodations,
      markupData: proposalPersistence.data.accommodationData.markupData
    });
  }, [accommodationStore, proposalPersistence]);

  // Get combined accommodation data
  const getAccommodationData = useCallback(() => {
    const storeData = accommodationStore.selectedAccommodations;
    const persistenceData = proposalPersistence.data.accommodationData.selectedAccommodations;
    
    // Return the most recent data (preference to persistence for cross-tab consistency)
    return persistenceData.length > 0 ? persistenceData : storeData;
  }, [accommodationStore.selectedAccommodations, proposalPersistence.data.accommodationData.selectedAccommodations]);

  // Initialize sync on mount
  useEffect(() => {
    syncAccommodationData();
  }, [syncAccommodationData]);

  return {
    accommodations: getAccommodationData(),
    updateAccommodationSelection,
    syncAccommodationData,
    importFromDayWiseItinerary,
    loading: accommodationStore.loading,
    error: accommodationStore.error || null,
    count: getAccommodationData().length
  };
};