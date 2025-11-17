import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, CheckCircle2, Clock, Send, Edit, RefreshCw, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Query } from '@/types/query';
import { useAutomatedProposalStatus } from '@/hooks/useAutomatedProposalStatus';
import { AutomatedProposalStatusBadge } from './AutomatedProposalStatusBadge';
interface ProposalState {
  hasProposals: boolean;
  hasDrafts: boolean;
  proposalCount: number;
  draftCount: number;
  lastProposalStatus?: 'draft' | 'ready' | 'sent' | 'viewed' | 'feedback-received' | 'modification-requested';
  lastActivity?: string;
  needsAttention: boolean;
}
interface SmartProposalStatusProps {
  query: Query;
  proposalState: ProposalState;
  onCreateNew: () => void;
  onContinueDraft: () => void;
  onViewProposal: () => void;
}
export const SmartProposalStatus: React.FC<SmartProposalStatusProps> = ({
  query,
  proposalState,
  onCreateNew,
  onContinueDraft,
  onViewProposal
}) => {
  // Integrate automated proposal status
  const { currentStatus, trackingData, isLoading: statusLoading } = useAutomatedProposalStatus(query.id);
  const getStatusMessage = () => {
    if (!proposalState.hasProposals && !proposalState.hasDrafts) {
      return {
        title: "Ready to Start",
        description: "No proposal work has been started for this query yet. Click below to begin creating a comprehensive proposal.",
        action: "Start First Proposal",
        actionHandler: onCreateNew,
        icon: <FileText className="h-12 w-12 text-blue-500 dark:text-blue-400" />,
        variant: "new" as const
      };
    }
    if (proposalState.hasDrafts && !proposalState.hasProposals) {
      // Use automated status if available, fallback to manual draft status
      const automatedTitle = currentStatus === 'proposal-in-draft' ? 'Proposal in Draft' : 
                           currentStatus === 'proposal-sent' ? 'Proposal Sent' :
                           currentStatus === 'proposal-viewed' ? 'Proposal Viewed' :
                           'Draft in Progress';
      
      return {
        title: automatedTitle,
        description: `You have ${proposalState.draftCount} draft${proposalState.draftCount > 1 ? 's' : ''} saved. ${currentStatus === 'proposal-in-draft' ? 'Your proposal is currently being drafted.' : 'Continue working on your proposal or create a new one.'}`,
        action: "Continue Draft",
        actionHandler: onContinueDraft,
        icon: <Edit className="h-12 w-12 text-orange-500 dark:text-orange-400" />,
        variant: "draft" as const
      };
    }
    if (proposalState.hasProposals) {
      const needsAttention = proposalState.needsAttention;
      const status = proposalState.lastProposalStatus;
      if (needsAttention) {
        return {
          title: "Action Required",
          description: "The agent has provided feedback or requested modifications to your proposal. Please review and update accordingly.",
          action: "Review Feedback",
          actionHandler: onViewProposal,
          icon: <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />,
          variant: "attention" as const
        };
      }
      if (status === 'sent' || status === 'viewed') {
        return {
          title: "Proposal Sent",
          description: `Your proposal has been ${status === 'viewed' ? 'viewed by the agent' : 'sent to the agent'}. Waiting for feedback or approval.`,
          action: "View Proposal",
          actionHandler: onViewProposal,
          icon: <Send className="h-12 w-12 text-purple-500 dark:text-purple-400" />,
          variant: "sent" as const
        };
      }
      return {
        title: "Proposal Ready",
        description: `You have ${proposalState.proposalCount} proposal${proposalState.proposalCount > 1 ? 's' : ''} for this query. View existing proposals or create a new version.`,
        action: "View Proposals",
        actionHandler: onViewProposal,
        icon: <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400" />,
        variant: "ready" as const
      };
    }
    return {
      title: "Unknown State",
      description: "Unable to determine proposal status.",
      action: "Create New",
      actionHandler: onCreateNew,
      icon: <Clock className="h-12 w-12 text-muted-foreground" />,
      variant: "unknown" as const
    };
  };
  const getCardStyling = (variant: string) => {
    switch (variant) {
      case 'new':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/30';
      case 'draft':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50/80 dark:hover:bg-orange-950/30';
      case 'attention':
        return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50/80 dark:hover:bg-red-950/30 ring-2 ring-red-100 dark:ring-red-900';
      case 'sent':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50/80 dark:hover:bg-purple-950/30';
      case 'ready':
        return 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50/80 dark:hover:bg-green-950/30';
      default:
        return 'border-border bg-card hover:bg-muted/50';
    }
  };
  const status = getStatusMessage();
  return <div className="space-y-4">
      {/* Status Overview */}
      <Card className={`transition-all duration-200 ${getCardStyling(status.variant)}`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
            <div className="scale-75 md:scale-100">
              {status.icon}
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg md:text-xl font-semibold">{status.title}</h3>
                {currentStatus && <AutomatedProposalStatusBadge status={currentStatus} size="sm" />}
              </div>
              <p className="text-sm md:text-base text-muted-foreground max-w-md px-2">{status.description}</p>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 md:gap-3 w-full max-w-sm">
              <Button onClick={status.actionHandler} size="sm" className={`flex-1 text-sm md:text-base ${status.variant === 'attention' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white' : ''}`}>
                {status.action}
              </Button>
              
              {proposalState.hasProposals && status.variant !== 'attention' && <Button variant="outline" size="sm" onClick={onCreateNew} className="flex-1 text-sm md:text-base">
                  Create New
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      

      {/* Activity Timeline */}
      {proposalState.lastActivity && <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs md:text-sm font-medium">Last Activity: </span>
                  <span className="text-xs md:text-sm text-muted-foreground break-all">
                    {new Date(proposalState.lastActivity).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:ml-auto">
                {currentStatus && <AutomatedProposalStatusBadge status={currentStatus} size="xs" />}
                {proposalState.lastProposalStatus && <Badge variant="outline" className="text-xs self-start">
                    {proposalState.lastProposalStatus.replace('-', ' ').toUpperCase()}
                  </Badge>}
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
};