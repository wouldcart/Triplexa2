
import { useEffect, useRef, useCallback, useState } from 'react';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import supabaseProposalService from '@/services/supabaseProposalService';
import { Query } from '@/types/query';

interface UseAutoSaveProposalOptions {
  queryId: string;
  days: ItineraryDay[];
  totalCost: number;
  query?: Query;
  enabled?: boolean;
  debounceMs?: number;
  showToast?: boolean;
}

export const useAutoSaveProposal = ({
  queryId,
  days,
  totalCost,
  query,
  enabled = true,
  debounceMs = 5000, // Increased from 2000ms to 5000ms for better typing experience
  showToast = false
}: UseAutoSaveProposalOptions) => {
  // Add validation for queryId format to prevent invalid saves
  const isValidQueryId = queryId && (typeof queryId === 'string') && queryId.length > 0;
  
  // Track if we've logged the missing query warning to avoid spam
  const hasLoggedMissingQuery = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const isSavingRef = useRef(false);
  
  // State for tracking save status
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveProposal = useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) return;
    
    // Skip if no valid queryId - silent return, this is expected during initialization
    if (!isValidQueryId) {
      return;
    }
    
    // Skip if no query data available - but only warn once to avoid console spam
    if (!query || !query.id) {
      if (!hasLoggedMissingQuery.current) {
        console.warn('Auto-save skipped: Query data not available for queryId:', queryId);
        hasLoggedMissingQuery.current = true;
      }
      return;
    }
    
    // Reset the warning flag when query becomes available
    hasLoggedMissingQuery.current = false;
    
    try {
      isSavingRef.current = true;
      setSaveError(null);
      
      const proposalData = {
        queryId,
        days,
        totalCost,
        savedAt: new Date().toISOString(),
        version: Date.now()
      };
      
      const dataString = JSON.stringify(proposalData);
      
      // Only save if data has actually changed
      if (dataString === lastSavedRef.current) {
        return;
      }
      
      // Save to Supabase instead of localStorage
      const { proposal_id, error } = await supabaseProposalService.upsertDraftProposal({
        query,
        days,
        totalCost,
        draftType: 'enhanced'
      });
      
      if (error) {
        console.error('Auto-save to Supabase failed:', error);
        setSaveError(`Supabase save failed: ${error.message || error}`);
        // Fallback to localStorage if Supabase fails
        localStorage.setItem(`proposal_draft_${queryId}`, dataString);
        console.warn('Auto-save fallback to localStorage');
      } else {
        lastSavedRef.current = dataString;
        setLastSaved(new Date());
        setSaveError(null);
        console.log('Auto-saved proposal to Supabase at:', new Date().toLocaleTimeString());
      }
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('proposal-saved'));
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveError(`Auto-save failed: ${error}`);
      // Final fallback to localStorage
      try {
        localStorage.setItem(`proposal_draft_${queryId}`, JSON.stringify({
          queryId,
          days,
          totalCost,
          savedAt: new Date().toISOString(),
          version: Date.now()
        }));
        console.warn('Auto-save final fallback to localStorage');
      } catch (fallbackError) {
        console.error('Even localStorage fallback failed:', fallbackError);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [queryId, days, totalCost, query, isValidQueryId]);

  const triggerAutoSave = useCallback(() => {
    if (!enabled || isSavingRef.current) return;
    
    // Skip auto-save on initial mount - but allow it if query just became available
    if (isInitialMount.current && query && query.id) {
      isInitialMount.current = false;
    } else if (isInitialMount.current) {
      return;
    }
    
    // Skip auto-save if query data is not available yet - it will retry when data loads
    if (!query || !query.id) {
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save with increased delay
    saveTimeoutRef.current = setTimeout(() => {
      saveProposal();
    }, Math.max(debounceMs, 3000)); // Minimum 3 second delay
  }, [enabled, debounceMs, saveProposal, query]);

  // Auto-save when days or totalCost changes
  useEffect(() => {
    triggerAutoSave();
  }, [days, totalCost, triggerAutoSave]);

  // Retry auto-save when query data becomes available
  useEffect(() => {
    if (query && query.id && enabled && !isInitialMount.current) {
      // Query data just became available, trigger auto-save
      triggerAutoSave();
    }
  }, [query, enabled, triggerAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Manual save function
  const manualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveProposal();
  }, [saveProposal]);

  return {
    triggerAutoSave,
    manualSave,
    lastSaved,
    saveError,
    isSaving: isSavingRef.current
  };
};
