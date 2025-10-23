
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentDetails as AgentDetailsType } from '@/types/travelerTypes';
import { User, Phone, Mail, Building } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AgentDetailsProps {
  agent: AgentDetailsType;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({ agent }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Your Travel Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm sm:text-base text-foreground">{agent.name}</h4>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Building className="h-3 w-3 flex-shrink-0" />
            <span>{agent.company}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs sm:text-sm"
            asChild
          >
            <a href={`tel:${agent.phone}`}>
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {isMobile ? 'Call' : `Call ${agent.phone}`}
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs sm:text-sm"
            asChild
          >
            <a href={`mailto:${agent.email}`}>
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {isMobile ? 'Email' : 'Send Email'}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDetails;
