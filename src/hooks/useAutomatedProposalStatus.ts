import { useState, useEffect, useCallback } from 'react';
import { 
  automatedProposalStatusService, 
  AutomatedProposalStatus, 
  ProposalTrackingData 
} from '@/services/automatedProposalStatusService';
import { useToast } from '@/hooks/use-toast';

export interface UseAutomatedProposalStatusReturn {
  // Current status data
  proposalStatus: AutomatedProposalStatus | null;
  trackingData: ProposalTrackingData | null;
  isLoading: boolean;
  error: string | null;
  
  // Status transition functions
  handleProposalCreated: (queryId: string, proposalId: string) => Promise<void>;
  handleProposalSent: (proposalId: string, sendMethod: 'email' | 'whatsapp' | 'portal') => Promise<void>;
  handleProposalViewed: (proposalId: string, clientId: string, viewSource: 'email' | 'portal') => Promise<void>;
  handleClientFeedback: (proposalId: string, feedbackType: 'interested' | 'modification-requested' | 'negotiation' | 'rejection') => Promise<void>;
  handlePaymentReceived: (proposalId: string, amount: number, paymentType: 'advance' | 'full') => Promise<void>;
  
  // Automated checks
  checkFollowUpRequired: (proposalId: string) => Promise<boolean>;
  getProposalsNeedingFollowUp: () => string[];
  
  // Statistics
  getProposalStats: () => {
    totalProposals: number;
    statusDistribution: Record<AutomatedProposalStatus, number>;
    averageTimeToView: number;
    conversionRate: number;
  };
}

export const useAutomatedProposalStatus = (): UseAutomatedProposalStatusReturn => {
  const [trackingData, setTrackingData] = useState<ProposalTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current proposal status
  const proposalStatus = trackingData?.currentStatus || null;

  // Handle proposal creation with automated status transition
  const handleProposalCreated = useCallback(async (queryId: string, proposalId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await automatedProposalStatusService.handleProposalCreated(queryId, proposalId);
      const newTrackingData = automatedProposalStatusService.getProposalTracking(proposalId);
      setTrackingData(newTrackingData || null);
      
      toast({
        title: 'Proposal Created',
        description: 'Status automatically updated to "Proposal in Draft"',
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal tracking';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle proposal sending
  const handleProposalSent = useCallback(async (proposalId: string, sendMethod: 'email' | 'whatsapp' | 'portal') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await automatedProposalStatusService.handleProposalSent(proposalId, sendMethod);
      if (success) {
        const updatedTrackingData = automatedProposalStatusService.getProposalTracking(proposalId);
        setTrackingData(updatedTrackingData || null);
        
        toast({
          title: 'Proposal Sent',
          description: `Status updated to "Proposal Sent" via ${sendMethod}`,
          variant: 'default'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update proposal status';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle proposal viewing
  const handleProposalViewed = useCallback(async (proposalId: string, clientId: string, viewSource: 'email' | 'portal') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await automatedProposalStatusService.handleProposalViewed(proposalId, clientId, viewSource);
      if (success) {
        const updatedTrackingData = automatedProposalStatusService.getProposalTracking(proposalId);
        setTrackingData(updatedTrackingData || null);
        
        toast({
          title: 'Proposal Viewed',
          description: `Client viewed proposal via ${viewSource}`,
          variant: 'default'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update proposal status';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle client feedback
  const handleClientFeedback = useCallback(async (proposalId: string, feedbackType: 'interested' | 'modification-requested' | 'negotiation' | 'rejection') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await automatedProposalStatusService.handleClientFeedback(proposalId, feedbackType);
      if (success) {
        const updatedTrackingData = automatedProposalStatusService.getProposalTracking(proposalId);
        setTrackingData(updatedTrackingData || null);
        
        const statusMap = {
          'interested': 'Interested',
          'modification-requested': 'Modification Requested',
          'negotiation': 'Negotiation',
          'rejection': 'Rejected'
        };
        
        toast({
          title: 'Client Feedback Received',
          description: `Status updated to "${statusMap[feedbackType]}"`,
          variant: feedbackType === 'rejection' ? 'destructive' : 'default'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update proposal status';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle payment received
  const handlePaymentReceived = useCallback(async (proposalId: string, amount: number, paymentType: 'advance' | 'full') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await automatedProposalStatusService.handlePaymentReceived(proposalId, amount, paymentType);
      if (success) {
        const updatedTrackingData = automatedProposalStatusService.getProposalTracking(proposalId);
        setTrackingData(updatedTrackingData || null);
        
        const statusMap = {
          'advance': 'Advance Received',
          'full': 'Booking Confirmed'
        };
        
        toast({
          title: 'Payment Received',
          description: `Status updated to "${statusMap[paymentType]}" - $${amount.toLocaleString()}`,
          variant: 'success'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment status';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Check if follow-up is required
  const checkFollowUpRequired = useCallback(async (proposalId: string): Promise<boolean> => {
    try {
      return await automatedProposalStatusService.checkFollowUpRequired(proposalId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check follow-up status';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Get proposals needing follow-up
  const getProposalsNeedingFollowUp = useCallback((): string[] => {
    return automatedProposalStatusService.getProposalsNeedingFollowUp();
  }, []);

  // Get proposal statistics
  const getProposalStats = useCallback(() => {
    return automatedProposalStatusService.getProposalStats();
  }, []);

  // Load tracking data for a specific proposal
  const loadProposalTracking = useCallback((proposalId: string) => {
    const trackingData = automatedProposalStatusService.getProposalTracking(proposalId);
    setTrackingData(trackingData || null);
  }, []);

  // Load tracking data for a specific query
  const loadQueryTracking = useCallback((queryId: string) => {
    const trackingData = automatedProposalStatusService.getTrackingByQueryId(queryId);
    setTrackingData(trackingData || null);
  }, []);

  // Auto-refresh tracking data
  useEffect(() => {
    const interval = setInterval(() => {
      if (trackingData?.proposalId) {
        checkFollowUpRequired(trackingData.proposalId);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [trackingData?.proposalId, checkFollowUpRequired]);

  return {
    // Current status data
    proposalStatus,
    trackingData,
    isLoading,
    error,
    
    // Status transition functions
    handleProposalCreated,
    handleProposalSent,
    handleProposalViewed,
    handleClientFeedback,
    handlePaymentReceived,
    
    // Automated checks
    checkFollowUpRequired,
    getProposalsNeedingFollowUp,
    
    // Statistics
    getProposalStats,
    
    // Utility functions
    loadProposalTracking,
    loadQueryTracking
  };
};