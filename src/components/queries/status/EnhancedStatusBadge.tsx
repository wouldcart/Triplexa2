
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  FileText, 
  UserPlus,
  MessageSquare,
  Star,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStatusBadgeProps {
  status: string;
  isNewAssignment?: boolean;
  lastUpdated?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedStatusBadge: React.FC<EnhancedStatusBadgeProps> = ({
  status,
  isNewAssignment = false,
  lastUpdated,
  priority,
  showProgress = false,
  size = 'md'
}) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'new': {
        label: 'New',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
        icon: AlertCircle,
        progress: 10
      },
      'assigned': {
        label: 'Assigned',
        variant: 'outline' as const,
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
        icon: UserPlus,
        progress: 25
      },
      'in-progress': {
        label: 'In Progress',
        variant: 'default' as const,
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200',
        icon: Clock,
        progress: 50
      },
      'proposal-sent': {
        label: 'Proposal Sent',
        variant: 'default' as const,
        className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200',
        icon: MessageSquare,
        progress: 75
      },
      'modify-proposal': {
        label: 'Modify Proposal',
        variant: 'default' as const,
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200',
        icon: FileText,
        progress: 65
      },
      'confirmed': {
        label: 'Confirmed',
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
        icon: CheckCircle,
        progress: 90
      },
      'converted': {
        label: 'Converted',
        variant: 'default' as const,
        className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
        icon: Star,
        progress: 100
      },
      'cancelled': {
        label: 'Cancelled',
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
        icon: AlertCircle,
        progress: 0
      }
    };

    return configs[status as keyof typeof configs] || configs.new;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'ring-2 ring-red-500 ring-offset-1';
      case 'high':
        return 'ring-2 ring-orange-500 ring-offset-1';
      case 'normal':
        return 'ring-1 ring-blue-500 ring-offset-1';
      default:
        return '';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-4 py-2';
      default:
        return 'text-xs px-3 py-1.5';
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {/* New Assignment Alert */}
      {isNewAssignment && (
        <Badge 
          variant="destructive" 
          className="animate-pulse font-semibold text-xs"
        >
          NEW ASSIGNMENT
        </Badge>
      )}

      {/* Main Status Badge */}
      <Badge
        variant={config.variant}
        className={cn(
          config.className,
          getSizeClasses(size),
          'gap-1 font-medium transition-all duration-200',
          priority && getPriorityColor(priority)
        )}
        data-testid="query-status"
      >
        <Icon className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
        )} />
        {config.label}
      </Badge>

      {/* Progress Indicator */}
      {showProgress && (
        <div className="flex items-center gap-1">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${config.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {config.progress}%
          </span>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
      )}
    </div>
  );
};

export default EnhancedStatusBadge;
