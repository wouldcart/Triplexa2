import { supabase } from '../client';
import type { Tables, TablesInsert, TablesUpdate, Json } from '../types';

export type SupabaseRestaurant = Tables<'restaurants'>;
export type SupabaseRestaurantInsert = TablesInsert<'restaurants'>;
export type SupabaseRestaurantUpdate = TablesUpdate<'restaurants'>;

// UI Restaurant type mirrors local UI model
export interface UIRestaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  location?: string | null;
  area?: string | null;
  description: string;
  imageUrl: string | null;
  images?: string[];
  cuisine?: string | null;
  cuisineTypes: string[];
  priceRange?: string | null;
  priceCategory: '$' | '$$' | '$$$' | '$$$$';
  averageCost: number;
  averagePrice?: number | null;
  rating: number | null;
  reviewCount: number | null;
  openingHours?: string | null;
  openingTime: string | null;
  closingTime: string | null;
  contact?: string | null;
  features: {
    outdoorSeating: boolean;
    privateRooms: boolean;
    wifi: boolean;
    parking: boolean;
    liveMusic: boolean;
    cardAccepted: boolean;
  };
  mealTypes: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
    beverages: boolean;
  };
  dietaryOptions: {
    pureVeg: boolean;
    veganFriendly: boolean;
    vegetarian: boolean;
    seafood: boolean;
    poultry: boolean;
    redMeat: boolean;
    aLaCarte: boolean;
  };
  currencyCode?: string | null;
  currencySymbol?: string | null;
  externalId?: string | null;
  status: 'active' | 'inactive';
  isPreferred?: boolean | null;
  lastUpdated?: string;
  vegOptions?: boolean;
}

// Conversion utilities between UI Restaurant and Supabase row
export const convertUIToSupabase = (r: Partial<UIRestaurant>): SupabaseRestaurantInsert => {
  return {
    id: r.id,
    name: r.name!,
    address: r.address!,
    city: r.city!,
    country: r.country!,
    location: r.location ?? null,
    area: r.area ?? null,
    description: r.description ?? null,
    image_url: r.imageUrl ?? null,
    images: r.images ? (r.images as unknown as Json) : null,
    cuisine: r.cuisine ?? null,
    cuisine_types: r.cuisineTypes ? (r.cuisineTypes as unknown as Json) : null,
    price_range: r.priceRange ?? null,
    price_category: r.priceCategory!,
    average_cost: r.averageCost!,
    average_price: r.averagePrice ?? null,
    rating: r.rating ?? null,
    review_count: r.reviewCount ?? null,
    opening_hours: r.openingHours ?? ((r.openingTime && r.closingTime) ? `${r.openingTime} - ${r.closingTime}` : null),
    opening_time: r.openingTime ?? null,
    closing_time: r.closingTime ?? null,
    contact: r.contact ?? null,
    features: (r.features as unknown as Json) ?? { outdoorSeating: false, privateRooms: false, wifi: false, parking: false, liveMusic: false, cardAccepted: false },
    meal_types: (r.mealTypes as unknown as Json) ?? { breakfast: false, lunch: false, dinner: false, snacks: false, beverages: false },
    dietary_options: (r.dietaryOptions as unknown as Json) ?? { pureVeg: false, veganFriendly: false, vegetarian: false, seafood: false, poultry: false, redMeat: false, aLaCarte: false },
    currency_code: r.currencyCode ?? null,
    currency_symbol: r.currencySymbol ?? null,
    external_id: r.externalId ?? null,
    status: r.status ?? 'active',
    is_preferred: r.isPreferred ?? false,
  };
};

