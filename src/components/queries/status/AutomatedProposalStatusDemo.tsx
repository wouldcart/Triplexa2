import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Send, 
  Eye, 
  MessageSquare, 
  RefreshCw, 
  Clock,
  CheckCircle2, 
  DollarSign,
  UserX,
  ThumbsUp,
  Handshake,
  Play
} from 'lucide-react';
import { AutomatedProposalStatusBadge } from '@/components/queries/status/AutomatedProposalStatusBadge';

// Demo component to showcase automated proposal status system
const AutomatedProposalStatusDemo: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState<'proposal-in-draft'>('proposal-in-draft');
  const [statusHistory, setStatusHistory] = useState([
    {
      status: 'proposal-in-draft' as const,
      timestamp: new Date().toISOString(),
      triggeredBy: 'demo-init'
    }
  ]);

  const statusFlow = [
    'proposal-in-draft',
    'proposal-sent',
    'proposal-viewed',
    'modification-requested',
    'revised-proposal-sent',
    'interested',
    'negotiation',
    'confirmed',
    'advance-received',
    'booking-confirmed'
  ];

  const nextStatus = () => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      const nextStatusValue = statusFlow[currentIndex + 1];
      setCurrentStatus(nextStatusValue);
      
      setStatusHistory(prev => [...prev, {
        status: nextStatusValue,
        timestamp: new Date().toISOString(),
        triggeredBy: 'demo-user'
      }]);
    }
  };

  const resetDemo = () => {
    setCurrentStatus('proposal-in-draft');
    setStatusHistory([{
      status: 'proposal-in-draft' as const,
      timestamp: new Date().toISOString(),
      triggeredBy: 'demo-reset'
    }]);
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      'proposal-in-draft': 'Enquiry created, proposal not yet finalized or sent',
      'proposal-sent': 'Proposal shared with client (via email/WhatsApp)',
      'proposal-viewed': 'Client has opened or viewed the sent proposal',
      'modification-requested': 'Client has requested changes in the proposal',
      'revised-proposal-sent': 'Updated version of the proposal has been sent',
      'follow-up-pending': 'Awaiting client\'s response or scheduled follow-up',
      'no-response': 'Client not responding after multiple follow-ups',
      'interested': 'Client has shown positive intent but not yet confirmed',
      'negotiation': 'Pricing or inclusions under discussion',
      'confirmed': 'Client has confirmed the booking verbally or via message',
      'advance-received': 'Partial payment received for confirmation',
      'booking-confirmed': 'Full confirmation with payment and documentation done'
    };
    
    return descriptions[status as keyof typeof descriptions] || 'Status updated';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Play className="h-5 w-5" />
            Automated Proposal Status System Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <h3 className="font-semibold text-gray-900">Current Status</h3>
                <p className="text-sm text-gray-600">{getStatusDescription(currentStatus)}</p>
              </div>
              <AutomatedProposalStatusBadge status={currentStatus} size="lg" />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={nextStatus}
                disabled={currentStatus === 'booking-confirmed'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Status →
              </Button>
              <Button 
                onClick={resetDemo}
                variant="outline"
              >
                Reset Demo
              </Button>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Status Timeline</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {statusHistory.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded border-l-4 border-blue-200 bg-gray-50">
                    <div className="flex-shrink-0">
                      <AutomatedProposalStatusBadge status={item.status} size="sm" showIcon={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Available Status Transitions</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {statusFlow.map((status, index) => (
                  <div 
                    key={status}
                    className={`p-2 rounded border text-center ${
                      status === currentStatus 
                        ? 'border-blue-500 bg-blue-50' 
                        : index < statusFlow.indexOf(currentStatus)
                        ? 'border-gray-300 bg-gray-50 opacity-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <AutomatedProposalStatusBadge status={status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Automated Workflow Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Automatic "Proposal in Draft" when enquiry is created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-purple-600" />
                    <span>Transitions to "Proposal Sent" when shared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-600" />
                    <span>Updates to "Proposal Viewed" when client opens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <span>"Modification Requested" for client feedback</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Automatic follow-up reminders after 3 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-gray-600" />
                    <span>"No Response" status after 7 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-cyan-600" />
                    <span>Payment tracking with "Advance Received"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Final "Booking Confirmed" status</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedProposalStatusDemo;