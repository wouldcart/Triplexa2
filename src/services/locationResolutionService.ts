import { adminSupabase, supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid';
import { telemetryService } from '@/services/telemetryService';

export type LocationCodeRow = Tables<'location_codes'>;

/**
 * Service for resolving location codes to full names and location details
 */
class LocationResolutionService {
  private locationCache: Map<string, LocationCodeRow> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;
  private lastCacheSource: 'supabase' | 'localStorage' | 'sample' | 'unknown' = 'unknown';
  private lastRefreshDurationMs: number = 0;

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
    const refreshStart = Date.now();
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
          console.warn('LocationResolutionService: Failed to refresh location cache from Supabase. Falling back to local/sample data.', error);
        }
        // Fallback: try loading from local storage or sample data
        const fallback = this.loadFallback();
        if (fallback.rows.length > 0) {
          this.rebuildCache(fallback.rows);
          this.lastCacheUpdate = Date.now();
          this.lastCacheSource = fallback.source;
          this.lastRefreshDurationMs = Date.now() - refreshStart;
          telemetryService.recordEvent('location_cache', 'refresh', {
            source: this.lastCacheSource,
            rows: this.locationCache.size,
            duration_ms: this.lastRefreshDurationMs,
            success: false,
            error_code: errorCode,
            error_message: error.message || 'unknown',
          });
        }
        return;
      }

      // If Supabase returns no data, use local/sample fallback to keep UX smooth
      if (data && data.length > 0) {
        this.rebuildCache(data);
        this.lastCacheSource = 'supabase';
      } else {
        const fallback = this.loadFallback();
        this.rebuildCache(fallback.rows);
        this.lastCacheSource = fallback.source;
      }

      this.lastCacheUpdate = Date.now();
      this.lastRefreshDurationMs = Date.now() - refreshStart;
      telemetryService.recordEvent('location_cache', 'refresh', {
        source: this.lastCacheSource,
        rows: this.locationCache.size,
        duration_ms: this.lastRefreshDurationMs,
        success: true,
      });
    } catch (error) {
      console.warn('LocationResolutionService: Exception while refreshing cache. Falling back to local/sample data.', error);
      const fallback = this.loadFallback();
      if (fallback.rows.length > 0) {
        this.rebuildCache(fallback.rows);
        this.lastCacheUpdate = Date.now();
        this.lastCacheSource = fallback.source;
        this.lastRefreshDurationMs = Date.now() - refreshStart;
        telemetryService.recordEvent('location_cache', 'refresh', {
          source: this.lastCacheSource,
          rows: this.locationCache.size,
          duration_ms: this.lastRefreshDurationMs,
          success: false,
          error_message: error instanceof Error ? error.message : 'unknown',
        });
      }
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

  /**
   * Get last cache source and timing for telemetry & monitoring
   */
  getLastCacheSource(): { source: string; duration_ms: number } {
    return { source: this.lastCacheSource, duration_ms: this.lastRefreshDurationMs };
  }

  /**
   * Public method to pre-warm cache on app start without blocking UI
   */
  async prewarmCache(force: boolean = false): Promise<void> {
    if (force || !this.isValidCache()) {
      const start = Date.now();
      await this.refreshCache();
      telemetryService.recordEvent('location_cache', 'prewarm', {
        source: this.lastCacheSource,
        rows: this.locationCache.size,
        duration_ms: Date.now() - start,
      });
    }
  }

  /**
   * Attempt to load location data from localStorage or a small sample dataset.
   * Provides resilience when Supabase is unreachable in local/dev environments.
   */
  private loadFallback(): { rows: LocationCodeRow[]; source: 'localStorage' | 'sample' } {
    try {
      // Try localStorage first (used by LocationCodesManager and hooks)
      const raw = typeof window !== 'undefined' ? localStorage.getItem('locationCodes') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return {
            rows: parsed
              .filter((loc: any) => (loc?.status ?? 'active') === 'active')
              .map((loc: any) => this.mapLocalToRow(loc)),
            source: 'localStorage',
          };
        }
      }
    } catch (e) {
      // Ignore localStorage JSON parse errors and continue to sample fallback
      console.warn('LocationResolutionService: Failed to load localStorage locationCodes, using sample data.', e);
    }

    // Minimal sample dataset to ensure the app remains usable without Supabase
    const now = new Date().toISOString();
    const sample: LocationCodeRow[] = [
      {
        id: uuidv4(), code: 'DXB', full_name: 'Dubai International Airport', category: 'airport',
        country: 'United Arab Emirates', city: 'Dubai', status: 'active', notes: 'Sample fallback',
        latitude: 25.2532, longitude: 55.3657, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'DWC', full_name: 'Al Maktoum International Airport', category: 'airport',
        country: 'United Arab Emirates', city: 'Dubai', status: 'active', notes: 'Sample fallback',
        latitude: 24.9182, longitude: 55.1742, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'AUH', full_name: 'Abu Dhabi International Airport', category: 'airport',
        country: 'United Arab Emirates', city: 'Abu Dhabi', status: 'active', notes: 'Sample fallback',
        latitude: 24.4539, longitude: 54.3773, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'SHJ', full_name: 'Sharjah International Airport', category: 'airport',
        country: 'United Arab Emirates', city: 'Sharjah', status: 'active', notes: 'Sample fallback',
        latitude: 25.3286, longitude: 55.5170, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'DEL', full_name: 'Indira Gandhi International Airport', category: 'airport',
        country: 'India', city: 'Delhi', status: 'active', notes: 'Sample fallback',
        latitude: 28.5562, longitude: 77.1000, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'BOM', full_name: 'Chhatrapati Shivaji Maharaj International Airport', category: 'airport',
        country: 'India', city: 'Mumbai', status: 'active', notes: 'Sample fallback',
        latitude: 19.0896, longitude: 72.8656, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'BLR', full_name: 'Kempegowda International Airport', category: 'airport',
        country: 'India', city: 'Bangalore', status: 'active', notes: 'Sample fallback',
        latitude: 13.1986, longitude: 77.7066, created_at: now, updated_at: now
      },
      {
        id: uuidv4(), code: 'DXB APT', full_name: 'Dubai Airport City', category: 'city',
        country: 'United Arab Emirates', city: 'Dubai', status: 'active', notes: 'Sample city code',
        latitude: 25.2048, longitude: 55.2708, created_at: now, updated_at: now
      },
    ];

    return { rows: sample, source: 'sample' };
  }

  private mapLocalToRow(loc: any): LocationCodeRow {
    const now = new Date().toISOString();
    const latitude = typeof loc?.latitude === 'string' ? Number(loc.latitude) : (loc?.latitude ?? null);
    const longitude = typeof loc?.longitude === 'string' ? Number(loc.longitude) : (loc?.longitude ?? null);
    return {
      id: loc.id || uuidv4(),
      code: loc.code,
      full_name: loc.fullName || loc.full_name || loc.name || loc.code,
      category: loc.category || 'city',
      country: loc.country || 'Unknown',
      city: loc.city || null,
      status: loc.status || 'active',
      notes: loc.notes ?? null,
      latitude: Number.isFinite(latitude) ? latitude as number : null,
      longitude: Number.isFinite(longitude) ? longitude as number : null,
      created_at: loc.created_at || now,
      updated_at: loc.updated_at || now,
    } as LocationCodeRow;
  }

  private rebuildCache(rows: LocationCodeRow[] | null | undefined): void {
    this.locationCache.clear();
    (rows || []).forEach((location) => {
      if (location && location.code) {
        this.locationCache.set(location.code, location);
      }
    });
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