export const convertSupabaseToUI = (row: SupabaseRestaurant): UIRestaurant => {
  const features = (row.features as any) || {};
  const mealTypes = (row.meal_types as any) || {};
  const dietaryOptions = (row.dietary_options as any) || {};
  const images = (row.images as any) || [];
  const cuisineTypes = (row.cuisine_types as any) || [];
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    country: row.country,
    location: row.location ?? null,
    area: row.area ?? undefined,
    description: row.description ?? '',
    imageUrl: row.image_url ?? null,
    images,
    cuisine: row.cuisine ?? undefined,
    cuisineTypes,
    priceRange: row.price_range ?? null,
    priceCategory: row.price_category as UIRestaurant['priceCategory'],
    averageCost: row.average_cost,
    averagePrice: row.average_price ?? null,
    rating: row.rating ?? null,
    reviewCount: row.review_count ?? null,
    openingHours: row.opening_hours ?? ((row.opening_time && row.closing_time) ? `${row.opening_time} - ${row.closing_time}` : null),
    openingTime: row.opening_time ?? null,
    closingTime: row.closing_time ?? null,
    contact: row.contact ?? null,
    features: {
      outdoorSeating: !!features.outdoorSeating,
      privateRooms: !!features.privateRooms,
      wifi: !!features.wifi,
      parking: !!features.parking,
      liveMusic: !!features.liveMusic,
      cardAccepted: !!features.cardAccepted,
    },
    mealTypes: {
      breakfast: !!mealTypes.breakfast,
      lunch: !!mealTypes.lunch,
      dinner: !!mealTypes.dinner,
      snacks: !!mealTypes.snacks,
      beverages: !!mealTypes.beverages,
    },
    dietaryOptions: {
      pureVeg: !!dietaryOptions.pureVeg,
      veganFriendly: !!dietaryOptions.veganFriendly,
      vegetarian: !!dietaryOptions.vegetarian,
      seafood: !!dietaryOptions.seafood,
      poultry: !!dietaryOptions.poultry,
      redMeat: !!dietaryOptions.redMeat,
      aLaCarte: !!dietaryOptions.aLaCarte,
    },
    currencyCode: row.currency_code ?? null,
    currencySymbol: row.currency_symbol ?? null,
    externalId: row.external_id ?? null,
    status: (row.status as 'active' | 'inactive') ?? 'active',
    isPreferred: row.is_preferred ?? false,
    lastUpdated: row.updated_at ?? row.created_at ?? undefined,
    vegOptions: undefined,
  };
};

// Helper to generate next sequential external ID in format 'rest001'
const generateNextExternalId = async (): Promise<string> => {
  // Fetch existing external IDs
  const { data, error } = await supabase
    .from('restaurants')
    .select('external_id')
    .not('external_id', 'is', null);
  if (error) throw error;

  const ids = (data || [])
    .map((row: any) => row.external_id as string)
    .filter(Boolean);

  // Extract numeric suffix from ids like 'rest001'
  let maxNum = 0;
  for (const id of ids) {
    const match = /^rest(\d+)$/.exec(id);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num)) maxNum = Math.max(maxNum, num);
    }
  }

  const next = maxNum + 1;
  const padded = String(next).padStart(3, '0');
  return `rest${padded}`;
};

export const restaurantService = {
  async list(params?: { search?: string; city?: string; country?: string; status?: string }) {
    let query = supabase.from('restaurants').select('*').order('name');
    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,city.ilike.%${params.search}%,country.ilike.%${params.search}%,cuisine.ilike.%${params.search}%`
      );
    }
    if (params?.city) query = query.eq('city', params.city);
    if (params?.country) query = query.eq('country', params.country);
    if (params?.status) query = query.eq('status', params.status);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(convertSupabaseToUI);
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single();
    if (error) throw error;
    return convertSupabaseToUI(data as SupabaseRestaurant);
  },

  async create(payload: Partial<UIRestaurant>) {
    const insertPayload = convertUIToSupabase(payload);
    // Auto-generate external_id if missing/blank
    const provided = (payload.externalId || '').trim();
    if (!provided) {
      insertPayload.external_id = await generateNextExternalId();
    } else {
      insertPayload.external_id = provided;
    }
    const { data, error } = await supabase.from('restaurants').insert(insertPayload).select('*').single();
    if (error) throw error;
    return convertSupabaseToUI(data as SupabaseRestaurant);
  },

  async update(id: string, payload: Partial<UIRestaurant>) {
    const updatePayload: SupabaseRestaurantUpdate = convertUIToSupabase({ ...payload, id });
    const { data, error } = await supabase.from('restaurants').update(updatePayload).eq('id', id).select('*').single();
    if (error) throw error;
    return convertSupabaseToUI(data as SupabaseRestaurant);
  },

  async upsertMany(rows: UIRestaurant[]) {
    const payload = rows.map(convertUIToSupabase);
    const { data, error } = await supabase.from('restaurants').upsert(payload, { onConflict: 'id' }).select('*');
    if (error) throw error;
    return (data || []).map(convertSupabaseToUI);
  },

  async delete(id: string) {
    const { error } = await supabase.from('restaurants').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};