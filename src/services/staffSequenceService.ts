import { supabase } from '@/lib/supabaseClient';

// Relax typing for flexibility across environments
const sb: any = supabase;

const TABLE = 'staff_sequence';

export type StaffSequenceRow = {
  id?: string;
  staff_id: string;
  sequence_order: number;
  auto_assign_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
};

export const StaffSequenceService = {
  fetchSequence: async (): Promise<{ data: StaffSequenceRow[]; error: any }> => {
    const { data, error } = await sb
      .from(TABLE)
      .select('id, staff_id, sequence_order, auto_assign_enabled')
      .order('sequence_order', { ascending: true });
    return { data: data ?? [], error };
  },

  upsertSequence: async (items: StaffSequenceRow[]): Promise<{ data: any; error: any }> => {
    // Determine the current user id to set audit fields
    const { data: authData } = await sb.auth.getUser();
    const currentUserId: string | null = (authData?.user?.id as string) || null;

    // Fetch existing sequence rows for these staff ids to avoid overwriting created_by
    const staffIds = items.map((it) => it.staff_id);
    const { data: existingRows } = await sb
      .from(TABLE)
      .select('staff_id')
      .in('staff_id', staffIds);
    const existingSet = new Set<string>((existingRows || []).map((r: any) => r.staff_id));

    const payload = items.map((it) => {
      const base: any = {
        staff_id: it.staff_id,
        sequence_order: it.sequence_order,
        auto_assign_enabled: it.auto_assign_enabled ?? true,
      };
      if (currentUserId) {
        if (existingSet.has(it.staff_id)) {
          base.updated_by = currentUserId;
          base.updated_at = new Date().toISOString();
        } else {
          base.created_by = currentUserId;
          base.updated_by = currentUserId;
          base.updated_at = new Date().toISOString();
        }
      }
      return base;
    });

    const { data, error } = await sb
      .from(TABLE)
      .upsert(payload, { onConflict: 'staff_id' });
    return { data, error };
  },

  addStaff: async (staffId: string, sequenceOrder: number): Promise<{ data: any; error: any }> => {
    // Get the current user id for audit fields
    const { data: authData } = await sb.auth.getUser();
    const currentUserId: string | null = (authData?.user?.id as string) || null;

    // Check if the staff row already exists
    const { data: existing, error: readErr } = await sb
      .from(TABLE)
      .select('id, staff_id')
      .eq('staff_id', staffId)
      .maybeSingle();

    if (!readErr && existing) {
      // Update existing row: only set updated_by
      const { data, error } = await sb
        .from(TABLE)
        .update({
          sequence_order: sequenceOrder,
          auto_assign_enabled: true,
          ...(currentUserId ? { updated_by: currentUserId, updated_at: new Date().toISOString() } : {}),
        })
        .eq('staff_id', staffId)
        .select();
      return { data, error };
    }

    // Insert new row: set both created_by and updated_by
    const insertPayload: any = {
      staff_id: staffId,
      sequence_order: sequenceOrder,
      auto_assign_enabled: true,
    };
    if (currentUserId) {
      insertPayload.created_by = currentUserId;
      insertPayload.updated_by = currentUserId;
      insertPayload.updated_at = new Date().toISOString();
    }

    const { data, error } = await sb
      .from(TABLE)
      .insert([insertPayload])
      .select();
    return { data, error };
  },

  removeStaff: async (staffId: string): Promise<{ error: any }> => {
    const { error } = await sb
      .from(TABLE)
      .delete()
      .eq('staff_id', staffId);
    return { error };
  },

  reorderSequence: async (orderedStaffIds: string[]): Promise<{ data: any; error: any }> => {
    const { data: authData } = await sb.auth.getUser();
    const currentUserId: string | null = (authData?.user?.id as string) || null;

    // Determine which rows exist to avoid overwriting created_by
    const { data: existingRows } = await sb
      .from(TABLE)
      .select('staff_id')
      .in('staff_id', orderedStaffIds);
    const existingSet = new Set<string>((existingRows || []).map((r: any) => r.staff_id));

    const payload = orderedStaffIds.map((sid, idx) => {
      const base: any = {
        staff_id: sid,
        sequence_order: idx + 1,
        auto_assign_enabled: true,
      };
      if (currentUserId) {
        if (existingSet.has(sid)) {
          base.updated_by = currentUserId;
          base.updated_at = new Date().toISOString();
        } else {
          base.created_by = currentUserId;
          base.updated_by = currentUserId;
          base.updated_at = new Date().toISOString();
        }
      }
      return base;
    });

    const { data, error } = await sb
      .from(TABLE)
      .upsert(payload, { onConflict: 'staff_id' });
    return { data, error };
  },

  updateAutoAssign: async (staffId: string, enabled: boolean): Promise<{ data: any; error: any }> => {
    const { data: authData } = await sb.auth.getUser();
    const currentUserId: string | null = (authData?.user?.id as string) || null;
    const { data, error } = await sb
      .from(TABLE)
      .update({
        auto_assign_enabled: enabled,
        ...(currentUserId ? { updated_by: currentUserId, updated_at: new Date().toISOString() } : {}),
      })
      .eq('staff_id', staffId)
      .select();
    return { data, error };
  },
};

export default StaffSequenceService;