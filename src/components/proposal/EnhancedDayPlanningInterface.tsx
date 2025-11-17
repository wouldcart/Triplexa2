
import React, { useEffect, useState } from 'react';

// UUID validation regex - shared across the component
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, MapPin } from 'lucide-react';
import EnhancedDayCard from './itinerary/EnhancedDayCard';
import { formatCurrency } from '@/utils/currencyUtils';
import { 
  loadComprehensiveItineraryData, 
  saveComprehensiveItineraryData,
  ensureThreeAccommodationOptions,
  ComprehensiveProposalData
} from '@/utils/enhancedItineraryUtils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EnhancedDayPlanningInterfaceProps {
  query: any;
  days: any[];
  onAddDay: () => void;
  onUpdateDay: (dayId: string, updates: any) => void;
  onRemoveDay: (dayId: string) => void;
  onReorderDay?: (dayId: string, direction: 'up' | 'down') => void;
  onToggleActivityOptional?: (activityId: string, isOptional: boolean) => void;
  onToggleTransportOptional?: (transportId: string, isOptional: boolean) => void;
  onToggleCityOptional?: (cityId: string, isOptional: boolean) => void;
  optionalRecords?: any;
}

export const EnhancedDayPlanningInterface: React.FC<EnhancedDayPlanningInterfaceProps> = ({
  query,
  days,
  onAddDay,
  onUpdateDay,
  onRemoveDay,
  onReorderDay,
  onToggleActivityOptional,
  onToggleTransportOptional,
  onToggleCityOptional,
  optionalRecords
}) => {
  const [enhancedData, setEnhancedData] = useState<ComprehensiveProposalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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

  const isCityOptional = (cityId: string) => {
    if (!optionalRecords?.cities) return false;
    
    // Check both possible data structures for backward compatibility
    return optionalRecords.cities.some((city: any) => {
      // New format: cityId/cityName
      if (city.cityId && city.cityName) {
        return city.cityName.toLowerCase() === cityId.toLowerCase() && city.isOptional;
      }
      // Old format: city field
      if (city.city) {
        return city.city.toLowerCase() === cityId.toLowerCase() && city.isOptional;
      }
      // Direct comparison for other formats
      return false;
    });
  };

  const getUniqueCities = () => {
    const cities = new Set<string>();
    days.forEach(day => {
      if (day.city) cities.add(day.city);
      if (day.location) {
        const locationName = typeof day.location === 'string' ? day.location : day.location?.name || day.location?.city;
        if (locationName) cities.add(locationName);
      }
    });
    return Array.from(cities);
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

  // Real-time update function for optional items
  const handleRealTimeOptionalUpdate = async (
    itemId: string, 
    itemType: 'activity' | 'transport', 
    isOptional: boolean
  ) => {
    try {
      if (!query?.proposalId) {
        throw new Error('No proposal ID available');
      }

      // Determine if proposalId is a UUID or enquiry ID (use shared constant)
      const isUuid = UUID_REGEX.test(query.proposalId);
      
      // Get current optional_records from proposals table
      let proposalQuery = supabase
        .from('proposals')
        .select('optional_records');

      if (isUuid) {
        // If it's a UUID, query by the 'id' field
        proposalQuery = proposalQuery.eq('id', query.proposalId);
      } else {
        // If it's an enquiry ID, query by the 'proposal_id' field
        proposalQuery = proposalQuery.eq('proposal_id', query.proposalId);
      }

      const { data: proposalData, error: fetchError } = await proposalQuery.single();

      if (fetchError) throw fetchError;

      // Update the specific item in optional_records
      const currentOptionalRecords = proposalData?.optional_records || {};
      const recordType = itemType === 'activity' ? 'sightseeing' : 'transport';
      
      // Initialize the record type array if it doesn't exist
      if (!currentOptionalRecords[recordType]) {
        currentOptionalRecords[recordType] = [];
      }

      // Find existing record or create new one
      const existingRecordIndex = currentOptionalRecords[recordType].findIndex(
        (record: any) => record.optionId === itemId
      );

      if (existingRecordIndex >= 0) {
        // Update existing record
        currentOptionalRecords[recordType][existingRecordIndex].isOptional = isOptional;
        currentOptionalRecords[recordType][existingRecordIndex].updatedAt = new Date().toISOString();
        currentOptionalRecords[recordType][existingRecordIndex].updatedBy = user?.id;
      } else {
        // Add new record
        currentOptionalRecords[recordType].push({
          optionId: itemId,
          isOptional: isOptional,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.id
        });
      }

      // Update the proposals table with new optional_records
      let updateQuery = supabase
        .from('proposals')
        .update({
          optional_records: currentOptionalRecords,
          last_saved: new Date().toISOString()
        });

      if (isUuid) {
        // If it's a UUID, update by the 'id' field
        updateQuery = updateQuery.eq('id', query.proposalId);
      } else {
        // If it's an enquiry ID, update by the 'proposal_id' field
        updateQuery = updateQuery.eq('proposal_id', query.proposalId);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) throw updateError;

      toast.success(`${itemType === 'activity' ? 'Activity' : 'Transport'} updated successfully`);
      return true;
    } catch (error) {
      console.error('Error updating optional records:', error);
      toast.error('Failed to update optional status');
      throw error;
    }
  };

  // Set up real-time listener for optional_records changes
  useEffect(() => {
    if (!query?.proposalId) return;

    const subscription = supabase
      .channel(`proposal-optional-${query.proposalId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${query.proposalId}`
        },
        (payload) => {
          if (payload.new.optional_records) {
            // Update local state with new optional records
            console.log('Optional records updated in real-time:', payload.new.optional_records);
            // You can add logic here to update local state if needed
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [query?.proposalId]);

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

      {/* City Selection with Optional Toggle */}
      {query?.destination?.cities && query.destination.cities.length > 0 && onToggleCityOptional && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Cities & Destinations</h4>
            <Badge variant="outline" className="text-xs">
              {query.destination.cities.length} cities
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {query.destination.cities.map((city: string, index: number) => (
              <div key={city} className={`flex items-center justify-between p-3 rounded-lg border ${
                isCityOptional(city) 
                  ? 'border-dashed border-orange-400 bg-orange-50/50 dark:bg-orange-900/10 opacity-75' 
                  : 'border-border bg-background dark:bg-card'
              }`}>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{city}</span>
                  {isCityOptional(city) && (
                    <Badge variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600">
                      Optional
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={isCityOptional(city)}
                  onCheckedChange={(checked) => onToggleCityOptional(city, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
            onToggleActivityOptional={onToggleActivityOptional}
            onToggleTransportOptional={onToggleTransportOptional}
            optionalRecords={optionalRecords}
            proposalId={query?.proposalId}
            onRealTimeUpdate={handleRealTimeOptionalUpdate}
            isLoading={isLoading}
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
