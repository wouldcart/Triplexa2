import { adminSupabase as supabaseAdmin, supabase } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Type definitions for integrated transport route data
export interface IntegratedTransportRoute extends Tables<'transport_routes'> {
  start_location_details?: Tables<'location_codes'> | null;
  end_location_details?: Tables<'location_codes'> | null;
  intermediate_stops_data?: IntegratedIntermediateStop[];
  transport_types_data?: Tables<'transport_types'>[];
  sightseeing_options_data?: Tables<'sightseeing_options'>[];
}

export interface IntegratedIntermediateStop extends Tables<'intermediate_stops'> {
  location_details?: Tables<'location_codes'> | null;
}

export interface CreateTransportRoutePayload {
  // Basic route information
  route_code: string;
  route_name: string;
  country: string;
  transfer_type: 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route';
  start_location_code: string;
  end_location_code: string;
  distance?: number;
  duration?: string;
  notes?: string;
  vehicle_types?: any[];
  luggage_capacity?: any[];
  status?: 'active' | 'inactive';
  enable_sightseeing?: boolean;
  
  // Related data
  intermediate_stops?: Array<{
    stop_order: number;
    location_code: string;
    coordinates?: { lat: number; lng: number } | null;
    transfer_method_notes?: string | null;
  }>;
  transport_types?: Array<{
    type: string;
    seating_capacity: number;
    luggage_capacity: number;
    duration: string;
    price: number;
    notes?: string;
  }>;
  sightseeing_options?: Array<{
    location: string;
    description?: string;
    adult_price: number;
    child_price: number;
    additional_charges?: number;
  }>;
}

export interface UpdateTransportRoutePayload extends Partial<CreateTransportRoutePayload> {
  id: string;
}

/**
 * Integrated Transport Service
 * Handles proper relationships between location_codes, transport_routes, and intermediate_stops tables
 */
export class IntegratedTransportService {
  private static instance: IntegratedTransportService;

  static getInstance(): IntegratedTransportService {
    if (!IntegratedTransportService.instance) {
      IntegratedTransportService.instance = new IntegratedTransportService();
    }
    return IntegratedTransportService.instance;
  }

