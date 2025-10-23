import { useState, useEffect } from 'react';
import { SightseeingEnhancementService } from '../services/sightseeingEnhancementService';

interface UseEnhancedSightseeingProps {
  sightseeing: any;
  query: any;
}

export const useEnhancedSightseeing = ({ sightseeing, query }: UseEnhancedSightseeingProps) => {
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEnhancedData = async () => {
      if (!sightseeing || !query) return;

      setLoading(true);
      setError(null);

      try {
        const service = SightseeingEnhancementService.getInstance();
        
        // Prepare query context
        const queryContext = {
          destination: {
            country: query.destination?.country || '',
            cities: query.destination?.cities || []
          },
          paxDetails: {
            adults: query.paxDetails?.adults || 1,
            children: query.paxDetails?.children || 0
          },
          dates: {
            startDate: query.dates?.startDate || new Date().toISOString(),
            endDate: query.dates?.endDate || new Date().toISOString()
          }
        };

        const enhanced = await service.enhanceSightseeingData(sightseeing, queryContext);
        setEnhancedData(enhanced);
      } catch (err) {
        console.error('Error loading enhanced sightseeing data:', err);
        setError('Failed to load enhanced data');
      } finally {
        setLoading(false);
      }
    };

    loadEnhancedData();
  }, [sightseeing, query]);

  // Function to refresh data manually
  const refreshData = async () => {
    const service = SightseeingEnhancementService.getInstance();
    service.clearCache();
    
    if (sightseeing && query) {
      setLoading(true);
      try {
        const queryContext = {
          destination: {
            country: query.destination?.country || '',
            cities: query.destination?.cities || []
          },
          paxDetails: {
            adults: query.paxDetails?.adults || 1,
            children: query.paxDetails?.children || 0
          },
          dates: {
            startDate: query.dates?.startDate || new Date().toISOString(),
            endDate: query.dates?.endDate || new Date().toISOString()
          }
        };

        const enhanced = await service.enhanceSightseeingData(sightseeing, queryContext);
        setEnhancedData(enhanced);
      } catch (err) {
        setError('Failed to refresh data');
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    enhancedData,
    loading,
    error,
    refreshData,
    // Helper functions
    getRealPricingOptions: () => enhancedData?.enrichedPricingOptions || [],
    getRecommendations: () => enhancedData?.recommendations || [],
    getMatchingActivities: () => enhancedData?.matchingActivities || [],
    isAvailable: (sightseeingId: number) => enhancedData?.availabilityStatus?.[sightseeingId] ?? true,
    getCacheStatus: () => SightseeingEnhancementService.getInstance().getCacheStatus()
  };
};