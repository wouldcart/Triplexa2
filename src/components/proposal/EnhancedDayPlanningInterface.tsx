
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import EnhancedDayCard from './itinerary/EnhancedDayCard';
import { formatCurrency } from '@/utils/currencyUtils';
import { 
  loadComprehensiveItineraryData, 
  saveComprehensiveItineraryData,
  ensureThreeAccommodationOptions,
  ComprehensiveProposalData
} from '@/utils/enhancedItineraryUtils';

interface EnhancedDayPlanningInterfaceProps {
  query: any;
  days: any[];
  onAddDay: () => void;
  onUpdateDay: (dayId: string, updates: any) => void;
  onRemoveDay: (dayId: string) => void;
  onReorderDay?: (dayId: string, direction: 'up' | 'down') => void;
}

export const EnhancedDayPlanningInterface: React.FC<EnhancedDayPlanningInterfaceProps> = ({
  query,
  days,
  onAddDay,
  onUpdateDay,
  onRemoveDay,
  onReorderDay
}) => {
  const [enhancedData, setEnhancedData] = useState<ComprehensiveProposalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load comprehensive data on mount
  useEffect(() => {
    if (query?.id) {
      setIsLoading(true);
      const loadedData = loadComprehensiveItineraryData(query.id);
      
      if (loadedData) {
        // Ensure each day has 3 accommodation options
        const dataWithOptions = ensureThreeAccommodationOptions(loadedData);
        setEnhancedData(dataWithOptions);
        console.log('Loaded enhanced itinerary data:', {
          queryId: query.id,
          daysCount: dataWithOptions.days.length,
          accommodationOptionsCount: Object.keys(dataWithOptions.enhancedData?.accommodationOptions || {}).length
        });
      } else {
        // Create default enhanced data structure from existing days
        const defaultData: ComprehensiveProposalData = {
          queryId: query.id,
          days: days || [],
          accommodationSelections: [],
          enhancedData: {
            days: days || [],
            accommodationOptions: {},
            sightseeingActivities: {},
            transportRoutes: {},
            transferConfigurations: {}
          },
          version: Date.now(),
          savedAt: new Date().toISOString(),
          totalCost: days?.reduce((sum, day) => sum + (day.totalCost || 0), 0) || 0
        };
        
        const dataWithOptions = ensureThreeAccommodationOptions(defaultData);
        setEnhancedData(dataWithOptions);
      }
      setIsLoading(false);
    }
  }, [query?.id, days]);

  // Enhanced days with accommodation options
  const getEnhancedDays = () => {
    if (!enhancedData || !enhancedData.days) return days || [];
    
    return enhancedData.days.map(day => ({
      ...day,
      accommodationOptions: enhancedData.enhancedData?.accommodationOptions[day.id] || [],
      enhancedActivities: enhancedData.enhancedData?.sightseeingActivities[day.id] || [],
      transportRoutes: enhancedData.enhancedData?.transportRoutes[day.id] || [],
      transferConfigurations: enhancedData.enhancedData?.transferConfigurations[day.id] || []
    }));
  };

  const handleReorderDay = (dayIndex: number, direction: 'up' | 'down') => {
    if (!onReorderDay) return;
    
    const day = days[dayIndex];
    if (day) {
      onReorderDay(day.id, direction);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getCurrencyFormatter = (country: string) => {
    return (amount: number) => formatCurrency(amount, country);
  };

  const handleRefreshData = () => {
    if (query?.id) {
      setIsLoading(true);
      const loadedData = loadComprehensiveItineraryData(query.id);
      
      if (loadedData) {
        const dataWithOptions = ensureThreeAccommodationOptions(loadedData);
        setEnhancedData(dataWithOptions);
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading comprehensive itinerary data...</span>
        </div>
      </div>
    );
  }

  const enhancedDays = getEnhancedDays();

  return (
    <div className="space-y-6">
      {/* Header with Data Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Day-wise Itinerary</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {enhancedData ? (
            <span>
              {enhancedDays.length} days • 
              {Object.keys(enhancedData.enhancedData?.accommodationOptions || {}).length} accommodation sets • 
              Total: {formatCurrency(enhancedData.totalCost || 0, query?.destination?.country || 'TH')}
            </span>
          ) : (
            <span>No enhanced data available</span>
          )}
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {enhancedDays.map((day, index) => (
          <EnhancedDayCard
            key={day.id}
            day={day}
            formatCurrency={getCurrencyFormatter(query?.destination?.country || 'TH')}
            formatDate={formatDate}
            onMoveUp={() => handleReorderDay(index, 'up')}
            onMoveDown={() => handleReorderDay(index, 'down')}
            canMoveUp={index > 0}
            canMoveDown={index < enhancedDays.length - 1}
          />
        ))}
      </div>

      {/* Add Day Button */}
      <div className="flex justify-center">
        <Button 
          onClick={onAddDay}
          className="gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add Another Day
        </Button>
      </div>
    </div>
  );
};
