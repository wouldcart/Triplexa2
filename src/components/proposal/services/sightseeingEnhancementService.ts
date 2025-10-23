import { Sightseeing } from '@/types/sightseeing';
import { loadSightseeingData } from '@/pages/inventory/sightseeing/services/storageService';

interface EnhancedSightseeingData {
  realTimeData: Sightseeing[];
  filteredByLocation: Sightseeing[];
  matchingActivities: Sightseeing[];
  enrichedPricingOptions: any[];
  availabilityStatus: { [key: number]: boolean };
  recommendations: Sightseeing[];
}

interface QueryContext {
  destination: {
    country: string;
    cities: string[];
  };
  paxDetails: {
    adults: number;
    children: number;
  };
  dates: {
    startDate: string;
    endDate: string;
  };
}

export class SightseeingEnhancementService {
  private static instance: SightseeingEnhancementService;
  private cachedData: Sightseeing[] = [];
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SightseeingEnhancementService {
    if (!SightseeingEnhancementService.instance) {
      SightseeingEnhancementService.instance = new SightseeingEnhancementService();
    }
    return SightseeingEnhancementService.instance;
  }

  // Load real data from Sightseeing Management with caching
  private async loadRealTimeData(): Promise<Sightseeing[]> {
    const now = new Date();
    
    // Use cache if it's fresh
    if (this.cachedData.length > 0 && this.lastCacheUpdate && 
        now.getTime() - this.lastCacheUpdate.getTime() < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      // Load from the sightseeing management storage service
      const realData = loadSightseeingData();
      
      // Filter only active sightseeing entries
      const activeData = realData.filter(item => item.status === 'active');
      
      // Cache the data
      this.cachedData = activeData;
      this.lastCacheUpdate = now;
      
      console.log('Loaded real-time sightseeing data:', activeData.length, 'active items');
      return activeData;
    } catch (error) {
      console.error('Error loading real-time sightseeing data:', error);
      return [];
    }
  }

  // Enhanced filtering by location with smart matching
  private filterByLocation(data: Sightseeing[], query: QueryContext): Sightseeing[] {
    return data.filter(item => {
      // Exact country match
      const countryMatch = item.country?.toLowerCase() === query.destination.country.toLowerCase();
      
      // City matching with fuzzy logic
      const cityMatch = query.destination.cities.some(queryCity => {
        const queryLower = queryCity.toLowerCase();
        const itemCityLower = item.city?.toLowerCase() || '';
        
        // Exact match
        if (itemCityLower === queryLower) return true;
        
        // Partial match (city contains query or vice versa)
        if (itemCityLower.includes(queryLower) || queryLower.includes(itemCityLower)) return true;
        
        return false;
      });

      return countryMatch && cityMatch;
    });
  }

  // Enhanced pricing calculation with real-time data
  private enrichPricingOptions(sightseeing: Sightseeing, query: QueryContext) {
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    const enrichedOptions = [];

    // Standard pricing from real data
    if (sightseeing.price && (sightseeing.price.adult > 0 || sightseeing.price.child > 0)) {
      enrichedOptions.push({
        id: 'standard',
        type: 'Standard Rate',
        name: 'Standard Pricing',
        adultPrice: sightseeing.price.adult,
        childPrice: sightseeing.price.child,
        totalPrice: (sightseeing.price.adult * query.paxDetails.adults) + 
                   (sightseeing.price.child * query.paxDetails.children),
        isEnabled: true,
        source: 'management_system'
      });
    }

    // Real pricing options from management system
    if (sightseeing.pricingOptions && sightseeing.pricingOptions.length > 0) {
      sightseeing.pricingOptions
        .filter(option => option.isEnabled)
        .forEach(option => {
          enrichedOptions.push({
            ...option,
            totalPrice: (option.adultPrice * query.paxDetails.adults) + 
                       (option.childPrice * query.paxDetails.children),
            source: 'management_system',
            realTimeData: true
          });
        });
    }

    // Real package options
    if (sightseeing.packageOptions && sightseeing.packageOptions.length > 0) {
      sightseeing.packageOptions
        .filter(pkg => pkg.isEnabled)
        .forEach(pkg => {
          let totalPrice = 0;
          if ((pkg as any).totalPrice) {
            totalPrice = (pkg as any).totalPrice;
          } else if (pkg.adultPrice !== undefined) {
            totalPrice = (pkg.adultPrice * query.paxDetails.adults) + 
                        ((pkg.childPrice || 0) * query.paxDetails.children);
          }
          
          enrichedOptions.push({
            ...pkg,
            type: 'package',
            totalPrice,
            source: 'management_system',
            realTimeData: true
          });
        });
    }

    return enrichedOptions;
  }

  // Enhanced transfer options from real data
  private enrichTransferOptions(sightseeing: Sightseeing) {
    const enrichedTransfers = [];

    if (sightseeing.transferOptions && sightseeing.transferOptions.length > 0) {
      sightseeing.transferOptions
        .filter(transfer => transfer.isEnabled)
        .forEach(transfer => {
          enrichedTransfers.push({
            ...transfer,
            source: 'management_system',
            realTimeData: true,
            capacity: transfer.capacity || 'Not specified',
            features: this.getTransferFeatures(transfer.vehicleType)
          });
        });
    }

    return enrichedTransfers;
  }

