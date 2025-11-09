import { supabase } from '@/lib/supabaseClient';
import { createWorkflowEvent } from '@/services/workflowEventsService';
import { Query } from '@/types/query';
import { getCountryCodeByName } from '@/utils/countryUtils';
import { EnquiryConfiguration, CountryEnquirySettings, DEFAULT_ENQUIRY_COUNTRIES } from '@/types/enquiry';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { AppSettingsService, AppSettingsHelpers, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { fetchEnhancedStaff, findBestStaffMatch } from '@/services/staffAssignmentService';
import { getAssignmentReason } from '@/services/countryAssignmentService';
import { getStaffOperationalCountries } from '@/services/countryMappingService';
import { StaffSequenceService } from '@/services/staffSequenceService';
import { getRulesEnabledMap } from '@/services/assignmentRulesService';
import { assignQuery } from '@/services/autoAssignmentEngine';

// Relax Supabase client typing for queries to reduce type overload errors
const sb = supabase as any;

// Keep this UUID in sync with the UI toggle used in useQueryAssignment
// It points to the specific app_settings row for auto_assign_enabled
const AUTO_ASSIGN_SETTING_ID = 'b57de51f-9bb0-4a1f-b89a-415c9c57ad3f';

// Supabase 'public.enquiries' row shape (subset used by UI)
export type EnquiryRow = {
  id?: string; // UUID
  enquiry_id: string; // business ID (e.g., ENQ2025...)
  agent_id?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;

  country_code: string;
  country_name: string;
  cities: any;

  travel_from: string; // date
  travel_to: string;   // date
  is_date_estimated?: boolean;
  nights: number;
  days: number;

  adults: number;
  children: number;
  infants: number;

  budget_min?: number | null;
  budget_max?: number | null;
  budget_currency?: string | null;
  package_type: string;

  hotel_rooms?: number | null;
  hotel_category?: string | null;

  sightseeing?: boolean | null;
  transfers?: string | null;
  meal_plan?: string | null;

  special_requests?: any;
  notes?: string | null;

  status: string;
  priority?: string | null;
  communication_preference?: string | null;
  city_allocations?: any;

  created_at?: string;
  updated_at?: string;
};

export type UseEnquiriesFilters = {
  status?: string;
  createdFrom?: string; // YYYY-MM-DD
  createdTo?: string;   // YYYY-MM-DD
};

export type UseEnquiriesParams = {
  page: number;
  pageSize: number;
  search?: string;
  filters?: UseEnquiriesFilters;
  sort?: { field?: 'created_at' | 'enquiry_id' | 'destination' | 'status'; direction?: 'asc' | 'desc' };
};
 

function toQuery(row: EnquiryRow): Query {
  const fallbackDate = new Date().toISOString();
  const cities = Array.isArray(row.cities) ? row.cities : [];
  const specialRequests = Array.isArray(row.special_requests) ? row.special_requests : [];

  // Preserve agent_id whether numeric or UUID string, normalize invalid values
  const rawAgentId = row.agent_id;
  let agentId: string | number = '';
  let agentUuid: string | undefined = undefined;
  if (typeof rawAgentId === 'number') {
    agentId = rawAgentId;
  } else if (typeof rawAgentId === 'string') {
    const norm = rawAgentId.trim();
    const invalid = norm === '' || norm.toLowerCase() === 'null' || norm.toLowerCase() === 'undefined' || norm.toLowerCase() === 'nan';
    if (invalid) {
      agentId = '';
    } else {
      const maybeNum = Number(norm);
      agentId = Number.isFinite(maybeNum) ? maybeNum : norm;
      // If it's not a finite number, treat it as the actual Supabase UUID
      if (!Number.isFinite(maybeNum)) agentUuid = norm;
    }
  }

  return {
    id: row.enquiry_id,
    agentId,
    agentUuid,
    // Leave empty to allow UI to resolve from agentId; do not use assigned_to
    agentName: '',
    destination: { country: row.country_name, cities },
    paxDetails: { adults: row.adults ?? 1, children: row.children ?? 0, infants: row.infants ?? 0 },
    travelDates: { from: row.travel_from ?? fallbackDate, to: row.travel_to ?? fallbackDate, isEstimated: !!row.is_date_estimated },
    tripDuration: { days: row.days ?? 0, nights: row.nights ?? 0 },
    packageType: row.package_type ?? 'full-package',
    specialRequests,
    budget: { min: Number(row.budget_min ?? 0), max: Number(row.budget_max ?? 0), currency: row.budget_currency ?? 'USD' },
    status: row.status ?? 'new',
    assignedTo: row.assigned_to ?? null,
    createdAt: row.created_at ?? fallbackDate,
    updatedAt: row.updated_at ?? fallbackDate,
    priority: row.priority ?? 'normal',
    notes: row.notes ?? '',
    communicationPreference: row.communication_preference ?? 'email',
    hotelDetails: { rooms: Number(row.hotel_rooms ?? 1), category: row.hotel_category ?? 'standard' },
    inclusions: { sightseeing: !!row.sightseeing, transfers: row.transfers ?? 'private', mealPlan: row.meal_plan ?? 'breakfast' },
    cityAllocations: row.city_allocations ?? undefined,
  } as Query;
}

function toDateOnly(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return null;
  }
}

