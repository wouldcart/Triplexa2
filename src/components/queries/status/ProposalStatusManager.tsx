import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  FileText, Edit, Send, RefreshCw, Clock, CheckCircle2,
  AlertCircle, MessageSquare, Mail, User, CalendarClock
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Query } from '@/types/query';
import { toast } from 'sonner';

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

interface ProposalStatusManagerProps {
  proposal: ProposalStatusData;
  query: Query;
  onStatusUpdate: (proposalId: string, status: ProposalStatus, data?: any) => void;
  onModificationRequest: (proposalId: string, modifications: any) => void;
  onResend: (proposalId: string) => void;
}

export const ProposalStatusManager: React.FC<ProposalStatusManagerProps> = ({
  proposal,
  query,
  onStatusUpdate,
  onModificationRequest,
  onResend
}) => {
  const [modificationDialog, setModificationDialog] = useState(false);
  const [modificationData, setModificationData] = useState({
    changes: '',
    priority: 'normal' as const,
    estimatedTime: '',
    notes: ''
  });

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      case 'viewed': return 'bg-indigo-100 text-indigo-800';
      case 'feedback-received': return 'bg-orange-100 text-orange-800';
      case 'modification-requested': return 'bg-red-100 text-red-800';
      case 'modified': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'ready': return <CheckCircle2 className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'viewed': return <FileText className="h-4 w-4" />;
      case 'feedback-received': return <MessageSquare className="h-4 w-4" />;
      case 'modification-requested': return <AlertCircle className="h-4 w-4" />;
      case 'modified': return <RefreshCw className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canModify = ['feedback-received', 'modification-requested', 'sent', 'viewed'].includes(proposal.status);
  const canResend = ['modified', 'ready'].includes(proposal.status);
  const needsAttention = ['feedback-received', 'modification-requested'].includes(proposal.status);

  const handleModificationSubmit = () => {
    const modification = {
      version: proposal.version + 1,
      changes: modificationData.changes,
      modifiedAt: new Date().toISOString(),
      modifiedBy: 'current_user', // Replace with actual user
      priority: modificationData.priority,
      estimatedTime: modificationData.estimatedTime,
      notes: modificationData.notes
    };

    onModificationRequest(proposal.id, modification);
    onStatusUpdate(proposal.id, 'modified', { modification });
    
    setModificationDialog(false);
    setModificationData({
      changes: '',
      priority: 'normal',
      estimatedTime: '',
      notes: ''
    });

    toast.success('Modification request processed');
  };

  const handleResend = () => {
    onResend(proposal.id);
    onStatusUpdate(proposal.id, 'sent', { sentDate: new Date().toISOString() });
    toast.success('Proposal resent successfully');
  };

  return (
    <Card className={`${needsAttention ? 'ring-2 ring-orange-200 bg-orange-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon(proposal.status)}
            Proposal Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(proposal.status)}>
              {proposal.status.replace('-', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">v{proposal.version}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Timeline */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="h-4 w-4" />
              <span>Last Updated: {new Date(proposal.lastModified).toLocaleString()}</span>
            </div>
            
            {proposal.sentDate && (
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4" />
                <span>Sent: {new Date(proposal.sentDate).toLocaleString()}</span>
              </div>
            )}
            
            {proposal.viewedDate && (
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <span>Viewed: {new Date(proposal.viewedDate).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="text-sm">
            <span className="font-medium">Total Amount: </span>
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(proposal.totalAmount, query.destination.country)}
            </span>
          </div>
        </div>

        {/* Agent Feedback Section */}
        {proposal.agentFeedback && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">Agent Feedback</span>
              <Badge variant="outline" className={
                proposal.agentFeedback.priority === 'urgent' ? 'border-red-500 text-red-700' :
                proposal.agentFeedback.priority === 'high' ? 'border-orange-500 text-orange-700' :
                'border-blue-500 text-blue-700'
              }>
                {proposal.agentFeedback.priority}
              </Badge>
            </div>
            <p className="text-sm text-orange-700 mb-2">{proposal.agentFeedback.message}</p>
            {proposal.agentFeedback.requestedChanges.length > 0 && (
              <div>
                <span className="text-sm font-medium text-orange-800">Requested Changes:</span>
                <ul className="list-disc list-inside text-sm text-orange-700 mt-1">
                  {proposal.agentFeedback.requestedChanges.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-xs text-orange-600 mt-2">
              Received: {new Date(proposal.agentFeedback.receivedAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Modifications History */}
        {proposal.modifications && proposal.modifications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Modification History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {proposal.modifications.map((mod, index) => (
                <div key={index} className="bg-gray-50 border rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Version {mod.version}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(mod.modifiedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{mod.changes}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Modified by: {mod.modifiedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {canModify && (
            <Dialog open={modificationDialog} onOpenChange={setModificationDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Modify Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Modify Proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="changes">Changes Description *</Label>
                    <Textarea
                      id="changes"
                      placeholder="Describe the changes needed..."
                      value={modificationData.changes}
                      onChange={(e) => setModificationData(prev => ({ ...prev, changes: e.target.value }))}
                      className="min-h-20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        value={modificationData.priority}
                        onChange={(e) => setModificationData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full p-2 border rounded"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="estimatedTime">Est. Time</Label>
                      <Input
                        id="estimatedTime"
                        placeholder="e.g., 2 hours"
                        value={modificationData.estimatedTime}
                        onChange={(e) => setModificationData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information..."
                      value={modificationData.notes}
                      onChange={(e) => setModificationData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setModificationDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleModificationSubmit}
                      disabled={!modificationData.changes.trim()}
                    >
                      Process Modification
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canResend && (
            <Button variant="default" size="sm" onClick={handleResend} className="flex-1">
              <Send className="h-4 w-4 mr-1" />
              Resend Proposal
            </Button>
          )}

          {proposal.status === 'sent' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onStatusUpdate(proposal.id, 'viewed')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              Mark as Viewed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};