import { useState, useEffect, useCallback } from 'react';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { AccommodationOption, EnhancedMarkupData } from '@/types/enhancedMarkup';
import SupabaseProposalService from '@/services/supabaseProposalService';

interface ProposalPersistenceData {
  itineraryData: ItineraryDay[];
  // Optional enhancements stored within itinerary_data JSONB
  sightseeingOptions?: Array<{
    option_label: string;
    activities: Array<{ name: string; cost: number; type: string; description?: string }>;
  }>;
  citySelection?: string | null;
  // Raw/other keys from itinerary_data to preserve unknown fields during merge
  itineraryOther?: Record<string, any>;
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
  // Preserve full pricing_data for safe merges
  pricingData?: Record<string, any> | null;
  // Optional transport options stored under pricing_data
  transportOptions?: Array<{
    option_label: string;
    vehicle_type: string;
    capacity: number;
    cost: number;
    remarks?: string;
  }>;
  lastSaved: string;
  queryId: string;
  draftType?: 'daywise' | 'enhanced';
  version?: number;
}

export const useProposalPersistence = (queryId: string, draftType: 'daywise' | 'enhanced' = 'daywise') => {
  const [data, setData] = useState<ProposalPersistenceData>({
    itineraryData: [],
    sightseeingOptions: [],
    citySelection: null,
    itineraryOther: {},
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
    pricingData: null,
    transportOptions: [],
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
        const itineraryRaw = row?.itinerary_data || {};
        const itineraryData = Array.isArray(itineraryRaw)
          ? itineraryRaw
          : Array.isArray(itineraryRaw?.days)
            ? itineraryRaw.days
            : [];
        const sightseeingOptions = Array.isArray(itineraryRaw?.sightseeing_options)
          ? itineraryRaw.sightseeing_options
          : [];
        const citySelection = itineraryRaw?.city_selection ?? null;
        const itineraryOther = Array.isArray(itineraryRaw) ? {} : Object.fromEntries(
          Object.entries(itineraryRaw || {}).filter(([k]) => !['days', 'sightseeing_options', 'city_selection'].includes(k))
        );

        const pricingRaw = row?.pricing_data || {};
        const transportOptions = Array.isArray(pricingRaw?.transport_options) ? pricingRaw.transport_options : [];

        const remoteData = {
          itineraryData,
          sightseeingOptions,
          citySelection,
          itineraryOther,
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
            mode: (pricingRaw?.mode ?? 'separate') as 'combined' | 'separate',
            adultMarkup: pricingRaw?.adultMarkup ?? 15,
            childMarkup: pricingRaw?.childMarkup ?? 10,
            childDiscountPercent: pricingRaw?.childDiscountPercent ?? 25
          },
          pricingData: pricingRaw || null,
          transportOptions,
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
      // Itinerary JSONB merge-builder
      const itineraryRelatedUpdate = (
        updates.itineraryData !== undefined ||
        updates.sightseeingOptions !== undefined ||
        updates.citySelection !== undefined
      );
      if (itineraryRelatedUpdate && nextData) {
        supabasePatch.itinerary_data = {
          ...(nextData.itineraryOther || {}),
          days: nextData.itineraryData || [],
          sightseeing_options: nextData.sightseeingOptions || [],
          city_selection: nextData.citySelection ?? null,
        };
      }

      // Accommodation JSONB
      if (updates.accommodationData !== undefined && nextData) {
        supabasePatch.accommodation_data = nextData.accommodationData;
      }

      // Pricing JSONB merge-builder
      const pricingRelatedUpdate = (
        updates.pricingConfig !== undefined ||
        updates.transportOptions !== undefined
      );
      if (pricingRelatedUpdate && nextData) {
        supabasePatch.pricing_data = {
          ...(nextData.pricingData || {}),
          ...nextData.pricingConfig,
          transport_options: nextData.transportOptions || [],
        };
      }

      // Email JSONB
      if (updates.emailData !== undefined && nextData) supabasePatch.email_data = nextData.emailData;
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

  const updateSightseeingOptions = useCallback((sightseeingOptions: NonNullable<ProposalPersistenceData['sightseeingOptions']>) => {
    return saveData({ sightseeingOptions });
  }, [saveData]);

  const updateCitySelection = useCallback((citySelection: string | null) => {
    return saveData({ citySelection });
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

  const updateTransportOptions = useCallback((transportOptions: NonNullable<ProposalPersistenceData['transportOptions']>) => {
    return saveData({ transportOptions });
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
    updateSightseeingOptions,
    updateCitySelection,
    updateAccommodationData,
    updateTermsConditions,
    updateEmailData,
    updatePricingConfig,
    updateTransportOptions,
    saveData,
    loadData
  };
};