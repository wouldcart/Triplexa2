import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';
import { userTrackingService } from './userTrackingService';
import { locationResolutionService, resolveTransportRouteLocations } from './locationResolutionService';

// Transport Routes service using admin client to bypass RLS
export const listTransportRoutes = async (filters?: {
  country?: string;
  transferType?: string;
}) => {
  let query = supabaseAdmin
    .from('transport_routes')
    .select('*')
    // Prefer ordering by start_location to support live schema
    .order('start_location', { ascending: true });

  if (filters?.country) {
    query = query.eq('country', filters.country);
  }
  if (filters?.transferType) {
    query = query.ilike('transfer_type', filters.transferType);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Resolve location codes to full names for all routes
  const routes = (data || []) as Tables<'transport_routes'>[];
  const resolvedRoutes = await Promise.all(
    routes.map(route => resolveTransportRouteLocations(route))
  );
  
  return resolvedRoutes;
};

export const createTransportRoute = async (
  // Accept a flexible payload to support differing live schemas
  payload: Partial<TablesInsert<'transport_routes'>> & {
    start_location?: string;
    end_location?: string;
    isActive?: boolean;
  }
) => {
  // Build a minimal insert payload compatible with live `transport_routes`
  const startLoc = (payload as any).start_location;
  const endLoc = (payload as any).end_location;
  const routeName = (payload as any).name ??
    (startLoc && endLoc ? `${startLoc} to ${endLoc}` : 'Route');
  // Ensure route_code is always non-null to satisfy NOT NULL constraint
  // Prefer meaningful code from start/end, otherwise generate a safe fallback
  const routeCode = (payload as any).route_code ??
    (startLoc && endLoc
      ? `${String(startLoc).toUpperCase()}-${String(endLoc).toUpperCase()}`
      : `RT-${Date.now().toString().slice(-6)}`);
  const transportEntries = (payload as any).transport_entries;

  // Get user tracking data for creation
  const trackingData = userTrackingService.getCreateTrackingData();

  // Handle status conversion: boolean isActive -> text status and boolean is_active
  const isActive = (payload as any).isActive ?? ((payload as any).status === 'active' || (payload as any).status !== 'inactive');
  const textStatus = isActive ? 'active' : 'inactive';

  // Resolve location codes to full names
  const startLocationCode = (payload as any).start_location_code ?? startLoc;
  const endLocationCode = (payload as any).end_location_code ?? endLoc;
  
  // Ensure we always have a non-null value for full names to satisfy NOT NULL constraint
  let startLocationFullName = (payload as any).start_location_full_name;
  let endLocationFullName = (payload as any).end_location_full_name;
  
  // If full names are not provided in payload, try to resolve them
  if (!startLocationFullName && startLocationCode) {
    startLocationFullName = await locationResolutionService.getLocationFullName(startLocationCode);
  }
  
  if (!endLocationFullName && endLocationCode) {
    endLocationFullName = await locationResolutionService.getLocationFullName(endLocationCode);
  }
  
  // If full names couldn't be resolved, use the location codes as fallback
  if (!startLocationFullName && startLocationCode) {
    startLocationFullName = startLocationCode;
  } else if (!startLocationFullName) {
    // Last resort fallback - use a placeholder that satisfies NOT NULL constraint
    startLocationFullName = "Unknown Start Location";
  }
  
  if (!endLocationFullName && endLocationCode) {
    endLocationFullName = endLocationCode;
  } else if (!endLocationFullName) {
    // Last resort fallback - use a placeholder that satisfies NOT NULL constraint
    endLocationFullName = "Unknown End Location";
  }

  // Extract coordinates from payload if available
  const startCoordinates = (payload as any).start_coordinates || null;
  const endCoordinates = (payload as any).end_coordinates || null;
  
  // Extract vehicle types from payload
  const vehicleTypes = (payload as any).vehicle_types || transportEntries || null;
  
  // Process intermediate stops to ensure they have full_name values
  const intermediateStops = (payload as any).intermediate_stops || [];
  if (intermediateStops.length > 0) {
    for (let i = 0; i < intermediateStops.length; i++) {
      const stop = intermediateStops[i];
      if (stop.location_code && !stop.full_name) {
        const fullName = await locationResolutionService.getLocationFullName(stop.location_code);
        intermediateStops[i].full_name = fullName || stop.location_code;
      }
      // Ensure stop_order is set
      if (intermediateStops[i].stop_order === undefined) {
        intermediateStops[i].stop_order = i + 1;
      }
    }
  }
  
  // Process sightseeing options
  const sightseeingOptions = (payload as any).sightseeing_options || (payload as any).sightseeingOptions || [];
  
  const insertPayload: any = {
    // Basic route information
    country: (payload as any).country,
    route_name: (payload as any).route_name || routeName,
    notes: (payload as any).notes,
    route_code: (payload as any).route_code || routeCode,
    transfer_type: (payload as any).transfer_type,
    vehicle_types: vehicleTypes,
    
    // Location information
    start_location: startLoc,
    end_location: endLoc,
    start_location_code: startLocationCode,
    end_location_code: endLocationCode,
    start_location_full_name: startLocationFullName,
    end_location_full_name: endLocationFullName,
    start_coordinates: startCoordinates,
    end_coordinates: endCoordinates,
    
    // Additional route details
    distance: (payload as any).distance,
    duration: (payload as any).duration,
    enable_sightseeing: (payload as any).enable_sightseeing,
    
    // Status information
    status: textStatus,
    is_active: isActive,
    
    // Related data
    transport_entries: transportEntries,
    sightseeing_options: sightseeingOptions,
    transfer_method_notes: (payload as any).transfer_method_notes || (payload as any).transferMethodNotes,
    description: (payload as any).description,
    route_segments: (payload as any).route_segments,
    intermediate_stops: intermediateStops,
    sightseeing_locations: (payload as any).sightseeing_locations,
    
    // User tracking fields
    created_by_user: trackingData.createdByUser,
    updated_by_user: trackingData.updatedByUser,
    created_by: trackingData.createdBy,
    updated_by: trackingData.updatedBy,
  };
  
  // Attempt insert; if PostgREST complains about unknown columns, drop them and retry
  let attemptPayload = { ...insertPayload };
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseAdmin
      .from('transport_routes')
      .insert(attemptPayload)
      .select('*')
      .single();
    if (!error) {
      const routeId = data.id;
      
      // Insert intermediate stops if they exist
      if (intermediateStops && intermediateStops.length > 0) {
        const stopsToInsert = intermediateStops.map((stop: any, index: number) => ({
          transport_route_id: routeId,
          stop_order: stop.stop_order ?? index + 1,
          location_code: stop.location_code,
          full_name: stop.full_name,
          ...userTrackingService.getCreateTrackingData(),
        }));

        const { error: stopsError } = await supabaseAdmin
          .from('intermediate_stops')
          .insert(stopsToInsert);

        if (stopsError) {
          console.error('Error inserting intermediate stops:', stopsError);
          // Optionally, you might want to roll back the route creation or handle the error appropriately
        }
      }
      
      // Insert sightseeing options if they exist
      if (sightseeingOptions && sightseeingOptions.length > 0) {
        const optionsToInsert = sightseeingOptions.map((option: any) => ({
          transport_route_id: routeId,
          location: option.location,
          adult_price: option.adultPrice,
          child_price: option.childPrice,
          description: option.description,
          additional_charges: option.additionalCharges,
          ...userTrackingService.getCreateTrackingData(),
        }));

        const { error: optionsError } = await supabaseAdmin
          .from('sightseeing_options')
          .insert(optionsToInsert);

        if (optionsError) {
          console.error('Error inserting sightseeing options:', optionsError);
          // Optionally, you might want to roll back the route creation or handle the error appropriately
        }
      }
      
      // Insert transport types if they exist
      const transportTypes = (payload as any).transport_types || [];
      if (transportTypes && transportTypes.length > 0) {
        const transportRouteTypes = transportTypes.map((tt: any) => ({
          transport_route_id: routeId,
          transport_type_id: tt.id,
          price: tt.price,
          duration: tt.duration,
          ...userTrackingService.getCreateTrackingData(),
        }));

        const { error: ttError } = await supabaseAdmin
          .from('transport_route_transport_type')
          .insert(transportRouteTypes);

        if (ttError) {
          console.error('Error inserting transport route types:', ttError);
        }
      }
      
      // Resolve location codes in the returned data
      const resolvedData = await resolveTransportRouteLocations(data);
      return resolvedData as Tables<'transport_routes'>;
    }
    const msg = String(error.message || '');
    const m1 = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column of 'transport_routes'/);
    const m2 = msg.match(/column\s+transport_routes\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i);
    const unknownCol = (m1 && m1[1]) || (m2 && m2[1]);
    if (unknownCol && unknownCol in attemptPayload) {
      delete (attemptPayload as any)[unknownCol];
      continue;
    }
    // If we cannot identify an unknown column, surface the error
    throw error;
  }
  // Fallback: perform one last minimal insert
  const { data, error } = await supabaseAdmin
    .from('transport_routes')
    .insert({
      country: (payload as any).country,
      transfer_type: (payload as any).transfer_type,
      start_location: startLoc,
      end_location: endLoc,
      route_code: routeCode,
      route_name: routeName,
      status: (payload as any).status ?? 'active',
    })
    .select('*')
    .single();
  if (error) throw error;
  
  // Resolve location codes in the returned data
  const resolvedData = await resolveTransportRouteLocations(data);
  return resolvedData as Tables<'transport_routes'>;
};

