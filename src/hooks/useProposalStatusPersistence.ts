import { useState, useCallback } from 'react';

export type ProposalStatus = 'draft' | 'ready' | 'sent' | 'viewed' | 'feedback-received' | 'modification-requested' | 'modified' | 'approved' | 'rejected';

interface ProposalStatusData {
  id: string;
  queryId: string;
  status: ProposalStatus;
  sentDate?: string;
  viewedDate?: string;
  lastModified: string;
  version: number;
  agentFeedback?: {
    message: string;
    requestedChanges: string[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    receivedAt: string;
  };
  modifications?: {
    version: number;
    changes: string;
    modifiedAt: string;
    modifiedBy: string;
  }[];
  totalAmount: number;
}

export const useProposalStatusPersistence = () => {
  const [statusData, setStatusData] = useState<Map<string, ProposalStatusData>>(new Map());

  const getStatusKey = (proposalId: string) => `proposal_status_${proposalId}`;

  const loadStatus = useCallback((proposalId: string): ProposalStatusData | null => {
    try {
      const saved = localStorage.getItem(getStatusKey(proposalId));
      if (saved) {
        const status = JSON.parse(saved);
        setStatusData(prev => new Map(prev).set(proposalId, status));
        return status;
      }
    } catch (error) {
      console.error('Error loading proposal status:', error);
    }
    return null;
  }, []);

  const saveStatus = useCallback((proposalId: string, status: Partial<ProposalStatusData>) => {
    try {
      const existing = statusData.get(proposalId) || loadStatus(proposalId);
      const updated = {
        ...existing,
        ...status,
        id: proposalId,
        lastModified: new Date().toISOString()
      } as ProposalStatusData;

      localStorage.setItem(getStatusKey(proposalId), JSON.stringify(updated));
      setStatusData(prev => new Map(prev).set(proposalId, updated));
      return updated;
    } catch (error) {
      console.error('Error saving proposal status:', error);
      return null;
    }
  }, [statusData, loadStatus]);

  const updateStatus = useCallback((proposalId: string, newStatus: ProposalStatus, data?: any) => {
    return saveStatus(proposalId, { status: newStatus, ...data });
  }, [saveStatus]);

  const addModification = useCallback((proposalId: string, modification: any) => {
    const current = statusData.get(proposalId) || loadStatus(proposalId);
    if (current) {
      const modifications = [...(current.modifications || []), modification];
      return saveStatus(proposalId, { 
        modifications,
        version: modification.version,
        status: 'modified' as ProposalStatus
      });
    }
    return null;
  }, [statusData, loadStatus, saveStatus]);

  const addAgentFeedback = useCallback((proposalId: string, feedback: any) => {
    return saveStatus(proposalId, { 
      agentFeedback: feedback,
      status: 'feedback-received' as ProposalStatus
    });
  }, [saveStatus]);

  const getStatus = useCallback((proposalId: string): ProposalStatusData | null => {
    return statusData.get(proposalId) || loadStatus(proposalId);
  }, [statusData, loadStatus]);

  const markAsSent = useCallback((proposalId: string) => {
    return updateStatus(proposalId, 'sent', { 
      sentDate: new Date().toISOString(),
      viewedDate: null // Reset viewed date
    });
  }, [updateStatus]);

  const markAsViewed = useCallback((proposalId: string) => {
    return updateStatus(proposalId, 'viewed', { 
      viewedDate: new Date().toISOString()
    });
  }, [updateStatus]);

  return {
    statusData,
    loadStatus,
    saveStatus,
    updateStatus,
    addModification,
    addAgentFeedback,
    getStatus,
    markAsSent,
    markAsViewed
  };
};