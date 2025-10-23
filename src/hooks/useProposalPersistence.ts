import { useState, useEffect, useCallback } from 'react';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { AccommodationOption, EnhancedMarkupData } from '@/types/enhancedMarkup';

interface ProposalPersistenceData {
  itineraryData: ItineraryDay[];
  accommodationData: {
    selectedAccommodations: AccommodationOption[];
    markupData: EnhancedMarkupData | null;
  };
  termsConditions: {
    paymentTerms: string;
    cancellationPolicy: string;
    additionalTerms: string;
    inclusions: string[];
    exclusions: string[];
  };
  emailData: {
    to: string;
    subject: string;
    message: string;
    agentName: string;
    agentPhone: string;
    agentEmail: string;
  };
  pricingConfig: {
    mode: 'combined' | 'separate';
    adultMarkup: number;
    childMarkup: number;
    childDiscountPercent: number;
  };
  lastSaved: string;
  queryId: string;
  draftType?: 'daywise' | 'enhanced';
  version?: number;
}

export const useProposalPersistence = (queryId: string, draftType: 'daywise' | 'enhanced' = 'daywise') => {
  const [data, setData] = useState<ProposalPersistenceData>({
    itineraryData: [],
    accommodationData: {
      selectedAccommodations: [],
      markupData: null
    },
    termsConditions: {
      paymentTerms: '',
      cancellationPolicy: '',
      additionalTerms: '',
      inclusions: [],
      exclusions: []
    },
    emailData: {
      to: '',
      subject: '',
      message: '',
      agentName: '',
      agentPhone: '',
      agentEmail: ''
    },
    pricingConfig: {
      mode: 'separate',
      adultMarkup: 15,
      childMarkup: 10,
      childDiscountPercent: 25
    },
    lastSaved: '',
    queryId,
    draftType,
    version: 1
  });

  const storageKey = `proposal_persistence_${queryId}_${draftType}`;

  // Enhanced load data with draft type support
  const loadData = useCallback(() => {
    try {
      // Try different storage keys for backward compatibility
      const storageKeys = [
        `proposal_persistence_${queryId}_${draftType}`,
        `proposal_persistence_${queryId}`,
        `proposal_draft_${queryId}_${draftType}`,
        `proposal_draft_${queryId}`
      ];
      
      for (const key of storageKeys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsedData = JSON.parse(saved);
          if (parsedData.queryId === queryId) {
            setData(prevData => ({
              ...prevData,
              ...parsedData,
              draftType,
              version: parsedData.version || 1
            }));
            console.log(`Loaded persistence data from ${key}`);
            return true;
          }
        }
      }
    } catch (error) {
      console.error('Error loading proposal persistence data:', error);
    }
    return false;
  }, [queryId, storageKey, draftType]);

  // Enhanced save data with versioning and reference stability
  const saveData = useCallback((updates: Partial<ProposalPersistenceData>) => {
    try {
      setData(prevData => {
        const updatedData = {
          ...prevData,
          ...updates,
          lastSaved: new Date().toISOString(),
          queryId,
          draftType,
          version: (prevData.version || 0) + 1
        };

        // Only save if data actually changed
        const prevDataString = JSON.stringify(prevData);
        const newDataString = JSON.stringify(updatedData);
        
        if (prevDataString !== newDataString) {
          localStorage.setItem(storageKey, newDataString);
          localStorage.setItem(`proposal_persistence_${queryId}`, newDataString);
          console.log(`Saved persistence data to ${storageKey}, version ${updatedData.version}`);
        }
        
        return updatedData;
      });
      
      return true;
    } catch (error) {
      console.error('Error saving proposal persistence data:', error);
      return false;
    }
  }, [queryId, storageKey, draftType]);

  // Update specific sections with stable references
  const updateItineraryData = useCallback((itineraryData: ItineraryDay[]) => {
    return saveData({ itineraryData });
  }, [saveData]);

  const updateTermsConditions = useCallback((termsConditions: typeof data.termsConditions) => {
    return saveData({ termsConditions });
  }, [saveData]);

  const updateEmailData = useCallback((emailData: typeof data.emailData) => {
    return saveData({ emailData });
  }, [saveData]);

  const updatePricingConfig = useCallback((pricingConfig: typeof data.pricingConfig) => {
    return saveData({ pricingConfig });
  }, [saveData]);

  const updateAccommodationData = useCallback((accommodationData: typeof data.accommodationData) => {
    return saveData({ accommodationData });
  }, [saveData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    updateItineraryData,
    updateAccommodationData,
    updateTermsConditions,
    updateEmailData,
    updatePricingConfig,
    saveData,
    loadData
  };
};