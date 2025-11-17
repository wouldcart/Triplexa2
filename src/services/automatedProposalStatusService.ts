import { Query, Proposal } from '@/types/query';
import { queryWorkflowService } from './queryWorkflowService';

export type AutomatedProposalStatus = 
  | 'proposal-in-draft'
  | 'proposal-sent' 
  | 'proposal-viewed'
  | 'modification-requested'
  | 'revised-proposal-sent'
  | 'follow-up-pending'
  | 'no-response'
  | 'interested'
  | 'negotiation'
  | 'confirmed'
  | 'advance-received'
  | 'booking-confirmed';

export interface ProposalStatusTransition {
  from: AutomatedProposalStatus | 'assigned' | 'in-progress';
  to: AutomatedProposalStatus;
  trigger: 'proposal-created' | 'proposal-sent' | 'proposal-viewed' | 'client-feedback' | 'follow-up-due' | 'no-response-detected' | 'client-interested' | 'negotiation-started' | 'payment-received' | 'booking-completed';
  conditions?: {
    daysSinceLastActivity?: number;
    clientResponseRequired?: boolean;
    paymentReceived?: boolean;
    followUpCount?: number;
  };
}

export interface ProposalTrackingData {
  queryId: string;
  proposalId: string;
  currentStatus: AutomatedProposalStatus;
  statusHistory: {
    status: AutomatedProposalStatus;
    timestamp: string;
    triggeredBy: string;
    metadata?: Record<string, any>;
  }[];
  proposalSentDate?: string;
  proposalViewedDate?: string;
  lastClientInteraction?: string;
  followUpCount: number;
  lastFollowUpDate?: string;
  clientResponseCount: number;
  paymentHistory: {
    amount: number;
    date: string;
    type: 'advance' | 'full-payment';
  }[];
}

class AutomatedProposalStatusService {
  private proposalTracking: Map<string, ProposalTrackingData> = new Map();
  private statusTransitionRules: ProposalStatusTransition[] = [
    // Initial proposal creation flow
    {
      from: 'assigned',
      to: 'proposal-in-draft',
      trigger: 'proposal-created'
    },
    {
      from: 'in-progress',
      to: 'proposal-in-draft',
      trigger: 'proposal-created'
    },
    
    // Proposal sending and viewing flow
    {
      from: 'proposal-in-draft',
      to: 'proposal-sent',
      trigger: 'proposal-sent'
    },
    {
      from: 'proposal-sent',
      to: 'proposal-viewed',
      trigger: 'proposal-viewed'
    },
    {
      from: 'proposal-viewed',
      to: 'modification-requested',
      trigger: 'client-feedback',
      conditions: { clientResponseRequired: true }
    },
    {
      from: 'modification-requested',
      to: 'revised-proposal-sent',
      trigger: 'proposal-sent'
    },
    
    // Client engagement flow
    {
      from: 'proposal-viewed',
      to: 'interested',
      trigger: 'client-interested'
    },
    {
      from: 'interested',
      to: 'negotiation',
      trigger: 'negotiation-started'
    },
    {
      from: 'negotiation',
      to: 'confirmed',
      trigger: 'client-interested'
    },
    
    // Payment and booking flow
    {
      from: 'confirmed',
      to: 'advance-received',
      trigger: 'payment-received',
      conditions: { paymentReceived: true }
    },
    {
      from: 'advance-received',
      to: 'booking-confirmed',
      trigger: 'booking-completed'
    },
    
    // Follow-up automation
    {
      from: 'proposal-sent',
      to: 'follow-up-pending',
      trigger: 'follow-up-due',
      conditions: { daysSinceLastActivity: 3, followUpCount: 0 }
    },
    {
      from: 'follow-up-pending',
      to: 'no-response',
      trigger: 'no-response-detected',
      conditions: { daysSinceLastActivity: 7, followUpCount: 2 }
    }
  ];

  // Initialize tracking for a new proposal
  initializeProposalTracking(queryId: string, proposalId: string): ProposalTrackingData {
    const trackingData: ProposalTrackingData = {
      queryId,
      proposalId,
      currentStatus: 'proposal-in-draft',
      statusHistory: [{
        status: 'proposal-in-draft',
        timestamp: new Date().toISOString(),
        triggeredBy: 'system',
        metadata: { reason: 'Initial proposal creation' }
      }],
      followUpCount: 0,
      clientResponseCount: 0,
      paymentHistory: []
    };

    this.proposalTracking.set(proposalId, trackingData);
    return trackingData;
  }

  // Get current tracking data for a proposal
  getProposalTracking(proposalId: string): ProposalTrackingData | undefined {
    return this.proposalTracking.get(proposalId);
  }

  // Get tracking data by query ID
  getTrackingByQueryId(queryId: string): ProposalTrackingData | undefined {
    return Array.from(this.proposalTracking.values()).find(tracking => tracking.queryId === queryId);
  }

