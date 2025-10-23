import { useState, useEffect, useCallback } from 'react';
import { UnifiedPricingService, PricingSnapshot } from '@/services/unifiedPricingService';

interface PricingSyncState {
  snapshot: PricingSnapshot | null;
  isLoading: boolean;
  hasData: boolean;
  lastUpdated: Date | null;
  errors: string[];
}

export const useRealTimePricingSync = (queryId: string) => {
  const [state, setState] = useState<PricingSyncState>({
    snapshot: null,
    isLoading: true,
    hasData: false,
    lastUpdated: null,
    errors: []
  });

  // Update snapshot callback
  const updateSnapshot = useCallback((snapshot: PricingSnapshot | null) => {
    setState(prev => ({
      ...prev,
      snapshot,
      isLoading: false,
      hasData: snapshot !== null,
      lastUpdated: snapshot ? new Date() : prev.lastUpdated,
      errors: snapshot ? [] : ['No pricing data available']
    }));
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { success, data, errors } = await UnifiedPricingService.loadPricingData(queryId);
      
      if (success && data) {
        const markupSettings = UnifiedPricingService.loadMarkupSettings(queryId);
        const snapshot = UnifiedPricingService.calculatePricing(data, markupSettings.percentage);
        updateSnapshot(snapshot);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasData: false,
          errors: errors || ['Failed to load pricing data']
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasData: false,
        errors: [`Loading error: ${error}`]
      }));
    }
  }, [queryId, updateSnapshot]);

  // Phase 4: Enhanced real-time sync with better error handling
  useEffect(() => {
    if (!queryId) return;

    try {
      const cleanup = UnifiedPricingService.setupRealtimeSync(queryId, updateSnapshot);
      
      // Phase 5: Add error boundary for real-time sync
      const handleSyncError = (error: Error) => {
        console.error('Real-time sync error:', error);
        setState(prev => ({
          ...prev,
          errors: [...prev.errors, `Sync error: ${error.message}`]
        }));
      };

      return () => {
        try {
          cleanup();
        } catch (error) {
          handleSyncError(error as Error);
        }
      };
    } catch (error) {
      console.error('Failed to setup real-time sync:', error);
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, `Setup error: ${error}`]
      }));
    }
  }, [queryId, updateSnapshot]);

  // Update markup percentage
  const updateMarkupPercentage = useCallback(async (percentage: number) => {
    if (!state.snapshot) return false;

    try {
      const { success, data } = await UnifiedPricingService.loadPricingData(queryId);
      if (success && data) {
        const newSnapshot = UnifiedPricingService.calculatePricing(data, percentage);
        updateSnapshot(newSnapshot);
        
        // Save the new settings
        UnifiedPricingService.saveMarkupSettings(queryId, {
          percentage,
          type: 'percentage'
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error updating markup percentage:', error);
    }
    
    return false;
  }, [queryId, state.snapshot, updateSnapshot]);

  return {
    ...state,
    refresh,
    updateMarkupPercentage
  };
};