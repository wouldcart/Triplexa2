import { useState, useEffect, useCallback } from 'react';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { EnhancedProposalManager as EPM } from '@/services/enhancedProposalManager';

interface WorkflowStep {
  id: string;
  name: string;
  completed: boolean;
  active: boolean;
}

interface EnquiryWorkflowState {
  currentStep: number;
  steps: WorkflowStep[];
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
  isDataSaved: boolean;
}

export const useEnquiryWorkflow = (queryId?: string) => {
  const [workflow, setWorkflow] = useState<EnquiryWorkflowState>({
    currentStep: 0,
    steps: [
      { id: 'query', name: 'Create Query', completed: false, active: true },
      { id: 'proposal', name: 'Build Proposal', completed: false, active: false },
      { id: 'pricing', name: 'Calculate Pricing', completed: false, active: false },
      { id: 'preview', name: 'Review & Preview', completed: false, active: false },
      { id: 'share', name: 'Share Proposal', completed: false, active: false }
    ],
    queryData: null,
    proposalData: {
      days: [],
      totalCost: 0,
      modules: []
    },
    shareData: {
      status: 'draft'
    },
    isDataSaved: true
  });

  // Load workflow data on mount
  useEffect(() => {
    if (queryId) {
      loadWorkflowData(queryId);
    }
  }, [queryId]);

  const loadWorkflowData = useCallback((queryId: string) => {
    try {
      const saved = localStorage.getItem(`enquiry_workflow_${queryId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setWorkflow(prev => ({
          ...prev,
          ...parsed,
          isDataSaved: true
        }));
        console.log('Loaded workflow data for:', queryId);
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    }
  }, []);

  const saveWorkflowData = useCallback(() => {
    if (!queryId) return;

    try {
      const workflowData = {
        ...workflow,
        lastSaved: new Date().toISOString(),
        version: Date.now()
      };

      localStorage.setItem(`enquiry_workflow_${queryId}`, JSON.stringify(workflowData));
      
      // Also save individual components for compatibility
      if (workflow.proposalData.days.length > 0) {
        localStorage.setItem(`proposal_draft_${queryId}`, JSON.stringify({
          queryId,
          days: workflow.proposalData.days,
          totalCost: workflow.proposalData.totalCost,
          savedAt: new Date().toISOString(),
          version: Date.now()
        }));
      }

      setWorkflow(prev => ({ ...prev, isDataSaved: true }));
      console.log('Workflow data saved for:', queryId);
    } catch (error) {
      console.error('Error saving workflow data:', error);
    }
  }, [workflow, queryId]);

  // Auto-save when data changes
  useEffect(() => {
    if (queryId && workflow.queryData && !workflow.isDataSaved) {
      const timeoutId = setTimeout(() => {
        saveWorkflowData();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [workflow, queryId, saveWorkflowData]);

  const updateQuery = useCallback((query: Query) => {
    setWorkflow(prev => {
      const updatedSteps = prev.steps.map((step, index) => ({
        ...step,
        completed: index === 0,
        active: index === 1
      }));

      return {
        ...prev,
        currentStep: 1,
        steps: updatedSteps,
        queryData: query,
        isDataSaved: false
      };
    });
  }, []);

  const updateProposal = useCallback((proposalData: Partial<EnquiryWorkflowState['proposalData']>) => {
    setWorkflow(prev => {
      const updatedSteps = prev.steps.map((step, index) => ({
        ...step,
        completed: index <= 1,
        active: index === 2
      }));

      return {
        ...prev,
        currentStep: 2,
        steps: updatedSteps,
        proposalData: {
          ...prev.proposalData,
          ...proposalData
        },
        isDataSaved: false
      };
    });
  }, []);

  const completeStep = useCallback((stepIndex: number) => {
    setWorkflow(prev => {
      const updatedSteps = prev.steps.map((step, index) => ({
        ...step,
        completed: index <= stepIndex,
        active: index === stepIndex + 1
      }));

      return {
        ...prev,
        currentStep: Math.min(stepIndex + 1, prev.steps.length - 1),
        steps: updatedSteps,
        isDataSaved: false
      };
    });
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setWorkflow(prev => {
      const updatedSteps = prev.steps.map((step, index) => ({
        ...step,
        active: index === stepIndex
      }));

      return {
        ...prev,
        currentStep: stepIndex,
        steps: updatedSteps
      };
    });
  }, []);

  const shareProposal = useCallback(async (shareData: Partial<EnquiryWorkflowState['shareData']>) => {
    if (!queryId || !workflow.queryData) return;

    try {
      // Save complete proposal using enhanced manager
      const proposalId = EPM.saveEnhancedProposal({
        queryId,
        query: workflow.queryData,
        days: workflow.proposalData.days,
        totalCost: workflow.proposalData.totalCost,
        pricing: {
          basePrice: workflow.proposalData.totalCost,
          markup: 0,
          finalPrice: workflow.proposalData.totalCost,
          currency: 'USD'
        }
      });

      // Update share status
      EPM.updateProposalStatus(proposalId, 'shared', shareData.shareUrl);

      setWorkflow(prev => {
        const updatedSteps = prev.steps.map((step, index) => ({
          ...step,
          completed: true,
          active: index === prev.steps.length - 1
        }));

        return {
          ...prev,
          currentStep: prev.steps.length - 1,
          steps: updatedSteps,
          shareData: {
            ...prev.shareData,
            ...shareData,
            sharedAt: new Date().toISOString(),
            status: 'shared'
          },
          isDataSaved: false
        };
      });

      return proposalId;
    } catch (error) {
      console.error('Error sharing proposal:', error);
      throw error;
    }
  }, [queryId, workflow]);

  const resetWorkflow = useCallback(() => {
    setWorkflow({
      currentStep: 0,
      steps: [
        { id: 'query', name: 'Create Query', completed: false, active: true },
        { id: 'proposal', name: 'Build Proposal', completed: false, active: false },
        { id: 'pricing', name: 'Calculate Pricing', completed: false, active: false },
        { id: 'preview', name: 'Review & Preview', completed: false, active: false },
        { id: 'share', name: 'Share Proposal', completed: false, active: false }
      ],
      queryData: null,
      proposalData: {
        days: [],
        totalCost: 0,
        modules: []
      },
      shareData: {
        status: 'draft'
      },
      isDataSaved: true
    });

    // Clear localStorage
    if (queryId) {
      localStorage.removeItem(`enquiry_workflow_${queryId}`);
      localStorage.removeItem(`proposal_draft_${queryId}`);
    }
  }, [queryId]);

  return {
    workflow,
    updateQuery,
    updateProposal,
    completeStep,
    goToStep,
    shareProposal,
    saveWorkflowData,
    resetWorkflow
  };
};