import { supabase } from '@/lib/supabaseClient';
import { getEnquiryById, assignEnquiry } from '@/services/enquiriesService';
import { StaffSequenceService } from '@/services/staffSequenceService';
import { getCountryByName, getStaffOperationalCountries } from '@/services/countryMappingService';
import { getRulesEnabledMap } from '@/services/assignmentRulesService';

// Use a relaxed Supabase client type to avoid type overloads
const sb = supabase as any;

export type EligibleStaff = {
  id: string; // Supabase UUID
  name: string;
  active: boolean;
  sequenceOrder: number | null;
  autoAssignEnabled: boolean;
  operationalCountries: string[]; // country names
  workloadCount: number; // active enquiries count for target country
};

// Utility: determine if staff operational countries include the enquiry's country name
function hasCountryMatch(rawOperationalCountries: string[] | null | undefined, countryName: string): boolean {
  const safe = Array.isArray(rawOperationalCountries) ? rawOperationalCountries : [];
  if (safe.length === 0) return false;

  // Try treating raw values as IDs and map to names
  const mappedNamesFromIds = getStaffOperationalCountries(safe);
  const target = getCountryByName(countryName)?.name || countryName;

  if (mappedNamesFromIds.length > 0) {
    return mappedNamesFromIds.some(n => n.toLowerCase() === target.toLowerCase());
  }

  // Fallback: treat raw values as names
  return safe.some(n => n && n.toLowerCase() === target.toLowerCase());
}

// Count workload per staff for the given country (active enquiries)
export async function calculateWorkload(staffId: string, countryName?: string): Promise<number> {
  try {
    let q = sb
      .from('enquiries')
      .select('id,assigned_to,country_name,status', { count: 'exact', head: true })
      .eq('assigned_to', staffId)
      .eq('status', 'assigned');
    if (countryName) q = q.eq('country_name', countryName);
    const { count, error } = await q;
    if (error) return 0;
    return Number(count || 0);
  } catch {
    return 0;
  }
}

// Fetch staff eligible by status + sequence + country match
export async function getEligibleStaff(countryName: string, enforceCountryFilter: boolean = true): Promise<EligibleStaff[]> {
  try {
    const { data: seqRows } = await StaffSequenceService.fetchSequence();
    const sequenceActive = (seqRows || [])
      .filter(r => r.auto_assign_enabled !== false)
      .sort((a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0));
    const seqById = new Map<string, { order: number | null; autoAssignEnabled: boolean }>();
    (sequenceActive || []).forEach(r => {
      seqById.set(String(r.staff_id), { order: Number(r.sequence_order || 0), autoAssignEnabled: r.auto_assign_enabled !== false });
    });

    const ids = Array.from(seqById.keys());
    if (ids.length === 0) return [];

    // Prefer public.staff for operational_countries
    const { data: staffRows, error: staffErr } = await sb
      .from('staff')
      .select('id,name,status,operational_countries')
      .in('id', ids);
    if (staffErr) throw staffErr;

    // Fallback to profiles when staff table is unavailable or incomplete
    let rows = staffRows || [];
    if (!rows || rows.length === 0) {
      const { data: profilesRows } = await sb
        .from('profiles')
        .select('id,name,status,operational_countries')
        .in('id', ids);
      rows = profilesRows || [];
    }

    const eligible: EligibleStaff[] = [];
    for (const r of rows) {
      const uuid = String((r as any)?.id);
      const name = String((r as any)?.name || 'Staff Member');
      const active = String((r as any)?.status || 'active').toLowerCase() === 'active';
      const rawOperational = Array.isArray((r as any)?.operational_countries) ? (r as any)?.operational_countries : [];

      const seq = seqById.get(uuid);
      const inSequence = !!seq && seq.autoAssignEnabled;
      const countryOk = enforceCountryFilter ? hasCountryMatch(rawOperational, countryName) : true;
      if (!active || !inSequence || !countryOk) continue;

      const workloadCount = await calculateWorkload(uuid, enforceCountryFilter ? countryName : undefined);
      const mappedOps = getStaffOperationalCountries(rawOperational);

      eligible.push({
        id: uuid,
        name,
        active,
        sequenceOrder: seq?.order ?? null,
        autoAssignEnabled: inSequence,
        operationalCountries: mappedOps.length > 0 ? mappedOps : rawOperational,
        workloadCount
      });
    }

    // Order by sequence for deterministic behavior in nextRoundRobin
    return eligible.sort((a, b) => (Number(a.sequenceOrder || 0) - Number(b.sequenceOrder || 0)));
  } catch {
    return [];
  }
}

