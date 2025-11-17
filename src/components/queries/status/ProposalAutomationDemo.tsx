import React, { useEffect } from 'react';
import { useAutomatedProposalStatus } from '@/hooks/useAutomatedProposalStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Eye, 
  MessageSquare, 
  DollarSign, 
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
  ThumbsUp,
  Handshake,
  UserX
} from 'lucide-react';
import { AutomatedProposalStatusBadge } from './AutomatedProposalStatusBadge';
import { AutomatedProposalStatusTimeline } from './AutomatedProposalStatusTimeline';

interface ProposalAutomationDemoProps {
  queryId: string;
  proposalId?: string;
  className?: string;
}

export const ProposalAutomationDemo: React.FC<ProposalAutomationDemoProps> = ({
  queryId,
  proposalId = `proposal-${queryId}-${Date.now()}`,
  className
}) => {
  const {
    proposalStatus,
    trackingData,
    isLoading,
    error,
    handleProposalCreated,
    handleProposalSent,
    handleProposalViewed,
    handleClientFeedback,
    handlePaymentReceived,
    checkFollowUpRequired,
    getProposalsNeedingFollowUp,
    getProposalStats
  } = useAutomatedProposalStatus();

  // Initialize proposal tracking when component mounts
  useEffect(() => {
    if (queryId && !trackingData) {
      handleProposalCreated(queryId, proposalId);
    }
  }, [queryId, proposalId, trackingData, handleProposalCreated]);

  // Auto-check follow-up requirements every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (proposalId) {
        checkFollowUpRequired(proposalId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [proposalId, checkFollowUpRequired]);

  const handleDemoProposalCreated = async () => {
    await handleProposalCreated(queryId, proposalId);
  };

  const handleDemoProposalSent = async () => {
    await handleProposalSent(proposalId, 'email');
  };

  const handleDemoProposalViewed = async () => {
    await handleProposalViewed(proposalId, 'client-123', 'email');
  };

  const handleDemoClientInterested = async () => {
    await handleClientFeedback(proposalId, 'interested');
  };

  const handleDemoModificationRequested = async () => {
    await handleClientFeedback(proposalId, 'modification-requested');
  };

  const handleDemoNegotiation = async () => {
    await handleClientFeedback(proposalId, 'negotiation');
  };

  const handleDemoConfirmed = async () => {
    await handleClientFeedback(proposalId, 'interested');
  };

  const handleDemoAdvancePayment = async () => {
    await handlePaymentReceived(proposalId, 2500, 'advance');
  };

  const handleDemoFullPayment = async () => {
    await handlePaymentReceived(proposalId, 7500, 'full');
  };

  const stats = getProposalStats();
  const proposalsNeedingFollowUp = getProposalsNeedingFollowUp();

  const getActionButtons = () => {
    if (!proposalStatus) return [];

    const buttons = [];

    switch (proposalStatus) {
      case 'proposal-in-draft':
        buttons.push(
          <Button key="send" size="sm" onClick={handleDemoProposalSent} className="bg-purple-600 hover:bg-purple-700">
            <Send className="h-4 w-4 mr-2" />
            Send Proposal
          </Button>
        );
        break;

      case 'proposal-sent':
        buttons.push(
          <Button key="view" size="sm" onClick={handleDemoProposalViewed} className="bg-indigo-600 hover:bg-indigo-700">
            <Eye className="h-4 w-4 mr-2" />
            Mark as Viewed
          </Button>
        );
        break;

      case 'proposal-viewed':
        buttons.push(
          <Button key="interested" size="sm" onClick={handleDemoClientInterested} className="bg-green-600 hover:bg-green-700">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Client Interested
          </Button>,
          <Button key="modify" size="sm" onClick={handleDemoModificationRequested} className="bg-orange-600 hover:bg-orange-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Modification Requested
          </Button>
        );
        break;

      case 'modification-requested':
        buttons.push(
          <Button key="revised" size="sm" onClick={handleDemoProposalSent} className="bg-teal-600 hover:bg-teal-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Send Revised Proposal
          </Button>
        );
        break;

      case 'interested':
        buttons.push(
          <Button key="negotiate" size="sm" onClick={handleDemoNegotiation} className="bg-yellow-600 hover:bg-yellow-700">
            <Handshake className="h-4 w-4 mr-2" />
            Start Negotiation
          </Button>
        );
        break;

      case 'negotiation':
        buttons.push(
          <Button key="confirm" size="sm" onClick={handleDemoConfirmed} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Client Confirmed
          </Button>
        );
        break;

      case 'confirmed':
        buttons.push(
          <Button key="advance" size="sm" onClick={handleDemoAdvancePayment} className="bg-cyan-600 hover:bg-cyan-700">
            <DollarSign className="h-4 w-4 mr-2" />
            Receive Advance
          </Button>
        );
        break;

      case 'advance-received':
        buttons.push(
          <Button key="full" size="sm" onClick={handleDemoFullPayment} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Booking
          </Button>
        );
        break;
    }

    return buttons;
  };

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Automation Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5" />
              Proposal Automation Demo
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Query: {queryId}</Badge>
              {proposalStatus && (
                <AutomatedProposalStatusBadge status={proposalStatus} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Processing...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getActionButtons()}
              </div>
              
              {proposalsNeedingFollowUp.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {proposalsNeedingFollowUp.length} proposal(s) need follow-up
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {trackingData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <AutomatedProposalStatusTimeline 
              statusHistory={trackingData.statusHistory}
            />
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalProposals}</div>
              <div className="text-sm text-gray-600">Total Proposals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageTimeToView.toFixed(1)}h</div>
              <div className="text-sm text-gray-600">Avg Time to View</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600">Active Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalAutomationDemo;