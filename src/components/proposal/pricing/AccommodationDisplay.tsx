import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useAccommodationMarkupIntegration } from '@/hooks/useAccommodationMarkupIntegration';
import { AccommodationCard } from './AccommodationCard';
import { AccommodationSummary } from './AccommodationSummary';
interface AccommodationDisplayProps {
  formatCurrency: (amount: number) => string;
  queryId?: string;
}
export const AccommodationDisplay: React.FC<AccommodationDisplayProps> = ({
  formatCurrency,
  queryId = ''
}) => {
  const {
    accommodations: selectedAccommodations,
    loading,
    error,
    syncAccommodationData
  } = useAccommodationMarkupIntegration(queryId, 'enhanced');
  const handleRefresh = async () => {
    await syncAccommodationData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading accommodations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <p className="text-destructive text-sm mb-2">{error}</p>
        <Button onClick={handleRefresh} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const validAccommodations = selectedAccommodations.filter(acc => acc.totalPrice > 0);

  if (validAccommodations.length === 0) {
    return (
      <div className="p-4 border border-muted rounded-lg bg-muted/20">
        <p className="text-muted-foreground text-sm mb-2">
          No accommodation pricing data available from itinerary.
        </p>
        <Button onClick={handleRefresh} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Accommodations</h3>
        <Button onClick={handleRefresh} size="sm" variant="ghost">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {validAccommodations.map((accommodation, index) => (
          <AccommodationCard
            key={`${accommodation.city}-${index}`}
            accommodation={accommodation}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      <AccommodationSummary
        accommodations={validAccommodations}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};