  // Automated status transition based on trigger
  async transitionStatus(
    proposalId: string, 
    trigger: ProposalStatusTransition['trigger'], 
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const trackingData = this.proposalTracking.get(proposalId);
    if (!trackingData) {
      console.warn(`No tracking data found for proposal ${proposalId}`);
      return false;
    }

    const applicableRules = this.statusTransitionRules.filter(rule => 
      rule.from === trackingData.currentStatus && 
      rule.trigger === trigger
    );

    if (applicableRules.length === 0) {
      console.warn(`No applicable transition rules for status ${trackingData.currentStatus} and trigger ${trigger}`);
      return false;
    }

    // Check conditions for the first applicable rule
    const rule = applicableRules[0];
    if (rule.conditions && !this.checkTransitionConditions(trackingData, rule.conditions)) {
      console.warn(`Transition conditions not met for rule`, rule);
      return false;
    }

    // Execute the transition
    return this.executeStatusTransition(trackingData, rule.to, trigger, metadata);
  }

  // Check if transition conditions are met
  private checkTransitionConditions(
    trackingData: ProposalTrackingData, 
    conditions: ProposalStatusTransition['conditions']
  ): boolean {
    if (!conditions) return true;

    const now = new Date();
    const lastActivity = trackingData.lastClientInteraction ? new Date(trackingData.lastClientInteraction) : null;
    
    // Check days since last activity
    if (conditions.daysSinceLastActivity && lastActivity) {
      const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < conditions.daysSinceLastActivity) {
        return false;
      }
    }

    // Check follow-up count
    if (conditions.followUpCount !== undefined) {
      if (trackingData.followUpCount < conditions.followUpCount) {
        return false;
      }
    }

    // Check payment received
    if (conditions.paymentReceived && trackingData.paymentHistory.length === 0) {
      return false;
    }

