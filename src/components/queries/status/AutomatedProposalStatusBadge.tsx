import React from 'react';
import { Badge } from '@/components/ui/badge';
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
  XCircle,
  AlertCircle,
  ThumbsUp,
  Handshake,
  Mail,
  UserX
} from 'lucide-react';
import { AutomatedProposalStatus } from '@/services/automatedProposalStatusService';

interface AutomatedProposalStatusBadgeProps {
  status: AutomatedProposalStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AutomatedProposalStatusBadge: React.FC<AutomatedProposalStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const getStatusConfig = (status: AutomatedProposalStatus) => {
    const configs = {
      'proposal-in-draft': {
        label: 'Proposal in Draft',
        icon: FileText,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Enquiry created, proposal not yet finalized or sent'
      },
      'proposal-sent': {
        label: 'Proposal Sent',
        icon: Send,
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'Proposal shared with client (via email/WhatsApp)'
      },
      'proposal-viewed': {
        label: 'Proposal Viewed',
        icon: Eye,
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        description: 'Client has opened or viewed the sent proposal'
      },
      'modification-requested': {
        label: 'Modification Requested',
        icon: MessageSquare,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        description: 'Client has requested changes in the proposal'
      },
      'revised-proposal-sent': {
        label: 'Revised Proposal Sent',
        icon: RefreshCw,
        className: 'bg-teal-100 text-teal-800 border-teal-200',
        description: 'Updated version of the proposal has been sent'
      },
      'follow-up-pending': {
        label: 'Follow-up Pending',
        icon: Clock,
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        description: 'Awaiting client\'s response or scheduled follow-up'
      },
      'no-response': {
        label: 'No Response',
        icon: UserX,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        description: 'Client not responding after multiple follow-ups'
      },
      'interested': {
        label: 'Interested',
        icon: ThumbsUp,
        className: 'bg-green-100 text-green-800 border-green-200',
        description: 'Client has shown positive intent but not yet confirmed'
      },
      'negotiation': {
        label: 'Negotiation',
        icon: Handshake,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Pricing or inclusions under discussion'
      },
      'confirmed': {
        label: 'Confirmed',
        icon: CheckCircle2,
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        description: 'Client has confirmed the booking verbally or via message'
      },
      'advance-received': {
        label: 'Advance Received',
        icon: DollarSign,
        className: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        description: 'Partial payment received for confirmation'
      },
      'booking-confirmed': {
        label: 'Booking Confirmed',
        icon: CheckCircle2,
        className: 'bg-green-600 text-white border-green-600',
        description: 'Full confirmation with payment and documentation done'
      }
    };

    return configs[status] || configs['proposal-in-draft'];
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  return (
    <Badge 
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold transition-colors',
        config.className,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon className={cn(
        'flex-shrink-0',
        size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
      )} />}
      <span className="truncate">{config.label}</span>
    </Badge>
  );
};

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

export default AutomatedProposalStatusBadge;