export const updateTransportRoute = async (
  id: string,
  // Accept a flexible payload to support differing live schemas
  payload: Partial<TablesUpdate<'transport_routes'>> & {
    start_location?: string;
    end_location?: string;
    isActive?: boolean;
  }
) => {
  // Build a minimal update payload compatible with live `transport_routes`
  const updatePayload: any = {};

  // Get user tracking data for updates
  const trackingData = userTrackingService.getUpdateTrackingData();

  // Handle status conversion: boolean isActive -> text status and boolean is_active
  if ((payload as any).isActive !== undefined) {
    const isActive = (payload as any).isActive;
    updatePayload.is_active = isActive;
    updatePayload.status = isActive ? 'active' : 'inactive'; // Keep legacy status in sync
  } else if ((payload as any).status !== undefined) {
    const textStatus = (payload as any).status;
    updatePayload.status = textStatus;
    updatePayload.is_active = textStatus === 'active'; // Convert text status to boolean
  }

  // Only include fields that are provided in the payload
  if ((payload as any).country !== undefined) updatePayload.country = (payload as any).country;
  if ((payload as any).transfer_type !== undefined) updatePayload.transfer_type = (payload as any).transfer_type;
  if ((payload as any).start_location !== undefined) updatePayload.start_location = (payload as any).start_location;
  if ((payload as any).end_location !== undefined) updatePayload.end_location = (payload as any).end_location;
  
  // Handle location code updates with automatic resolution
  if ((payload as any).start_location_code !== undefined) {
    updatePayload.start_location_code = (payload as any).start_location_code;
    const startLocationFullName = await locationResolutionService.getLocationFullName((payload as any).start_location_code);
    if (startLocationFullName) {
      updatePayload.start_location_full_name = startLocationFullName;
    }
  }
  if ((payload as any).end_location_code !== undefined) {
    updatePayload.end_location_code = (payload as any).end_location_code;
    const endLocationFullName = await locationResolutionService.getLocationFullName((payload as any).end_location_code);
    if (endLocationFullName) {
      updatePayload.end_location_full_name = endLocationFullName;
    }
  }
  
  if ((payload as any).route_code !== undefined) updatePayload.route_code = (payload as any).route_code;
  if ((payload as any).name !== undefined) updatePayload.name = (payload as any).name;
  if ((payload as any).route_name !== undefined) updatePayload.route_name = (payload as any).route_name;
  if ((payload as any).transport_entries !== undefined) updatePayload.transport_entries = (payload as any).transport_entries;
  // Handle sightseeing options and transfer method notes
  if ((payload as any).sightseeing_options !== undefined) updatePayload.sightseeing_options = (payload as any).sightseeing_options;
  if ((payload as any).sightseeingOptions !== undefined) updatePayload.sightseeing_options = (payload as any).sightseeingOptions;
  if ((payload as any).transfer_method_notes !== undefined) updatePayload.transfer_method_notes = (payload as any).transfer_method_notes;
  if ((payload as any).transferMethodNotes !== undefined) updatePayload.transfer_method_notes = (payload as any).transferMethodNotes;
  if ((payload as any).notes !== undefined) updatePayload.notes = (payload as any).notes;
  if ((payload as any).description !== undefined) updatePayload.description = (payload as any).description;
  if ((payload as any).distance !== undefined) updatePayload.distance = (payload as any).distance;
  if ((payload as any).duration !== undefined) updatePayload.duration = (payload as any).duration;
  if ((payload as any).enable_sightseeing !== undefined) updatePayload.enable_sightseeing = (payload as any).enable_sightseeing;
  if ((payload as any).route_segments !== undefined) updatePayload.route_segments = (payload as any).route_segments;
  if ((payload as any).intermediate_stops !== undefined) updatePayload.intermediate_stops = (payload as any).intermediate_stops;
  if ((payload as any).sightseeing_locations !== undefined) updatePayload.sightseeing_locations = (payload as any).sightseeing_locations;

  // Add user tracking fields for updates
  updatePayload.updated_by_user = trackingData.updatedByUser;
  updatePayload.updated_by = trackingData.updatedBy;
  
  // Attempt update with fallback removal of unknown columns
  let attemptPayload = { ...updatePayload };
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseAdmin
      .from('transport_routes')
      .update(attemptPayload)
      .eq('id', id)
      .select('*')
      .single();
    if (!error) {
      const routeId = data.id;

      // If the payload includes intermediate stops, update them (delete and re-insert)
      if ((payload as any).intermediate_stops !== undefined) {
        const intermediateStops = (payload as any).intermediate_stops || [];

        // Process stops to ensure they have full_name and stop_order values
        for (let i = 0; i < intermediateStops.length; i++) {
          const stop = intermediateStops[i];
          if (stop.location_code && !stop.full_name) {
            const fullName = await locationResolutionService.getLocationFullName(stop.location_code);
            intermediateStops[i].full_name = fullName || stop.location_code;
          }
          if (intermediateStops[i].stop_order === undefined) {
            intermediateStops[i].stop_order = i + 1;
          }
        }

        // Delete existing stops and insert the new ones
        await supabaseAdmin.from('intermediate_stops').delete().eq('transport_route_id', routeId);
        if (intermediateStops.length > 0) {
          const stopsToInsert = intermediateStops.map((stop: any) => ({
            transport_route_id: routeId,
            stop_order: stop.stop_order,
            location_code: stop.location_code,
            full_name: stop.full_name,
            ...userTrackingService.getCreateTrackingData(),
          }));
          const { error: stopsError } = await supabaseAdmin.from('intermediate_stops').insert(stopsToInsert);
          if (stopsError) console.error('Error updating intermediate stops:', stopsError);
        }
      }

      // If the payload includes sightseeing options, update them (delete and re-insert)
      if ((payload as any).sightseeing_options !== undefined || (payload as any).sightseeingOptions !== undefined) {
        const sightseeingOptions = (payload as any).sightseeing_options || (payload as any).sightseeingOptions || [];

        // Delete existing options and insert the new ones
        await supabaseAdmin.from('sightseeing_options').delete().eq('transport_route_id', routeId);
        if (sightseeingOptions.length > 0) {
          const optionsToInsert = sightseeingOptions.map((option: any) => ({
            transport_route_id: routeId,
            location: option.location,
            adult_price: option.adultPrice,
            child_price: option.childPrice,
            description: option.description,
            additional_charges: option.additionalCharges,
            ...userTrackingService.getCreateTrackingData(),
          }));
          const { error: optionsError } = await supabaseAdmin.from('sightseeing_options').insert(optionsToInsert);
          if (optionsError) console.error('Error updating sightseeing options:', optionsError);
        }
      }
      
      // If the payload includes transport types, update them (delete and re-insert)
      if ((payload as any).transport_types !== undefined) {
        const transportTypes = (payload as any).transport_types || [];

        // Delete existing types and insert the new ones
        await supabaseAdmin.from('transport_route_transport_type').delete().eq('transport_route_id', routeId);
        if (transportTypes.length > 0) {
          const ttToInsert = transportTypes.map((tt: any) => ({
            transport_route_id: routeId,
            transport_type_id: tt.id,
            price: tt.price,
            duration: tt.duration,
            ...userTrackingService.getCreateTrackingData(),
          }));
          const { error: ttError } = await supabaseAdmin.from('transport_route_transport_type').insert(ttToInsert);
          if (ttError) console.error('Error updating transport route types:', ttError);
        }
      }
      
      // Resolve location codes in the returned data
      const resolvedData = await resolveTransportRouteLocations(data);
      return resolvedData as Tables<'transport_routes'>;
    }
    const msg = String(error.message || '');
    const m1 = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column of 'transport_routes'/);
    const m2 = msg.match(/column\s+transport_routes\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i);
    const unknownCol = (m1 && m1[1]) || (m2 && m2[1]);
    if (unknownCol && unknownCol in attemptPayload) {
      delete (attemptPayload as any)[unknownCol];
      continue;
    }
    throw error;
  }
  // Last resort: minimal update
  const { data, error } = await supabaseAdmin
    .from('transport_routes')
    .update({
      country: (payload as any).country,
      transfer_type: (payload as any).transfer_type,
      start_location: (payload as any).start_location,
      end_location: (payload as any).end_location,
      name: (payload as any).name,
      status: (payload as any).status,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  
  // Resolve location codes in the returned data
  const resolvedData = await resolveTransportRouteLocations(data);
  return resolvedData as Tables<'transport_routes'>;
};

export const deleteTransportRoute = async (id: string) => {
  const { error } = await supabaseAdmin
    .from('transport_routes')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

// Basic mapping to proposal TransportRoute type
export function mapRouteRowToProposalRoute(row: Tables<'transport_routes'>) {
  let price = 0;
  let duration = 'N/A';
  const vt = (row as any).vehicle_types as Json | null;
  const te = (row as any).transport_entries as Json | null;
  const source = Array.isArray(vt) && vt.length > 0 ? vt : Array.isArray(te) ? te : [];
  if (Array.isArray(source) && source.length > 0) {
    const first: any = source[0];
    const p = typeof first?.price === 'number' ? first.price : Number(first?.price);
    price = isNaN(p) ? 0 : p;
    duration = typeof first?.duration === 'string' ? first.duration : duration;
  }

  return {
    id: row.id,
    from: (row as any).start_location_code || (row as any).start_location,
    to: (row as any).end_location_code || (row as any).end_location,
    distance: 0,
    duration,
    transportType: row.transfer_type,
    price,
    // Prefer `name` but fall back to legacy `route_name`
    name: (row as any).name || (row as any).route_name,
    country: row.country,
    code: (row as any).route_code || `${(row as any).start_location}-${(row as any).end_location}`,
    transferType: row.transfer_type,
  };
}