    return true;
  }

  // Execute the actual status transition
  private executeStatusTransition(
    trackingData: ProposalTrackingData,
    newStatus: AutomatedProposalStatus,
    trigger: ProposalStatusTransition['trigger'],
    metadata?: Record<string, any>
  ): boolean {
    const oldStatus = trackingData.currentStatus;
    
    // Update tracking data
    trackingData.currentStatus = newStatus;
    trackingData.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      triggeredBy: trigger,
      metadata
    });

    // Update specific tracking fields based on status
    switch (newStatus) {
      case 'proposal-sent':
        trackingData.proposalSentDate = new Date().toISOString();
        break;
      case 'proposal-viewed':
        trackingData.proposalViewedDate = new Date().toISOString();
        trackingData.lastClientInteraction = new Date().toISOString();
        trackingData.clientResponseCount++;
        break;
      case 'follow-up-pending':
        trackingData.followUpCount++;
        trackingData.lastFollowUpDate = new Date().toISOString();
        break;
    }

    // Create workflow event
    this.createWorkflowEvent(trackingData.queryId, oldStatus, newStatus, trigger, metadata);

    console.log(`Automated status transition: ${oldStatus} → ${newStatus} (trigger: ${trigger})`);
    return true;
  }

  // Create workflow event for the transition
  private createWorkflowEvent(
    queryId: string,
    oldStatus: string,
    newStatus: string,
    trigger: string,
    metadata?: Record<string, any>
  ): void {
    queryWorkflowService.addEvent(queryId, {
      type: 'status_changed',
      timestamp: new Date().toISOString(),
      userId: 'automated-system',
      userName: 'Automated System',
      userRole: 'system',
      details: `Automated status transition: ${oldStatus} → ${newStatus} (trigger: ${trigger})`,
      metadata: {
        previousStatus: oldStatus,
        newStatus,
        trigger,
        automated: true,
        ...metadata
      }
    });
  }

  // Handle proposal creation
  async handleProposalCreated(queryId: string, proposalId: string): Promise<void> {
    const trackingData = this.initializeProposalTracking(queryId, proposalId);
    
    // Transition from assigned/in-progress to proposal-in-draft
    const query = await this.getQueryById(queryId);
    if (query && (query.status === 'assigned' || query.status === 'in-progress')) {
      await this.transitionStatus(proposalId, 'proposal-created', {
        queryStatus: query.status,
        proposalCreatedAt: new Date().toISOString()
      });
    }
  }

  // Handle proposal sending
  async handleProposalSent(proposalId: string, sendMethod: 'email' | 'whatsapp' | 'portal'): Promise<void> {
    await this.transitionStatus(proposalId, 'proposal-sent', {
      sendMethod,
      sentAt: new Date().toISOString()
    });
  }

  // Handle proposal viewing
  async handleProposalViewed(proposalId: string, clientId: string, viewSource: 'email' | 'portal'): Promise<void> {
    await this.transitionStatus(proposalId, 'proposal-viewed', {
      clientId,
      viewSource,
      viewedAt: new Date().toISOString()
    });
  }

  // Handle client feedback
  async handleClientFeedback(proposalId: string, feedbackType: 'interested' | 'modification-requested' | 'negotiation' | 'rejection'): Promise<void> {
    const triggerMap = {
      'interested': 'client-interested',
      'modification-requested': 'client-feedback',
      'negotiation': 'negotiation-started',
      'rejection': 'client-rejected'
    };

    await this.transitionStatus(proposalId, triggerMap[feedbackType], {
      feedbackType,
      receivedAt: new Date().toISOString()
    });
  }

  // Handle payment received
  async handlePaymentReceived(proposalId: string, amount: number, paymentType: 'advance' | 'full'): Promise<void> {
    const trackingData = this.proposalTracking.get(proposalId);
    if (trackingData) {
      trackingData.paymentHistory.push({
        amount,
        date: new Date().toISOString(),
        type: paymentType === 'advance' ? 'advance' : 'full-payment'
      });

      await this.transitionStatus(proposalId, 'payment-received', {
        amount,
        paymentType,
        receivedAt: new Date().toISOString()
      });
    }
  }

  // Automated follow-up check
  async checkFollowUpRequired(proposalId: string): Promise<boolean> {
    const trackingData = this.proposalTracking.get(proposalId);
    if (!trackingData) return false;

    const now = new Date();
    const lastActivity = trackingData.lastClientInteraction ? new Date(trackingData.lastClientInteraction) : null;
    const lastFollowUp = trackingData.lastFollowUpDate ? new Date(trackingData.lastFollowUpDate) : null;
    
    // Check if follow-up is needed based on current status
    switch (trackingData.currentStatus) {
      case 'proposal-sent':
        // Follow up after 3 days if no response
        if (lastActivity && Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) >= 3) {
          return this.transitionStatus(proposalId, 'follow-up-due', {
            reason: 'No response after 3 days',
            followUpNumber: trackingData.followUpCount + 1
          });
        }
        break;
        
      case 'follow-up-pending':
        // Mark as no response after 7 days and 2 follow-ups
        if (trackingData.followUpCount >= 2 && lastFollowUp && 
            Math.floor((now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60 * 24)) >= 4) {
          return this.transitionStatus(proposalId, 'no-response-detected', {
            reason: 'No response after multiple follow-ups',
            totalFollowUps: trackingData.followUpCount
          });
        }
        break;
    }

    return false;
  }

  // Get all proposals that need follow-up
  getProposalsNeedingFollowUp(): string[] {
    const proposalsNeedingFollowUp: string[] = [];
    
    for (const [proposalId, trackingData] of this.proposalTracking.entries()) {
      if (this.shouldFollowUp(trackingData)) {
        proposalsNeedingFollowUp.push(proposalId);
      }
    }
    
    return proposalsNeedingFollowUp;
  }

  // Check if a proposal should be followed up
  private shouldFollowUp(trackingData: ProposalTrackingData): boolean {
    const now = new Date();
    const lastActivity = trackingData.lastClientInteraction ? new Date(trackingData.lastClientInteraction) : null;
    const lastFollowUp = trackingData.lastFollowUpDate ? new Date(trackingData.lastFollowUpDate) : null;
    
    switch (trackingData.currentStatus) {
      case 'proposal-sent':
        return lastActivity !== null && Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) >= 3;
        
      case 'follow-up-pending':
        return trackingData.followUpCount < 2 && lastFollowUp !== null && 
               Math.floor((now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60 * 24)) >= 2;
               
      default:
        return false;
    }
  }

  // Helper method to get query by ID (would be implemented with actual data service)
  private async getQueryById(queryId: string): Promise<Query | null> {
    // This would typically call a data service to get the query
    // For now, returning null as this would be implemented based on your data layer
    return null;
  }

  // Get proposal status statistics
  getProposalStats(): {
    totalProposals: number;
    statusDistribution: Record<AutomatedProposalStatus, number>;
    averageTimeToView: number;
    conversionRate: number;
  } {
    const allTrackingData = Array.from(this.proposalTracking.values());
    
    const statusDistribution = allTrackingData.reduce((acc, tracking) => {
      acc[tracking.currentStatus] = (acc[tracking.currentStatus] || 0) + 1;
      return acc;
    }, {} as Record<AutomatedProposalStatus, number>);

    // Calculate average time to view (in hours)
    const viewedProposals = allTrackingData.filter(t => t.proposalViewedDate && t.proposalSentDate);
    const averageTimeToView = viewedProposals.length > 0
      ? viewedProposals.reduce((sum, t) => {
          const sentTime = new Date(t.proposalSentDate!).getTime();
          const viewedTime = new Date(t.proposalViewedDate!).getTime();
          return sum + (viewedTime - sentTime) / (1000 * 60 * 60);
        }, 0) / viewedProposals.length
      : 0;

    // Calculate conversion rate (proposals that reached confirmed or beyond)
    const convertedProposals = allTrackingData.filter(t => 
      ['confirmed', 'advance-received', 'booking-confirmed'].includes(t.currentStatus)
    );
    const conversionRate = allTrackingData.length > 0 
      ? (convertedProposals.length / allTrackingData.length) * 100 
      : 0;

    return {
      totalProposals: allTrackingData.length,
      statusDistribution,
      averageTimeToView,
      conversionRate
    };
  }
}

export const automatedProposalStatusService = new AutomatedProposalStatusService();