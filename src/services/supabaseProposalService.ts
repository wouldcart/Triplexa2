import { supabase } from '@/lib/supabaseClient';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';

const sb = supabase as any;

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function resolveEnquiryUuid(enquiryBusinessOrUuid: string): Promise<string | null> {
  try {
    if (isUuid(enquiryBusinessOrUuid)) return enquiryBusinessOrUuid;
    const { data, error } = await sb
      .from('enquiries')
      .select('id')
      .eq('enquiry_id', enquiryBusinessOrUuid)
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function getCurrentProfileId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

function generateDraftProposalId(queryId: string, draftType: string): string {
  return `DRAFT-${queryId}-${draftType}`;
}

function generateProposalId(queryId: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PROP${year}${rand}`;
}

function computeCostPerPerson(query: Query, totalCost: number): number {
  const pax = (query?.paxDetails?.adults || 0) + (query?.paxDetails?.children || 0) + (query?.paxDetails?.infants || 0);
  const divisor = pax > 0 ? pax : 1;
  return Number((totalCost / divisor).toFixed(2));
}

function buildTitle(query: Query, days: ItineraryDay[]): string {
  const d = days?.length || query?.tripDuration?.days || 0;
  const country = query?.destination?.country || 'Trip';
  return `Proposal for ${country} (${d} days)`;
}

function buildDescription(days: ItineraryDay[]): string {
  const parts = days.slice(0, 5).map((d) => d.title || `Day ${d.dayNumber}`);
  return parts.length ? `Includes: ${parts.join(', ')}...` : 'Day-by-day itinerary proposal.';
}

function buildItineraryData(days: ItineraryDay[]): Record<string, any> {
  const normalizedDays = days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title,
    city: day.city,
    description: day.description,
    date: day.date,
    activities: day.activities || [],
    transport: day.transport || [],
    accommodations: day.accommodations || [],
    accommodation: day.accommodation || null,
    meals: day.meals || { breakfast: false, lunch: false, dinner: false },
    totalCost: day.totalCost || 0,
  }));
  // Initial shape supports optional selections alongside days
  return {
    days: normalizedDays,
    sightseeing_options: [],
    city_selection: null,
  };
}

function buildAccommodationData(days: ItineraryDay[]): Record<string, any> {
  const all: any[] = [];
  for (const day of days) {
    if (day.accommodation) {
      all.push({ ...day.accommodation, dayId: day.id, city: day.city, date: day.date });
    }
    (day.accommodations || []).forEach((acc) => {
      all.push({ ...acc, dayId: day.id, city: day.city, date: day.date });
    });
  }
  return { options: all };
}

function buildPricingData(totalCost: number, currency = 'USD'): Record<string, any> {
  return {
    basePrice: totalCost,
    finalPrice: totalCost,
    markup: 0,
    currency,
    transport_options: [],
  };
}

// Generic deep merge for plain objects; arrays are replaced by source
function isPlainObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: any = { ...target };
  for (const key of Object.keys(source || {})) {
    const srcVal = (source as any)[key];
    const tgtVal = result[key];
    if (srcVal === undefined) continue;
    if (Array.isArray(srcVal)) {
      // Replace arrays entirely to avoid unintended concatenation
      result[key] = srcVal.slice();
    } else if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result as T;
}

// Normalize legacy itinerary_data that may be stored as an array
function normalizeItineraryData(data: any): { days: any[]; sightseeing_options: any[]; city_selection: string | null } {
  if (Array.isArray(data)) {
    return { days: data, sightseeing_options: [], city_selection: null };
  }
  const base = isPlainObject(data) ? data : {};
  return {
    days: Array.isArray((base as any).days) ? (base as any).days : [],
    sightseeing_options: Array.isArray((base as any).sightseeing_options) ? (base as any).sightseeing_options : [],
    city_selection: typeof (base as any).city_selection === 'string' || (base as any).city_selection === null
      ? (base as any).city_selection ?? null
      : null,
  };
}

function normalizePricingData(data: any): { basePrice?: number; finalPrice?: number; markup?: number; currency?: string; transport_options: any[] } {
  const base = isPlainObject(data) ? data : {};
  return {
    basePrice: typeof (base as any).basePrice === 'number' ? (base as any).basePrice : undefined,
    finalPrice: typeof (base as any).finalPrice === 'number' ? (base as any).finalPrice : undefined,
    markup: typeof (base as any).markup === 'number' ? (base as any).markup : undefined,
    currency: typeof (base as any).currency === 'string' ? (base as any).currency : undefined,
    transport_options: Array.isArray((base as any).transport_options) ? (base as any).transport_options : [],
  };
}

export const SupabaseProposalService = {
  /**
   * Fetch latest draft by enquiry and draft_type
   */
  async getLatestDraftForEnquiry(
    enquiryBusinessOrUuid: string,
    draftType: 'daywise' | 'enhanced'
  ): Promise<{ data?: any; error?: any }> {
    const enquiryUuid = await resolveEnquiryUuid(enquiryBusinessOrUuid);
    if (!enquiryUuid) return { error: 'enquiry_uuid_not_found' };
    const { data, error } = await sb
      .from('proposals')
      .select(
        'id, proposal_id, enquiry_id, title, description, cost_per_person, total_cost, final_price, currency, status, inclusions, exclusions, terms, created_by, created_at, updated_at, sent_at, accepted_at, rejected_at, draft_type, version, itinerary_data, accommodation_data, pricing_data, email_data, agent_feedback, modifications, viewed_at, last_saved'
      )
      .eq('enquiry_id', enquiryUuid)
      .eq('draft_type', draftType)
      .eq('status', 'draft')
      .order('last_saved', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (error) return { error };
    return { data };
  },
  /**
   * List all proposals (including drafts) for an enquiry
   */
  async listProposalsByEnquiry(enquiryBusinessOrUuid: string): Promise<{ data?: any[]; error?: any }> {
    const enquiryUuid = await resolveEnquiryUuid(enquiryBusinessOrUuid);
    if (!enquiryUuid) return { error: 'enquiry_uuid_not_found' };
    const { data, error } = await sb
      .from('proposals')
      .select(
        'id, proposal_id, enquiry_id, title, description, cost_per_person, total_cost, final_price, currency, status, inclusions, exclusions, terms, created_by, created_at, updated_at, sent_at, accepted_at, rejected_at, draft_type, version, itinerary_data, accommodation_data, pricing_data, email_data, agent_feedback, modifications, viewed_at, last_saved'
      )
      .eq('enquiry_id', enquiryUuid)
      .order('updated_at', { ascending: false, nullsFirst: false });
    if (error) return { error };
    return { data: data || [] };
  },

  /**
   * Fetch draft by its proposal_id
   */
  async getDraftByProposalId(proposalId: string): Promise<{ data?: any; error?: any }> {
    const { data, error } = await sb
      .from('proposals')
      .select(
        'id, proposal_id, enquiry_id, title, description, cost_per_person, total_cost, final_price, currency, status, inclusions, exclusions, terms, created_by, created_at, updated_at, sent_at, accepted_at, rejected_at, draft_type, version, itinerary_data, accommodation_data, pricing_data, email_data, agent_feedback, modifications, viewed_at, last_saved'
      )
      .eq('proposal_id', proposalId)
      .limit(1)
      .maybeSingle();
    if (error) return { error };
    return { data };
  },
  async upsertDraftProposal(params: {
    query: Query;
    days: ItineraryDay[];
    totalCost: number;
    draftType: string;
  }): Promise<{ id?: string; proposal_id?: string; error?: any }> {
    const { query, days, totalCost, draftType } = params;
    const enquiryUuid = await resolveEnquiryUuid(query.id);
    if (!enquiryUuid) {
      return { error: 'enquiry_uuid_not_found' };
    }

    const createdBy = await getCurrentProfileId();
    const proposal_id = generateDraftProposalId(query.id, draftType);

    const row = {
      proposal_id,
      enquiry_id: enquiryUuid,
      title: buildTitle(query, days),
      description: buildDescription(days),
      cost_per_person: computeCostPerPerson(query, totalCost),
      total_cost: Number(totalCost.toFixed(2)),
      final_price: Number(totalCost.toFixed(2)),
      currency: query?.budget?.currency || 'USD',
      status: 'draft',
      inclusions: [],
      exclusions: [],
      terms: query?.inclusions?.mealPlan || null,
      created_by: createdBy,
      draft_type: draftType,
      version: 1,
      itinerary_data: buildItineraryData(days),
      accommodation_data: buildAccommodationData(days),
      pricing_data: buildPricingData(totalCost, query?.budget?.currency || 'USD'),
      email_data: {},
      agent_feedback: null,
      modifications: [],
      last_saved: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from('proposals')
      .upsert(row, { onConflict: 'proposal_id' })
      .select('id,proposal_id')
      .maybeSingle();

    if (error) return { error };
    return { id: data?.id, proposal_id: data?.proposal_id };
  },

  async createProposal(params: {
    query: Query;
    days: ItineraryDay[];
    totalCost: number;
    draftType?: string;
    title?: string;
    description?: string;
  }): Promise<{ id?: string; proposal_id?: string; error?: any }> {
    const { query, days, totalCost, draftType = 'enhanced', title, description } = params;
    const enquiryUuid = await resolveEnquiryUuid(query.id);
    if (!enquiryUuid) {
      return { error: 'enquiry_uuid_not_found' };
    }

    const createdBy = await getCurrentProfileId();
    const proposal_id = generateProposalId(query.id);

    // Build optional records from query data
    const optionalRecords = {}; // Default empty optional records

    const row = {
      proposal_id,
      enquiry_id: enquiryUuid,
      title: title || buildTitle(query, days),
      description: description || buildDescription(days),
      cost_per_person: computeCostPerPerson(query, totalCost),
      total_cost: Number(totalCost.toFixed(2)),
      final_price: Number(totalCost.toFixed(2)),
      currency: query?.budget?.currency || 'USD',
      status: 'draft',
      inclusions: [],
      exclusions: [],
      terms: query?.inclusions?.mealPlan || null,
      created_by: createdBy,
      draft_type: draftType,
      version: 1,
      itinerary_data: buildItineraryData(days),
      accommodation_data: buildAccommodationData(days),
      pricing_data: buildPricingData(totalCost, query?.budget?.currency || 'USD'),
      email_data: {},
      agent_feedback: null,
      modifications: [],
      last_saved: new Date().toISOString(),
      optional_records: optionalRecords,
    };

    const { data, error } = await sb
      .from('proposals')
      .insert(row)
      .select('id,proposal_id')
      .maybeSingle();

    if (error) return { error };
    return { id: data?.id, proposal_id: data?.proposal_id };
  },

  async updateProposalStatus(proposalId: string, status: 'draft' | 'ready' | 'sent' | 'accepted' | 'rejected') {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (status === 'sent') payload.sent_at = new Date().toISOString();
    if (status === 'accepted') payload.accepted_at = new Date().toISOString();
    if (status === 'rejected') payload.rejected_at = new Date().toISOString();
    
    // Handle draft formats by extracting the base enquiry ID
    let searchId = proposalId;
    
    // If it's a draft format like "DRAFT-ENQ20257999-enhanced", extract the base enquiry ID
    if (proposalId.startsWith('DRAFT-')) {
      const parts = proposalId.split('-');
      if (parts.length >= 2 && parts[1].startsWith('ENQ')) {
        searchId = parts[1]; // Extract "ENQ20257999" from "DRAFT-ENQ20257999-enhanced"
      }
    }
    
    return await sb.from('proposals').update(payload).eq('proposal_id', searchId);
  },

  /**
   * Update draft fields for an existing draft row identified by queryId + draftType.
   * Will not create rows. Ensure a row is created via upsertDraftProposal beforehand.
   */
  async updateDraftFields(params: {
    queryId: string;
    draftType: 'daywise' | 'enhanced';
    patch: Partial<{
      itinerary_data: any;
      accommodation_data: any;
      pricing_data: any;
      email_data: any;
      terms: string;
      inclusions: any;
      exclusions: any;
      status: 'draft' | 'ready' | 'sent' | 'accepted' | 'rejected';
      version: number;
    }>;
  }): Promise<{ data?: any; error?: any }> {
    const { queryId, draftType, patch } = params;
    const proposalId = generateDraftProposalId(queryId, draftType);

    try {
      // Fetch existing JSONB fields to allow deep merge
      const { data: existing, error: fetchError } = await sb
        .from('proposals')
        .select('id, itinerary_data, accommodation_data, pricing_data, email_data, inclusions, exclusions, terms, version')
        .eq('proposal_id', proposalId)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        // If fetch fails, attempt direct update as a fallback
        const payload = {
          ...patch,
          updated_at: new Date().toISOString(),
          last_saved: new Date().toISOString(),
        } as any;
        const { data, error } = await sb
          .from('proposals')
          .update(payload)
          .eq('proposal_id', proposalId)
          .select('id, proposal_id, version, last_saved')
          .maybeSingle();
        if (error) return { error };
        return { data };
      }

      // Prepare merged payloads for JSONB fields
      let mergedItinerary = existing?.itinerary_data;
      if (patch.itinerary_data !== undefined) {
        const currentNormalized = normalizeItineraryData(existing?.itinerary_data);
        const patchNormalized = normalizeItineraryData(patch.itinerary_data);
        mergedItinerary = deepMerge(currentNormalized, patchNormalized);
      }

      let mergedPricing = existing?.pricing_data;
      if (patch.pricing_data !== undefined) {
        const currentNormalized = normalizePricingData(existing?.pricing_data);
        const patchNormalized = normalizePricingData(patch.pricing_data);
        mergedPricing = deepMerge(currentNormalized, patchNormalized);
      }

      // Accommodation and email: simple replacement if provided
      const mergedAccommodation = patch.accommodation_data !== undefined ? patch.accommodation_data : existing?.accommodation_data;
      const mergedEmail = patch.email_data !== undefined ? patch.email_data : existing?.email_data;

      // Inclusions/Exclusions/Terms: replace if provided
      const mergedInclusions = patch.inclusions !== undefined ? patch.inclusions : existing?.inclusions;
      const mergedExclusions = patch.exclusions !== undefined ? patch.exclusions : existing?.exclusions;
      const mergedTerms = patch.terms !== undefined ? patch.terms : existing?.terms;

      // Build final payload
      const payload: any = {
        updated_at: new Date().toISOString(),
        last_saved: new Date().toISOString(),
      };
      if (patch.status !== undefined) payload.status = patch.status;
      if (patch.version !== undefined) payload.version = patch.version;
      if (patch.itinerary_data !== undefined) payload.itinerary_data = mergedItinerary;
      if (patch.pricing_data !== undefined) payload.pricing_data = mergedPricing;
      if (patch.accommodation_data !== undefined) payload.accommodation_data = mergedAccommodation;
      if (patch.email_data !== undefined) payload.email_data = mergedEmail;
      if (patch.inclusions !== undefined) payload.inclusions = mergedInclusions;
      if (patch.exclusions !== undefined) payload.exclusions = mergedExclusions;
      if (patch.terms !== undefined) payload.terms = mergedTerms;

      const { data, error } = await sb
        .from('proposals')
        .update(payload)
        .eq('proposal_id', proposalId)
        .select('id, proposal_id, version, last_saved')
        .maybeSingle();
      if (error) return { error };
      return { data };
    } catch (e) {
      return { error: e };
    }
  },
  /**
   * Delete a proposal or draft row by its proposal_id
   */
  async deleteByProposalId(proposalId: string): Promise<{ data?: any; error?: any }> {
    try {
      const { data, error } = await sb
        .from('proposals')
        .delete()
        .eq('proposal_id', proposalId)
        .select('proposal_id')
        .maybeSingle();
      if (error) return { error };
      return { data };
    } catch (e) {
      return { error: e };
    }
  },
};

export default SupabaseProposalService;
