import { supabase } from '@/lib/supabaseClient';

const sb = supabase as any;

export type AssignmentHistoryRow = {
  id?: string; // UUID
  enquiry_id: string; // UUID reference to public.enquiries.id
  staff_id: string; // UUID reference to public.profiles.id
  assigned_by?: string | null; // UUID reference to public.profiles.id
  assigned_at?: string; // timestamptz
  reason?: string | null;
  rule_applied?: string | null;
  is_auto_assigned?: boolean;
};

// Resolve enquiry UUID from business id (enquiry_id) string
async function resolveEnquiryUuid(enquiryBusinessId: string): Promise<string | null> {
  const { data, error } = await sb
    .from('enquiries')
    .select('id')
    .eq('enquiry_id', enquiryBusinessId)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

export async function createAssignmentHistory(entry: {
  enquiryBusinessId: string;
  staffId: string;
  assignedBy?: string | null;
  reason?: string | null;
  ruleApplied?: string | null;
  isAutoAssigned?: boolean;
}) {
  const enquiryUuid = await resolveEnquiryUuid(entry.enquiryBusinessId);
  if (!enquiryUuid) return { error: new Error('Enquiry not found for business id: ' + entry.enquiryBusinessId) };

  const payload: AssignmentHistoryRow = {
    enquiry_id: enquiryUuid,
    staff_id: entry.staffId,
    assigned_by: entry.assignedBy ?? null,
    reason: entry.reason ?? null,
    rule_applied: entry.ruleApplied ?? null,
    is_auto_assigned: !!entry.isAutoAssigned,
  };

  const { error } = await sb.from('assignment_history').insert(payload);
  return { error: error || null };
}

export async function listAssignmentHistoryByEnquiryBusinessId(enquiryBusinessId: string, limit = 10) {
  const enquiryUuid = await resolveEnquiryUuid(enquiryBusinessId);
  if (!enquiryUuid) return { data: [], error: new Error('Enquiry not found for business id: ' + enquiryBusinessId) };

  const { data, error } = await sb
    .from('assignment_history')
    .select('id,enquiry_id,staff_id,assigned_by,assigned_at,reason,rule_applied,is_auto_assigned')
    .eq('enquiry_id', enquiryUuid)
    .order('assigned_at', { ascending: false })
    .limit(limit);

  return { data: (data || []) as AssignmentHistoryRow[], error: error || null };
}

export async function updateAssignmentHistory(id: string, patch: Partial<AssignmentHistoryRow>) {
  const allowed: Partial<AssignmentHistoryRow> = {
    reason: patch.reason,
    rule_applied: patch.rule_applied,
    is_auto_assigned: patch.is_auto_assigned,
  };
  const { error } = await sb.from('assignment_history').update(allowed).eq('id', id);
  return { error: error || null };
}

export async function deleteAssignmentHistory(id: string) {
  const { error } = await sb.from('assignment_history').delete().eq('id', id);
  return { error: error || null };
}

export async function listRecentAssignments(limit = 20) {
  const { data, error } = await sb
    .from('assignment_history')
    .select('id,enquiry_id,staff_id,assigned_by,assigned_at,reason,rule_applied,is_auto_assigned')
    .order('assigned_at', { ascending: false })
    .limit(limit);
  return { data: (data || []) as AssignmentHistoryRow[], error: error || null };
}