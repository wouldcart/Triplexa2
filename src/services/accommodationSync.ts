import { AccommodationOption } from '@/types/enhancedMarkup';

export class AccommodationSyncService {
  private static instance: AccommodationSyncService;
  private listeners: Set<(data: AccommodationOption[]) => void> = new Set();

  static getInstance(): AccommodationSyncService {
    if (!AccommodationSyncService.instance) {
      AccommodationSyncService.instance = new AccommodationSyncService();
    }
    return AccommodationSyncService.instance;
  }

  // Subscribe to accommodation changes
  subscribe(listener: (data: AccommodationOption[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of accommodation changes
  notify(accommodations: AccommodationOption[]): void {
    this.listeners.forEach(listener => listener(accommodations));
  }

  // Sync accommodations across all components
  syncAccommodations(queryId: string, accommodations: AccommodationOption[]): void {
    // Save to localStorage
    try {
      const storageKey = `selected_accommodations_${queryId}`;
      localStorage.setItem(storageKey, JSON.stringify(accommodations));
      
      // Notify all subscribers
      this.notify(accommodations);
      
      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(new CustomEvent('accommodation-sync', {
        detail: { queryId, accommodations }
      }));
      
    } catch (error) {
      console.error('Error syncing accommodations:', error);
    }
  }

  // Load accommodations from storage
  loadAccommodations(queryId: string): AccommodationOption[] {
    try {
      const storageKey = `selected_accommodations_${queryId}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading accommodations:', error);
      return [];
    }
  }

  // Extract accommodations from itinerary data with enhanced support
  extractFromItinerary(itineraryData: any[], type: 'standard' | 'optional' | 'alternative'): AccommodationOption[] {
    if (!Array.isArray(itineraryData)) return [];

    const accommodations: AccommodationOption[] = [];

    itineraryData.forEach((day: any, dayIndex: number) => {
      console.log(`🏨 [AccommodationSync] Processing day ${dayIndex + 1}:`, day);
      
      // Handle different accommodation data structures
      let accommodationData = null;
      
      // Check for accommodations array (standard structure)
      if (day.accommodations && Array.isArray(day.accommodations)) {
        accommodationData = day.accommodations.find((acc: any) => 
          acc.option === (type === 'standard' ? 1 : type === 'optional' ? 2 : 3)
        ) || day.accommodations[0];
      }
      // Check for single accommodation object
      else if (day.accommodation) {
        // Handle undefined accommodation objects from day-wise itinerary
        if (day.accommodation._type !== 'undefined' && day.accommodation.value !== 'undefined') {
          accommodationData = day.accommodation.value || day.accommodation;
        }
        // Create default accommodation for cities with undefined accommodation
        else if (day.location?.city) {
          accommodationData = {
            name: `Hotel in ${day.location.city}`,
            city: day.location.city,
            type: 'hotel',
            roomType: 'Standard Room'
          };
        }
      }
      // If no accommodation but has location, create a placeholder
      else if (day.location?.city) {
        accommodationData = {
          name: `Accommodation in ${day.location.city}`,
          city: day.location.city,
          type: 'hotel',
          roomType: 'Standard Room'
        };
      }

      if (accommodationData) {
        // Enhanced price extraction logic
        const extractedPrice = this.extractPriceFromData(accommodationData, day);
        const nights = accommodationData.nights || accommodationData.numberOfNights || 1;
        const rooms = accommodationData.numberOfRooms || accommodationData.rooms || 1;
        
        const accommodation: AccommodationOption = {
          id: `${day.id || `day_${dayIndex}`}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          hotelName: accommodationData.name || accommodationData.hotelName || `Hotel in ${day.location?.city || 'Unknown'}`,
          roomType: accommodationData.roomType || 'Standard Room',
          nights,
          pricePerNight: extractedPrice,
          numberOfRooms: rooms,
          totalPrice: extractedPrice * nights * rooms,
          type,
          dayId: day.id || `day_${dayIndex}`,
          city: day.location?.city || accommodationData.city || day.city || 'Unknown'
        };
        
        accommodations.push(accommodation);
        console.log(`🏨 [AccommodationSync] Created accommodation for ${accommodation.city}:`, {
          hotel: accommodation.hotelName,
          price: extractedPrice,
          source: extractedPrice > 0 ? 'extracted' : 'estimated',
          originalData: accommodationData
        });
      } else {
        console.log(`🏨 [AccommodationSync] No accommodation data found for day ${dayIndex + 1}`);
      }
    });

    console.log(`🏨 [AccommodationSync] Extracted ${accommodations.length} accommodations of type ${type}`);
    return accommodations;
  }

