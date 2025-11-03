import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { Sightseeing } from '@/types/sightseeing';

// DB row shape for public.sightseeing (partial, using JSONB for complex fields)
// Supabase returns int8 (BIGSERIAL) as string; coerce to number in mapper
type SightseeingRow = {
  id: string;
  external_id: number | null;
  name: string;
  description?: string | null;
  country: string;
  city: string;
  category?: string | null;
  status: 'active' | 'inactive';
  image_url?: string | null;
  images?: any | null;
  activities?: any | null;
  duration?: string | null;
  transfer_types?: any | null;
  transfer_options?: any | null;
  address?: string | null;
  google_map_link?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: any | null;
  difficulty_level?: string | null;
  season?: string | null;
  allowed_age_group?: string | null;
  days_of_week?: any | null;
  timing?: string | null;
  pickup_time?: string | null;
  package_options?: any | null;
  group_size_options?: any | null;
  pricing_options?: any | null;
  other_inclusions?: string | null;
  advisory?: string | null;
  cancellation_policy?: string | null;
  refund_policy?: string | null;
  confirmation_policy?: string | null;
  terms_conditions?: string | null;
  is_free?: boolean | null;
  policies?: any | null;
  validity_period?: any | null;
  is_expired?: boolean | null;
  expiration_notified?: boolean | null;
  currency?: string | null;
  sic_available?: boolean | null;
  sic_pricing?: any | null;
  requires_mandatory_transfer?: boolean | null;
  transfer_mandatory?: boolean | null;
  created_at: string;
  last_updated: string;
};

function mapRowToSightseeing(row: SightseeingRow): Sightseeing {
  const difficulty = (row.difficulty_level ?? undefined) as Sightseeing['difficultyLevel'];
  const uuidToNumber = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const allowedDifficulty = new Set(['Easy', 'Moderate', 'Difficult']);
  return {
    id: (row.external_id ?? uuidToNumber(row.id)),
    name: row.name,
    description: row.description ?? undefined,
    country: row.country,
    city: row.city,
    category: row.category ?? undefined,
    status: row.status,
    imageUrl: row.image_url ?? undefined,
    images: (row.images ?? undefined) as Sightseeing['images'],
    activities: Array.isArray(row.activities) ? (row.activities as string[]) : (row.activities ? [String(row.activities)] : []),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    lastUpdated: row.last_updated,
    createdAt: row.created_at,
    duration: row.duration ?? undefined,
    transferOptions: (row.transfer_options ?? undefined) as Sightseeing['transferOptions'],
    address: row.address ?? undefined,
    googleMapLink: row.google_map_link ?? undefined,
    price: (row.price ?? undefined) as Sightseeing['price'],
    difficultyLevel: difficulty && allowedDifficulty.has(difficulty) ? difficulty : undefined,
    season: row.season ?? undefined,
    allowedAgeGroup: row.allowed_age_group ?? undefined,
    daysOfWeek: Array.isArray(row.days_of_week) ? (row.days_of_week as string[]) : (row.days_of_week ? [String(row.days_of_week)] : []),
    timing: row.timing ?? undefined,
    pickupTime: row.pickup_time ?? undefined,
    packageOptions: (row.package_options ?? undefined) as Sightseeing['packageOptions'],
    groupSizeOptions: (row.group_size_options ?? undefined) as Sightseeing['groupSizeOptions'],
    pricingOptions: (row.pricing_options ?? undefined) as Sightseeing['pricingOptions'],
    isFree: row.is_free ?? undefined,
    policies: (row.policies ?? undefined) as Sightseeing['policies'],
    validityPeriod: (row.validity_period ?? undefined) as Sightseeing['validityPeriod'],
    sicAvailable: row.sic_available ?? undefined,
    sicPricing: (row.sic_pricing ?? undefined) as Sightseeing['sicPricing'],
    requiresMandatoryTransfer: row.requires_mandatory_transfer ?? undefined,
    transferMandatory: row.transfer_mandatory ?? undefined,
  };
}

function mapSightseeingToRow(data: Sightseeing): Partial<SightseeingRow> {
  return {
    // id omitted for insert; used for update matching
    external_id: data.id,
    name: data.name,
    description: data.description ?? null,
    country: data.country,
    city: data.city,
    category: data.category ?? null,
    status: data.status,
    // Include JSONB arrays/objects as per target schema
    images: data.images ?? [],
    activities: data.activities ?? [],
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    duration: data.duration ?? null,
    transfer_options: data.transferOptions ?? [],
    address: data.address ?? null,
    google_map_link: data.googleMapLink ?? null,
    price: data.price ?? null,
    difficulty_level: data.difficultyLevel ?? null,
    season: data.season ?? null,
    allowed_age_group: data.allowedAgeGroup ?? null,
    days_of_week: data.daysOfWeek ?? [],
    timing: data.timing ?? null,
    pickup_time: data.pickupTime ?? null,
    package_options: data.packageOptions ?? [],
    group_size_options: data.groupSizeOptions ?? [],
    pricing_options: data.pricingOptions ?? [],
    is_free: data.isFree ?? null,
    policies: data.policies ?? null,
    validity_period: data.validityPeriod ?? null,
    sic_available: data.sicAvailable ?? null,
    sic_pricing: data.sicPricing ?? null,
    requires_mandatory_transfer: data.requiresMandatoryTransfer ?? null,
    transfer_mandatory: data.transferMandatory ?? null,
    // pricing currency fields omitted: table may not include these columns
    // timestamps handled by DB; can optionally send last_updated
  };
}

