import { useState, useEffect, useCallback } from 'react';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { AccommodationOption, EnhancedMarkupData } from '@/types/enhancedMarkup';
import SupabaseProposalService from '@/services/supabaseProposalService';

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

  // Enhanced load data with Supabase remote-first and local fallback
  const loadData = useCallback(async () => {
    try {
      const proposalId = `DRAFT-${queryId}-${draftType}`;
      const { data: row, error } = await SupabaseProposalService.getDraftByProposalId(proposalId);
      if (!error && row) {
        const remoteData = {
          itineraryData: Array.isArray(row.itinerary_data) ? row.itinerary_data : [],
          accommodationData: {
            selectedAccommodations: Array.isArray(row?.accommodation_data?.selectedAccommodations)
              ? row.accommodation_data.selectedAccommodations
              : Array.isArray(row?.accommodation_data?.options)
                ? row.accommodation_data.options
                : [],
            markupData: row?.accommodation_data?.markupData || null
          },
          termsConditions: {
            paymentTerms: row?.terms || '',
            cancellationPolicy: '',
            additionalTerms: '',
            inclusions: Array.isArray(row?.inclusions) ? row.inclusions : [],
            exclusions: Array.isArray(row?.exclusions) ? row.exclusions : []
          },
          emailData: row?.email_data || {
            to: '', subject: '', message: '', agentName: '', agentPhone: '', agentEmail: ''
          },
          pricingConfig: {
            mode: (row?.pricing_data?.mode ?? 'separate') as 'combined' | 'separate',
            adultMarkup: row?.pricing_data?.adultMarkup ?? 15,
            childMarkup: row?.pricing_data?.childMarkup ?? 10,
            childDiscountPercent: row?.pricing_data?.childDiscountPercent ?? 25
          },
          lastSaved: row?.last_saved || new Date().toISOString(),
          queryId,
          draftType,
          version: row?.version || 1
        } as Partial<ProposalPersistenceData>;

        setData(prevData => ({ ...prevData, ...remoteData } as ProposalPersistenceData));

        // Keep offline cache in sync
        try {
          const cacheString = JSON.stringify({ ...data, ...remoteData });
          localStorage.setItem(storageKey, cacheString);
          localStorage.setItem(`proposal_persistence_${queryId}`, cacheString);
        } catch {}

        console.log('Loaded persistence data from Supabase proposals');
        return true;
      }
    } catch (error) {
      console.error('Error loading proposal persistence data (Supabase):', error);
    }

    // Fallback: local storage keys for backward compatibility
    try {
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
      console.error('Error loading proposal persistence data (local fallback):', error);
    }
    return false;
  }, [queryId, storageKey, draftType, data]);

  // Enhanced save data with versioning and reference stability
  const saveData = useCallback(async (updates: Partial<ProposalPersistenceData>) => {
    try {
      // Update local state and offline cache
      const nowIso = new Date().toISOString();
      let nextData: ProposalPersistenceData | null = null;
      setData(prevData => {
        const updatedData = {
          ...prevData,
          ...updates,
          lastSaved: nowIso,
          queryId,
          draftType,
          version: (prevData.version || 0) + 1
        };
        nextData = updatedData as ProposalPersistenceData;
        const prevDataString = JSON.stringify(prevData);
        const newDataString = JSON.stringify(updatedData);
        if (prevDataString !== newDataString) {
          try {
            localStorage.setItem(storageKey, newDataString);
            localStorage.setItem(`proposal_persistence_${queryId}`, newDataString);
          } catch {}
          console.log(`Saved persistence data locally to ${storageKey}, version ${updatedData.version}`);
        }
        return updatedData;
      });

      // Prepare Supabase patch for remote persistence
      const supabasePatch: any = {};
      if (updates.itineraryData !== undefined) supabasePatch.itinerary_data = updates.itineraryData;
      if (updates.accommodationData !== undefined) supabasePatch.accommodation_data = updates.accommodationData;
      if (updates.pricingConfig !== undefined) supabasePatch.pricing_data = updates.pricingConfig;
      if (updates.emailData !== undefined) supabasePatch.email_data = updates.emailData;
      if (updates.termsConditions !== undefined) {
        supabasePatch.terms = updates.termsConditions.paymentTerms || '';
        supabasePatch.inclusions = updates.termsConditions.inclusions || [];
        supabasePatch.exclusions = updates.termsConditions.exclusions || [];
      }
      if (nextData) supabasePatch.version = nextData.version;

      // Only call remote if there is anything to update
      if (Object.keys(supabasePatch).length > 0) {
        const { error } = await SupabaseProposalService.updateDraftFields({
          queryId,
          draftType,
          patch: supabasePatch
        });
        if (error) {
          console.warn('Supabase updateDraftFields warning:', error);
        } else {
          console.log('Persisted proposal data to Supabase (proposals table)');
        }
      }
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
    void loadData();
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