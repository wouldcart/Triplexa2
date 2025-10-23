
import { useEffect, useRef, useCallback } from 'react';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';

interface UseAutoSaveProposalOptions {
  queryId: string;
  days: ItineraryDay[];
  totalCost: number;
  enabled?: boolean;
  debounceMs?: number;
  showToast?: boolean;
}

export const useAutoSaveProposal = ({
  queryId,
  days,
  totalCost,
  enabled = true,
  debounceMs = 2000,
  showToast = false
}: UseAutoSaveProposalOptions) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const isSavingRef = useRef(false);

  const saveProposal = useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      
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
      
      localStorage.setItem(`proposal_draft_${queryId}`, dataString);
      lastSavedRef.current = dataString;
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('proposal-saved'));
      
      console.log('Auto-saved proposal at:', new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [queryId, days, totalCost]);

  const triggerAutoSave = useCallback(() => {
    if (!enabled || isSavingRef.current) return;
    
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
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
  }, [enabled, debounceMs, saveProposal]);

  // Auto-save when days or totalCost changes
  useEffect(() => {
    triggerAutoSave();
  }, [days, totalCost, triggerAutoSave]);

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
    manualSave
  };
};