export async function listSightseeings(): Promise<Sightseeing[]> {
  const { data, error } = await supabase
    .from('sightseeing')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapRowToSightseeing(r as SightseeingRow));
}

export async function getSightseeingById(id: number): Promise<Sightseeing | null> {
  const { data, error } = await supabase
    .from('sightseeing')
    .select('*')
    .eq('external_id', id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRowToSightseeing(data as SightseeingRow) : null;
}

export async function createSightseeing(payload: Sightseeing): Promise<Sightseeing> {
  // Ensure external_id is assigned sequentially when missing
  const client = isAdminClientConfigured ? adminSupabase : supabase;
  let row = mapSightseeingToRow(payload);
  if (!row.external_id || row.external_id === 0) {
    const { data: maxRows, error: maxErr } = await client
      .from('sightseeing')
      .select('external_id')
      .order('external_id', { ascending: false })
      .limit(1);
    if (!maxErr) {
      const maxExternalId = (maxRows && maxRows[0]?.external_id) ? Number(maxRows[0].external_id) : 0;
      row = { ...row, external_id: maxExternalId + 1 };
    } else {
      console.warn('Could not compute next external_id, defaulting to 1:', maxErr);
      row = { ...row, external_id: 1 };
    }
  }
  const { data, error } = await client
    .from('sightseeing')
    .insert(row as any)
    .select('*')
    .single();
  if (error) {
    const info = {
      operation: 'insert',
      usingAdminClient: !!isAdminClientConfigured,
      hint: isAdminClientConfigured
        ? 'Admin client used. Check schema and payload fields.'
        : 'Anon client used. If RLS is enabled without policies, writes will fail.'
    };
    console.error('Sightseeing insert failed:', info, error);
    throw error;
  }
  return mapRowToSightseeing(data as SightseeingRow);
}

export async function updateSightseeing(payload: Sightseeing): Promise<Sightseeing> {
  if (!payload.id) throw new Error('Sightseeing id is required for update');
  // Merge existing policies to avoid overwriting JSONB when fields are omitted
  let mergedRow = mapSightseeingToRow(payload);
  try {
    const { data: existing, error: fetchError } = await (isAdminClientConfigured ? adminSupabase : supabase)
      .from('sightseeing')
      .select('policies')
      .eq('external_id', payload.id)
      .single();
    if (!fetchError && existing && existing.policies) {
      const existingPolicies = existing.policies as any;
      const incomingPolicies = (mergedRow.policies ?? {}) as any;
      const mergedPolicies = {
        ...existingPolicies,
        ...incomingPolicies,
        // Arrays: prefer incoming if provided, else preserve existing
        highlights: Array.isArray(incomingPolicies?.highlights) ? incomingPolicies.highlights : (existingPolicies?.highlights ?? []),
        exclusions: Array.isArray(incomingPolicies?.exclusions) ? incomingPolicies.exclusions : (existingPolicies?.exclusions ?? []),
        inclusions: Array.isArray(incomingPolicies?.inclusions) ? incomingPolicies.inclusions : (existingPolicies?.inclusions ?? []),
        // Strings: if incoming provided and non-empty, use it; otherwise keep existing
        advisory: (incomingPolicies?.advisory ?? '').trim() ? incomingPolicies.advisory : (existingPolicies?.advisory ?? ''),
        refundPolicy: (incomingPolicies?.refundPolicy ?? '').trim() ? incomingPolicies.refundPolicy : (existingPolicies?.refundPolicy ?? ''),
        confirmationPolicy: (incomingPolicies?.confirmationPolicy ?? '').trim() ? incomingPolicies.confirmationPolicy : (existingPolicies?.confirmationPolicy ?? ''),
        termsConditions: (incomingPolicies?.termsConditions ?? '').trim() ? incomingPolicies.termsConditions : (existingPolicies?.termsConditions ?? ''),
        cancellationPolicy: (incomingPolicies?.cancellationPolicy ?? '').trim() ? incomingPolicies.cancellationPolicy : (existingPolicies?.cancellationPolicy ?? '')
      };
      mergedRow.policies = mergedPolicies as any;
    }
  } catch (e) {
    console.warn('Policy merge skipped due to fetch error:', e);
  }
  const client = isAdminClientConfigured ? adminSupabase : supabase;
  const { data, error } = await client
    .from('sightseeing')
    .update(mergedRow as any)
    .eq('external_id', payload.id)
    .select('*')
    .single();
  if (error) {
    const info = {
      operation: 'update',
      usingAdminClient: !!isAdminClientConfigured,
      matchField: 'external_id',
      matchValue: payload.id,
      hint: isAdminClientConfigured
        ? 'Admin client used. Check that external_id exists and payload fields are valid.'
        : 'Anon client used. If RLS is enabled without policies, updates will fail.'
    };
    console.error('Sightseeing update failed:', info, error);
    throw error;
  }
  return mapRowToSightseeing(data as SightseeingRow);
}

export async function deleteSightseeing(id: number): Promise<void> {
  const client = isAdminClientConfigured ? adminSupabase : supabase;
  const { error } = await client
    .from('sightseeing')
    .delete()
    .eq('external_id', id);
  if (error) {
    const info = {
      operation: 'delete',
      usingAdminClient: !!isAdminClientConfigured,
      matchField: 'external_id',
      matchValue: id,
      hint: isAdminClientConfigured
        ? 'Admin client used. Verify the record exists.'
        : 'Anon client used. If RLS is enabled without policies, deletes will fail.'
    };
    console.error('Sightseeing delete failed:', info, error);
    throw error;
  }
}