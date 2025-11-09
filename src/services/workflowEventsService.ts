import { supabase } from '@/lib/supabaseClient';
import { WorkflowEvent } from '@/types/query';
import { resolveProfileNameById, resolveProfileRoleById } from './profilesHelper';

const sb = supabase as any;

export type WorkflowEventRow = {
  id?: string; // UUID
  enquiry_id: string; // UUID reference to public.enquiries.id
  event_type: WorkflowEvent['type'];
  user_id?: string | null;
  user_name?: string | null;
  user_role?: string | null;
  details?: string | null;
  metadata?: any | null;
  created_at?: string; // timestamptz
};

// Resolve enquiry UUID from business id (enquiry_id)
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

// Resolve a user's display name with source label for debugging
async function resolveUserNameWithSource(userId: string): Promise<{ name: string | null; source: 'staff' | 'profiles' | 'agents' | 'unknown' }> {
  try {
    // Prefer staff table for internal staff
    const { data: staffRow, error: staffErr } = await sb
      .from('staff' as any)
      .select('name,email')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();
    if (!staffErr && staffRow) {
      const name = (staffRow as any)?.name || (staffRow as any)?.email || null;
      return { name, source: 'staff' };
    }
  } catch {}

  try {
    // Fallback to profiles
    const { data: profRow, error: profErr } = await sb
      .from('profiles')
      .select('full_name,name,username,email')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();
    if (!profErr && profRow) {
      const name = (profRow as any)?.full_name || (profRow as any)?.name || (profRow as any)?.username || (profRow as any)?.email || null;
      return { name, source: 'profiles' };
    }
  } catch {}

  try {
    // Fallback to agents: match by user_id then by id
    const { data: agentByUser, error: agentUserErr } = await sb
      .from('agents')
      .select('name,agency_name,email,user_id,id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (!agentUserErr && agentByUser) {
      const name = (agentByUser as any)?.name || (agentByUser as any)?.agency_name || (agentByUser as any)?.email || null;
      return { name, source: 'agents' };
    }

    const { data: agentById, error: agentIdErr } = await sb
      .from('agents')
      .select('name,agency_name,email,user_id,id')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();
    if (!agentIdErr && agentById) {
      const name = (agentById as any)?.name || (agentById as any)?.agency_name || (agentById as any)?.email || null;
      return { name, source: 'agents' };
    }
  } catch {}

  return { name: null, source: 'unknown' };
}

function toUIEvent(row: WorkflowEventRow): WorkflowEvent {
  return {
    id: row.id || '',
    type: row.event_type,
    timestamp: row.created_at || new Date().toISOString(),
    userId: row.user_id || 'unknown',
    userName: row.user_name || 'Unknown',
    userRole: (row.user_role as any) || 'staff',
    details: row.details || '',
    metadata: row.metadata || {},
  };
}

