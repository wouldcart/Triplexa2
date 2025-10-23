import { EnhancedMarkupData, AccommodationOption, ServiceCost } from '@/types/enhancedMarkup';
import { PricingService } from './pricingService';
import { EnhancedPricingService } from './enhancedPricingService';

export interface DataLoadingStatus {
  isLoading: boolean;
  source: 'daywise' | 'proposal' | 'localStorage' | 'empty';
  lastUpdated?: string;
  errors?: string[];
}

export class MarkupDataService {
  private static STORAGE_KEYS = [
    'proposal_draft_{queryId}',
    'itinerary_builder_{queryId}',
    'itinerary_{queryId}',
    'central_itinerary_{queryId}',
    'proposal_itinerary_{queryId}',
    'enhanced_proposal_modules_{queryId}',
    'accommodations_{queryId}',
    'markup_settings_{queryId}'
  ];

  /**
   * Load itinerary data with comprehensive fallback strategy
   */
  static async loadItineraryData(queryId: string): Promise<{ data: any[], source: string, errors: string[] }> {
    const errors: string[] = [];
    
    // Try all possible storage keys
    for (const keyTemplate of this.STORAGE_KEYS) {
      const storageKey = keyTemplate.replace('{queryId}', queryId);
      
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Extract days data from various structures
          let daysData = this.extractDaysData(parsedData);
          
          if (daysData && daysData.length > 0) {
            console.log(`✅ Loaded itinerary from ${storageKey}:`, daysData.length, 'days');
            return { data: daysData, source: storageKey, errors };
          }
        }
      } catch (error) {
        const errorMsg = `Error loading from ${storageKey}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        // Clean up corrupted data
        localStorage.removeItem(storageKey);
      }
    }
    
    // No data found
    errors.push('No itinerary data found in any storage location');
    return { data: [], source: 'empty', errors };
  }

  /**
   * Extract days data from various data structures
   */
  private static extractDaysData(parsedData: any): any[] | null {
    // Check different possible structures
    if (parsedData.days && Array.isArray(parsedData.days) && parsedData.days.length > 0) {
      return parsedData.days;
    }
    
    if (parsedData.data && Array.isArray(parsedData.data) && parsedData.data.length > 0) {
      return parsedData.data;
    }
    
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      return parsedData;
    }
    
    // Check for itinerary inside data
    if (parsedData.itinerary?.days && Array.isArray(parsedData.itinerary.days)) {
      return parsedData.itinerary.days;
    }
    
    return null;
  }

  /**
   * Load accommodation data from the accommodations specific storage
   */
  static loadAccommodationData(queryId: string): any[] {
    try {
      const storageKey = `accommodations_${queryId}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return Array.isArray(parsedData) ? parsedData : [];
      }
    } catch (error) {
      console.error('Error loading accommodation data:', error);
    }
    
    return [];
  }

  /**
   * Load markup settings for a specific proposal
   */
  static loadProposalMarkupSettings(queryId: string): any {
    const storageKey = `markup_settings_${queryId}`;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading proposal markup settings:', error);
    }
    
    // Return global settings as default
    return {
      inheritFromGlobal: true,
      ...PricingService.getSettings()
    };
  }

  /**
   * Save proposal markup settings
   */
  static saveProposalMarkupSettings(queryId: string, settings: any): boolean {
    const storageKey = `markup_settings_${queryId}`;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        ...settings,
        lastUpdated: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Error saving proposal markup settings:', error);
      return false;
    }
  }

  /**
   * Extract accommodations by type from days data
   */
  static extractAccommodationsByType(
    daysData: any[], 
    type: 'standard' | 'optional' | 'alternative'
  ): AccommodationOption[] {
    const accommodations: AccommodationOption[] = [];
    
    daysData.forEach((day: any) => {
      if (day.accommodations && Array.isArray(day.accommodations)) {
        // Map option types to numbers
        const optionNumber = type === 'standard' ? 1 : type === 'optional' ? 2 : 3;
        
        const accommodation = day.accommodations.find((acc: any) => 
          acc.option === optionNumber || acc.optionNumber === optionNumber
        ) || day.accommodations[0]; // Fallback to first accommodation

        if (accommodation) {
          accommodations.push({
            id: `${day.id || day.day}_${type}`,
            hotelName: accommodation.name || accommodation.hotelName || 'Unnamed Hotel',
            roomType: accommodation.roomType || 'Standard Room',
            nights: accommodation.nights || accommodation.numberOfNights || 1,
            pricePerNight: accommodation.pricePerNight || accommodation.pricePerNightPerRoom || 0,
            numberOfRooms: accommodation.numberOfRooms || 1,
            totalPrice: this.calculateAccommodationTotal(accommodation),
            type,
            dayId: day.id || day.day,
            city: day.city || accommodation.city || day.title || ''
          });
        }
      }
    });

    return accommodations;
  }

  /**
   * Calculate total accommodation price with fallback logic
   */
  private static calculateAccommodationTotal(accommodation: any): number {
    // Try various total price fields
    if (accommodation.totalPrice) return accommodation.totalPrice;
    if (accommodation.total) return accommodation.total;
    if (accommodation.finalCost) return accommodation.finalCost;
    
    // Calculate from components
    const pricePerNight = accommodation.pricePerNight || accommodation.pricePerNightPerRoom || 0;
    const nights = accommodation.nights || accommodation.numberOfNights || 1;
    const rooms = accommodation.numberOfRooms || 1;
    
    return pricePerNight * nights * rooms;
  }

  /**
   * Calculate service costs from days data
   */
  static calculateServiceCosts(daysData: any[], adults: number, children: number): ServiceCost {
    let sightseeingTotal = 0;
    let transportTotal = 0;
    let diningTotal = 0;
    
    const totalPax = adults + children;

    daysData.forEach((day: any) => {
      // Sightseeing calculation
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach((activity: any) => {
          if (activity.adultPrice && activity.childPrice) {
            sightseeingTotal += (activity.adultPrice * adults) + (activity.childPrice * children);
          } else if (activity.flatRate || activity.totalCost) {
            sightseeingTotal += (activity.flatRate || activity.totalCost) * totalPax;
          } else if (activity.finalCost) {
            sightseeingTotal += activity.finalCost;
          } else if (activity.cost) {
            sightseeingTotal += activity.cost;
          }
        });
      }

      // Transport calculation
      if (day.transport) {
        transportTotal += day.transport.finalCost || day.transport.cost || day.transport.totalCost || 0;
      }

      // Dining calculation
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal: any) => {
          if (meal.adultPrice && meal.childPrice) {
            diningTotal += (meal.adultPrice * adults) + (meal.childPrice * children);
          } else if (meal.flatRate || meal.totalCost) {
            diningTotal += (meal.flatRate || meal.totalCost) * totalPax;
          } else if (meal.finalCost) {
            diningTotal += meal.finalCost;
          } else if (meal.cost) {
            diningTotal += meal.cost;
          }
        });
      }
    });

    return {
      sightseeing: {
        adultPrice: adults > 0 ? sightseeingTotal / totalPax * adults / adults : 0,
        childPrice: children > 0 ? sightseeingTotal / totalPax * children / children : 0,
        total: sightseeingTotal
      },
      transport: {
        totalCost: transportTotal,
        perPersonCost: totalPax > 0 ? transportTotal / totalPax : 0
      },
      dining: {
        adultPrice: adults > 0 ? diningTotal / totalPax * adults / adults : 0,
        childPrice: children > 0 ? diningTotal / totalPax * children / children : 0,
        total: diningTotal
      },
      accommodation: {
        totalCost: 0,
        perPersonCost: 0,
        totalRooms: 0,
        totalNights: 0
      }
    };
  }

  /**
   * Calculate total base cost from days data
   */
  static calculateTotalBaseCost(daysData: any[]): number {
    return daysData.reduce((total, day) => {
      return total + (day.totalCost || day.total || day.finalCost || 0);
    }, 0);
  }

  /**
   * Apply markup calculation based on settings
   */
  static calculateMarkup(baseAmount: number, settings: any, paxCount: number = 1): number {
    if (settings.inheritFromGlobal) {
      return PricingService.calculateMarkup(baseAmount, paxCount).markup;
    }

    // Custom settings calculation
    if (settings.useSlabPricing && settings.markupSlabs) {
      const comparisonAmount = settings.slabApplicationMode === 'per-person' 
        ? baseAmount / paxCount 
        : baseAmount;
        
      const applicableSlab = settings.markupSlabs.find((slab: any) => 
        slab.isActive && 
        comparisonAmount >= slab.minAmount && 
        comparisonAmount <= slab.maxAmount
      );

      if (applicableSlab) {
        if (applicableSlab.markupType === 'fixed') {
          return applicableSlab.markupValue * paxCount;
        } else {
          return (baseAmount * applicableSlab.markupValue) / 100;
        }
      }
    }

    // Default percentage markup
    return (baseAmount * (settings.defaultMarkupPercentage || 0)) / 100;
  }

  /**
   * Validate data integrity
   */
  static validateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || !Array.isArray(data)) {
      errors.push('Invalid data format: expected array of days');
    }

    if (data.length === 0) {
      errors.push('No itinerary days found');
    }

    data.forEach((day: any, index: number) => {
      if (!day.id && !day.day) {
        errors.push(`Day ${index + 1}: Missing day identifier`);
      }

      if (!day.city && !day.title) {
        errors.push(`Day ${index + 1}: Missing location information`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Real-time data sync check
   */
  static setupRealTimeSync(queryId: string, callback: (data: any[]) => void): () => void {
    const checkForUpdates = async () => {
      const { data } = await this.loadItineraryData(queryId);
      callback(data);
    };

    // Check every 2 seconds for updates
    const interval = setInterval(checkForUpdates, 2000);

    // Also listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes(queryId)) {
        checkForUpdates();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}