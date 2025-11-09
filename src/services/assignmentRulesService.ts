import { supabase } from '@/lib/supabaseClient';

// Database row shape for public.assignment_rules
export interface DBAssignmentRule {
  id: string; // uuid
  name: string;
  rule_type: string; // e.g., 'agent-staff-relationship', 'expertise-match'
  priority: number;
  enabled: boolean | null; // nullable in DB, default true
  conditions: any | null; // jsonb
  created_at?: string;
  updated_at?: string;
}

// List rules ordered by priority
export async function listAssignmentRules(): Promise<{ data: DBAssignmentRule[]; error: any | null }> {
  try {
    const { data, error } = await (supabase as any)
      .from('assignment_rules')
      .select('*')
      .order('priority', { ascending: true });
    return { data: (data || []) as DBAssignmentRule[], error: error || null };
  } catch (error) {
    return { data: [], error };
  }
}

// Update rule enabled state
export async function updateAssignmentRuleEnabled(id: string, enabled: boolean): Promise<{ data: DBAssignmentRule | null; error: any | null }> {
  try {
    const { data, error } = await (supabase as any)
      .from('assignment_rules')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    return { data: (data || null) as DBAssignmentRule | null, error: error || null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create a new rule
export async function createAssignmentRule(payload: Omit<DBAssignmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: DBAssignmentRule | null; error: any | null }> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from('assignment_rules')
      .insert({
        name: payload.name,
        rule_type: payload.rule_type,
        priority: payload.priority,
        enabled: payload.enabled ?? true,
        conditions: payload.conditions ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .maybeSingle();
    return { data: (data || null) as DBAssignmentRule | null, error: error || null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update rule properties
export async function updateAssignmentRule(id: string, patch: Partial<DBAssignmentRule>): Promise<{ data: DBAssignmentRule | null; error: any | null }> {
  try {
    const { data, error } = await (supabase as any)
      .from('assignment_rules')
      .update({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.rule_type !== undefined ? { rule_type: patch.rule_type } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
        ...(patch.conditions !== undefined ? { conditions: patch.conditions } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    return { data: (data || null) as DBAssignmentRule | null, error: error || null };
  } catch (error) {
    return { data: null, error };
  }
}

// Delete a rule
export async function deleteAssignmentRule(id: string): Promise<{ error: any | null }> {
  try {
    const { error } = await (supabase as any)
      .from('assignment_rules')
      .delete()
      .eq('id', id);
    return { error: error || null };
  } catch (error) {
    return { error };
  }
}

// Bulk update priorities
export async function reorderAssignmentRules(updates: { id: string; priority: number }[]): Promise<{ error: any | null }> {
  try {
    // Perform updates sequentially to avoid JSON casting issues
    for (const u of updates) {
      const { error } = await (supabase as any)
        .from('assignment_rules')
        .update({ priority: u.priority, updated_at: new Date().toISOString() })
        .eq('id', u.id);
      if (error) return { error };
    }
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Soft check for table accessibility
export async function isAssignmentRulesTableAccessible(): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('assignment_rules')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Get whether a specific rule type is enabled; returns null if table inaccessible
export async function getRuleEnabledByType(ruleType: string): Promise<boolean | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('assignment_rules')
      .select('enabled,rule_type')
      .eq('rule_type', ruleType)
      .maybeSingle();
    if (error) return null;
    // Default to true if null to preserve legacy behavior unless explicitly disabled
    return Boolean((data as any)?.enabled ?? true);
  } catch {
    return null;
  }
}

// Batch fetch enabled flags for a set of rule types
export async function getRulesEnabledMap(ruleTypes: string[]): Promise<Record<string, boolean | null>> {
  const result: Record<string, boolean | null> = {};
  try {
    const { data, error } = await (supabase as any)
      .from('assignment_rules')
      .select('rule_type,enabled');
    if (error) {
      ruleTypes.forEach(rt => { result[rt] = null; });
      return result;
    }
    const rows = Array.isArray(data) ? (data as any[]) : [];
    const map = new Map<string, boolean>();
    rows.forEach(r => {
      const rt = String((r as any)?.rule_type || '');
      const en = Boolean((r as any)?.enabled ?? true);
      map.set(rt, en);
    });
    ruleTypes.forEach(rt => { result[rt] = map.has(rt) ? map.get(rt)! : null; });
    return result;
  } catch {
    ruleTypes.forEach(rt => { result[rt] = null; });
    return result;
  }
}