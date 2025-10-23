
import { QueryWorkflow, WorkflowEvent, Query } from '@/types/query';

export interface WorkflowAction {
  id: string;
  type: 'assignment' | 'communication' | 'proposal' | 'follow-up' | 'status-change';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high';
  estimatedTime?: string;
  requiredRole?: string[];
}

export interface WorkflowSummary {
  currentStep: string;
  completedSteps: string[];
  nextActions: WorkflowAction[];
  estimatedCompletion: string;
}

class QueryWorkflowService {
  private workflows: Map<string, QueryWorkflow> = new Map();
  private eventId = 1;

  // Generate a new event ID
  private generateEventId(): string {
    return `event_${this.eventId++}_${Date.now()}`;
  }

  // Create a new workflow for a query
  createWorkflow(queryId: string): QueryWorkflow {
    const workflow: QueryWorkflow = {
      id: `workflow_${queryId}`,
      queryId,
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.workflows.set(queryId, workflow);
    return workflow;
  }

  // Get workflow for a query
  getWorkflow(queryId: string): QueryWorkflow | undefined {
    return this.workflows.get(queryId);
  }

  // Add an event to a workflow
  addEvent(queryId: string, event: Omit<WorkflowEvent, 'id'>): WorkflowEvent {
    let workflow = this.workflows.get(queryId);
    
    if (!workflow) {
      workflow = this.createWorkflow(queryId);
    }

    const newEvent: WorkflowEvent = {
      ...event,
      id: this.generateEventId()
    };

    workflow.events.push(newEvent);
    workflow.updatedAt = new Date().toISOString();
    
    this.workflows.set(queryId, workflow);
    return newEvent;
  }

  // Create query creation event
  createQueryCreatedEvent(query: Query): WorkflowEvent {
    return this.addEvent(query.id, {
      type: 'created',
      timestamp: query.createdAt,
      userId: query.agentId.toString(),
      userName: query.agentName,
      userRole: 'agent',
      details: `Query created for ${query.destination.country} (${query.tripDuration.nights} nights)`,
      metadata: {
        destination: query.destination.country,
        duration: query.tripDuration.nights,
        pax: query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants,
        packageType: query.packageType
      }
    });
  }

  // Create assignment event
  createAssignmentEvent(queryId: string, assignedBy: string, assignedTo: string, assignedToName: string): WorkflowEvent {
    return this.addEvent(queryId, {
      type: 'assigned',
      timestamp: new Date().toISOString(),
      userId: assignedBy,
      userName: assignedBy,
      userRole: 'manager',
      details: `Query assigned to ${assignedToName}`,
      metadata: {
        assignedTo,
        assignedToName,
        previousStatus: 'new',
        newStatus: 'assigned'
      }
    });
  }

  // Create status change event
  createStatusChangeEvent(queryId: string, userId: string, userName: string, userRole: string, previousStatus: string, newStatus: string, reason?: string): WorkflowEvent {
    return this.addEvent(queryId, {
      type: 'status_changed',
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      details: `Status changed from ${previousStatus} to ${newStatus}${reason ? `: ${reason}` : ''}`,
      metadata: {
        previousStatus,
        newStatus,
        reason
      }
    });
  }

  // Create proposal creation event
  createProposalCreatedEvent(queryId: string, userId: string, userName: string, proposalTitle: string): WorkflowEvent {
    return this.addEvent(queryId, {
      type: 'proposal_created',
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole: 'staff',
      details: `Proposal created: ${proposalTitle}`,
      metadata: {
        proposalTitle,
        previousStatus: 'in-progress',
        newStatus: 'proposal-sent'
      }
    });
  }

  // Create follow-up event
  createFollowUpEvent(queryId: string, userId: string, userName: string, followUpDate: string, notes?: string): WorkflowEvent {
    return this.addEvent(queryId, {
      type: 'follow_up',
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole: 'staff',
      details: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}${notes ? `: ${notes}` : ''}`,
      metadata: {
        followUpDate,
        notes
      }
    });
  }

  // Create comment event
  createCommentEvent(queryId: string, userId: string, userName: string, userRole: string, comment: string): WorkflowEvent {
    return this.addEvent(queryId, {
      type: 'comment_added',
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      details: comment,
      metadata: {
        commentType: 'general'
      }
    });
  }

  // Get all events for a query ordered by timestamp
  getQueryEvents(queryId: string): WorkflowEvent[] {
    const workflow = this.workflows.get(queryId);
    if (!workflow) return [];
    
    return [...workflow.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  // Get available actions for a query
  getAvailableActions(query: Query): WorkflowAction[] {
    const actions: WorkflowAction[] = [];

    switch (query.status) {
      case 'new':
        actions.push({
          id: 'assign-staff',
          type: 'assignment',
          title: 'Assign to Staff',
          description: 'Assign this query to a staff member',
          priority: 'high'
        });
        break;
      case 'assigned':
        actions.push({
          id: 'start-working',
          type: 'status-change',
          title: 'Start Working',
          description: 'Change status to in-progress',
          priority: 'high'
        });
        break;
      case 'in-progress':
        actions.push({
          id: 'create-proposal',
          type: 'proposal',
          title: 'Create Proposal',
          description: 'Create a new proposal for this query',
          priority: 'high'
        });
        actions.push({
          id: 'add-follow-up',
          type: 'follow-up',
          title: 'Schedule Follow-up',
          description: 'Schedule a follow-up for this query',
          priority: 'normal'
        });
        break;
      case 'proposal-sent':
        actions.push({
          id: 'follow-up-proposal',
          type: 'communication',
          title: 'Follow up on Proposal',
          description: 'Contact client about the sent proposal',
          priority: 'normal'
        });
        break;
    }

    // Add common actions
    actions.push({
      id: 'add-comment',
      type: 'communication',
      title: 'Add Comment',
      description: 'Add a comment to this query',
      priority: 'low'
    });

    return actions;
  }

  // Get Thailand-specific actions
  getThailandSpecificActions(query: Query): WorkflowAction[] {
    if (query.destination.country.toLowerCase() !== 'thailand') {
      return [];
    }

    return [
      {
        id: 'visa-check',
        type: 'communication',
        title: 'Check Visa Requirements',
        description: 'Verify visa requirements for Thailand',
        priority: 'normal'
      },
      {
        id: 'weather-update',
        type: 'communication',
        title: 'Check Weather Conditions',
        description: 'Provide weather update for travel dates',
        priority: 'low'
      }
    ];
  }

  // Generate workflow summary
  generateWorkflowSummary(query: Query): WorkflowSummary {
    const events = this.getQueryEvents(query.id);
    const statusEvents = events.filter(e => e.type === 'status_changed');
    
    const completedSteps: string[] = [];
    if (events.some(e => e.type === 'created')) completedSteps.push('created');
    if (events.some(e => e.type === 'assigned')) completedSteps.push('assigned');
    if (statusEvents.some(e => e.metadata?.newStatus === 'in-progress')) completedSteps.push('in-progress');
    if (events.some(e => e.type === 'proposal_created')) completedSteps.push('proposal-sent');

    return {
      currentStep: query.status,
      completedSteps,
      nextActions: this.getAvailableActions(query),
      estimatedCompletion: this.calculateEstimatedCompletion(query)
    };
  }

  // Execute an action
  async executeAction(query: Query, actionId: string): Promise<{ success: boolean; message: string; updatedQuery?: Query }> {
    try {
      switch (actionId) {
        case 'assign-staff':
          this.createAssignmentEvent(query.id, 'current-user', 'staff-member', 'Staff Member');
          return { success: true, message: 'Query assigned successfully' };
        
        case 'start-working':
          this.createStatusChangeEvent(query.id, 'current-user', 'Current User', 'staff', query.status, 'in-progress');
          return { success: true, message: 'Status updated to in-progress' };
        
        case 'create-proposal':
          this.createProposalCreatedEvent(query.id, 'current-user', 'Current User', 'New Proposal');
          return { success: true, message: 'Proposal created successfully' };
        
        case 'add-follow-up':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          this.createFollowUpEvent(query.id, 'current-user', 'Current User', tomorrow.toISOString());
          return { success: true, message: 'Follow-up scheduled' };
        
        case 'add-comment':
          this.createCommentEvent(query.id, 'current-user', 'Current User', 'staff', 'Comment added via workflow action');
          return { success: true, message: 'Comment added successfully' };
        
        default:
          return { success: false, message: 'Unknown action' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to execute action' };
    }
  }

  // Calculate estimated completion time
  private calculateEstimatedCompletion(query: Query): string {
    const daysRemaining = Math.floor((new Date(query.travelDates.from).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    switch (query.status) {
      case 'new':
        return `${Math.min(daysRemaining - 7, 2)} days`;
      case 'assigned':
        return `${Math.min(daysRemaining - 5, 3)} days`;
      case 'in-progress':
        return `${Math.min(daysRemaining - 3, 2)} days`;
      default:
        return `${Math.max(daysRemaining - 1, 1)} days`;
    }
  }

  // Get workflow statistics
  getWorkflowStats(queryId: string): {
    totalEvents: number;
    daysInCurrentStatus: number;
    timeToFirstProposal?: number;
    averageResponseTime: number;
  } {
    const events = this.getQueryEvents(queryId);
    const statusChanges = events.filter(e => e.type === 'status_changed');
    const proposals = events.filter(e => e.type === 'proposal_created');
    
    const currentStatusEvent = statusChanges[statusChanges.length - 1];
    const daysInCurrentStatus = currentStatusEvent 
      ? Math.floor((Date.now() - new Date(currentStatusEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const timeToFirstProposal = proposals.length > 0 && events.length > 0
      ? Math.floor((new Date(proposals[0].timestamp).getTime() - new Date(events[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      totalEvents: events.length,
      daysInCurrentStatus,
      timeToFirstProposal,
      averageResponseTime: 2 // Simulated average response time in days
    };
  }

  // Export workflow as structured data
  exportWorkflow(queryId: string): any {
    const workflow = this.workflows.get(queryId);
    if (!workflow) return null;

    return {
      queryId,
      exportedAt: new Date().toISOString(),
      workflow,
      stats: this.getWorkflowStats(queryId)
    };
  }

  // Get workflow summary for dashboard
  getWorkflowSummary(queryId: string): {
    currentStatus: string;
    lastActivity: string;
    totalEvents: number;
    daysActive: number;
  } {
    const events = this.getQueryEvents(queryId);
    if (events.length === 0) {
      return {
        currentStatus: 'new',
        lastActivity: 'No activity',
        totalEvents: 0,
        daysActive: 0
      };
    }

    const lastEvent = events[events.length - 1];
    const firstEvent = events[0];
    const statusEvents = events.filter(e => e.type === 'status_changed');
    const currentStatus = statusEvents.length > 0 
      ? statusEvents[statusEvents.length - 1].metadata?.newStatus || 'new'
      : 'new';

    const daysActive = Math.floor(
      (new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()) 
      / (1000 * 60 * 60 * 24)
    );

    return {
      currentStatus,
      lastActivity: this.formatActivityDescription(lastEvent),
      totalEvents: events.length,
      daysActive
    };
  }

  private formatActivityDescription(event: WorkflowEvent): string {
    const timeAgo = this.getTimeAgo(event.timestamp);
    return `${event.details} (${timeAgo})`;
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - eventTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  }
}

export const queryWorkflowService = new QueryWorkflowService();
