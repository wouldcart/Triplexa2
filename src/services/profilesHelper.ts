import { supabase } from '@/lib/supabaseClient';

const sb = supabase as any;

const nameCache = new Map<string, string>();
const roleCache = new Map<string, string>();

export async function resolveProfileNameById(id?: string | null): Promise<string | null> {
  if (!id) return null;
  const cached = nameCache.get(id);
  if (cached) return cached;

  // Try staff_profiles first
  try {
    const { data, error } = await sb
      .from('staff_profiles')
      .select('name,full_name')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const name = (data.full_name as string) || (data.name as string) || null;
      if (name) { nameCache.set(id, name); return name; }
    }
  } catch {}

  // Fallback to profiles table
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('full_name,username,email')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const name = (data.full_name as string) || (data.username as string) || (data.email as string) || null;
      if (name) { nameCache.set(id, name); return name; }
    }
  } catch {}

  // Fallback to public.staff table
  try {
    const { data, error } = await sb
      .from('staff' as any)
      .select('name,email')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const name = (data.name as string) || (data.email as string) || null;
      if (name) { nameCache.set(id, name); return name; }
    }
  } catch {}

  // Secondary fallback: agents table (by user_id, then by id)
  try {
    // Try match by user_id first
    const { data: agentByUser, error: agentUserErr } = await sb
      .from('agents')
      .select('name,agency_name,email,user_id,id')
      .eq('user_id', id)
      .limit(1)
      .maybeSingle();
    if (!agentUserErr && agentByUser) {
      const name = (agentByUser.name as string) || (agentByUser.agency_name as string) || (agentByUser.email as string) || null;
      if (name) { nameCache.set(id, name); return name; }
    }

    // Fallback: match by agent id
    const { data: agentById, error: agentIdErr } = await sb
      .from('agents')
      .select('name,agency_name,email,user_id,id')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!agentIdErr && agentById) {
      const name = (agentById.name as string) || (agentById.agency_name as string) || (agentById.email as string) || null;
      if (name) { nameCache.set(id, name); return name; }
    }
  } catch {}

  return null;
}

export async function resolveProfileRoleById(id?: string | null): Promise<string | null> {
  if (!id) return null;
  const cached = roleCache.get(id);
  if (cached) return cached;

  try {
    const { data, error } = await sb
      .from('staff_profiles')
      .select('role')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const role = (data.role as string) || null;
      if (role) { roleCache.set(id, role); return role; }
    }
  } catch {}

  // Fallback to profiles (if role exists there)
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('role')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const role = (data.role as string) || null;
      if (role) { roleCache.set(id, role); return role; }
    }
  } catch {}

  // Fallback to public.staff role
  try {
    const { data, error } = await sb
      .from('staff' as any)
      .select('role')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      const role = (data.role as string) || null;
      if (role) { roleCache.set(id, role); return role; }
    }
  } catch {}

  // Secondary fallback: agents table implies role 'agent'
  try {
    const { data: agentByUser, error: agentUserErr } = await sb
      .from('agents')
      .select('id,user_id')
      .eq('user_id', id)
      .limit(1)
      .maybeSingle();
    if (!agentUserErr && agentByUser) {
      roleCache.set(id, 'agent');
      return 'agent';
    }

    const { data: agentById, error: agentIdErr } = await sb
      .from('agents')
      .select('id,user_id')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (!agentIdErr && agentById) {
      roleCache.set(id, 'agent');
      return 'agent';
    }
  } catch {}

  return null;
}