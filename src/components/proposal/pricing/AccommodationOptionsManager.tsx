import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hotel } from 'lucide-react';
import { AccommodationDisplay } from './AccommodationDisplay';
import { useAccommodationMarkupIntegration } from '@/hooks/useAccommodationMarkupIntegration';

interface AccommodationOptionsManagerProps {
  formatCurrency: (amount: number) => string;
  queryId?: string;
}

export const AccommodationOptionsManager: React.FC<AccommodationOptionsManagerProps> = ({
  formatCurrency,
  queryId = ''
}) => {
  const { count } = useAccommodationMarkupIntegration(queryId, 'enhanced');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hotel className="h-5 w-5 text-primary" />
          Accommodations {count > 0 && <Badge variant="secondary">({count})</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AccommodationDisplay 
          formatCurrency={formatCurrency}
          queryId={queryId}
        />
      </CardContent>
    </Card>
  );
};