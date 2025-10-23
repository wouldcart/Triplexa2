import { supabase } from '@/lib/supabaseClient';

export interface TransportRouteDetails {
  id: string;
  route_code?: string | null;
  route_name?: string | null;
  country?: string | null;
  transfer_type?: string | null;
  start_location?: string | null;
  start_location_full_name?: string | null;
  end_location?: string | null;
  end_location_full_name?: string | null;
  duration?: string | null;
  distance?: number | null;
  notes?: string | null;
  status?: string | null;
  vehicleTypes: Array<any>;
  luggageCapacity: Array<any>;
  stops: Array<any>;
  sightseeing: Array<any>;
  [key: string]: any;
}

// Safely parse potential JSON arrays (stringified or already arrays)
function parseJsonArraySafely(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Simple in-memory cache for location full names to reduce duplicate lookups
const locationNameCache: Record<string, string> = {};

async function getLocationFullName(code: string | null | undefined): Promise<string | null> {
  if (!code) return null;
  const cached = locationNameCache[code];
  if (cached) return cached;
  const { data, error } = await supabase
    .from('location_codes')
    .select('code, full_name')
    .eq('code', code)
    .maybeSingle();
  if (error) return null;
  const name = (data?.full_name as string | undefined) || null;
  if (name) locationNameCache[code] = name;
  return name;
}

// Fetch a single transport route with parsed JSON fields and related tables
export async function getTransportRouteDetails(route_id: string): Promise<TransportRouteDetails> {
  // Get main route
  const { data: routeData, error: routeError } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('id', route_id)
    .single();

  if (routeError) throw routeError;

  // Parse JSON fields safely, accounting for differing schema keys and TypeScript table typings
  const raw = (routeData as Record<string, any>) || {};
  const vehicleTypes = parseJsonArraySafely(
    raw.vehicle_types ?? raw.transport_types ?? raw.transport_types_data
  );
  const luggageCapacity = parseJsonArraySafely(
    raw.luggage_capacity ?? raw.luggageCapacity
  );

  // Get intermediate stops ordered by stop_order
  const { data: stops, error: stopsError } = await supabase
    .from('intermediate_stops')
    .select('*')
    .eq('route_id', route_id)
    .order('stop_order', { ascending: true });

  if (stopsError) throw stopsError;

  // Get sightseeing options
  const { data: sightseeing, error: sightseeingError } = await supabase
    .from('sightseeing_options')
    .select('*')
    .eq('route_id', route_id);

  if (sightseeingError) throw sightseeingError;

  // Resolve full names for start and end locations via location_codes
  const [startFullName, endFullName] = await Promise.all([
    getLocationFullName(raw.start_location),
    getLocationFullName(raw.end_location),
  ]);

  return {
    ...routeData,
    start_location_full_name: startFullName ?? null,
    end_location_full_name: endFullName ?? null,
    vehicleTypes,
    luggageCapacity,
    stops: stops || [],
    sightseeing: sightseeing || [],
  } as TransportRouteDetails;
}