function fromQuery(q: Query, userId?: string | null): EnquiryRow {
  const countryName = q.destination?.country ?? 'Unknown';
  const countryCode = getCountryCodeByName(countryName) || (countryName || '').slice(0, 2).toUpperCase();
  return {
    enquiry_id: q.id,
    // Prefer Supabase UUID; avoid inserting numeric IDs into uuid column
    agent_id: (q.agentUuid && q.agentUuid.trim().length > 0) ? q.agentUuid : null,
    country_code: countryCode,
    country_name: countryName,
    cities: q.destination?.cities ?? [],
    travel_from: toDateOnly(q.travelDates?.from) || new Date().toISOString().slice(0, 10),
    travel_to: toDateOnly(q.travelDates?.to) || new Date().toISOString().slice(0, 10),
    is_date_estimated: !!q.travelDates?.isEstimated,
    nights: q.tripDuration?.nights ?? 0,
    days: q.tripDuration?.days ?? 0,
    adults: q.paxDetails?.adults ?? 1,
    children: q.paxDetails?.children ?? 0,
    infants: q.paxDetails?.infants ?? 0,
    budget_min: q.budget?.min ?? 0,
    budget_max: q.budget?.max ?? 0,
    budget_currency: q.budget?.currency ?? 'USD',
    package_type: q.packageType ?? 'full-package',
    hotel_rooms: q.hotelDetails?.rooms ?? 1,
    hotel_category: q.hotelDetails?.category ?? 'standard',
    sightseeing: q.inclusions?.sightseeing ?? true,
    transfers: q.inclusions?.transfers ?? 'private',
    meal_plan: q.inclusions?.mealPlan ?? 'breakfast',
    special_requests: Array.isArray(q.specialRequests) ? q.specialRequests : [],
    notes: q.notes ?? '',
    status: q.status ?? 'new',
    priority: q.priority ?? 'normal',
    communication_preference: q.communicationPreference ?? 'email',
    city_allocations: q.cityAllocations ?? [],
    created_by: userId ?? null,
  };
}

// No offline/localStorage fallback — queries module uses Supabase exclusively

export async function listEnquiries(params: UseEnquiriesParams) {
  const { page, pageSize, search = '', filters = {}, sort = { field: 'created_at', direction: 'desc' } } = params;
  const offset = (page - 1) * pageSize;

  // Avoid typed joins; select * and cast to reduce type complexity
  let query = sb
    .from('enquiries')
    .select('*', { count: 'exact' });

  // Search across multiple fields
  if (search && search.trim().length > 0) {
    const s = `%${search}%`;
    // Search across known columns to avoid type errors
    query = query.or(
      `country_name.ilike.${s},notes.ilike.${s},enquiry_id.ilike.${s}`
    );
  }

  // Filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.createdFrom) {
    query = query.gte('created_at', filters.createdFrom);
  }
  if (filters.createdTo) {
    query = query.lte('created_at', filters.createdTo);
  }

  // Sorting
  const sortField = sort?.field === 'destination' ? 'country_name' : (sort?.field || 'created_at');
  query = query.order(sortField, { ascending: sort?.direction === 'asc' });

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data || []) as any[];
  // Collect unique agent IDs from rows to fetch agent names/company in one query
  const agentIds = Array.from(
    new Set(
      rows
        .map((r: any) => (r?.agent_id ? String(r.agent_id) : null))
        .filter((id: string | null): id is string => !!id)
    )
  );

  let agentsMap = new Map<string, { name?: string; agency_name?: string; email?: string }>();
  if (agentIds.length > 0) {
    try {
      const { data: agentsData, error: agentsErr } = await sb
        .from('agents' as any)
        .select('id,name,agency_name,email')
        .in('id', agentIds);
      if (!agentsErr && Array.isArray(agentsData)) {
        (agentsData as any[]).forEach((a: any) => {
          agentsMap.set(String(a.id), {
            name: (a as any)?.name,
            agency_name: (a as any)?.agency_name,
            email: (a as any)?.email,
          });
        });
      }
    } catch {}
  }

  const queries = rows.map((row: any) => {
    const q = toQuery(row as EnquiryRow);
    const a = agentsMap.get(String(row?.agent_id));
    const agentName = a?.name || a?.agency_name || a?.email || q.agentName || '';
    const agentCompany = a?.agency_name || q.agentCompany || '';
    return { ...q, agentName, agentCompany } as Query;
  });

  return { data: queries, count: count ?? queries.length };
}

