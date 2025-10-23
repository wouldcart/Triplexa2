
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, AlertTriangle, MapPin, CreditCard, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const QuickActions: React.FC = () => {
  const isMobile = useIsMobile();

  const quickActions = [
    {
      icon: MessageSquare,
      label: 'Contact Agent',
      action: () => console.log('Contact agent'),
      color: 'text-primary'
    },
    {
      icon: Phone,
      label: 'Emergency Call',
      action: () => window.open('tel:+1234567890'),
      color: 'text-destructive'
    },
    {
      icon: AlertTriangle,
      label: 'Report Issue',
      action: () => console.log('Report issue'),
      color: 'text-orange-500'
    },
    {
      icon: MapPin,
      label: 'Share Location',
      action: () => console.log('Share location'),
      color: 'text-blue-500'
    },
    {
      icon: CreditCard,
      label: 'Payment Help',
      action: () => console.log('Payment help'),
      color: 'text-green-500'
    },
    {
      icon: FileText,
      label: 'Documents',
      action: () => console.log('Documents'),
      color: 'text-purple-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              className="flex flex-col items-center gap-1 sm:gap-2 h-auto p-3 sm:p-4 text-center"
              size="sm"
            >
              <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color}`} />
              <span className="text-xs sm:text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
