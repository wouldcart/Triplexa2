import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';
import { TourPackage, ItineraryDay, Destination } from '@/types/package';

export type TourPackageRow = Tables<'tour_packages'>;
export type TourPackageInsert = TablesInsert<'tour_packages'>;
export type TourPackageUpdate = TablesUpdate<'tour_packages'>;

// Normalize itinerary JSON from DB to ensure safe defaults
function normalizeItinerary(raw: any): ItineraryDay[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((d: any, idx: number) => ({
    id: d?.id ?? `day-${idx + 1}-${Date.now()}`,
    day: Number(d?.day ?? idx + 1),
    title: String(d?.title ?? `Day ${Number(d?.day ?? idx + 1)}`),
    description: d?.description ?? '',
    city: d?.city ?? '',
    meals: {
      breakfast: Boolean(d?.meals?.breakfast),
      lunch: Boolean(d?.meals?.lunch),
      dinner: Boolean(d?.meals?.dinner),
    },
    accommodation: d?.accommodation ?? {},
    activities: Array.isArray(d?.activities) ? d.activities : [],
    transportation: d?.transportation ?? undefined,
  }));
}

// Mapping helpers between Supabase row and UI TourPackage
function rowToTourPackage(row: TourPackageRow): TourPackage {
  return {
    id: row.id,
    name: row.name,
    summary: row.summary ?? undefined,
    description: row.description ?? undefined,
    minPax: row.min_pax,
    maxPax: row.max_pax ?? undefined,
    days: row.days,
    nights: row.nights,
    isFixedDeparture: Boolean(row.is_fixed_departure),
    departureDate: row.departure_date ?? undefined,
    returnDate: row.return_date ?? undefined,
    totalSeats: row.total_seats ?? undefined,
    startCity: row.start_city ?? '',
    endCity: row.end_city ?? '',
    destinations: (row.destinations as unknown as Destination[]) ?? [],
    packageType: row.package_type as TourPackage['packageType'],
    themes: (row.themes as unknown as string[]) ?? [],
    banners: (row.banners as unknown as string[]) ?? [],
    itinerary: normalizeItinerary(row.itinerary),
    baseCost: row.base_cost ?? 0,
    markup: row.markup ?? 0,
    commission: row.commission ?? undefined,
    finalPrice: row.final_price ?? 0,
    pricePerPerson: row.price_per_person ?? 0,
    currency: row.currency,
    inclusions: row.inclusions ?? undefined,
    exclusions: row.exclusions ?? undefined,
    cancellationPolicy: row.cancellation_policy ?? undefined,
    paymentPolicy: row.payment_policy ?? undefined,
    status: row.status as TourPackage['status'],
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
  };
}

export function buildInsertFromUi(pkg: Partial<TourPackage>): TourPackageInsert {
  return {
    id: pkg.id,
    name: pkg.name!,
    summary: pkg.summary ?? null,
    description: pkg.description ?? null,
    min_pax: pkg.minPax!,
    max_pax: pkg.maxPax ?? null,
    days: pkg.days!,
    nights: pkg.nights!,
    is_fixed_departure: pkg.isFixedDeparture ?? null,
    departure_date: pkg.departureDate ?? null,
    return_date: pkg.returnDate ?? null,
    total_seats: pkg.totalSeats ?? null,
    start_city: pkg.startCity ?? null,
    end_city: pkg.endCity ?? null,
    destinations: Array.isArray(pkg.destinations) ? (pkg.destinations as unknown as any) : [],
    package_type: pkg.packageType!,
    themes: Array.isArray(pkg.themes) ? (pkg.themes as unknown as any) : [],
    banners: Array.isArray(pkg.banners) ? (pkg.banners as unknown as any) : [],
    itinerary: Array.isArray(pkg.itinerary) ? (pkg.itinerary as unknown as any) : [],
    base_cost: pkg.baseCost ?? 0,
    markup: pkg.markup ?? 0,
    commission: pkg.commission ?? null,
    final_price: pkg.finalPrice ?? 0,
    price_per_person: pkg.pricePerPerson ?? 0,
    currency: pkg.currency!,
    inclusions: pkg.inclusions ?? null,
    exclusions: pkg.exclusions ?? null,
    cancellation_policy: pkg.cancellationPolicy ?? null,
    payment_policy: pkg.paymentPolicy ?? null,
    status: pkg.status ?? 'draft',
    created_at: pkg.createdAt ?? new Date().toISOString(),
    updated_at: pkg.updatedAt ?? null,
    external_id: null,
  };
}