// Fetch all enquiries across pages for export, honoring filters/search/sort
export async function fetchAllEnquiries(params: Omit<UseEnquiriesParams, 'page' | 'pageSize'> & { batchSize?: number }) {
  const { search = '', filters = {}, sort = { field: 'created_at', direction: 'desc' }, batchSize = 1000 } = params;

  // Base query builder with filters/search/sort
  const buildBaseQuery = () => {
    let q = sb.from('enquiries').select('*', { count: 'exact' });
    if (search && search.trim().length > 0) {
      const s = `%${search}%`;
      q = q.or(`country_name.ilike.${s},notes.ilike.${s},enquiry_id.ilike.${s}`);
    }
    if (filters.status && filters.status !== 'all') {
      q = q.eq('status', filters.status);
    }
    if (filters.createdFrom) {
      q = q.gte('created_at', filters.createdFrom);
    }
    if (filters.createdTo) {
      q = q.lte('created_at', filters.createdTo);
    }
    const sortField = sort?.field === 'destination' ? 'country_name' : (sort?.field || 'created_at');
    q = q.order(sortField, { ascending: sort?.direction === 'asc' });
    return q;
  };

  // First request to get total count
  let { data: firstData, error: firstError, count } = await buildBaseQuery().range(0, batchSize - 1);
  if (firstError) throw firstError;
  const rows: any[] = Array.isArray(firstData) ? firstData.slice() : [];

  const total = typeof count === 'number' ? count : rows.length;
  if (total > rows.length) {
    let fetched = rows.length;
    while (fetched < total) {
      const start = fetched;
      const end = Math.min(fetched + batchSize - 1, total - 1);
      const { data: batch, error } = await buildBaseQuery().range(start, end);
      if (error) throw error;
      rows.push(...(Array.isArray(batch) ? batch : []));
      fetched = rows.length;
    }
  }

  const queries = rows.map((row: any) => toQuery(row as EnquiryRow));
  // Enrich agent details similar to listEnquiries
  const agentIds = Array.from(
    new Set(rows.map((r: any) => (r?.agent_id ? String(r.agent_id) : null)).filter((id: string | null): id is string => !!id))
  );
  if (agentIds.length > 0) {
    try {
      const { data: agentsData } = await sb.from('agents' as any).select('id,name,agency_name,email').in('id', agentIds);
      const map = new Map<string, { name?: string; agency_name?: string; email?: string }>();
      (agentsData || []).forEach((a: any) => {
        map.set(String(a.id), { name: a?.name, agency_name: a?.agency_name, email: a?.email });
      });
      return {
        data: queries.map((q, idx) => {
          const a = map.get(String((rows[idx] as any)?.agent_id));
          const agentName = a?.name || a?.agency_name || a?.email || q.agentName || '';
          const agentCompany = a?.agency_name || q.agentCompany || '';
          return { ...q, agentName, agentCompany } as Query;
        }),
        count: total,
      };
    } catch {
      // Fall back to base queries without enrichment
    }
  }
  return { data: queries, count: total };
}

