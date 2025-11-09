import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { StaffSequenceService } from '@/services/staffSequenceService';
import { createEnquiry, assignEnquiry } from '@/services/enquiriesService';
import { assignQuery } from '@/services/autoAssignmentEngine';
import { getCountryByName, getCountryByCode } from '@/services/countryMappingService';
import type { Query } from '@/types/query';

const sb: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

function uuid(): string {
  try {
    const u = (globalThis as any)?.crypto?.randomUUID?.();
    if (u) return u;
  } catch {}
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function ensureStaff(name: string, operationalCountries: string[]): Promise<{ id: string; name: string }> {
  // Profiles -> Staff sync is enforced by a DB trigger. Create/ensure a profile row for this staff.
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}` + '@example.com';

  // Try to find existing profile by email (stable unique key) or name
  let profile: any = null;
  {
    const { data } = await sb
      .from('profiles')
      .select('id,name,email,role,status')
      .eq('email', email)
      .maybeSingle();
    profile = data || null;
  }
  if (!profile) {
    const { data } = await sb
      .from('profiles')
      .select('id,name,email,role,status')
      .ilike('name', name)
      .in('role', ['staff','manager','hr_manager'])
      .limit(1)
      .maybeSingle();
    profile = data || null;
  }

  let id = profile?.id ? String(profile.id) : uuid();

  if (!profile) {
    const insertPayload = {
      id,
      name,
      email,
      role: 'staff',
      status: 'active',
      department: 'General'
    } as any;
    const { error: profErr } = await sb
      .from('profiles')
      .insert([insertPayload]);
    if (profErr) throw profErr;
  } else {
    // Ensure role/status are correct for sync
    const updates: any = {};
    if (!profile.role || !['staff','manager','hr_manager'].includes(String(profile.role))) updates.role = 'staff';
    if (profile.status !== 'active') updates.status = 'active';
    if (Object.keys(updates).length > 0) {
      await sb
        .from('profiles')
        .update(updates)
        .eq('id', id);
    }
  }

  // At this point, the DB trigger should have created/updated the staff row. Set operational countries.
  await sb
    .from('staff')
    .update({ status: 'active', operational_countries: operationalCountries })
    .eq('id', id);

  // Read back staff name for return (fallback to provided name)
  const { data: staffRow } = await sb
    .from('staff')
    .select('id,name')
    .eq('id', id)
    .maybeSingle();

  return { id, name: String(staffRow?.name || name) };
}

async function ensureAgent(name: string): Promise<{ id: string; name: string }> {
  const { data: existing } = await sb
    .from('agents')
    .select('id,name,email')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return { id: String(existing.id), name: String(existing.name || name) };
  const id = uuid();
  const { data, error } = await sb
    .from('agents')
    .insert([{ id, name, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com` }])
    .select()
    .maybeSingle();
  if (error) throw error;
  return { id: String(data.id), name };
}

async function ensureAgentStaffRelation(agentId: string, staffId: string): Promise<void> {
  const { data: existing } = await sb
    .from('agent_staff_assignments')
    .select('agent_id,staff_id')
    .eq('agent_id', agentId)
    .eq('staff_id', staffId)
    .limit(1);
  if (Array.isArray(existing) && existing.length > 0) return;
  await sb
    .from('agent_staff_assignments')
    .insert([{ agent_id: agentId, staff_id: staffId }]);
}

function buildQuery(id: string, countryName: string, agentUuid?: string): Query {
  const country = getCountryByName(countryName);
  const code = country?.code || getCountryByCode(countryName)?.code || (countryName.slice(0, 2).toUpperCase());
  return {
    id,
    agentId: 0,
    agentName: agentUuid ? 'Seed Agent' : '',
    agentUuid,
    agentCompany: '',
    destination: { country: country?.name || countryName, cities: [] },
    paxDetails: { adults: 2, children: 0, infants: 0 },
    travelDates: { from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10), isEstimated: true },
    tripDuration: { nights: 5, days: 6 },
    packageType: 'full-package',
    specialRequests: [],
    budget: { min: 1000, max: 2000, currency: 'USD' },
    status: 'new',
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priority: 'normal',
    notes: '',
    communicationPreference: 'email',
    hotelDetails: { rooms: 1, category: 'standard' },
    inclusions: { sightseeing: true, transfers: 'private', mealPlan: 'breakfast' },
    cityAllocations: [],
  };
}

export async function seedAssignmentTestData(): Promise<{ logs: string[]; data: any }> {
  const logs: string[] = [];
  try {
    // Prepare staff (operational countries use codes to validate robust mapping)
    const alice = await ensureStaff('Alice', ['TH', 'AE']);
    const bob = await ensureStaff('Bob', ['AE']);
    const charlie = await ensureStaff('Charlie', ['TH']);
    logs.push(`Staff ready: Alice=${alice.id}, Bob=${bob.id}, Charlie=${charlie.id}`);

    // Ensure sequence order
    await StaffSequenceService.upsertSequence([
      { staff_id: alice.id, sequence_order: 1, auto_assign_enabled: true },
      { staff_id: bob.id, sequence_order: 2, auto_assign_enabled: true },
      { staff_id: charlie.id, sequence_order: 3, auto_assign_enabled: true },
    ]);
    logs.push('Staff sequence set: [Alice(1), Bob(2), Charlie(3)]');

    // Prepare agent and link to Bob for Agent–Staff relationship
    const agent = await ensureAgent('Agent Zoe');
    await ensureAgentStaffRelation(agent.id, bob.id);
    logs.push(`Agent ready: Zoe=${agent.id}, linked to Bob`);

    // Preload workload for Alice in Thailand to enable workload-balanced assignment to Charlie
    const pre1Id = 'ENQ_TH_PRE_A';
    await createEnquiry(buildQuery(pre1Id, 'Thailand'));
    await assignEnquiry(pre1Id, alice.id, 'system-seed', 'Seed Preload', true);
    logs.push('Preloaded Thailand workload: Alice +1');

    // 1) Agent–Staff Relationship: UAE enquiry from Agent Zoe -> expect Bob
    const relId = 'ENQ_REL_UAE';
    await createEnquiry(buildQuery(relId, 'United Arab Emirates', agent.id));
    await assignQuery(relId);
    logs.push('Agent–Staff test created and auto-assigned');

    // 2) Workload Balance: Thailand enquiry (Alice=1, Charlie=0) -> expect Charlie
    const balanceId = 'ENQ_BALANCE_TH';
    await createEnquiry(buildQuery(balanceId, 'Thailand'));
    await assignQuery(balanceId);
    logs.push('Workload-balance test created and auto-assigned');

    // 3) Round Robin tie-break: Another Thailand enquiry (Alice=1, Charlie=1) -> next in RR
    const rrId = 'ENQ_RR_TH_1';
    await createEnquiry(buildQuery(rrId, 'Thailand'));
    await assignQuery(rrId);
    logs.push('Round-robin tie-break test created and auto-assigned');

    // Optional: one more RR to show alternation
    const rr2Id = 'ENQ_RR_TH_2';
    await createEnquiry(buildQuery(rr2Id, 'Thailand'));
    await assignQuery(rr2Id);
    logs.push('Round-robin follow-up test created and auto-assigned');

    return { logs, data: { staff: { alice, bob, charlie }, agent, enquiries: { relId, balanceId, rrId, rr2Id, pre1Id } } };
  } catch (e: any) {
    logs.push(`Seed error: ${e?.message || e}`);
    return { logs, data: null };
  }
}