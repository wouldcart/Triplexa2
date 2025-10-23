import { adminSupabase, supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/integrations/supabase/types';

export type LocationCodeRow = Tables<'location_codes'>;

/**
 * Service for resolving location codes to full names and location details
 */
class LocationResolutionService {
  private locationCache: Map<string, LocationCodeRow> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  /**
   * Get location details by code
   */
  async getLocationByCode(code: string): Promise<LocationCodeRow | null> {
    // Check cache first
    if (this.isValidCache() && this.locationCache.has(code)) {
      return this.locationCache.get(code) || null;
    }

    // Refresh cache if needed
    if (!this.isValidCache()) {
      await this.refreshCache();
    }

    return this.locationCache.get(code) || null;
  }

  /**
   * Get full name for a location code
   */
  async getLocationFullName(code: string): Promise<string | null> {
    const location = await this.getLocationByCode(code);
    return location?.full_name || null;
  }

  /**
   * Resolve multiple location codes to full names
   */
  async resolveLocationCodes(codes: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    
    for (const code of codes) {
      result[code] = await this.getLocationFullName(code);
    }
    
    return result;
  }

  /**
   * Get all active locations
   */
  async getAllActiveLocations(): Promise<LocationCodeRow[]> {
    if (!this.isValidCache()) {
      await this.refreshCache();
    }
    
    return Array.from(this.locationCache.values()).filter(loc => loc.status === 'active');
  }

  /**
   * Search locations by partial code or name
   */
  async searchLocations(query: string, limit: number = 10): Promise<LocationCodeRow[]> {
    if (!this.isValidCache()) {
      await this.refreshCache();
    }

    const searchTerm = query.toLowerCase();
    const results = Array.from(this.locationCache.values())
      .filter(loc => 
        loc.status === 'active' && (
          loc.code.toLowerCase().includes(searchTerm) ||
          loc.full_name.toLowerCase().includes(searchTerm) ||
          loc.city?.toLowerCase().includes(searchTerm) ||
          loc.country?.toLowerCase().includes(searchTerm)
        )
      )
      .slice(0, limit);

    return results;
  }

  /**
   * Refresh the location cache
   */
  private async refreshCache(): Promise<void> {
    try {
      // Use admin client for better performance, fallback to regular client
      const client = adminSupabase || supabase;
      
      const { data, error } = await client
        .from('location_codes')
        .select('*')
        .eq('status', 'active')
        .order('code', { ascending: true });

      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';
        
        // Handle specific error codes that indicate database access issues (like RLS policies)
        if (
          errorCode === '406' ||
          errorCode === 'PGRST301' ||
          errorCode === 'PGRST116' ||
          errorMessage.includes('not acceptable') ||
          errorMessage.includes('permission denied') ||
          errorMessage.includes('does not exist')
        ) {
          console.warn('LocationResolutionService: Database table not accessible due to permissions/RLS policies:', error);
        } else {
          console.error('Failed to refresh location cache:', error);
        }
        return;
      }

      // Clear and rebuild cache
      this.locationCache.clear();
      data?.forEach(location => {
        this.locationCache.set(location.code, location);
      });

      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Error refreshing location cache:', error);
    }
  }

  /**
   * Check if cache is still valid
   */
  private isValidCache(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.locationCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; lastUpdate: Date | null; isValid: boolean } {
    return {
      size: this.locationCache.size,
      lastUpdate: this.lastCacheUpdate ? new Date(this.lastCacheUpdate) : null,
      isValid: this.isValidCache()
    };
  }
}

// Export singleton instance
export const locationResolutionService = new LocationResolutionService();

/**
 * Utility function to resolve location codes in transport route data
 */
export async function resolveTransportRouteLocations(route: any): Promise<any> {
  const resolvedRoute = { ...route };

  // Resolve start location
  if (route.start_location_code && !route.start_location_full_name) {
    resolvedRoute.start_location_full_name = await locationResolutionService.getLocationFullName(route.start_location_code);
  }

  // Resolve end location
  if (route.end_location_code && !route.end_location_full_name) {
    resolvedRoute.end_location_full_name = await locationResolutionService.getLocationFullName(route.end_location_code);
  }

  // Resolve intermediate stops if they have location codes
  if (route.intermediate_stops && Array.isArray(route.intermediate_stops)) {
    resolvedRoute.intermediate_stops = await Promise.all(
      route.intermediate_stops.map(async (stop: any) => {
        if (stop.location_code && !stop.location_full_name) {
          return {
            ...stop,
            location_full_name: await locationResolutionService.getLocationFullName(stop.location_code)
          };
        }
        return stop;
      })
    );
  }

  // Resolve sightseeing locations if they have location codes
  if (route.sightseeing_locations && Array.isArray(route.sightseeing_locations)) {
    resolvedRoute.sightseeing_locations = await Promise.all(
      route.sightseeing_locations.map(async (location: any) => {
        if (location.location_code && !location.location_full_name) {
          return {
            ...location,
            location_full_name: await locationResolutionService.getLocationFullName(location.location_code)
          };
        }
        return location;
      })
    );
  }

  return resolvedRoute;
}