export async function createEnquiry(q: Query) {
  const { data: { user } } = await supabase.auth.getUser();
  // Opportunistic ensure: keep enquiry settings healthy for selected country
  try {
    const selectedCountryCode = getCountryCodeByName(q.destination?.country || '');
    await ensureCountryConfig(selectedCountryCode || undefined);
  } catch {}
  const row = fromQuery(q, user?.id ?? null);

  // Pre-compute a unique enquiry_id by looking at existing IDs with the same prefix
  // This avoids repeated duplicate violations when many records already exist.
  const ensureUniqueEnquiryId = async (initialId: string): Promise<string> => {
    try {
      const match = initialId.match(/(.*?)(\d+)$/);
      if (!match) {
        // If no trailing digits, just return the initial with a safe suffix
        const candidate = initialId + '1';
        const { data: exists } = await sb
          .from('enquiries')
          .select('enquiry_id')
          .eq('enquiry_id', candidate)
          .limit(1)
          .maybeSingle();
        return exists ? initialId + '2' : candidate;
      }

      const prefix = match[1];
      const numStr = match[2];

      // Find the highest existing enquiry_id for this prefix
      const { data: latest } = await sb
        .from('enquiries')
        .select('enquiry_id')
        .like('enquiry_id', `${prefix}%`)
        .order('enquiry_id', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNum = parseInt(numStr, 10) || 1;
      if (latest && (latest as any).enquiry_id) {
        const lm = String((latest as any).enquiry_id).match(/(\d+)$/);
        if (lm) {
          const maxNum = parseInt(lm[1], 10) || 0;
          nextNum = maxNum + 1;
        }
      }

      const padded = String(nextNum).padStart(numStr.length, '0');
      return prefix + padded;
    } catch {
      // On any failure, fall back to the provided initial id
      return initialId;
    }
  };

  // Compute a unique ID prior to insert to minimize duplicate conflicts
  row.enquiry_id = await ensureUniqueEnquiryId(row.enquiry_id);

  // Robust insert: handle duplicate enquiry_id by incrementing suffix
  const bumpId = (id: string): string => {
    const match = id.match(/(\d+)$/);
    if (!match) return id + '1';
    const numStr = match[1];
    const nextNum = (parseInt(numStr, 10) || 0) + 1;
    // Preserve padding length when possible
    const padded = nextNum.toString().padStart(numStr.length, '0');
    return id.slice(0, id.length - numStr.length) + padded;
  };

  let inserted: any = null;
  let insertError: any = null;
  let attempts = 0;
  let currentRow: any = { ...row };
  while (attempts < 20) {
    const res = await sb.from('enquiries').insert(currentRow).select('*').single();
    inserted = res.data;
    insertError = res.error;
    if (!insertError) break;
    const isDup = (insertError?.code === '23505') || String(insertError?.message || '').includes('enquiries_enquiry_id_key');
    if (isDup) {
      currentRow.enquiry_id = bumpId(currentRow.enquiry_id);
      attempts += 1;
      continue;
    }
    // Non-dup errors: bail out
    break;
  }
  if (insertError) return { data: null, error: insertError };

  // Convert to Query for matching and potential auto-assignment
  const createdQuery = toQuery(inserted as EnquiryRow);

  // Auto-assign if enabled in App Settings
  try {
    // Ensure setting exists with a default value
    await AppSettingsHelpers.ensureSettingValue('assignment', 'auto_assign_enabled', 'false');
    // Prefer reading by UUID to stay aligned with the UI toggle state
    let autoAssignEnabled = false;
    try {
      const byId = await AppSettingsService.getSettingById(AUTO_ASSIGN_SETTING_ID);
      if (byId.success && byId.data) {
        const raw = (byId.data as any).setting_value ?? (byId.data as any).setting_json;
        autoAssignEnabled = typeof raw === 'boolean' ? raw : String(raw ?? '').toLowerCase() === 'true';
      } else {
        const settingVal = await AppSettingsService.getSettingValue('assignment', 'auto_assign_enabled');
        autoAssignEnabled = typeof settingVal === 'boolean' ? settingVal : String(settingVal ?? '').toLowerCase() === 'true';
      }
    } catch {
      const settingVal = await AppSettingsService.getSettingValue('assignment', 'auto_assign_enabled');
      autoAssignEnabled = typeof settingVal === 'boolean' ? settingVal : String(settingVal ?? '').toLowerCase() === 'true';
    }

    if (autoAssignEnabled) {
      // Read rule statuses to decide assignment strategy
      const ruleStatus = await getRulesEnabledMap(['round-robin', 'workload-balance', 'expertise-match']);
      // Treat null (unavailable) as enabled to preserve legacy behavior
      const roundRobinActive = ruleStatus['round-robin'] !== false;
      const workloadBalanceActive = ruleStatus['workload-balance'] !== false;
      const expertiseMatchActive = ruleStatus['expertise-match'] !== false;

      const staff = await fetchEnhancedStaff();
      const activeStaff = (staff || []).filter((s: any) => s.active && s.assigned < s.workloadCapacity);
      const destCountry = String(createdQuery?.destination?.country || '').trim();

      // If Expertise Match is active, prefer country-based assignment first
      if (expertiseMatchActive) {
        // Build list of sequence members who have a country match
        const candidatesWithCountry: string[] = activeStaff
          .filter((s: any) => {
            const ops = getStaffOperationalCountries(Array.isArray(s.operationalCountries) ? s.operationalCountries : []);
            return destCountry && ops.includes(destCountry);
          })
          .map((s: any) => String(s.uuid))
          .filter(Boolean);

        // If Round Robin is also active and we have country-matching candidates, assign by sequence among them
        if (roundRobinActive && candidatesWithCountry.length > 0) {
          try {
            const { data: seqRows } = await StaffSequenceService.fetchSequence();
            const ordered = (seqRows || [])
              .filter(r => r.auto_assign_enabled !== false)
              .filter(r => candidatesWithCountry.includes(String(r.staff_id)))
              .sort((a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0));
            const orderedIds = ordered.map(r => String(r.staff_id));

            if (orderedIds.length > 0) {
              // Build availability among sequence members
              const staffByUuid = new Map<string, any>();
              (activeStaff || []).forEach((s: any) => {
                if (s && s.uuid) staffByUuid.set(String(s.uuid), s);
              });

              const availableIds = orderedIds.filter(uuid => {
                const s = staffByUuid.get(uuid);
                return s && s.active && s.assigned < s.workloadCapacity;
              });

              let nextUuid: string | null = null;
              if (availableIds.length > 0) {
                // Find most recently assigned among candidates, then pick next by sequence
                const { data: recent } = await sb
                  .from('assignment_history')
                  .select('staff_id,assigned_at')
                  .in('staff_id', orderedIds)
                  .order('assigned_at', { ascending: false })
                  .limit(1);
                const lastId = Array.isArray(recent) && recent.length > 0 ? String((recent[0] as any).staff_id) : null;
                const startIndex = lastId ? Math.max(orderedIds.indexOf(lastId), 0) : -1;
                const total = orderedIds.length;
                for (let step = 1; step <= total; step++) {
                  const idx = ((startIndex + step) % total + total) % total;
                  const candidate = orderedIds[idx];
                  if (availableIds.includes(candidate)) {
                    nextUuid = candidate;
                    break;
                  }
                }
              }

              // Fallbacks: if none available within matching sequence, use best country match
              if (!nextUuid) {
                const best = activeStaff.length > 0 ? findBestStaffMatch(createdQuery, activeStaff as any) : null;
                if (best && (best as any).uuid) nextUuid = (best as any).uuid;
              }

              if (nextUuid) {
                const { error: assignErr } = await assignEnquiry(createdQuery.id, nextUuid, user?.id || undefined, 'Country Expertise', true);
                if (!assignErr) {
                  const { data: refetched } = await sb
                    .from('enquiries')
                    .select('*')
                    .eq('id', (inserted as any).id)
                    .limit(1)
                    .maybeSingle();
                  if (refetched) {
                    return { data: toQuery(refetched as EnquiryRow), error: null };
                  }
                }
              }
            }
          } catch {
            // If sequence fetch fails, fall back to best-match strategy below
          }
        }

        // If Round Robin not applicable or no matching candidates, use best-match (which prioritizes country)
        const best = findBestStaffMatch(createdQuery, staff);
        if (best && (best as any).uuid) {
          const reason = getAssignmentReason(best, createdQuery);
          const { error: assignErr } = await assignEnquiry(createdQuery.id, (best as any).uuid, user?.id || undefined, reason, true);
          if (!assignErr) {
            const { data: refetched } = await sb
              .from('enquiries')
              .select('*')
              .eq('id', (inserted as any).id)
              .limit(1)
              .maybeSingle();
            if (refetched) {
              return { data: toQuery(refetched as EnquiryRow), error: null };
            }
          }
        }
      }

      // When Round Robin is active AND smart rules are inactive, assign immediately using staff sequence
      if (roundRobinActive && !workloadBalanceActive && !expertiseMatchActive) {
        try {
          const { data: seqRows } = await StaffSequenceService.fetchSequence();
          const ordered = (seqRows || [])
            .filter(r => r.auto_assign_enabled !== false)
            .sort((a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0));
          const orderedIds = ordered.map(r => String(r.staff_id));

          if (orderedIds.length > 0) {
            // Build availability among sequence members
            const staffByUuid = new Map<string, any>();
            (staff || []).forEach((s: any) => {
              if (s && s.uuid) staffByUuid.set(String(s.uuid), s);
            });

            const availableIds = orderedIds.filter(uuid => {
              const s = staffByUuid.get(uuid);
              return s && s.active && s.assigned < s.workloadCapacity;
            });

            let nextUuid: string | null = null;
            if (availableIds.length > 0) {
              // Find most recently assigned among sequence, then pick the next in order
              const { data: recent } = await sb
                .from('assignment_history')
                .select('staff_id,assigned_at')
                .in('staff_id', orderedIds)
                .order('assigned_at', { ascending: false })
                .limit(1);
              const lastId = Array.isArray(recent) && recent.length > 0 ? String((recent[0] as any).staff_id) : null;
              const startIndex = lastId ? Math.max(orderedIds.indexOf(lastId), 0) : -1;
              // Scan forward from next position for the first available
              const total = orderedIds.length;
              for (let step = 1; step <= total; step++) {
                const idx = ((startIndex + step) % total + total) % total;
                const candidate = orderedIds[idx];
                if (availableIds.includes(candidate)) {
                  nextUuid = candidate;
                  break;
                }
              }
            }

            // Fallbacks: if no available in sequence, use best match
            if (!nextUuid) {
              const best = findBestStaffMatch(createdQuery, staff);
              if (best && (best as any).uuid) nextUuid = (best as any).uuid;
            }

            if (nextUuid) {
              const { error: assignErr } = await assignEnquiry(createdQuery.id, nextUuid, user?.id || undefined, 'Round Robin', true);
              if (!assignErr) {
                const { data: refetched } = await sb
                  .from('enquiries')
                  .select('*')
                  .eq('id', (inserted as any).id)
                  .limit(1)
                  .maybeSingle();
                if (refetched) {
                  return { data: toQuery(refetched as EnquiryRow), error: null };
                }
              }
            }
          }
        } catch {
          // If sequence fetch fails, fall back to best-match strategy below
        }
      }
      // Default/legacy behavior: use best match (expertise/workload)
      const best = findBestStaffMatch(createdQuery, staff);
      if (best && (best as any).uuid) {
        const reason = getAssignmentReason(best, createdQuery);
        const { error: assignErr } = await assignEnquiry(createdQuery.id, (best as any).uuid, user?.id || undefined, reason, true);
        if (!assignErr) {
          // Refetch to return updated assignment state
          const { data: refetched } = await sb
            .from('enquiries')
            .select('*')
            .eq('id', (inserted as any).id)
            .limit(1)
            .maybeSingle();
          if (refetched) {
            return { data: toQuery(refetched as EnquiryRow), error: null };
          }
        }
      }
    }
  } catch (e) {
    // Non-blocking: ignore auto-assign failures
  }

  return { data: createdQuery, error: null };
}

export async function updateEnquiry(id: string, patch: Partial<Query>) {
  // If assignment is changing, resolve staff ID and record assignment history after update
  let resolvedStaffId: string | null = null;
  let enquiryUuid: string | null = null;
  try {
    if (typeof patch.assignedTo === 'string' && patch.assignedTo.length > 0) {
      // Resolve enquiry UUID from business id
      const { data: found, error: findError } = await sb
        .from('enquiries')
        .select('id,enquiry_id')
        .eq('enquiry_id', id)
        .limit(1)
        .maybeSingle();
      if (!findError && found?.id) enquiryUuid = found.id as string;

      // Try to resolve staff id if not a UUID
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patch.assignedTo);
      if (looksLikeUuid) {
        resolvedStaffId = patch.assignedTo;
      } else {
        let res = await sb
          .from('staff_profiles')
          .select('id,name')
          .ilike('name', patch.assignedTo)
          .limit(1)
          .maybeSingle();
        let staffFound = res.data;
        if (!staffFound?.id) {
          res = await sb
            .from('staff_profiles')
            .select('id,full_name')
            .ilike('full_name', patch.assignedTo)
            .limit(1)
            .maybeSingle();
          staffFound = res.data;
        }
        resolvedStaffId = staffFound?.id || null;
      }
    }
  } catch {}

  const payload: Partial<EnquiryRow> = {
    status: patch.status,
    country_name: patch.destination?.country as any,
    cities: patch.destination?.cities as any,
    // Budget fields
    budget_min: patch.budget?.min,
    budget_max: patch.budget?.max,
    budget_currency: patch.budget?.currency,
    // Travel date fields
    travel_from: toDateOnly(patch.travelDates?.from) as any,
    travel_to: toDateOnly(patch.travelDates?.to) as any,
    is_date_estimated: patch.travelDates?.isEstimated,
    // Agent mapping (prefer Supabase UUID)
    agent_id: (patch.agentUuid && patch.agentUuid.trim().length > 0) ? patch.agentUuid : undefined,
    // Trip duration
    nights: patch.tripDuration?.nights,
    days: patch.tripDuration?.days,
    // Pax details
    adults: patch.paxDetails?.adults,
    children: patch.paxDetails?.children,
    infants: patch.paxDetails?.infants,
    // Package details
    package_type: patch.packageType,
    priority: patch.priority,
    communication_preference: patch.communicationPreference,
    notes: patch.notes,
    special_requests: Array.isArray(patch.specialRequests) ? patch.specialRequests : undefined,
    hotel_rooms: patch.hotelDetails?.rooms,
    hotel_category: patch.hotelDetails?.category,
    transfers: patch.inclusions?.transfers,
    meal_plan: patch.inclusions?.mealPlan,
    sightseeing: patch.inclusions?.sightseeing,
    assigned_to: typeof patch.assignedTo === 'string' ? (resolvedStaffId || patch.assignedTo) : undefined,
    // Timestamp
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb.from('enquiries').update(payload).eq('enquiry_id', id);
  if (error) return { error };

  // Record assignment history when assigned_to was provided
  try {
    if (typeof patch.assignedTo === 'string' && (resolvedStaffId || enquiryUuid)) {
      // Ensure we have enquiry UUID
      if (!enquiryUuid) {
        const { data: found } = await sb
          .from('enquiries')
          .select('id')
          .eq('enquiry_id', id)
          .limit(1)
          .maybeSingle();
        enquiryUuid = found?.id || null;
      }

      // Get current user for assigned_by
      let assignedBy: string | null = null;
      try {
        const { data: auth } = await (supabase as any).auth.getUser();
        assignedBy = auth?.user?.id || null;
      } catch {}

      // Insert into assignment_history
      if (enquiryUuid && (resolvedStaffId || patch.assignedTo)) {
        await sb.from('assignment_history').insert({
          enquiry_id: enquiryUuid,
          staff_id: resolvedStaffId || patch.assignedTo,
          assigned_by: assignedBy,
          reason: patch.notes || null,
          is_auto_assigned: false,
        });
      }
    }
  } catch {}

  return { error: null };
}

export async function deleteEnquiry(id: string) {
  // Soft-delete via status to respect RLS rules
  const { error } = await sb.from('enquiries').update({ status: 'deleted' }).eq('enquiry_id', id);
  return { error };
}

export async function uploadAttachment(enquiryId: string, file: File) {
  const path = `${enquiryId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from('enquiry-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) return { error };
  const { data: pub } = supabase.storage.from('enquiry-attachments').getPublicUrl(data.path);
  return { url: pub.publicUrl };
}

// Realtime subscription
export function subscribeEnquiries(onChange: (type: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void) {
  const channel = supabase
    .channel('public:enquiries')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, (payload) => {
      onChange(payload.eventType as any, payload.new ?? payload.old);
    })
    .subscribe();
  return channel;
}

// React hook: server-side pagination and filters, optimistic updates supported externally
import { useEffect, useState, useCallback } from 'react';

export function useEnquiries(params: UseEnquiriesParams) {
  const [data, setData] = useState<Query[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listEnquiries(params);
      setData(res.data);
      setCount(res.count);
      setError(null);
    } catch (e: any) {
      console.error('Failed loading enquiries', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.search, params.filters?.status, params.sort?.field, params.sort?.direction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ch = subscribeEnquiries((_type) => {
      // On realtime change, refetch
      fetchData();
    });
    return () => {
      try { supabase.removeChannel(ch); } catch {}
    };
  }, [fetchData]);

  // No online/localStorage synchronization — always source from Supabase

  return { data, count, isLoading, error, refetch: fetchData };
}

// Single fetch by business ID (enquiry_id) or UUID
export async function getEnquiryById(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  let q = sb.from('enquiries').select('*').limit(1);
  q = isUuid ? q.eq('id', id) : q.eq('enquiry_id', id);
  const { data, error } = await q.maybeSingle();
  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };

  const base = toQuery(data as EnquiryRow);
  let enriched = { ...base } as Query;
  try {
    const agentId = (data as any)?.agent_id ? String((data as any).agent_id) : null;
    if (agentId) {
      const { data: agentRow, error: agentErr } = await sb
        .from('agents' as any)
        .select('id,name,agency_name,email')
        .eq('id', agentId)
        .maybeSingle();
      if (!agentErr && agentRow) {
        const name = (agentRow as any)?.name || (agentRow as any)?.agency_name || (agentRow as any)?.email || enriched.agentName || '';
        const company = (agentRow as any)?.agency_name || enriched.agentCompany || '';
        enriched = { ...enriched, agentName: name, agentCompany: company } as Query;
      }
    }
  } catch {}

  return { data: enriched, error: null };
}

// Assignment helper: updates assigned_to and records assignment history
export async function assignEnquiry(
  enquiryBusinessId: string,
  staffIdOrName: string,
  assignedBy?: string,
  reason?: string,
  isAutoAssigned?: boolean
) {
  // First, find the enquiry UUID
  const { data: found, error: findError } = await sb
    .from('enquiries')
    .select('id,enquiry_id,assigned_to,status')
    .eq('enquiry_id', enquiryBusinessId)
    .limit(1)
    .maybeSingle();
  if (findError || !found?.id) return { error: findError || new Error('Enquiry not found') };

  const previousAssignedId: string | null = (found as any)?.assigned_to || null;
  const previousStatus: string | null = (found as any)?.status || null;
  let previousAssignedName: string | null = null;
  let previousAssignedNameSource: 'staff' | 'profiles' | 'agents' | undefined;
  try {
    if (previousAssignedId) {
      // Prefer staff table
      const { data: prevStaffRow, error: prevStaffErr } = await sb
        .from('staff' as any)
        .select('name,email')
        .eq('id', previousAssignedId)
        .limit(1)
        .maybeSingle();
      if (!prevStaffErr && prevStaffRow) {
        previousAssignedName = (prevStaffRow as any)?.name || (prevStaffRow as any)?.email || null;
        previousAssignedNameSource = 'staff';
      }
      // Fallback: profiles
      if (!previousAssignedName) {
        const { data: prevProfile, error: prevProfErr } = await sb
          .from('profiles')
          .select('full_name,name,username,email')
          .eq('id', previousAssignedId)
          .limit(1)
          .maybeSingle();
        if (!prevProfErr && prevProfile) {
          previousAssignedName = (prevProfile as any)?.full_name || (prevProfile as any)?.name || (prevProfile as any)?.username || (prevProfile as any)?.email || null;
          previousAssignedNameSource = 'profiles';
        }
      }
      // Fallback: agents by user_id then id
      if (!previousAssignedName) {
        const { data: agentByUser, error: agentUserErr } = await sb
          .from('agents')
          .select('name,agency_name,email,user_id,id')
          .eq('user_id', previousAssignedId)
          .limit(1)
          .maybeSingle();
        if (!agentUserErr && agentByUser) {
          previousAssignedName = (agentByUser as any)?.name || (agentByUser as any)?.agency_name || (agentByUser as any)?.email || null;
          previousAssignedNameSource = 'agents';
        } else {
          const { data: agentById, error: agentIdErr } = await sb
            .from('agents')
            .select('name,agency_name,email,user_id,id')
            .eq('id', previousAssignedId)
            .limit(1)
            .maybeSingle();
          if (!agentIdErr && agentById) {
            previousAssignedName = (agentById as any)?.name || (agentById as any)?.agency_name || (agentById as any)?.email || null;
            previousAssignedNameSource = 'agents';
          }
        }
      }
    }
  } catch {}

  // Resolve staff ID if a name was provided
  let staffProfileId = staffIdOrName;
  let staffAssignedName: string | null = null;
  let assignedToNameSource: 'staff' | 'profiles' | 'agents' | undefined;
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(staffIdOrName);
  if (!looksLikeUuid) {
    // Resolve by name: prefer staff, then profiles
    let res = await sb
      .from('staff' as any)
      .select('id,name')
      .ilike('name', staffIdOrName)
      .limit(1)
      .maybeSingle();
    let staffFound = res.data;
    if (!staffFound?.id) {
      res = await sb
        .from('profiles')
        .select('id,full_name,name,username')
        .ilike('full_name', staffIdOrName)
        .limit(1)
        .maybeSingle();
      staffFound = res.data;
      if (staffFound?.id) {
        staffAssignedName = (staffFound as any)?.full_name || (staffFound as any)?.name || (staffFound as any)?.username || null;
        assignedToNameSource = 'profiles';
      }
    }
    if (!staffFound?.id) {
      return { error: res.error || new Error('Staff profile not found for name: ' + staffIdOrName) };
    }
    staffProfileId = (staffFound as any).id as string;
    if (!staffAssignedName) {
      staffAssignedName = (staffFound as any)?.name || null;
      assignedToNameSource = assignedToNameSource || 'staff';
    }
  } else {
    // Resolve display name for UUID case
    try {
      const { data: staffRow, error: staffErr } = await sb
        .from('staff' as any)
        .select('name,email')
        .eq('id', staffProfileId)
        .limit(1)
        .maybeSingle();
      if (!staffErr && staffRow) {
        staffAssignedName = (staffRow as any)?.name || (staffRow as any)?.email || null;
        assignedToNameSource = 'staff';
      }
      if (!staffAssignedName) {
        const { data: profRow, error: profErr } = await sb
          .from('profiles')
          .select('full_name,name,username,email')
          .eq('id', staffProfileId)
          .limit(1)
          .maybeSingle();
        if (!profErr && profRow) {
          staffAssignedName = (profRow as any)?.full_name || (profRow as any)?.name || (profRow as any)?.username || (profRow as any)?.email || null;
          assignedToNameSource = 'profiles';
        }
      }
      if (!staffAssignedName) {
        const { data: agentByUser, error: agentUserErr } = await sb
          .from('agents')
          .select('name,agency_name,email,user_id,id')
          .eq('user_id', staffProfileId)
          .limit(1)
          .maybeSingle();
        if (!agentUserErr && agentByUser) {
          staffAssignedName = (agentByUser as any)?.name || (agentByUser as any)?.agency_name || (agentByUser as any)?.email || null;
          assignedToNameSource = 'agents';
        } else {
          const { data: agentById, error: agentIdErr } = await sb
            .from('agents')
            .select('name,agency_name,email,user_id,id')
            .eq('id', staffProfileId)
            .limit(1)
            .maybeSingle();
          if (!agentIdErr && agentById) {
            staffAssignedName = (agentById as any)?.name || (agentById as any)?.agency_name || (agentById as any)?.email || null;
            assignedToNameSource = 'agents';
          }
        }
      }
    } catch {}
  }

  // Update assignment on the enquiry
  const { error: updateError } = await sb
    .from('enquiries')
    .update({ assigned_to: staffProfileId, status: 'assigned' })
    .eq('id', found.id);
  if (updateError) return { error: updateError };

  // Insert assignment history
  const { error: historyError } = await sb
    .from('assignment_history')
    .insert({
      enquiry_id: found.id,
      staff_id: staffProfileId,
      assigned_by: assignedBy || null,
      reason: reason || null,
      // Persist the specific rule label used for assignment for clearer UI feedback
      rule_applied: reason || null,
      is_auto_assigned: !!isAutoAssigned,
    });
  if (historyError) return { error: historyError };

  // Record workflow event (assigned)
  try {
    await createWorkflowEvent({
      enquiryBusinessId,
      eventType: 'assigned',
      userId: assignedBy || null,
      userName: null,
      userRole: isAutoAssigned ? 'system' : null,
      details: `Assigned to ${staffAssignedName || staffProfileId}${previousAssignedId ? ` (prev: ${previousAssignedName || previousAssignedId})` : ''}`,
      metadata: {
        assignedTo: staffProfileId,
        assignedToName: staffAssignedName || undefined,
        assignedToNameSource: assignedToNameSource || undefined,
        assignedBy,
        isAutoAssigned: !!isAutoAssigned,
        reason: reason || undefined,
        previousAssignedId: previousAssignedId || undefined,
        previousAssignedName: previousAssignedName || undefined,
        previousAssignedNameSource: previousAssignedNameSource || undefined,
        oldStatus: previousStatus || undefined,
        newStatus: 'assigned'
      },
    });
  } catch (e) {
    // Non-blocking: ignore workflow event failure
  }

  return { error: null };
}

// Ensure enquiry configuration exists and includes the given country. Also sync localStorage for legacy utils.
export async function ensureCountryConfig(countryCode?: string): Promise<EnquiryConfiguration> {
  try {
    const existing = (await AppSettingsService.getSettingValue(SETTING_CATEGORIES.GENERAL, 'enquiry_configuration')) as EnquiryConfiguration | null;
    let config: EnquiryConfiguration = existing ?? {
      countries: DEFAULT_ENQUIRY_COUNTRIES,
      defaultCountryCode: 'TH'
    };

    // If a target country is provided, ensure it's present and active in the config
    if (countryCode) {
      const hasCountry = Array.isArray(config.countries) && config.countries.some(c => c.countryCode === countryCode && c.isActive);
      if (!hasCountry) {
        const invCountry = initialCountries.find(c => c.code === countryCode);
        const template = DEFAULT_ENQUIRY_COUNTRIES.find(c => c.countryCode === countryCode) || DEFAULT_ENQUIRY_COUNTRIES[0];
        const newCountry: CountryEnquirySettings = {
          countryCode,
          countryName: invCountry?.name || countryCode,
          prefix: template?.prefix || 'ENQ',
          yearFormat: template?.yearFormat || 'YYYY',
          yearSeparator: template?.yearSeparator || 'none',
          numberLength: template?.numberLength || 4,
          numberSeparator: template?.numberSeparator || 'none',
          startingNumber: template?.startingNumber || 1,
          isDefault: false,
          isActive: true
        };
        config = {
          ...config,
          countries: [...(config.countries || []), newCountry]
        };
        if (!config.defaultCountryCode) {
          config.defaultCountryCode = countryCode;
        }
      }
    }

    // Persist to unified App Settings store (DB with local fallback)
    await AppSettingsHelpers.upsertSetting({
      category: SETTING_CATEGORIES.GENERAL,
      setting_key: 'enquiry_configuration',
      setting_json: config as any,
      data_type: 'json',
      is_active: true
    });

    // Keep legacy localStorage in sync for EnqIdGenerator
    try {
      const stored = localStorage.getItem('applicationSettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, enquirySettings: config };
        localStorage.setItem('applicationSettings', JSON.stringify(updated));
      } else {
        localStorage.setItem('applicationSettings', JSON.stringify({ enquirySettings: config }));
      }
    } catch {}

    return config;
  } catch (e) {
    // On any error, fall back to defaults and ensure at least localStorage has config
    const fallback: EnquiryConfiguration = {
      countries: DEFAULT_ENQUIRY_COUNTRIES,
      defaultCountryCode: 'TH'
    };
    try {
      localStorage.setItem('applicationSettings', JSON.stringify({ enquirySettings: fallback }));
    } catch {}
    return fallback;
  }
}