  // Enhanced price extraction with multiple fallback strategies
  private extractPriceFromData(accommodationData: any, dayData: any): number {
    console.log(`🏨 [AccommodationSync] Extracting price from:`, { accommodationData, dayData });
    
    // Primary price fields to check
    const priceFields = [
      'pricePerNight',
      'pricePerNightPerRoom', 
      'price',
      'cost',
      'adultPrice',
      'roomPrice',
      'rate',
      'totalPrice'
    ];

    // Try direct price extraction
    for (const field of priceFields) {
      const price = accommodationData[field];
      if (price && typeof price === 'number' && price > 0) {
        console.log(`🏨 [AccommodationSync] Found price in field '${field}':`, price);
        return price;
      }
    }

    // Check nested price data
    if (accommodationData.pricing) {
      for (const field of priceFields) {
        const price = accommodationData.pricing[field];
        if (price && typeof price === 'number' && price > 0) {
          console.log(`🏨 [AccommodationSync] Found price in pricing.${field}:`, price);
          return price;
        }
      }
    }

    // Check day-level pricing
    if (dayData?.pricing?.accommodation) {
      const price = dayData.pricing.accommodation;
      if (typeof price === 'number' && price > 0) {
        console.log(`🏨 [AccommodationSync] Found price in day pricing:`, price);
        return price;
      }
    }

    // Calculate from total if available
    if (accommodationData.totalPrice && accommodationData.nights) {
      const calculatedPrice = accommodationData.totalPrice / accommodationData.nights;
      if (calculatedPrice > 0) {
        console.log(`🏨 [AccommodationSync] Calculated price from total:`, calculatedPrice);
        return calculatedPrice;
      }
    }

    // Regional fallback pricing instead of hardcoded 100
    const city = dayData?.location?.city || accommodationData.city;
    const country = dayData?.location?.country || accommodationData.country;
    const estimatedPrice = this.getEstimatedPrice(city, country);
    
    console.log(`🏨 [AccommodationSync] Using estimated price for ${city}, ${country}:`, estimatedPrice);
    return estimatedPrice;
  }

  // Get estimated pricing based on location
  private getEstimatedPrice(city?: string, country?: string): number {
    // Regional pricing estimates (more realistic than hardcoded 100)
    const regionPricing: Record<string, number> = {
      // Major cities
      'london': 150,
      'paris': 140,
      'tokyo': 120,
      'new york': 160,
      'dubai': 110,
      'singapore': 130,
      'hong kong': 140,
      
      // Countries
      'united states': 120,
      'united kingdom': 110,
      'france': 100,
      'japan': 90,
      'germany': 95,
      'australia': 115,
      'canada': 105,
      'switzerland': 180,
      'norway': 150,
      'denmark': 130,
      
      // Regions
      'europe': 95,
      'asia': 75,
      'north america': 110,
      'middle east': 85,
      'africa': 60,
      'south america': 70
    };

    const cityKey = city?.toLowerCase();
    const countryKey = country?.toLowerCase();

    // Check city first, then country, then use default
    if (cityKey && regionPricing[cityKey]) {
      return regionPricing[cityKey];
    }
    
    if (countryKey && regionPricing[countryKey]) {
      return regionPricing[countryKey];
    }

    // Default estimated price for unknown locations
    return 85;
  }

  // Merge accommodations from multiple sources
  mergeAccommodations(
    fromStore: AccommodationOption[], 
    fromItinerary: AccommodationOption[]
  ): AccommodationOption[] {
    const merged = new Map<string, AccommodationOption>();

    // Add store accommodations first (priority)
    fromStore.forEach(acc => merged.set(acc.id, acc));

    // Add itinerary accommodations only if not already present
    fromItinerary.forEach(acc => {
      if (!merged.has(acc.id)) {
        merged.set(acc.id, acc);
      }
    });

    return Array.from(merged.values());
  }

  // Validate accommodation data
  validateAccommodations(accommodations: AccommodationOption[]): {
    valid: AccommodationOption[];
    invalid: AccommodationOption[];
    errors: string[];
  } {
    const valid: AccommodationOption[] = [];
    const invalid: AccommodationOption[] = [];
    const errors: string[] = [];

    accommodations.forEach(acc => {
      const issues: string[] = [];

      if (!acc.id) issues.push('Missing ID');
      if (!acc.hotelName) issues.push('Missing hotel name');
      if (!acc.city) issues.push('Missing city');
      if (acc.pricePerNight < 0) issues.push('Invalid price per night');
      if (acc.nights <= 0) issues.push('Invalid number of nights');
      if (acc.numberOfRooms <= 0) issues.push('Invalid number of rooms');

      if (issues.length === 0) {
        valid.push(acc);
      } else {
        invalid.push(acc);
        errors.push(`${acc.hotelName || 'Unknown hotel'}: ${issues.join(', ')}`);
      }
    });

    return { valid, invalid, errors };
  }
}

// Export singleton instance
export const accommodationSync = AccommodationSyncService.getInstance();