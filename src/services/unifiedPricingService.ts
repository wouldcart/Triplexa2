import { useCurrency } from '@/hooks/useCurrency';
import { getCurrencyByCountry } from '@/utils/currencyUtils';

export interface PricingSnapshot {
  baseServices: {
    accommodation: number;
    activities: number;
    transport: number;
    meals: number;
  };
  totalBase: number;
  markup: {
    percentage: number;
    amount: number;
  };
  finalTotal: number;
  perPerson: {
    adult: number;
    child: number;
  };
  currency: string;
  lastCalculated: string;
}

export interface ItineraryPricingData {
  days: any[];
  accommodations: any[];
  paxDetails: {
    adults: number;
    children: number;
  };
  destination: {
    country: string;
  };
}

export class UnifiedPricingService {
  private static STORAGE_KEYS = [
    'proposal_draft_{queryId}',
    'itinerary_builder_{queryId}',
    'central_itinerary_{queryId}',
    'enhanced_proposal_modules_{queryId}'
  ];

  /**
   * Load and sync pricing data from all sources
   */
  static async loadPricingData(queryId: string): Promise<{
    success: boolean;
    data: ItineraryPricingData | null;
    source: string;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Try each storage key
    for (const keyTemplate of this.STORAGE_KEYS) {
      const storageKey = keyTemplate.replace('{queryId}', queryId);
      
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Extract itinerary data
          const days = this.extractDaysData(parsedData);
          if (days && days.length > 0) {
            
            // Create unified data structure
            const pricingData: ItineraryPricingData = {
              days,
              accommodations: this.extractAccommodations(days),
              paxDetails: this.extractPaxDetails(parsedData),
              destination: this.extractDestination(parsedData)
            };

            console.log(`✅ Loaded pricing data from ${storageKey}:`, {
              days: days.length,
              accommodations: pricingData.accommodations.length
            });

            return {
              success: true,
              data: pricingData,
              source: storageKey,
              errors
            };
          }
        }
      } catch (error) {
        errors.push(`Error loading from ${storageKey}: ${error}`);
        localStorage.removeItem(storageKey); // Clean corrupted data
      }
    }

    return {
      success: false,
      data: null,
      source: 'none',
      errors: [...errors, 'No valid pricing data found']
    };
  }

  /**
   * Calculate complete pricing snapshot
   */
  static calculatePricing(
    data: ItineraryPricingData,
    markupPercentage: number = 15
  ): PricingSnapshot {
    const currency = getCurrencyByCountry(data.destination.country);
    const totalPax = data.paxDetails.adults + data.paxDetails.children;

    // Calculate base service costs
    const baseServices = this.calculateServiceCosts(data.days);
    const totalBase = Object.values(baseServices).reduce((sum, cost) => sum + cost, 0);

    // Calculate markup
    const markupAmount = (totalBase * markupPercentage) / 100;
    const finalTotal = totalBase + markupAmount;

    // Calculate per-person pricing (children get 25% discount)
    const adultShare = data.paxDetails.adults / totalPax;
    const childShare = data.paxDetails.children / totalPax;
    const adultPrice = (finalTotal * adultShare) / data.paxDetails.adults || 0;
    const childPrice = (finalTotal * childShare * 0.75) / data.paxDetails.children || 0;

    return {
      baseServices,
      totalBase,
      markup: {
        percentage: markupPercentage,
        amount: markupAmount
      },
      finalTotal,
      perPerson: {
        adult: adultPrice,
        child: childPrice
      },
      currency: currency.code,
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Save markup settings for a query
   */
  static saveMarkupSettings(queryId: string, settings: {
    percentage: number;
    type: 'percentage' | 'fixed';
    amount?: number;
  }): boolean {
    try {
      const storageKey = `markup_settings_${queryId}`;
      localStorage.setItem(storageKey, JSON.stringify({
        ...settings,
        lastUpdated: new Date().toISOString()
      }));

      // Dispatch event for real-time sync
      window.dispatchEvent(new CustomEvent('markup-settings-updated', {
        detail: { queryId, settings }
      }));

      return true;
    } catch (error) {
      console.error('Error saving markup settings:', error);
      return false;
    }
  }

  /**
   * Load markup settings for a query
   */
  static loadMarkupSettings(queryId: string): {
    percentage: number;
    type: 'percentage' | 'fixed';
    amount?: number;
  } {
    try {
      const storageKey = `markup_settings_${queryId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading markup settings:', error);
    }

    // Default settings
    return {
      percentage: 15,
      type: 'percentage'
    };
  }

  /**
   * Set up real-time data synchronization with performance optimization
   */
  static setupRealtimeSync(
    queryId: string,
    callback: (snapshot: PricingSnapshot | null) => void
  ): () => void {
    let lastSnapshot: PricingSnapshot | null = null;
    let updateCount = 0;
    let isProcessing = false;
    
    const checkForUpdates = async () => {
      if (isProcessing) return; // Prevent concurrent updates
      isProcessing = true;
      
      try {
        // Circuit breaker: Stop if too many rapid updates
        if (updateCount > 10) {
          console.warn('Circuit breaker: Too many rapid updates, pausing sync');
          setTimeout(() => { updateCount = 0; }, 30000); // Reset after 30s
          return;
        }

        const { success, data } = await this.loadPricingData(queryId);
        if (success && data) {
          const markupSettings = this.loadMarkupSettings(queryId);
          const snapshot = this.calculatePricing(data, markupSettings.percentage);
          
          // Smart diffing: Only update if data actually changed
          const hasChanges = !lastSnapshot || 
            JSON.stringify(snapshot) !== JSON.stringify(lastSnapshot);
            
          if (hasChanges) {
            lastSnapshot = snapshot;
            updateCount++;
            callback(snapshot);
          }
        } else if (lastSnapshot) {
          // Only call callback(null) if we had data before
          lastSnapshot = null;
          callback(null);
        }
      } catch (error) {
        console.error('Real-time sync error:', error);
      } finally {
        isProcessing = false;
      }
    };

    // Check immediately
    checkForUpdates();

    // Reduced polling frequency (every 10 seconds instead of 3)
    const interval = setInterval(checkForUpdates, 10000);

    // Listen for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes(queryId) || e.key.includes('markup_settings'))) {
        setTimeout(checkForUpdates, 100); // Small delay to ensure data is written
      }
    };

    // Listen for custom events
    const handleCustomEvents = (e: CustomEvent) => {
      if (e.detail?.queryId === queryId) {
        setTimeout(checkForUpdates, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('markup-settings-updated', handleCustomEvents as EventListener);
    window.addEventListener('itinerary-updated', handleCustomEvents as EventListener);

    // Cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('markup-settings-updated', handleCustomEvents as EventListener);
      window.removeEventListener('itinerary-updated', handleCustomEvents as EventListener);
    };
  }

  // Helper methods
  private static extractDaysData(parsedData: any): any[] | null {
    if (parsedData.days && Array.isArray(parsedData.days)) return parsedData.days;
    if (parsedData.data && Array.isArray(parsedData.data)) return parsedData.data;
    if (Array.isArray(parsedData)) return parsedData;
    return null;
  }

  private static extractAccommodations(days: any[]): any[] {
    const accommodations: any[] = [];
    days.forEach(day => {
      if (day.accommodations && Array.isArray(day.accommodations)) {
        accommodations.push(...day.accommodations);
      }
    });
    return accommodations;
  }

  private static extractPaxDetails(parsedData: any): { adults: number; children: number } {
    const pax = parsedData.paxDetails || parsedData.query?.paxDetails || { adults: 1, children: 0 };
    return {
      adults: pax.adults || 1,
      children: pax.children || 0
    };
  }

  private static extractDestination(parsedData: any): { country: string } {
    const dest = parsedData.destination || parsedData.query?.destination || { country: 'Thailand' };
    return {
      country: dest.country || 'Thailand'
    };
  }

  private static calculateServiceCosts(days: any[]): PricingSnapshot['baseServices'] {
    let accommodation = 0;
    let activities = 0;
    let transport = 0;
    let meals = 0;

    days.forEach(day => {
      // Accommodation costs
      if (day.accommodations) {
        day.accommodations.forEach((acc: any) => {
          accommodation += acc.totalPrice || acc.total || acc.finalCost || 0;
        });
      }

      // Activity costs
      if (day.activities) {
        day.activities.forEach((activity: any) => {
          activities += activity.cost || activity.price || activity.finalCost || 0;
        });
      }

      // Transport costs
      if (day.transport) {
        if (Array.isArray(day.transport)) {
          day.transport.forEach((t: any) => {
            transport += t.price || t.cost || t.finalCost || 0;
          });
        } else {
          transport += day.transport.price || day.transport.cost || day.transport.finalCost || 0;
        }
      }

      // Meal costs
      if (day.meals) {
        if (Array.isArray(day.meals)) {
          day.meals.forEach((meal: any) => {
            meals += meal.cost || meal.price || meal.finalCost || 0;
          });
        }
      }
    });

    return { accommodation, activities, transport, meals };
  }
}