import { supabase } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';
import { CountriesService } from './countriesService';

// Location resolution service for fetching location details
export class LocationResolutionService {
  static async getLocationDetails(locationCode: string): Promise<{
    full_name?: string;
    coordinates?: Json;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('location_codes')
        .select('full_name, latitude, longitude')
        .eq('code', locationCode)
        .single();

      if (error) {
        console.warn(`Location not found for code: ${locationCode}`);
        return { error: `Location not found for code: ${locationCode}` };
      }

      // Convert latitude/longitude to coordinates JSON format
      const coordinates = data.latitude && data.longitude 
        ? { lat: data.latitude, lng: data.longitude }
        : null;

      return {
        full_name: data.full_name,
        coordinates: coordinates as Json,
      };
    } catch (error) {
      console.error('Error fetching location details:', error);
      return { error: 'Failed to fetch location details' };
    }
  }

  static async resolveLocationFields(formData: TransportRouteFormData): Promise<TransportRouteFormData> {
    const resolvedData = { ...formData };

    // Resolve start location if only code is provided
    if (formData.start_location && !formData.start_location_full_name) {
      const startDetails = await this.getLocationDetails(formData.start_location);
      if (startDetails.full_name) {
        resolvedData.start_location_full_name = startDetails.full_name;
        resolvedData.start_coordinates = startDetails.coordinates;
      }
    }

    // Resolve end location if only code is provided
    if (formData.end_location && !formData.end_location_full_name) {
      const endDetails = await this.getLocationDetails(formData.end_location);
      if (endDetails.full_name) {
        resolvedData.end_location_full_name = endDetails.full_name;
        resolvedData.end_coordinates = endDetails.coordinates;
      }
    }

    // Resolve intermediate stops locations
    if (formData.intermediate_stops) {
      for (let i = 0; i < formData.intermediate_stops.length; i++) {
        const stop = formData.intermediate_stops[i];
        if (stop.location_code && !stop.full_name) {
          const stopDetails = await this.getLocationDetails(stop.location_code);
          if (stopDetails.full_name) {
            resolvedData.intermediate_stops![i] = {
              ...stop,
              full_name: stopDetails.full_name,
              coordinates: stopDetails.coordinates,
            };
          }
        }
      }
    }

    return resolvedData;
  }

  // Resolve location fields for intermediate stops
  static async resolveStopLocation(stopData: any): Promise<any> {
    const resolvedData = { ...stopData };

    if (stopData.location_code) {
      const locationDetails = await this.getLocationDetails(stopData.location_code);
      if (locationDetails) {
        resolvedData.location_full_name = locationDetails.full_name;
        resolvedData.coordinates = locationDetails.coordinates;
      }
    }

    return resolvedData;
  }

  // Resolve location fields for sightseeing options
  static async resolveSightseeingLocation(optionData: any): Promise<any> {
    const resolvedData = { ...optionData };

    if (optionData.location_code) {
      const locationDetails = await this.getLocationDetails(optionData.location_code);
      if (locationDetails) {
        resolvedData.location_full_name = locationDetails.full_name;
        resolvedData.coordinates = locationDetails.coordinates;
      }
    }

    return resolvedData;
  }
}

// Type definitions for transport-related data
export type TransportRoute = Tables<'transport_routes'>;
export type IntermediateStop = Tables<'intermediate_stops'>;
export type SightseeingOption = Tables<'sightseeing_options'>;
export type TransportType = Tables<'transport_types'>;

export type TransportRouteInsert = TablesInsert<'transport_routes'>;
export type IntermediateStopInsert = TablesInsert<'intermediate_stops'>;
export type SightseeingOptionInsert = TablesInsert<'sightseeing_options'>;

export type TransportRouteUpdate = TablesUpdate<'transport_routes'>;
export type IntermediateStopUpdate = TablesUpdate<'intermediate_stops'>;
export type SightseeingOptionUpdate = TablesUpdate<'sightseeing_options'>;

// Enhanced query options for better filtering and pagination
interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    country?: string;
    transfer_type?: string;
    status?: string;
    search?: string;
    start_location?: string;
    end_location?: string;
  };
}

// Response interface for paginated results
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Complete route data with relationships
export interface CompleteTransportRoute extends TransportRoute {
  intermediate_stops?: IntermediateStop[];
  sightseeing_options?: SightseeingOption[];
}

