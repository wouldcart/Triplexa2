import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  X, 
  FileText, 
  Calendar, 
  Users, 
  Upload, 
  MessageCircle,
  Phone,
  Mail,
  Camera,
  MapPin,
  Clock
} from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string | number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface FloatingActionButtonProps {
  actions?: QuickAction[];
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions = [],
  className,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const defaultActions: QuickAction[] = [
    {
      id: 'new-proposal',
      label: 'New Proposal',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => console.log('New proposal'),
      color: 'primary'
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => console.log('Schedule meeting'),
      color: 'secondary'
    },
    {
      id: 'add-client',
      label: 'Add Client',
      icon: <Users className="h-5 w-5" />,
      onClick: () => console.log('Add client'),
      color: 'success'
    },
    {
      id: 'upload-document',
      label: 'Upload Document',
      icon: <Upload className="h-5 w-5" />,
      onClick: () => console.log('Upload document'),
      color: 'warning'
    },
    {
      id: 'quick-message',
      label: 'Quick Message',
      icon: <MessageCircle className="h-5 w-5" />,
      onClick: () => console.log('Quick message'),
      badge: 3,
      color: 'primary'
    }
  ];

  const allActions = actions.length > 0 ? actions : defaultActions;

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'warning':
        return 'bg-orange-600 text-white hover:bg-orange-700';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'primary':
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <div className={cn('fixed z-50', getPositionClasses(), className)}>
      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 mb-2">
          {allActions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center justify-end space-x-3 animate-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Action Label */}
              <Card className="shadow-lg">
                <CardContent className="px-3 py-2">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                </CardContent>
              </Card>
              
              {/* Action Button */}
              <Button
                size="lg"
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg relative',
                  getColorClasses(action.color)
                )}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
              >
                {action.icon}
                {action.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs flex items-center justify-center"
                    variant="destructive"
                  >
                    {action.badge}
                  </Badge>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-200',
          isOpen ? 'rotate-45 bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Quick Actions for specific contexts
export const ProposalQuickActions: QuickAction[] = [
  {
    id: 'new-proposal',
    label: 'New Proposal',
    icon: <FileText className="h-5 w-5" />,
    onClick: () => console.log('New proposal'),
    color: 'primary'
  },
  {
    id: 'duplicate-last',
    label: 'Duplicate Last',
    icon: <FileText className="h-5 w-5" />,
    onClick: () => console.log('Duplicate last proposal'),
    color: 'secondary'
  },
  {
    id: 'quick-quote',
    label: 'Quick Quote',
    icon: <Clock className="h-5 w-5" />,
    onClick: () => console.log('Quick quote'),
    color: 'success'
  }
];

export const ClientQuickActions: QuickAction[] = [
  {
    id: 'add-client',
    label: 'Add Client',
    icon: <Users className="h-5 w-5" />,
    onClick: () => console.log('Add client'),
    color: 'primary'
  },
  {
    id: 'call-client',
    label: 'Call Client',
    icon: <Phone className="h-5 w-5" />,
    onClick: () => console.log('Call client'),
    color: 'success'
  },
  {
    id: 'email-client',
    label: 'Email Client',
    icon: <Mail className="h-5 w-5" />,
    onClick: () => console.log('Email client'),
    color: 'secondary'
  }
];

export const DocumentQuickActions: QuickAction[] = [
  {
    id: 'upload-document',
    label: 'Upload Document',
    icon: <Upload className="h-5 w-5" />,
    onClick: () => console.log('Upload document'),
    color: 'primary'
  },
  {
    id: 'scan-document',
    label: 'Scan Document',
    icon: <Camera className="h-5 w-5" />,
    onClick: () => console.log('Scan document'),
    color: 'secondary'
  },
  {
    id: 'location-docs',
    label: 'Location Docs',
    icon: <MapPin className="h-5 w-5" />,
    onClick: () => console.log('Location documents'),
    color: 'warning'
  }
];

export default FloatingActionButton;