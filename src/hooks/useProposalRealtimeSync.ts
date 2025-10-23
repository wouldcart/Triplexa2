import { useState, useEffect, useCallback } from 'react';
import { ProposalSummarySnapshot } from '@/utils/markupSync';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';

export const useProposalRealtimeSync = (queryId: string, draftType: 'daywise' | 'enhanced' = 'enhanced') => {
  const { data: persistenceData, loadData } = useProposalPersistence(queryId, draftType);
  const [snapshot, setSnapshot] = useState<ProposalSummarySnapshot | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Refresh data manually - moved before use
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Extract snapshot from persistence data
  useEffect(() => {
    if (persistenceData.accommodationData?.markupData?.options) {
      const markupData = persistenceData.accommodationData.markupData;
      const newSnapshot: ProposalSummarySnapshot = {
        baseCost: markupData.options[0]?.baseTotal || 0,
        serviceCosts: markupData.options[0]?.serviceCosts || {
          sightseeing: { total: 0 },
          transport: { totalCost: 0, perPersonCost: 0 },
          dining: { total: 0 },
          accommodation: { totalCost: 0, perPersonCost: 0, totalRooms: 0, totalNights: 0 }
        },
        accommodationOptions: markupData.options || [],
        currency: 'USD',
        lastCalculated: persistenceData.lastSaved || new Date().toISOString()
      };
      setSnapshot(newSnapshot);
      setLastUpdate(persistenceData.lastSaved);
    }
  }, [persistenceData]);

  // Listen for localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes(`proposal_persistence_${queryId}`)) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryId, loadData]);

  // Phase 4: Listen for custom events from proposal summary updates
  useEffect(() => {
    const handleProposalUpdate = (event: CustomEvent) => {
      const { queryId: eventQueryId, snapshot: newSnapshot } = event.detail;
      if (eventQueryId === queryId) {
        setSnapshot(newSnapshot);
        setLastUpdate(new Date().toISOString());
      }
    };

    const handlePricingUpdate = (event: CustomEvent) => {
      const { queryId: eventQueryId, snapshot: newSnapshot } = event.detail;
      if (eventQueryId === queryId) {
        setSnapshot(newSnapshot);
        setLastUpdate(new Date().toISOString());
        console.log('Real-time pricing sync updated:', newSnapshot);
      }
    };

    const handleTermsUpdate = (event: CustomEvent) => {
      const { queryId: eventQueryId, terms } = event.detail;
      if (eventQueryId === queryId) {
        setLastUpdate(new Date().toISOString());
        console.log('Real-time terms sync updated:', terms);
        // Refresh data to get updated snapshot
        refresh();
      }
    };

    window.addEventListener('proposal-summary-updated', handleProposalUpdate as EventListener);
    window.addEventListener('proposal-pricing-updated', handlePricingUpdate as EventListener);
    window.addEventListener('proposal-terms-updated', handleTermsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('proposal-summary-updated', handleProposalUpdate as EventListener);
      window.removeEventListener('proposal-pricing-updated', handlePricingUpdate as EventListener);
      window.removeEventListener('proposal-terms-updated', handleTermsUpdate as EventListener);
    };
  }, [queryId, refresh]);

  return {
    snapshot,
    lastUpdate,
    persistenceData,
    refresh,
    hasData: !!snapshot
  };
};