import { supabase } from '@/integrations/supabase/client';
import { Target as UITarget } from '@/types/staff';

// The generated Supabase types don't yet include the new tables.
// Use a lightly-typed client to avoid union-narrowing errors while we wire functionality.
const sb = supabase as any;

export type StaffTargetRow = {
  id: string;
  staff_id: string;
  name: string;
  type: string;
  value: number;
  achieved: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
  status: 'active' | 'completed' | 'overdue';
  created_at?: string;
  updated_at?: string;
};

const mapUIToRow = (staffId: string, t: UITarget): Omit<StaffTargetRow, 'id'> => ({
  staff_id: staffId,
  name: t.name ?? 'Target',
  type: t.type ?? 'revenue',
  value: Number(t.value ?? 0),
  achieved: Number(t.achieved ?? 0),
  period: (t.period as any) ?? 'monthly',
  start_date: t.startDate ?? new Date().toISOString().slice(0, 10),
  end_date: t.endDate ?? new Date().toISOString().slice(0, 10),
  status: (t.status as any) ?? 'active',
});

const mapRowToUI = (r: StaffTargetRow): UITarget => ({
  id: r.id,
  name: r.name,
  type: r.type as any,
  value: r.value,
  achieved: r.achieved,
  period: r.period as any,
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status as any,
});

export const staffTargetService = {
  async listTargetsByStaff(staffId: string) {
    const { data, error } = await sb
      .from('staff_targets')
      .select('*')
      .eq('staff_id', staffId)
      .order('start_date', { ascending: true });
    if (error) {
      console.warn('Failed to load targets', error);
      return { data: [] as UITarget[], error };
    }
    return { data: ((data || []) as StaffTargetRow[]).map(mapRowToUI), error: null };
  },

  async replaceTargetsForStaff(staffId: string, targets: UITarget[]) {
    // Replace strategy: delete all then insert current list
    const del = await sb.from('staff_targets').delete().eq('staff_id', staffId);
    if (del.error) {
      console.warn('Failed to delete prior targets', del.error);
      return { data: null, error: del.error };
    }
    if (!targets || targets.length === 0) return { data: [], error: null };
    const rows = targets.map((t) => mapUIToRow(staffId, t));
    const { data, error } = await sb.from('staff_targets').insert(rows).select();
    if (error) {
      console.warn('Failed to insert targets', error);
      return { data: null, error };
    }
    return { data, error: null };
  },

  async createTarget(staffId: string, target: UITarget) {
    const row = mapUIToRow(staffId, target);
    const { data, error } = await sb.from('staff_targets').insert(row).select().single();
    return { data, error };
  },

  async updateTarget(id: string, updates: Partial<UITarget>) {
    const normalized: any = {};
    if (updates.name != null) normalized.name = updates.name;
    if (updates.type != null) normalized.type = updates.type;
    if (updates.value != null) normalized.value = updates.value;
    if (updates.achieved != null) normalized.achieved = updates.achieved;
    if (updates.period != null) normalized.period = updates.period;
    if (updates.startDate != null) normalized.start_date = updates.startDate;
    if (updates.endDate != null) normalized.end_date = updates.endDate;
    if (updates.status != null) normalized.status = updates.status;
    const { data, error } = await sb.from('staff_targets').update(normalized).eq('id', id).select().single();
    return { data, error };
  },

  async deleteTarget(id: string) {
    const { error } = await sb.from('staff_targets').delete().eq('id', id);
    return { error };
  },
};