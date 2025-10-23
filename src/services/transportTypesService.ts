import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Transport Types service using admin client to bypass RLS
export const listTransportTypes = async (filters?: {
  active?: boolean;
  category?: string;
}) => {
  let query = supabaseAdmin
    .from('transport_types')
    .select('*')
    .order('name', { ascending: true });

  if (filters?.active !== undefined) {
    query = query.eq('active', filters.active);
  }
  if (filters?.category) {
    query = query.ilike('category', filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Tables<'transport_types'>[];
};

export const createTransportType = async (
  payload: TablesInsert<'transport_types'>
) => {
  const { data, error } = await supabaseAdmin
    .from('transport_types')
    .insert({
      name: payload.name,
      category: payload.category,
      seating_capacity: payload.seating_capacity ?? 0,
      luggage_capacity: payload.luggage_capacity ?? 0,
      active: payload.active ?? true,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Tables<'transport_types'>;
};

export const updateTransportType = async (
  id: string,
  payload: TablesUpdate<'transport_types'>
) => {
  const { data, error } = await supabaseAdmin
    .from('transport_types')
    .update({
      name: payload.name,
      category: payload.category,
      seating_capacity: payload.seating_capacity,
      luggage_capacity: payload.luggage_capacity,
      active: payload.active,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Tables<'transport_types'>;
};

export const deleteTransportType = async (id: string) => {
  const { error } = await supabaseAdmin
    .from('transport_types')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const toggleTransportTypeActive = async (id: string, active: boolean) => {
  const { data, error } = await supabaseAdmin
    .from('transport_types')
    .update({ active })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Tables<'transport_types'>;
};

// Helpers for mapping between UI and DB fields
export function mapTransportTypeRowToUI(
  row: Tables<'transport_types'>
): {
  id: string;
  name: string;
  category: string;
  seatingCapacity: number;
  luggageCapacity: number;
  active: boolean;
} {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    seatingCapacity: row.seating_capacity,
    luggageCapacity: row.luggage_capacity,
    active: row.active,
  };
}

export function mapTransportTypeUIToInsert(ui: {
  name: string;
  category: string;
  seatingCapacity: number;
  luggageCapacity: number;
  active?: boolean;
}): TablesInsert<'transport_types'> {
  return {
    name: ui.name,
    category: ui.category,
    seating_capacity: ui.seatingCapacity,
    luggage_capacity: ui.luggageCapacity,
    active: ui.active ?? true,
  };
}

export function mapTransportTypeUIToUpdate(ui: {
  id: string;
  name: string;
  category: string;
  seatingCapacity: number;
  luggageCapacity: number;
  active: boolean;
}): TablesUpdate<'transport_types'> {
  return {
    name: ui.name,
    category: ui.category,
    seating_capacity: ui.seatingCapacity,
    luggage_capacity: ui.luggageCapacity,
    active: ui.active,
  };
}

// Alias for backward compatibility
export const mapUIToTransportTypeRow = mapTransportTypeUIToUpdate;