// Form data structure for creating/updating routes
export interface TransportRouteFormData {
  // Basic route information
  id?: string;
  route_code?: string;
  route_name: string;
  country: string;
  transfer_type: 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route';
  
  // Location information
  start_location: string;
  start_location_full_name: string;
  start_coordinates?: Json;
  end_location: string;
  end_location_full_name: string;
  end_coordinates?: Json;
  
  // Route details
  distance?: number;
  duration?: string;
  description?: string;
  notes?: string;
  status?: string;
  enable_sightseeing?: boolean;
  name?: string;
  
  // Related data
  intermediate_stops?: Omit<IntermediateStopInsert, 'route_id'>[];
  sightseeing_options?: Omit<SightseeingOptionInsert, 'route_id'>[];
}

export class ComprehensiveTransportService {
  /**
   * Create a new transport route with all related data
   */
  static async createCompleteRoute(formData: TransportRouteFormData): Promise<{
    success: boolean;
    data?: CompleteTransportRoute;
    error?: string;
  }> {
    try {
      // Resolve location data before validation
      const resolvedFormData = await LocationResolutionService.resolveLocationFields(formData);

      // Validate the form data including secure country validation
      const validation = await this.validateRouteData(resolvedFormData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Start a transaction by creating the main route first
      const routeData: TransportRouteInsert = {
        route_code: resolvedFormData.route_code || this.generateRouteCode(resolvedFormData),
        route_name: resolvedFormData.route_name,
        country: resolvedFormData.country,
        transfer_type: resolvedFormData.transfer_type,
        start_location: resolvedFormData.start_location,
        start_location_full_name: resolvedFormData.start_location_full_name,
        start_coordinates: resolvedFormData.start_coordinates,
        end_location: resolvedFormData.end_location,
        end_location_full_name: resolvedFormData.end_location_full_name,
        end_coordinates: resolvedFormData.end_coordinates,
        distance: resolvedFormData.distance,
        duration: resolvedFormData.duration,
        notes: resolvedFormData.notes,
        status: resolvedFormData.status || 'active',
        enable_sightseeing: resolvedFormData.enable_sightseeing || false,
        name: resolvedFormData.name,
      };

      const { data: route, error: routeError } = await supabase
        .from('transport_routes')
        .insert(routeData)
        .select()
        .single();

      if (routeError) {
        throw new Error(`Failed to create route: ${routeError.message}`);
      }

      // Create intermediate stops if provided
      let intermediateStops: IntermediateStop[] = [];
      if (resolvedFormData.intermediate_stops && resolvedFormData.intermediate_stops.length > 0) {
        // Resolve location data for each stop
        const resolvedStops = await Promise.all(
          resolvedFormData.intermediate_stops.map(stop => 
            LocationResolutionService.resolveStopLocation(stop)
          )
        );
        
        const stopsData = resolvedStops.map((stop, index) => ({
          ...stop,
          route_id: route.id,
          stop_order: stop.stop_order || index + 1,
        }));

        const { data: stops, error: stopsError } = await supabase
          .from('intermediate_stops')
          .insert(stopsData)
          .select();

        if (stopsError) {
          // Rollback: delete the created route
          await supabase.from('transport_routes').delete().eq('id', route.id);
          throw new Error(`Failed to create intermediate stops: ${stopsError.message}`);
        }

        intermediateStops = stops;
      }

      // Create sightseeing options if provided
      let sightseeingOptions: SightseeingOption[] = [];
      if (resolvedFormData.sightseeing_options && resolvedFormData.sightseeing_options.length > 0) {
        // Resolve location data for each sightseeing option
        const resolvedOptions = await Promise.all(
          resolvedFormData.sightseeing_options.map(option => 
            LocationResolutionService.resolveSightseeingLocation(option)
          )
        );
        
        const sightseeingData = resolvedOptions.map(option => ({
          ...option,
          route_id: route.id,
        }));

        const { data: options, error: optionsError } = await supabase
          .from('sightseeing_options')
          .insert(sightseeingData)
          .select();

        if (optionsError) {
          // Rollback: delete created route and stops
          await supabase.from('transport_routes').delete().eq('id', route.id);
          throw new Error(`Failed to create sightseeing options: ${optionsError.message}`);
        }

        sightseeingOptions = options;
      }

      return {
        success: true,
        data: {
          ...route,
          intermediate_stops: intermediateStops,
          sightseeing_options: sightseeingOptions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get a transport route with all related data
   */
  static async getCompleteRoute(routeId: string): Promise<{
    success: boolean;
    data?: CompleteTransportRoute;
    error?: string;
  }> {
    try {
      const { data: route, error: routeError } = await supabase
        .from('transport_routes')
        .select(`
          *,
          intermediate_stops(*),
          sightseeing_options(*)
        `)
        .eq('id', routeId)
        .single();

      if (routeError) {
        throw new Error(`Failed to fetch route: ${routeError.message}`);
      }

      return {
        success: true,
        data: route,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all transport routes with enhanced filtering and pagination
   */
  static async getCompleteRoutes(options: QueryOptions = {}): Promise<{
    success: boolean;
    data?: PaginatedResponse<CompleteTransportRoute>;
    error?: string;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        filters = {}
      } = options;

      // Auth guard: avoid unauthenticated calls to protected tables
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        return {
          success: true,
          data: {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        };
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Build the base query
      let query = supabase
        .from('transport_routes')
        .select(`
          *,
          intermediate_stops(*),
          sightseeing_options(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters.country) {
        query = query.eq('country', filters.country);
      }
      if (filters.transfer_type) {
        query = query.eq('transfer_type', filters.transfer_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.start_location) {
        query = query.eq('start_location', filters.start_location);
      }
      if (filters.end_location) {
        query = query.eq('end_location', filters.end_location);
      }
      if (filters.search) {
        query = query.or(`route_name.ilike.%${filters.search}%,route_code.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: routes, error: routesError, count } = await query;

      if (routesError) {
        throw new Error(`Failed to fetch routes: ${routesError.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        success: true,
        data: {
          data: routes || [],
          total: count || 0,
          page,
          limit,
          totalPages
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update a transport route and its related data
   */
  static async updateCompleteRoute(
    routeId: string,
    formData: Partial<TransportRouteFormData>
  ): Promise<{
    success: boolean;
    data?: CompleteTransportRoute;
    error?: string;
  }> {
    try {
      // Resolve location data before validation if route data is provided
      let resolvedFormData = formData;
      if (Object.keys(formData).length > 0) {
        resolvedFormData = await LocationResolutionService.resolveLocationFields(formData as TransportRouteFormData);
        
        const validation = await this.validateRouteData(resolvedFormData as TransportRouteFormData);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update the main route
      const routeUpdateData: TransportRouteUpdate = {};
      
      // Only include fields that are provided
      if (resolvedFormData.route_name !== undefined) routeUpdateData.route_name = resolvedFormData.route_name;
      if (resolvedFormData.country !== undefined) routeUpdateData.country = resolvedFormData.country;
      if (resolvedFormData.transfer_type !== undefined) routeUpdateData.transfer_type = resolvedFormData.transfer_type;
      if (resolvedFormData.start_location !== undefined) routeUpdateData.start_location = resolvedFormData.start_location;
      if (resolvedFormData.start_location_full_name !== undefined) routeUpdateData.start_location_full_name = resolvedFormData.start_location_full_name;
      if (resolvedFormData.start_coordinates !== undefined) routeUpdateData.start_coordinates = resolvedFormData.start_coordinates;
      if (resolvedFormData.end_location !== undefined) routeUpdateData.end_location = resolvedFormData.end_location;
      if (resolvedFormData.end_location_full_name !== undefined) routeUpdateData.end_location_full_name = resolvedFormData.end_location_full_name;
      if (resolvedFormData.end_coordinates !== undefined) routeUpdateData.end_coordinates = resolvedFormData.end_coordinates;
      if (resolvedFormData.distance !== undefined) routeUpdateData.distance = resolvedFormData.distance;
      if (resolvedFormData.duration !== undefined) routeUpdateData.duration = resolvedFormData.duration;
      if (resolvedFormData.notes !== undefined) routeUpdateData.notes = resolvedFormData.notes;
      if (resolvedFormData.status !== undefined) routeUpdateData.status = resolvedFormData.status;
      if (resolvedFormData.enable_sightseeing !== undefined) routeUpdateData.enable_sightseeing = resolvedFormData.enable_sightseeing;
      if (resolvedFormData.name !== undefined) routeUpdateData.name = resolvedFormData.name;

      const { data: route, error: routeError } = await supabase
        .from('transport_routes')
        .update(routeUpdateData)
        .eq('id', routeId)
        .select()
        .single();

      if (routeError) {
        throw new Error(`Failed to update route: ${routeError.message}`);
      }

      // Handle intermediate stops updates if provided
      if (resolvedFormData.intermediate_stops !== undefined) {
        // Delete existing stops
        await supabase.from('intermediate_stops').delete().eq('route_id', routeId);

        // Create new stops
        if (resolvedFormData.intermediate_stops.length > 0) {
          // Resolve location data for each stop
          const resolvedStops = await Promise.all(
            resolvedFormData.intermediate_stops.map(stop => 
              LocationResolutionService.resolveStopLocation(stop)
            )
          );
          
          const stopsData = resolvedStops.map((stop, index) => ({
            ...stop,
            route_id: routeId,
            stop_order: stop.stop_order || index + 1,
          }));

          const { error: stopsError } = await supabase
            .from('intermediate_stops')
            .insert(stopsData);

          if (stopsError) {
            throw new Error(`Failed to update intermediate stops: ${stopsError.message}`);
          }
        }
      }

      // Handle sightseeing options updates if provided
      if (resolvedFormData.sightseeing_options !== undefined) {
        // Delete existing options
        await supabase.from('sightseeing_options').delete().eq('route_id', routeId);

        // Create new options
        if (resolvedFormData.sightseeing_options.length > 0) {
          // Resolve location data for each sightseeing option
          const resolvedOptions = await Promise.all(
            resolvedFormData.sightseeing_options.map(option => 
              LocationResolutionService.resolveSightseeingLocation(option)
            )
          );
          
          const sightseeingData = resolvedOptions.map(option => ({
            ...option,
            route_id: routeId,
          }));

          const { error: optionsError } = await supabase
            .from('sightseeing_options')
            .insert(sightseeingData);

          if (optionsError) {
            throw new Error(`Failed to update sightseeing options: ${optionsError.message}`);
          }
        }
      }

      // Fetch the updated route with all relationships
      return await this.getCompleteRoute(routeId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete a transport route and all related data
   */
  static async deleteCompleteRoute(routeId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Delete the route (cascade will handle related data)
      const { error: deleteError } = await supabase
        .from('transport_routes')
        .delete()
        .eq('id', routeId);

      if (deleteError) {
        throw new Error(`Failed to delete route: ${deleteError.message}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get available transport types (reference table)
   */
  static async getTransportTypes(): Promise<{
    success: boolean;
    data?: TransportType[];
    error?: string;
  }> {
    try {
      // Auth guard: avoid unauthenticated calls to protected tables
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        return {
          success: true,
          data: []
        };
      }

      const { data: types, error: typesError } = await supabase
        .from('transport_types')
        .select('*')
        .eq('active', true)
        .order('name');

      if (typesError) {
        throw new Error(`Failed to fetch transport types: ${typesError.message}`);
      }

      return {
        success: true,
        data: types || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Manage intermediate stops for a route
   */
  static async manageIntermediateStops(
    routeId: string,
    stops: Omit<IntermediateStopInsert, 'route_id'>[]
  ): Promise<{
    success: boolean;
    data?: IntermediateStop[];
    error?: string;
  }> {
    try {
      // Delete existing stops
      await supabase.from('intermediate_stops').delete().eq('route_id', routeId);

      if (stops.length === 0) {
        return { success: true, data: [] };
      }

      // Create new stops
      const stopsData = stops.map((stop, index) => ({
        ...stop,
        route_id: routeId,
        stop_order: stop.stop_order || index + 1,
      }));

      const { data: newStops, error: stopsError } = await supabase
        .from('intermediate_stops')
        .insert(stopsData)
        .select();

      if (stopsError) {
        throw new Error(`Failed to manage intermediate stops: ${stopsError.message}`);
      }

      return {
        success: true,
        data: newStops,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Enhanced intermediate stops management
   */
  static async getIntermediateStops(routeId: string): Promise<{
    success: boolean;
    data?: IntermediateStop[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('intermediate_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch intermediate stops'
      };
    }
  }

  static async createIntermediateStop(stopData: Omit<IntermediateStopInsert, 'id'>): Promise<{
    success: boolean;
    data?: IntermediateStop;
    error?: string;
  }> {
    try {
      // Resolve location data before creating
      const resolvedStopData = await LocationResolutionService.resolveStopLocation(stopData);
      
      const { data, error } = await supabase
        .from('intermediate_stops')
        .insert(resolvedStopData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create intermediate stop'
      };
    }
  }

  static async updateIntermediateStop(id: string, updates: IntermediateStopUpdate): Promise<{
    success: boolean;
    data?: IntermediateStop;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('intermediate_stops')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update intermediate stop'
      };
    }
  }

  static async deleteIntermediateStop(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('intermediate_stops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete intermediate stop'
      };
    }
  }

  static async reorderIntermediateStops(routeId: string, stopIds: string[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Update stop_order for each stop
      const updates = stopIds.map((stopId, index) => 
        supabase
          .from('intermediate_stops')
          .update({ stop_order: index + 1 })
          .eq('id', stopId)
          .eq('route_id', routeId)
      );

      await Promise.all(updates);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder intermediate stops'
      };
    }
  }

  /**
   * Manage sightseeing options for a route
   */
  static async manageSightseeingOptions(
    routeId: string,
    options: Omit<SightseeingOptionInsert, 'route_id'>[]
  ): Promise<{
    success: boolean;
    data?: SightseeingOption[];
    error?: string;
  }> {
    try {
      // Delete existing options
      await supabase.from('sightseeing_options').delete().eq('route_id', routeId);

      if (options.length === 0) {
        return { success: true, data: [] };
      }

      // Create new options
      const optionsData = options.map(option => ({
        ...option,
        route_id: routeId,
      }));

      const { data: newOptions, error: optionsError } = await supabase
        .from('sightseeing_options')
        .insert(optionsData)
        .select();

      if (optionsError) {
        throw new Error(`Failed to manage sightseeing options: ${optionsError.message}`);
      }

      return {
        success: true,
        data: newOptions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Enhanced sightseeing options management
   */
  static async getSightseeingOptions(routeId: string): Promise<{
    success: boolean;
    data?: SightseeingOption[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('sightseeing_options')
        .select('*')
        .eq('route_id', routeId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sightseeing options'
      };
    }
  }

  static async createSightseeingOption(optionData: Omit<SightseeingOptionInsert, 'id'>): Promise<{
    success: boolean;
    data?: SightseeingOption;
    error?: string;
  }> {
    try {
      // Resolve location data before creating
      const resolvedOptionData = await LocationResolutionService.resolveSightseeingLocation(optionData);
      
      const { data, error } = await supabase
        .from('sightseeing_options')
        .insert(resolvedOptionData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sightseeing option'
      };
    }
  }

  static async updateSightseeingOption(id: string, updates: SightseeingOptionUpdate): Promise<{
    success: boolean;
    data?: SightseeingOption;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('sightseeing_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update sightseeing option'
      };
    }
  }

  static async deleteSightseeingOption(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('sightseeing_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete sightseeing option'
      };
    }
  }

  /**
   * Generate a route code based on route data
   */
  private static generateRouteCode(formData: TransportRouteFormData): string {
    const start = formData.start_location.substring(0, 3).toUpperCase();
    const end = formData.end_location.substring(0, 3).toUpperCase();
    const type = formData.transfer_type.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${start}-${end}-${type}-${timestamp}`;
  }

  /**
   * Validate country against active countries from public.countries table
   */
  static async validateCountry(countryName: string): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      if (!countryName?.trim()) {
        return { isValid: false, error: 'Country is required' };
      }

      // Get active countries from secure public.countries table
      const response = await CountriesService.getCountriesByStatus('active');
      
      if (!response.success || !response.data || response.data.length === 0) {
        return { 
          isValid: false, 
          error: response.error || 'No active countries available' 
        };
      }

      // Check if the provided country exists in active countries
      const countryExists = response.data.some(
        country => country.name.toLowerCase() === countryName.toLowerCase()
      );

      if (!countryExists) {
        const availableCountries = response.data.map(c => c.name).join(', ');
        return { 
          isValid: false, 
          error: `Invalid country. Available countries: ${availableCountries}` 
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating country:', error);
      return { 
        isValid: false, 
        error: 'Failed to validate country. Please try again.' 
      };
    }
  }

  /**
   * Get list of active countries for form dropdowns
   */
  static async getActiveCountries(): Promise<Tables<'countries'>[]> {
    try {
      const response = await CountriesService.getCountriesByStatus('active');
      if (response.success && response.data) {
        return response.data;
      }
      console.error('Error fetching active countries:', response.error);
      return [];
    } catch (error) {
      console.error('Error fetching active countries:', error);
      return [];
    }
  }

  /**
   * Validate route data before submission
   */
  static async validateRouteData(formData: TransportRouteFormData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.route_name?.trim()) {
      errors.push('Route name is required');
    }
    
    // Validate country using secure public.countries table
    const countryValidation = await this.validateCountry(formData.country);
    if (!countryValidation.isValid) {
      errors.push(countryValidation.error || 'Invalid country');
    }
    if (!formData.transfer_type) {
      errors.push('Transfer type is required');
    }
    if (!formData.start_location?.trim()) {
      errors.push('Start location is required');
    }
    if (!formData.start_location_full_name?.trim()) {
      errors.push('Start location full name is required');
    }
    if (!formData.end_location?.trim()) {
      errors.push('End location is required');
    }
    if (!formData.end_location_full_name?.trim()) {
      errors.push('End location full name is required');
    }

    // Transfer type validation
    const validTransferTypes = ['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'];
    if (formData.transfer_type && !validTransferTypes.includes(formData.transfer_type)) {
      errors.push('Invalid transfer type');
    }

    // Intermediate stops validation for Multi-Stop routes
    if (formData.transfer_type === 'Multi-Stop') {
      if (!formData.intermediate_stops || formData.intermediate_stops.length === 0) {
        errors.push('Multi-Stop routes must have at least one intermediate stop');
      }
    }

    // Sightseeing options validation
    if (formData.enable_sightseeing && formData.sightseeing_options) {
      formData.sightseeing_options.forEach((option, index) => {
        if (!option.location?.trim()) {
          errors.push(`Sightseeing option ${index + 1}: Location is required`);
        }
        if (option.adult_price !== undefined && option.adult_price < 0) {
          errors.push(`Sightseeing option ${index + 1}: Adult price cannot be negative`);
        }
        if (option.child_price !== undefined && option.child_price < 0) {
          errors.push(`Sightseeing option ${index + 1}: Child price cannot be negative`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get route statistics
   */
  static async getRouteStatistics(): Promise<{
    success: boolean;
    data?: {
      totalRoutes: number;
      routesByTransferType: Record<string, number>;
      routesByCountry: Record<string, number>;
      routesWithSightseeing: number;
      routesWithIntermediateStops: number;
    };
    error?: string;
  }> {
    try {
      // Auth guard: avoid unauthenticated calls to protected tables
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        return {
          success: true,
          data: {
            totalRoutes: 0,
            routesByTransferType: {},
            routesByCountry: {},
            routesWithSightseeing: 0,
            routesWithIntermediateStops: 0
          }
        };
      }

      // Get total routes
      const { count: totalRoutes, error: countError } = await supabase
        .from('transport_routes')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to get route count: ${countError.message}`);
      }

      // Get routes by transfer type
      const { data: transferTypeData, error: transferTypeError } = await supabase
        .from('transport_routes')
        .select('transfer_type');

      if (transferTypeError) {
        throw new Error(`Failed to get transfer type data: ${transferTypeError.message}`);
      }

      // Get routes by country
      const { data: countryData, error: countryError } = await supabase
        .from('transport_routes')
        .select('country');

      if (countryError) {
        throw new Error(`Failed to get country data: ${countryError.message}`);
      }

      // Get routes with sightseeing
      const { count: routesWithSightseeing, error: sightseeingError } = await supabase
        .from('transport_routes')
        .select('*', { count: 'exact', head: true })
        .eq('enable_sightseeing', true);

      if (sightseeingError) {
        throw new Error(`Failed to get sightseeing count: ${sightseeingError.message}`);
      }

      // Get routes with intermediate stops
      const { data: routesWithStops, error: stopsError } = await supabase
        .from('intermediate_stops')
        .select('route_id');

      if (stopsError) {
        throw new Error(`Failed to get intermediate stops data: ${stopsError.message}`);
      }

      // Process data
      const routesByTransferType = transferTypeData.reduce((acc, route) => {
        acc[route.transfer_type] = (acc[route.transfer_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const routesByCountry = countryData.reduce((acc, route) => {
        // Add null check for country field to prevent TypeError
        const country = route.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const uniqueRoutesWithStops = new Set(routesWithStops.map(stop => stop.route_id)).size;

      return {
        success: true,
        data: {
          totalRoutes: totalRoutes || 0,
          routesByTransferType,
          routesByCountry,
          routesWithSightseeing: routesWithSightseeing || 0,
          routesWithIntermediateStops: uniqueRoutesWithStops,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}