// Agent–Staff Relationship check with eligibility
async function getAgentStaffRelation(agentId: string | null, countryName: string, eligibleIds: string[]): Promise<string | null> {
  if (!agentId || eligibleIds.length === 0) return null;
  try {
    const { data, error } = await sb
      .from('agent_staff_assignments')
      .select('agent_id,staff_id')
      .eq('agent_id', agentId)
      .in('staff_id', eligibleIds)
      .limit(1);
    if (error) return null;
    if (Array.isArray(data) && data.length > 0) {
      const staffId = String((data[0] as any)?.staff_id);
      return staffId || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Sequence-only helpers (strict: only Staff Sequence with auto_assign_enabled = TRUE)
async function getStrictSequenceOrderedIds(): Promise<string[]> {
  try {
    const { data: seqRows } = await StaffSequenceService.fetchSequence();
    const ordered = (seqRows || [])
      .filter(r => r.auto_assign_enabled !== false)
      .sort((a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0));
    return ordered.map(r => String(r.staff_id));
  } catch {
    return [];
  }
}

// Round Robin across strict sequence (ignores country/availability; respects sequence_order)
async function nextSequenceRoundRobin(allowedIds?: string[]): Promise<string | null> {
  try {
    const orderedIds = Array.isArray(allowedIds) && allowedIds.length > 0
      ? allowedIds.map(String)
      : await getStrictSequenceOrderedIds();
    if (orderedIds.length === 0) return null;

    const { data: recent } = await sb
      .from('assignment_history')
      .select('staff_id,assigned_at')
      .in('staff_id', orderedIds)
      .order('assigned_at', { ascending: false })
      .limit(1);
    const lastId = Array.isArray(recent) && recent.length > 0 ? String((recent[0] as any).staff_id) : null;

    const total = orderedIds.length;
    const startIndex = lastId ? Math.max(orderedIds.indexOf(lastId), 0) : -1;
    for (let step = 1; step <= total; step++) {
      const idx = ((startIndex + step) % total + total) % total;
      const candidateId = orderedIds[idx];
      if (candidateId) return candidateId;
    }
    return orderedIds[0] || null;
  } catch {
    return null;
  }
}

// Round Robin: find next eligible by sequence after last used for this country
export async function nextRoundRobinStaff(countryName: string, allowedIds?: string[]): Promise<EligibleStaff | null> {
  try {
    let eligible = await getEligibleStaff(countryName);
    if (Array.isArray(allowedIds) && allowedIds.length > 0) {
      const allowSet = new Set(allowedIds.map(String));
      eligible = eligible.filter(e => allowSet.has(e.id));
    }
    if (eligible.length === 0) return null;
    const orderedIds = eligible.map(s => s.id);

    // Find most recently assigned for these eligible ids
    const { data: recent } = await sb
      .from('assignment_history')
      .select('staff_id,assigned_at')
      .in('staff_id', orderedIds)
      .order('assigned_at', { ascending: false })
      .limit(1);
    const lastId = Array.isArray(recent) && recent.length > 0 ? String((recent[0] as any).staff_id) : null;

    const total = orderedIds.length;
    const startIndex = lastId ? Math.max(orderedIds.indexOf(lastId), 0) : -1;
    for (let step = 1; step <= total; step++) {
      const idx = ((startIndex + step) % total + total) % total;
      const candidateId = orderedIds[idx];
      const candidate = eligible.find(e => e.id === candidateId);
      if (candidate) return candidate;
    }
    // Fallback: first by sequence
    return eligible[0] || null;
  } catch {
    return null;
  }
}

// Main assignment function applying rule hierarchy
export async function assignQuery(enquiryBusinessId: string): Promise<void> {
  // Fetch enquiry details (normalized Query)
  const { data: enquiry } = await getEnquiryById(enquiryBusinessId);
  if (!enquiry) return;

  const countryName = String(enquiry.destination?.country || enquiry.country_name || '').trim();
  // Read assignment rule toggles (default to enabled when unavailable)
  const ruleStatus = await getRulesEnabledMap(['expertise-match', 'agent-staff-relationship', 'workload-balance', 'round-robin']);
  const expertiseMatchEnabled = ruleStatus['expertise-match'] !== false;
  const relationEnabled = ruleStatus['agent-staff-relationship'] !== false;
  const workloadBalanceEnabled = ruleStatus['workload-balance'] !== false;
  const roundRobinEnabled = ruleStatus['round-robin'] !== false;
  // If no country provided OR expertise-match disabled, use strict sequence eligible pool
  if (!countryName || !expertiseMatchEnabled) {
    // With no country or expertise disabled, we rely on Staff Sequence and optional tie-breakers
    // Try Agent–Staff Relationship within sequence if enabled
    const seqIds = await getStrictSequenceOrderedIds();
    if (seqIds.length === 0) return;

    const rawAgentId = enquiry.agentUuid ? String(enquiry.agentUuid) : (typeof enquiry.agentId === 'number' ? String(enquiry.agentId) : String(enquiry.agentId || ''));
    const agentId = rawAgentId && rawAgentId.trim().length > 0 ? rawAgentId.trim() : null;

    if (relationEnabled) {
      const relStaffId = await getAgentStaffRelation(agentId, countryName, seqIds);
      if (relStaffId) {
        await assignEnquiry(enquiryBusinessId, relStaffId, 'system-auto', 'Agent–Staff Relationship', true);
        return;
      }
    }

    // Workload Balance across all assignments (no country filter) if enabled
    if (workloadBalanceEnabled) {
      // Build eligible staff objects from sequence ids, preserving order
      const eligibleNoCountry = await getEligibleStaff(countryName, false);
      const byWorkload = [...eligibleNoCountry].sort((a, b) => a.workloadCount - b.workloadCount);
      const minCount = byWorkload.length > 0 ? byWorkload[0].workloadCount : null;
      const lowest = minCount !== null ? byWorkload.filter(s => s.workloadCount === minCount) : [];
      if (lowest.length === 1) {
        await assignEnquiry(enquiryBusinessId, lowest[0].id, 'system-auto', 'Workload Balance', true);
        return;
      }
      if (lowest.length > 1) {
        if (roundRobinEnabled) {
          const rrTieId = await nextSequenceRoundRobin(lowest.map(s => s.id));
          if (rrTieId) {
            await assignEnquiry(enquiryBusinessId, rrTieId, 'system-auto', 'Round Robin (Tie-break)', true);
            return;
          }
        } else {
          // Sequence order tie-break when round-robin disabled
          const nextSeqId = await nextSequenceRoundRobin(lowest.map(s => s.id));
          if (nextSeqId) {
            await assignEnquiry(enquiryBusinessId, nextSeqId, 'system-auto', 'Sequence Order (Tie-break)', true);
            return;
          }
        }
      }
    }

    // Final fallback: sequence round robin if enabled, else sequence order
    if (roundRobinEnabled) {
      const seqNext = await nextSequenceRoundRobin();
      if (seqNext) {
        await assignEnquiry(enquiryBusinessId, seqNext, 'system-auto', 'Round Robin (Sequence Only)', true);
      }
    } else {
      const seqNext = await nextSequenceRoundRobin();
      if (seqNext) {
        await assignEnquiry(enquiryBusinessId, seqNext, 'system-auto', 'Sequence Order', true);
      }
    }
    return;
  }

  // 1) Country Expertise (only when enabled)
  const eligible = expertiseMatchEnabled ? await getEligibleStaff(countryName) : await getEligibleStaff(countryName, false);
  // If no eligible by country, fall back to sequence-only round robin or sequence order based on RR toggle
  if (eligible.length === 0) {
    const seqNext = await nextSequenceRoundRobin();
    if (seqNext) {
      await assignEnquiry(enquiryBusinessId, seqNext, 'system-auto', roundRobinEnabled ? 'Round Robin (Sequence Only)' : 'Sequence Order', true);
    }
    return;
  }

  // Resolve agent id (prefer UUID string when present)
  const rawAgentId = enquiry.agentUuid ? String(enquiry.agentUuid) : (typeof enquiry.agentId === 'number' ? String(enquiry.agentId) : String(enquiry.agentId || ''));
  const agentId = rawAgentId && rawAgentId.trim().length > 0 ? rawAgentId.trim() : null;

  // 2) Agent–Staff Relationship (only when enabled)
  if (relationEnabled) {
    const relationStaffId = await getAgentStaffRelation(agentId, countryName, eligible.map(e => e.id));
    if (relationStaffId) {
      await assignEnquiry(enquiryBusinessId, relationStaffId, 'system-auto', 'Agent–Staff Relationship', true);
      return;
    }
  }

  // 3) Workload Balance with Round Robin tie-breaker (only when enabled)
  if (workloadBalanceEnabled) {
    const byWorkload = [...eligible].sort((a, b) => a.workloadCount - b.workloadCount);
    const minCount = byWorkload.length > 0 ? byWorkload[0].workloadCount : null;
    const lowest = minCount !== null ? byWorkload.filter(s => s.workloadCount === minCount) : [];
    if (lowest.length === 1) {
      await assignEnquiry(enquiryBusinessId, lowest[0].id, 'system-auto', 'Workload Balance', true);
      return;
    }
    if (lowest.length > 1) {
      if (roundRobinEnabled) {
        const rrTie = await nextRoundRobinStaff(countryName, lowest.map(s => s.id));
        if (rrTie) {
          await assignEnquiry(enquiryBusinessId, rrTie.id, 'system-auto', 'Round Robin (Tie-break)', true);
          return;
        }
      } else {
        const seqTieId = await nextSequenceRoundRobin(lowest.map(s => s.id));
        if (seqTieId) {
          await assignEnquiry(enquiryBusinessId, seqTieId, 'system-auto', 'Sequence Order (Tie-break)', true);
          return;
        }
      }
    }
  }

  // 4) Final fallback — Round Robin or strict sequence order
  if (roundRobinEnabled) {
    const rr = await nextRoundRobinStaff(countryName);
    if (rr) {
      await assignEnquiry(enquiryBusinessId, rr.id, 'system-auto', 'Round Robin', true);
    }
  } else {
    const seqNext = await nextSequenceRoundRobin();
    if (seqNext) {
      await assignEnquiry(enquiryBusinessId, seqNext, 'system-auto', 'Sequence Order', true);
    }
  }
}