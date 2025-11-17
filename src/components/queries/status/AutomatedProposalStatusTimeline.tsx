import React from 'react';
import { cn } from '@/lib/utils';
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
  Handshake
} from 'lucide-react';
import { AutomatedProposalStatus } from '@/services/automatedProposalStatusService';

interface AutomatedProposalStatusTimelineProps {
  statusHistory: Array<{
    status: AutomatedProposalStatus;
    timestamp: string;
    triggeredBy: string;
    metadata?: Record<string, any>;
  }>;
  className?: string;
}

export const AutomatedProposalStatusTimeline: React.FC<AutomatedProposalStatusTimelineProps> = ({
  statusHistory,
  className
}) => {
  const getStatusIcon = (status: AutomatedProposalStatus) => {
    const configs = {
      'proposal-in-draft': FileText,
      'proposal-sent': Send,
      'proposal-viewed': Eye,
      'modification-requested': MessageSquare,
      'revised-proposal-sent': RefreshCw,
      'follow-up-pending': Clock,
      'no-response': UserX,
      'interested': ThumbsUp,
      'negotiation': Handshake,
      'confirmed': CheckCircle2,
      'advance-received': DollarSign,
      'booking-confirmed': CheckCircle2
    };
    
    return configs[status] || FileText;
  };

  const getStatusColor = (status: AutomatedProposalStatus) => {
    const colors = {
      'proposal-in-draft': 'text-blue-600',
      'proposal-sent': 'text-purple-600',
      'proposal-viewed': 'text-indigo-600',
      'modification-requested': 'text-orange-600',
      'revised-proposal-sent': 'text-teal-600',
      'follow-up-pending': 'text-amber-600',
      'no-response': 'text-gray-600',
      'interested': 'text-green-600',
      'negotiation': 'text-yellow-600',
      'confirmed': 'text-emerald-600',
      'advance-received': 'text-cyan-600',
      'booking-confirmed': 'text-green-600'
    };
    
    return colors[status] || 'text-gray-600';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTriggerDescription = (triggeredBy: string, metadata?: Record<string, any>) => {
    const triggerMap = {
      'proposal-created': 'Proposal created',
      'proposal-sent': metadata?.sendMethod ? `Sent via ${metadata.sendMethod}` : 'Proposal sent',
      'proposal-viewed': metadata?.viewSource ? `Viewed via ${metadata.viewSource}` : 'Proposal viewed',
      'client-feedback': 'Client feedback received',
      'follow-up-due': 'Follow-up required',
      'no-response-detected': 'No response detected',
      'client-interested': 'Client showed interest',
      'negotiation-started': 'Negotiation started',
      'payment-received': 'Payment received',
      'booking-completed': 'Booking completed',
      'automated-system': 'Automated system'
    };
    
    return triggerMap[triggeredBy] || triggeredBy;
  };

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No status history available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900">Proposal Status Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {statusHistory.map((item, index) => {
            const Icon = getStatusIcon(item.status);
            const colorClass = getStatusColor(item.status);
            
            return (
              <div key={index} className="relative flex items-start space-x-3">
                <div className={cn(
                  'relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border-2',
                  colorClass.replace('text-', 'border-')
                )}>
                  <Icon className={cn('h-4 w-4', colorClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getTriggerDescription(item.triggeredBy, item.metadata)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                  {item.metadata?.reason && (
                    <p className="mt-1 text-xs text-gray-600">{item.metadata.reason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AutomatedProposalStatusTimeline;