  /**
   * Validate that location codes exist in the location_codes table
   */
  private async validateLocationCodes(codes: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    const { data: existingCodes, error } = await supabaseAdmin
      .from('location_codes')
      .select('code')
      .in('code', codes)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to validate location codes: ${error.message}`);
    }

    const validCodes = existingCodes?.map(item => item.code) || [];
    const invalidCodes = codes.filter(code => !validCodes.includes(code));

    return { valid: validCodes, invalid: invalidCodes };
  }

  /**
   * Get location details by code
   */
  private async getLocationDetails(code: string): Promise<Tables<'location_codes'> | null> {
    const { data, error } = await supabaseAdmin
      .from('location_codes')
      .select('*')
      .eq('code', code)
      .eq('status', 'active')
      .single();

    if (error) {
      console.warn(`Failed to get location details for code ${code}:`, error.message);
      return null;
    }

    return data;
  }

  /**
   * Create a new transport route with proper table relationships
   */
  async createTransportRoute(payload: CreateTransportRoutePayload): Promise<{
    success: boolean;
    data?: IntegratedTransportRoute;
    error?: string;
  }> {
    try {
      // Validate transfer type against allowed values
      const allowedTypes = new Set(['One-Way', 'Round-Trip', 'Multi-Stop', 'en route']);
      if (!allowedTypes.has(payload.transfer_type)) {
        return {
          success: false,
          error: 'Invalid transfer_type. Allowed values: One-Way, Round-Trip, Multi-Stop, en route'
        };
      }

      // Validate all location codes
      const allLocationCodes = [
        payload.start_location_code,
        payload.end_location_code,
        ...(payload.intermediate_stops?.map(stop => stop.location_code) || [])
      ];

      const { valid, invalid } = await this.validateLocationCodes(allLocationCodes);
      if (invalid.length > 0) {
        return {
          success: false,
          error: `Location code ${invalid[0]} not found in location_codes table`
        };
      }

      // Get location details for start and end locations
      const [startLocationDetails, endLocationDetails] = await Promise.all([
        this.getLocationDetails(payload.start_location_code),
        this.getLocationDetails(payload.end_location_code)
      ]);

      if (!startLocationDetails || !endLocationDetails) {
        return {
          success: false,
          error: 'Failed to retrieve location details for start or end location'
        };
      }

      // Compute full names and a safe route name (never empty)
      const startFullName = startLocationDetails.full_name || payload.start_location_code;
      const endFullName = endLocationDetails.full_name || payload.end_location_code;
      const startCoordinates = (startLocationDetails.latitude != null && startLocationDetails.longitude != null)
        ? { lat: startLocationDetails.latitude, lng: startLocationDetails.longitude }
        : null;
      const endCoordinates = (endLocationDetails.latitude != null && endLocationDetails.longitude != null)
        ? { lat: endLocationDetails.latitude, lng: endLocationDetails.longitude }
        : null;
      const computedRouteName = (payload.route_name && payload.route_name.trim().length > 0)
        ? payload.route_name.trim()
        : `${startFullName} → ${endFullName}`;

      // Generate route code if not provided: {start}-{end}-{type_short}{index}
      const typeShortMap: Record<string, string> = {
        'One-Way': 'OW',
        'Round-Trip': 'RT',
        'Multi-Stop': 'MS',
        'en route': 'ER'
      };
      let routeCode = (payload.route_code || '').trim();
      if (!routeCode) {
        const { count } = await supabaseAdmin
          .from('transport_routes')
          .select('*', { count: 'exact', head: true })
          .eq('start_location', payload.start_location_code)
          .eq('end_location', payload.end_location_code)
          .eq('transfer_type', payload.transfer_type);
        const nextIndex = ((count as number) || 0) + 1;
        const indexStr = String(nextIndex).padStart(2, '0');
        const typeShort = typeShortMap[payload.transfer_type] || payload.transfer_type.substring(0, 2).toUpperCase();
        routeCode = `${payload.start_location_code}-${payload.end_location_code}-${typeShort}${indexStr}`;
      }

      // Start transaction
      const { data: route, error: routeError } = await supabaseAdmin
        .from('transport_routes')
        .insert({
          route_code: routeCode,
          route_name: computedRouteName,
          name: computedRouteName,
          country: payload.country,
          transfer_type: payload.transfer_type,
          // Map to live schema columns
          start_location: payload.start_location_code,
          end_location: payload.end_location_code,
          // Store full names when available
          start_location_full_name: startFullName,
          end_location_full_name: endFullName,
          start_coordinates: startCoordinates,
          end_coordinates: endCoordinates,
          distance: payload.distance,
          duration: payload.duration,
      // Live schema uses `notes` for free-text description
      notes: payload.notes ?? '',
      // Ensure vehicle_types is a JSON array (optional)
      vehicle_types: Array.isArray(payload.vehicle_types)
        ? payload.vehicle_types
        : (payload.transport_types?.map(t => ({
            type: t.type,
            seating_capacity: t.seating_capacity,
            luggage_capacity: t.luggage_capacity,
            duration: t.duration,
            price: t.price,
            notes: t.notes
          })) || []),
      // Ensure luggage_capacity JSONB array exists (optional)
      luggage_capacity: Array.isArray(payload.luggage_capacity)
        ? payload.luggage_capacity
        : (payload.transport_types?.map(t => ({
            transport_type: t.type,
            bags: t.luggage_capacity,
            // kg can be provided by UI later; default to null/undefined
            kg: undefined
          })) || []),
      status: payload.status || 'active',
      enable_sightseeing: payload.enable_sightseeing || false
    })
        .select()
        .single();

      if (routeError) {
        return {
          success: false,
          error: `Failed to create transport route: ${routeError.message}`
        };
      }

      // Create intermediate stops if provided
      let intermediateStopsData: IntegratedIntermediateStop[] = [];
      if (payload.intermediate_stops && payload.intermediate_stops.length > 0) {
        const stopsToInsert = await Promise.all(
          payload.intermediate_stops.map(async stop => {
            const details = await this.getLocationDetails(stop.location_code);
            const resolvedCoords = (stop.coordinates && typeof stop.coordinates === 'object')
              ? stop.coordinates
              : (details && details.latitude != null && details.longitude != null
                  ? { lat: details.latitude, lng: details.longitude }
                  : null);
            return {
              route_id: route.id,
              stop_order: stop.stop_order,
              location_code: stop.location_code,
              full_name: details?.full_name || stop.location_code,
              coordinates: resolvedCoords,
              transfer_method_notes: stop.transfer_method_notes ?? null
            };
          })
        );

        const { data: stops, error: stopsError } = await supabaseAdmin
          .from('intermediate_stops')
          .insert(stopsToInsert)
          .select();

        if (stopsError) {
          // Rollback route creation
          await supabaseAdmin.from('transport_routes').delete().eq('id', route.id);
          return {
            success: false,
            error: `Failed to create intermediate stops: ${stopsError.message}`
          };
        }

        // Enrich stops with location details
        intermediateStopsData = await Promise.all(
          (stops || []).map(async (stop) => {
            const locationDetails = await this.getLocationDetails(stop.location_code);
            return {
              ...stop,
              full_name: locationDetails?.full_name || stop.location_code,
              location_details: locationDetails
            };
          })
        );
      }

      // Create transport types if provided
      let transportTypesData: Tables<'transport_types'>[] = [];
      if (payload.transport_types && payload.transport_types.length > 0) {
        const { data: types, error: typesError } = await supabaseAdmin
          .from('transport_types')
          .insert(
            payload.transport_types.map(type => ({
              route_id: route.id,
              type: type.type,
              seating_capacity: type.seating_capacity,
              luggage_capacity: type.luggage_capacity,
              duration: type.duration,
              price: type.price,
              notes: type.notes
            }))
          )
          .select();

        if (typesError) {
          console.warn('Failed to create transport types:', typesError.message);
        } else {
          transportTypesData = types || [];
        }
      }

      // Create sightseeing options if provided
      let sightseeingOptionsData: Tables<'sightseeing_options'>[] = [];
      if (payload.sightseeing_options && payload.sightseeing_options.length > 0) {
        const { data: options, error: optionsError } = await supabaseAdmin
          .from('sightseeing_options')
          .insert(
            payload.sightseeing_options.map(option => ({
              route_id: route.id,
              location: option.location,
              description: option.description,
              adult_price: option.adult_price,
              child_price: option.child_price,
              additional_charges: option.additional_charges || 0
            }))
          )
          .select();

        if (optionsError) {
          console.warn('Failed to create sightseeing options:', optionsError.message);
        } else {
          sightseeingOptionsData = options || [];
        }
      }

      // Return integrated route data
      const integratedRoute: IntegratedTransportRoute = {
        ...route,
        start_location_details: startLocationDetails,
        end_location_details: endLocationDetails,
        intermediate_stops_data: intermediateStopsData,
        transport_types_data: transportTypesData,
        sightseeing_options_data: sightseeingOptionsData
      };

      return {
        success: true,
        data: integratedRoute
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get transport route with all related data
   */
  async getTransportRoute(id: string): Promise<{
    success: boolean;
    data?: IntegratedTransportRoute;
    error?: string;
  }> {
    try {
      // Get the main route
      const { data: route, error: routeError } = await supabaseAdmin
        .from('transport_routes')
        .select('*')
        .eq('id', id)
        .single();

      if (routeError) {
        return {
          success: false,
          error: `Failed to get transport route: ${routeError.message}`
        };
      }

      // Get related data in parallel
      const [
        startLocationDetails,
        endLocationDetails,
        intermediateStops,
        transportTypes,
        sightseeingOptions
      ] = await Promise.all([
        this.getLocationDetails(route.start_location),
        this.getLocationDetails(route.end_location),
        supabaseAdmin
          .from('intermediate_stops')
          .select('*')
          .eq('route_id', id)
          .order('stop_order'),
        supabaseAdmin
          .from('transport_types')
          .select('*')
          .eq('route_id', id),
        supabaseAdmin
          .from('sightseeing_options')
          .select('*')
          .eq('route_id', id)
      ]);

      // Enrich intermediate stops with location details
      const enrichedStops: IntegratedIntermediateStop[] = await Promise.all(
        (intermediateStops.data || []).map(async (stop) => {
          const locationDetails = await this.getLocationDetails(stop.location_code);
          return {
            ...stop,
            location_details: locationDetails
          };
        })
      );

      const integratedRoute: IntegratedTransportRoute = {
        ...route,
        start_location_details: startLocationDetails,
        end_location_details: endLocationDetails,
        intermediate_stops_data: enrichedStops,
        transport_types_data: transportTypes.data || [],
        sightseeing_options_data: sightseeingOptions.data || []
      };

      return {
        success: true,
        data: integratedRoute
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List transport routes with filtering and related data
   */
  async listTransportRoutes(filters?: {
    country?: string;
    status?: string;
    transfer_type?: string;
    include_related?: boolean;
  }): Promise<{
    success: boolean;
    data?: IntegratedTransportRoute[];
    error?: string;
  }> {
    try {
      let query = supabaseAdmin.from('transport_routes').select('*');

      // Apply filters
      if (filters?.country) {
        query = query.eq('country', filters.country);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.transfer_type) {
        query = query.eq('transfer_type', filters.transfer_type);
      }

      const { data: routes, error: routesError } = await query;

      if (routesError) {
        return {
          success: false,
          error: `Failed to list transport routes: ${routesError.message}`
        };
      }

      // If include_related is false, return basic route data
      if (!filters?.include_related) {
        return {
          success: true,
          data: routes as IntegratedTransportRoute[]
        };
      }

      // Enrich with related data
      const enrichedRoutes: IntegratedTransportRoute[] = await Promise.all(
        (routes || []).map(async (route) => {
          const result = await this.getTransportRoute(route.id);
          return result.data || route as IntegratedTransportRoute;
        })
      );

      return {
        success: true,
        data: enrichedRoutes
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update transport route with proper relationship handling
   */
  async updateTransportRoute(payload: UpdateTransportRoutePayload): Promise<{
    success: boolean;
    data?: IntegratedTransportRoute;
    error?: string;
  }> {
    try {
      const { id, intermediate_stops, transport_types, sightseeing_options, ...routeData } = payload;

      // Validate location codes if they're being updated
      const locationCodes: string[] = [];
      if (routeData.start_location_code) locationCodes.push(routeData.start_location_code);
      if (routeData.end_location_code) locationCodes.push(routeData.end_location_code);
      if (intermediate_stops) {
        locationCodes.push(...intermediate_stops.map(stop => stop.location_code));
      }

      if (locationCodes.length > 0) {
        const { invalid } = await this.validateLocationCodes(locationCodes);
        if (invalid.length > 0) {
          return {
            success: false,
            error: `Invalid location codes: ${invalid.join(', ')}`
          };
        }
      }

      // Update main route
      // Map start/end location codes to actual columns in live schema
      const updateBody: Record<string, any> = { ...routeData };
      // Always bump updated_at timestamp on save
      updateBody.updated_at = new Date().toISOString();
      // Ensure notes is a string when updating
      if (Object.prototype.hasOwnProperty.call(routeData, 'notes')) {
        updateBody.notes = routeData.notes ?? '';
      }
      // Ensure vehicle_types is JSON array when provided
      if (Object.prototype.hasOwnProperty.call(routeData, 'vehicle_types')) {
        updateBody.vehicle_types = Array.isArray(routeData.vehicle_types)
          ? routeData.vehicle_types
          : [];
      }
      // Ensure luggage_capacity is JSON array when provided
      if (Object.prototype.hasOwnProperty.call(routeData, 'luggage_capacity')) {
        updateBody.luggage_capacity = Array.isArray(routeData.luggage_capacity)
          ? routeData.luggage_capacity
          : [];
      }
      if (routeData.start_location_code) {
        updateBody.start_location = routeData.start_location_code;
        const startDetails = await this.getLocationDetails(routeData.start_location_code);
        updateBody.start_location_full_name = startDetails?.full_name || routeData.start_location_code;
        if (startDetails && startDetails.latitude != null && startDetails.longitude != null) {
          updateBody.start_coordinates = { lat: startDetails.latitude, lng: startDetails.longitude };
        } else {
          updateBody.start_coordinates = null;
        }
        // Remove schema-incompatible key before update
        delete (updateBody as any).start_location_code;
      }
      if (routeData.end_location_code) {
        updateBody.end_location = routeData.end_location_code;
        const endDetails = await this.getLocationDetails(routeData.end_location_code);
        updateBody.end_location_full_name = endDetails?.full_name || routeData.end_location_code;
        if (endDetails && endDetails.latitude != null && endDetails.longitude != null) {
          updateBody.end_coordinates = { lat: endDetails.latitude, lng: endDetails.longitude };
        } else {
          updateBody.end_coordinates = null;
        }
        // Remove schema-incompatible key before update
        delete (updateBody as any).end_location_code;
      }

      // Sanitize status to allowed literals if provided
      if (Object.prototype.hasOwnProperty.call(updateBody, 'status')) {
        const s = updateBody.status;
        updateBody.status = typeof s === 'boolean' ? (s ? 'active' : 'inactive') : (s === 'inactive' ? 'inactive' : 'active');
      }
      // Defensive: sanitize transfer_type to known values if provided
      if (Object.prototype.hasOwnProperty.call(updateBody, 'transfer_type')) {
        const allowed = ['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'];
        updateBody.transfer_type = allowed.includes(updateBody.transfer_type) ? updateBody.transfer_type : 'One-Way';
      }

      const { data: updatedRoute, error: routeError } = await supabaseAdmin
        .from('transport_routes')
        .update(updateBody)
        .eq('id', id)
        .select()
        .single();

      if (routeError) {
        return {
          success: false,
          error: `Failed to update transport route: ${routeError.message}`
        };
      }

      // Update intermediate stops if provided
      if (intermediate_stops !== undefined) {
        // Delete existing stops
        await supabaseAdmin
          .from('intermediate_stops')
          .delete()
          .eq('route_id', id);

        // Insert new stops
        if (intermediate_stops.length > 0) {
          const stopsToInsert = await Promise.all(
            intermediate_stops.map(async stop => {
              const details = await this.getLocationDetails(stop.location_code);
              const resolvedCoords = (stop.coordinates && typeof stop.coordinates === 'object')
                ? stop.coordinates
                : (details && details.latitude != null && details.longitude != null
                    ? { lat: details.latitude, lng: details.longitude }
                    : null);
              return {
                route_id: id,
                stop_order: stop.stop_order,
                location_code: stop.location_code,
                full_name: details?.full_name || stop.location_code,
                coordinates: resolvedCoords,
                transfer_method_notes: stop.transfer_method_notes ?? null
              };
            })
          );
          await supabaseAdmin
            .from('intermediate_stops')
            .insert(stopsToInsert);
        }
      }

      // Update transport types if provided
      if (transport_types !== undefined) {
        // Delete existing types
        await supabaseAdmin
          .from('transport_types')
          .delete()
          .eq('route_id', id);

        // Insert new types
        if (transport_types.length > 0) {
          await supabaseAdmin
            .from('transport_types')
            .insert(
              transport_types.map(type => ({
                route_id: id,
                type: type.type,
                seating_capacity: type.seating_capacity,
                luggage_capacity: type.luggage_capacity,
                duration: type.duration,
                price: type.price,
                notes: type.notes
              }))
            );
        }
      }

      // Update sightseeing options if provided
      if (sightseeing_options !== undefined) {
        // Delete existing options
        await supabaseAdmin
          .from('sightseeing_options')
          .delete()
          .eq('route_id', id);

        // Insert new options
        if (sightseeing_options.length > 0) {
          await supabaseAdmin
            .from('sightseeing_options')
            .insert(
              sightseeing_options.map(option => ({
                route_id: id,
                location: option.location,
                description: option.description,
                adult_price: option.adult_price,
                child_price: option.child_price,
                additional_charges: option.additional_charges || 0
              }))
            );
        }
      }

      // Get the updated route with all related data
      const result = await this.getTransportRoute(id);
      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete transport route and all related data
   */
  async deleteTransportRoute(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Delete related data first (due to foreign key constraints)
      await Promise.all([
        supabaseAdmin.from('intermediate_stops').delete().eq('route_id', id),
        supabaseAdmin.from('transport_types').delete().eq('route_id', id),
        supabaseAdmin.from('sightseeing_options').delete().eq('route_id', id)
      ]);

      // Delete the main route
      const { error: routeError } = await supabaseAdmin
        .from('transport_routes')
        .delete()
        .eq('id', id);

      if (routeError) {
        return {
          success: false,
          error: `Failed to delete transport route: ${routeError.message}`
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate data consistency across all tables
   */
  async validateDataConsistency(): Promise<{
    success: boolean;
    issues?: Array<{
      type: 'missing_location' | 'orphaned_stop' | 'orphaned_type' | 'orphaned_sightseeing';
      description: string;
      route_id?: string;
      location_code?: string;
    }>;
    error?: string;
  }> {
    try {
      const issues: Array<{
        type: 'missing_location' | 'orphaned_stop' | 'orphaned_type' | 'orphaned_sightseeing';
        description: string;
        route_id?: string;
        location_code?: string;
      }> = [];

      // Check for routes with invalid location codes
      const { data: routes } = await supabaseAdmin
        .from('transport_routes')
        .select('id, start_location, end_location');

      const { data: locationCodes } = await supabaseAdmin
        .from('location_codes')
        .select('code')
        .eq('status', 'active');

      const validCodes = new Set(locationCodes?.map(lc => lc.code) || []);

      for (const route of routes || []) {
        if (!validCodes.has(route.start_location)) {
          issues.push({
            type: 'missing_location',
            description: `Route ${route.id} has invalid start_location: ${route.start_location}`,
            route_id: route.id,
            location_code: route.start_location
          });
        }
        if (!validCodes.has(route.end_location)) {
          issues.push({
            type: 'missing_location',
            description: `Route ${route.id} has invalid end_location: ${route.end_location}`,
            route_id: route.id,
            location_code: route.end_location
          });
        }
      }

      // Check for intermediate stops with invalid location codes
      const { data: stops } = await supabaseAdmin
        .from('intermediate_stops')
        .select('id, route_id, location_code');

      for (const stop of stops || []) {
        if (!validCodes.has(stop.location_code)) {
          issues.push({
            type: 'missing_location',
            description: `Intermediate stop ${stop.id} has invalid location_code: ${stop.location_code}`,
            route_id: stop.route_id,
            location_code: stop.location_code
          });
        }
      }

      // Check for orphaned records
      const routeIds = new Set(routes?.map(r => r.id) || []);

      // Check orphaned intermediate stops
      for (const stop of stops || []) {
        if (!routeIds.has(stop.route_id)) {
          issues.push({
            type: 'orphaned_stop',
            description: `Intermediate stop ${stop.id} references non-existent route: ${stop.route_id}`,
            route_id: stop.route_id
          });
        }
      }

      return {
        success: true,
        issues
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const integratedTransportService = IntegratedTransportService.getInstance();

// Export convenience functions
export const createIntegratedTransportRoute = (payload: CreateTransportRoutePayload) =>
  integratedTransportService.createTransportRoute(payload);

export const getIntegratedTransportRoute = (id: string) =>
  integratedTransportService.getTransportRoute(id);

export const listIntegratedTransportRoutes = (filters?: Parameters<typeof integratedTransportService.listTransportRoutes>[0]) =>
  integratedTransportService.listTransportRoutes(filters);

export const updateIntegratedTransportRoute = (payload: UpdateTransportRoutePayload) =>
  integratedTransportService.updateTransportRoute(payload);

export const deleteIntegratedTransportRoute = (id: string) =>
  integratedTransportService.deleteTransportRoute(id);

export const validateTransportDataConsistency = () =>
  integratedTransportService.validateDataConsistency();