export async function createWorkflowEvent(entry: {
  enquiryBusinessId: string;
  eventType: WorkflowEvent['type'];
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  details?: string | null;
  metadata?: any | null;
}) {
  const enquiryUuid = await resolveEnquiryUuid(entry.enquiryBusinessId);
  if (!enquiryUuid) return { error: new Error('Enquiry not found for business id: ' + entry.enquiryBusinessId) };

  let userName = entry.userName ?? null;
  let userRole = entry.userRole ?? null;
  let userNameSource: 'staff' | 'profiles' | 'agents' | 'unknown' | undefined;
  const userIdStr = typeof entry.userId === 'string' ? String(entry.userId) : '';
  const isSystemAuto = userIdStr && ['system', 'system-auto'].includes(userIdStr.toLowerCase());
  if (isSystemAuto) {
    userName = userName || 'System';
    userRole = userRole || 'system' as any;
  }
  if (!userName && entry.userId) {
    try {
      const { name, source } = await resolveUserNameWithSource(entry.userId);
      userName = name as any;
      userNameSource = source;
    } catch {}
  }
  if (!userRole && entry.userId) {
    try { userRole = await resolveProfileRoleById(entry.userId) as any; } catch {}
  }

  const meta = { ...(entry.metadata || {}) };
  if (userNameSource && !meta.userNameSource) meta.userNameSource = userNameSource;
  // Normalize assignment rule presence on assigned events
  if (entry.eventType === 'assigned') {
    const ruleApplied = meta.rule_applied || meta.reason || null;
    if (ruleApplied && !meta.assignmentRule) meta.assignmentRule = ruleApplied;
    // Provide assignedByName for UI decoding when possible
    const assignedByStr = typeof meta.assignedBy === 'string' ? String(meta.assignedBy) : '';
    if (assignedByStr && !meta.assignedByName) {
      if (['system', 'system-auto'].includes(assignedByStr.toLowerCase())) {
        meta.assignedByName = 'System';
      } else {
        try { meta.assignedByName = await resolveProfileNameById(assignedByStr) as any; } catch {}
      }
    }
    // Fill assignedToName if missing
    const assignedToStr = typeof meta.assignedTo === 'string' ? String(meta.assignedTo) : '';
    if (assignedToStr && !meta.assignedToName) {
      try { meta.assignedToName = await resolveProfileNameById(assignedToStr) as any; } catch {}
    }
  }

  const payload: WorkflowEventRow = {
    enquiry_id: enquiryUuid,
    event_type: entry.eventType,
    user_id: entry.userId ?? null,
    user_name: userName ?? null,
    user_role: userRole ?? null,
    details: entry.details ?? null,
    metadata: meta ?? null,
  };

  const { error } = await sb.from('enquiry_workflow_events').insert(payload);
  return { error: error || null };
}

export async function listWorkflowEventsByEnquiryBusinessId(enquiryBusinessId: string, limit = 20) {
  const enquiryUuid = await resolveEnquiryUuid(enquiryBusinessId);
  if (!enquiryUuid) return { data: [], error: new Error('Enquiry not found for business id: ' + enquiryBusinessId) };

  const { data, error } = await sb
    .from('enquiry_workflow_events')
    .select('id,enquiry_id,event_type,user_id,user_name,user_role,details,metadata,created_at')
    .eq('enquiry_id', enquiryUuid)
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = (data || []) as WorkflowEventRow[];
  const uiEvents: WorkflowEvent[] = await Promise.all(rows.map(async (row) => {
    let userName = row.user_name;
    let userRole = row.user_role;
    const userIdStr = typeof row.user_id === 'string' ? String(row.user_id) : '';
    const isSystemAuto = userIdStr && ['system', 'system-auto'].includes(userIdStr.toLowerCase());
    if (!userName && isSystemAuto) userName = 'System' as any;
    if (!userRole && isSystemAuto) userRole = 'system' as any;
    if (!userName && row.user_id) {
      try { userName = await resolveProfileNameById(row.user_id) as any; } catch {}
    }
    if (!userRole && row.user_id) {
      try { userRole = await resolveProfileRoleById(row.user_id) as any; } catch {}
    }

    // Enrich metadata for decoding
    const meta = { ...(row.metadata || {}) };
    if (row.event_type === 'assigned') {
      const ruleApplied = meta.rule_applied || meta.reason || null;
      if (ruleApplied && !meta.assignmentRule) meta.assignmentRule = ruleApplied;
      const assignedByStr = typeof meta.assignedBy === 'string' ? String(meta.assignedBy) : '';
      if (assignedByStr && !meta.assignedByName) {
        if (['system', 'system-auto'].includes(assignedByStr.toLowerCase())) {
          meta.assignedByName = 'System';
        } else {
          try { meta.assignedByName = await resolveProfileNameById(assignedByStr) as any; } catch {}
        }
      }
      const assignedToStr = typeof meta.assignedTo === 'string' ? String(meta.assignedTo) : '';
      if (assignedToStr && !meta.assignedToName) {
        try { meta.assignedToName = await resolveProfileNameById(assignedToStr) as any; } catch {}
      }
    }

    return toUIEvent({ ...row, user_name: userName || row.user_name, user_role: userRole || row.user_role, metadata: meta });
  }));

  return { data: uiEvents, error: error || null };
}