  // Get transfer features based on vehicle type
  private getTransferFeatures(vehicleType: string): string[] {
    const features: { [key: string]: string[] } = {
      'private car': ['Air conditioning', 'Professional driver', 'Door-to-door service'],
      'private van': ['Air conditioning', 'Professional driver', 'Group transport', 'Luggage space'],
      'sic transfer': ['Shared transport', 'Cost effective', 'Fixed schedule'],
      'luxury car': ['Premium vehicle', 'Professional chauffeur', 'Complimentary refreshments'],
      'minibus': ['Group transport', 'Air conditioning', 'Professional driver', 'Large luggage capacity']
    };

    return features[vehicleType.toLowerCase()] || ['Standard transport'];
  }

  // Check availability based on validity period and expiration status
  private checkAvailability(sightseeing: Sightseeing, query: QueryContext): boolean {
    // Check if sightseeing is active
    if (sightseeing.status !== 'active') return false;

    // Check validity period if exists
    if (sightseeing.validityPeriod) {
      const startDate = new Date(sightseeing.validityPeriod.startDate);
      const endDate = new Date(sightseeing.validityPeriod.endDate);
      const queryStartDate = new Date(query.dates.startDate);
      const queryEndDate = new Date(query.dates.endDate);

      // Check if query dates fall within validity period
      if (queryStartDate < startDate || queryEndDate > endDate) {
        return false;
      }
    }

    // Check if expired
    if (sightseeing.isExpired) return false;

    return true;
  }

  // Generate smart recommendations
  private generateRecommendations(
    allData: Sightseeing[], 
    currentSightseeing: Sightseeing, 
    query: QueryContext
  ): Sightseeing[] {
    const recommendations = allData
      .filter(item => 
        item.id !== currentSightseeing.id && 
        item.status === 'active' &&
        !item.isExpired
      )
      .filter(item => {
        // Same city or country
        const sameLocation = item.city === currentSightseeing.city || 
                            item.country === currentSightseeing.country;
        
        // Similar category
        const similarCategory = item.category === currentSightseeing.category;
        
        // Similar price range (within 30%)
        const currentPrice = currentSightseeing.price?.adult || 0;
        const itemPrice = item.price?.adult || 0;
        const similarPrice = Math.abs(currentPrice - itemPrice) <= (currentPrice * 0.3);

        return sameLocation || similarCategory || similarPrice;
      })
      .sort((a, b) => {
        // Prioritize same city, then same category, then similar price
        const aScore = (a.city === currentSightseeing.city ? 3 : 0) +
                      (a.category === currentSightseeing.category ? 2 : 0) +
                      (a.country === currentSightseeing.country ? 1 : 0);
        
        const bScore = (b.city === currentSightseeing.city ? 3 : 0) +
                      (b.category === currentSightseeing.category ? 2 : 0) +
                      (b.country === currentSightseeing.country ? 1 : 0);

        return bScore - aScore;
      })
      .slice(0, 5); // Top 5 recommendations

    return recommendations;
  }

  // Main enhancement function
  async enhanceSightseeingData(
    baseSightseeing: any, 
    query: QueryContext
  ): Promise<EnhancedSightseeingData> {
    try {
      // Load real-time data from management system
      const realTimeData = await this.loadRealTimeData();
      
      // Filter by location
      const filteredByLocation = this.filterByLocation(realTimeData, query);
      
      // Find matching activities for the base sightseeing
      const matchingActivities = realTimeData.filter(item => 
        item.name.toLowerCase().includes(baseSightseeing.name.toLowerCase()) ||
        item.city?.toLowerCase() === baseSightseeing.city?.toLowerCase()
      );

      // If we have a real match, use the real data instead of base data
      const enhancedSightseeing = matchingActivities.length > 0 ? matchingActivities[0] : baseSightseeing;
      
      // Enrich pricing options with real data
      const enrichedPricingOptions = this.enrichPricingOptions(enhancedSightseeing, query);
      
      // Check availability for all items
      const availabilityStatus: { [key: number]: boolean } = {};
      [...filteredByLocation, ...matchingActivities].forEach(item => {
        availabilityStatus[item.id] = this.checkAvailability(item, query);
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations(realTimeData, enhancedSightseeing, query);

      return {
        realTimeData,
        filteredByLocation,
        matchingActivities,
        enrichedPricingOptions,
        availabilityStatus,
        recommendations
      };
    } catch (error) {
      console.error('Error enhancing sightseeing data:', error);
      return {
        realTimeData: [],
        filteredByLocation: [],
        matchingActivities: [],
        enrichedPricingOptions: [],
        availabilityStatus: {},
        recommendations: []
      };
    }
  }

  // Clear cache manually
  clearCache(): void {
    this.cachedData = [];
    this.lastCacheUpdate = null;
  }

  // Get cache status
  getCacheStatus(): { isCached: boolean; lastUpdate: Date | null; itemCount: number } {
    return {
      isCached: this.cachedData.length > 0,
      lastUpdate: this.lastCacheUpdate,
      itemCount: this.cachedData.length
    };
  }
}