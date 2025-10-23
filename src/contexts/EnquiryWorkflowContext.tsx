import React, { createContext, useContext, useState, useEffect } from 'react';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface WorkflowState {
  currentStep: 'query-creation' | 'proposal-building' | 'pricing' | 'preview' | 'sharing';
  queryData: Query | null;
  proposalData: {
    days: ItineraryDay[];
    totalCost: number;
    modules: any[];
  };
  shareData: {
    shareUrl?: string;
    sharedAt?: string;
    status: 'draft' | 'shared' | 'sent';
  };
}

interface EnquiryWorkflowContextType {
  workflowState: WorkflowState;
  updateQuery: (query: Query) => void;
  updateProposal: (proposal: Partial<WorkflowState['proposalData']>) => void;
  updateShareData: (shareData: Partial<WorkflowState['shareData']>) => void;
  setCurrentStep: (step: WorkflowState['currentStep']) => void;
  saveWorkflow: () => void;
  loadWorkflow: (queryId: string) => WorkflowState | null;
  resetWorkflow: () => void;
  isDataSaved: boolean;
}

const EnquiryWorkflowContext = createContext<EnquiryWorkflowContextType | undefined>(undefined);

export const useEnquiryWorkflow = () => {
  const context = useContext(EnquiryWorkflowContext);
  if (!context) {
    throw new Error('useEnquiryWorkflow must be used within an EnquiryWorkflowProvider');
  }
  return context;
};

interface EnquiryWorkflowProviderProps {
  children: React.ReactNode;
  queryId?: string;
}

export const EnquiryWorkflowProvider: React.FC<EnquiryWorkflowProviderProps> = ({ 
  children, 
  queryId 
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 'query-creation',
    queryData: null,
    proposalData: {
      days: [],
      totalCost: 0,
      modules: []
    },
    shareData: {
      status: 'draft'
    }
  });

  const [isDataSaved, setIsDataSaved] = useState(true);

  // Load workflow data on mount
  useEffect(() => {
    if (queryId) {
      const loadedWorkflow = loadWorkflow(queryId);
      if (loadedWorkflow) {
        setWorkflowState(loadedWorkflow);
      }
    }
  }, [queryId]);

  // Auto-save when state changes
  useEffect(() => {
    if (queryId && workflowState.queryData) {
      saveWorkflow();
    }
  }, [workflowState, queryId]);

  const updateQuery = (query: Query) => {
    setWorkflowState(prev => ({
      ...prev,
      queryData: query,
      currentStep: 'proposal-building'
    }));
    setIsDataSaved(false);
  };

  const updateProposal = (proposal: Partial<WorkflowState['proposalData']>) => {
    setWorkflowState(prev => ({
      ...prev,
      proposalData: {
        ...prev.proposalData,
        ...proposal
      }
    }));
    setIsDataSaved(false);
  };

  const updateShareData = (shareData: Partial<WorkflowState['shareData']>) => {
    setWorkflowState(prev => ({
      ...prev,
      shareData: {
        ...prev.shareData,
        ...shareData
      }
    }));
    setIsDataSaved(false);
  };

  const setCurrentStep = (step: WorkflowState['currentStep']) => {
    setWorkflowState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  const saveWorkflow = () => {
    if (!queryId || !workflowState.queryData) return;

    try {
      const workflowData = {
        ...workflowState,
        lastSaved: new Date().toISOString(),
        version: Date.now()
      };

      // Save complete workflow
      localStorage.setItem(`enquiry_workflow_${queryId}`, JSON.stringify(workflowData));
      
      // Save individual components for compatibility
      localStorage.setItem(`proposal_draft_${queryId}`, JSON.stringify({
        queryId,
        days: workflowState.proposalData.days,
        totalCost: workflowState.proposalData.totalCost,
        savedAt: new Date().toISOString(),
        version: Date.now()
      }));

      setIsDataSaved(true);
      console.log('Workflow saved successfully for query:', queryId);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const loadWorkflow = (queryId: string): WorkflowState | null => {
    try {
      const saved = localStorage.getItem(`enquiry_workflow_${queryId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loaded workflow for query:', queryId, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
    return null;
  };

  const resetWorkflow = () => {
    setWorkflowState({
      currentStep: 'query-creation',
      queryData: null,
      proposalData: {
        days: [],
        totalCost: 0,
        modules: []
      },
      shareData: {
        status: 'draft'
      }
    });
    setIsDataSaved(true);
  };

  return (
    <EnquiryWorkflowContext.Provider value={{
      workflowState,
      updateQuery,
      updateProposal,
      updateShareData,
      setCurrentStep,
      saveWorkflow,
      loadWorkflow,
      resetWorkflow,
      isDataSaved
    }}>
      {children}
    </EnquiryWorkflowContext.Provider>
  );
};