function tourPackageToUpdate(pkg: Partial<TourPackage>): TourPackageUpdate {
  const update: TourPackageUpdate = {
    name: pkg.name,
    summary: pkg.summary ?? null,
    description: pkg.description ?? null,
    min_pax: pkg.minPax,
    max_pax: pkg.maxPax ?? null,
    days: pkg.days,
    nights: pkg.nights,
    is_fixed_departure: pkg.isFixedDeparture ?? null,
    departure_date: pkg.departureDate ?? null,
    return_date: pkg.returnDate ?? null,
    total_seats: pkg.totalSeats ?? null,
    start_city: pkg.startCity ?? null,
    end_city: pkg.endCity ?? null,
    destinations: Array.isArray(pkg.destinations) ? (pkg.destinations as unknown as any) : [],
    package_type: pkg.packageType,
    themes: Array.isArray(pkg.themes) ? (pkg.themes as unknown as any) : [],
    banners: Array.isArray(pkg.banners) ? (pkg.banners as unknown as any) : [],
    itinerary: Array.isArray(pkg.itinerary) ? (pkg.itinerary as unknown as any) : [],
    base_cost: pkg.baseCost,
    markup: pkg.markup,
    commission: pkg.commission ?? null,
    final_price: pkg.finalPrice,
    price_per_person: pkg.pricePerPerson,
    currency: pkg.currency,
    inclusions: pkg.inclusions ?? null,
    exclusions: pkg.exclusions ?? null,
    cancellation_policy: pkg.cancellationPolicy ?? null,
    payment_policy: pkg.paymentPolicy ?? null,
    status: pkg.status,
    updated_at: pkg.updatedAt ?? new Date().toISOString(),
  };
  return update;
}

export const tourPackageService = {
  async listTourPackages(filters?: { status?: string; search?: string }) {
    let query = supabase
      .from('tour_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      // Search by name or destinations country/city names
      const s = filters.search;
      query = query.or(
        `name.ilike.%${s}%,start_city.ilike.%${s}%,end_city.ilike.%${s}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(rowToTourPackage);
  },

  async getTourPackageById(id: string): Promise<TourPackage> {
    const { data, error } = await supabase
      .from('tour_packages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return rowToTourPackage(data);
  },

  async createTourPackage(pkg: TourPackageInsert): Promise<TourPackage> {
    const { data, error } = await supabase
      .from('tour_packages')
      .insert(pkg)
      .select()
      .single();
    if (error) throw error;
    return rowToTourPackage(data);
  },

  async createFromUiPackage(pkg: Partial<TourPackage>): Promise<TourPackage> {
    const payload = buildInsertFromUi(pkg);
    return this.createTourPackage(payload);
  },

  async updateTourPackage(id: string, updates: TourPackageUpdate): Promise<TourPackage> {
    const { data, error } = await supabase
      .from('tour_packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToTourPackage(data);
  },

  async updateFromUiPackage(id: string, pkg: Partial<TourPackage>): Promise<TourPackage> {
    const payload = tourPackageToUpdate(pkg);
    return this.updateTourPackage(id, payload);
  },

  async deleteTourPackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_packages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async searchTourPackages(searchTerm: string): Promise<TourPackage[]> {
    const { data, error } = await supabase
      .from('tour_packages')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,start_city.ilike.%${searchTerm}%,end_city.ilike.%${searchTerm}%`)
      .order('name');
    if (error) throw error;
    return (data ?? []).map(rowToTourPackage);
  },

  async setStatus(id: string, status: TourPackage['status']): Promise<TourPackage> {
    return this.updateTourPackage(id, { status });
  },
};