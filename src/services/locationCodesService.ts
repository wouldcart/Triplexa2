import { adminSupabase as supabaseAdmin, isAdminClientConfigured, supabase } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LocationCodeRow = Tables<'location_codes'>;
export type LocationCodeInsert = TablesInsert<'location_codes'>;
export type LocationCodeUpdate = TablesUpdate<'location_codes'>;

type ListFilters = {
  search?: string;
  country?: string;
  status?: string;
  category?: string;
};

const table = 'location_codes';

export const listLocationCodes = async (filters: ListFilters = {}) => {
  const client = isAdminClientConfigured ? supabaseAdmin : supabase;
  let query = client.from<LocationCodeRow>(table).select('*').order('code', { ascending: true });

  if (filters.country && filters.country !== 'All') {
    query = query.eq('country', filters.country);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }
  if (filters.search) {
    // Basic ILIKE across code and full_name
    const s = `%${filters.search}%`;
    query = query.or(`code.ilike.${s},full_name.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createLocationCode = async (payload: Omit<LocationCodeInsert, 'id' | 'created_at' | 'updated_at'>) => {
  const client = isAdminClientConfigured ? supabaseAdmin : supabase;
  const now = new Date().toISOString();
  const insertData: LocationCodeInsert = { ...payload, status: payload.status ?? 'active', created_at: now, updated_at: now };
  const { data, error } = await client.from<LocationCodeRow>(table).insert(insertData).select('*').single();
  if (error) throw error;
  return data;
};

export const updateLocationCode = async (id: string, updates: LocationCodeUpdate) => {
  const client = isAdminClientConfigured ? supabaseAdmin : supabase;
  const { data, error } = await client
    .from<LocationCodeRow>(table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const deleteLocationCode = async (id: string) => {
  const client = isAdminClientConfigured ? supabaseAdmin : supabase;
  const { error } = await client.from<LocationCodeRow>(table).delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const toggleLocationCodeStatus = async (id: string, status: 'active' | 'inactive') => {
  return updateLocationCode(id, { status });
};