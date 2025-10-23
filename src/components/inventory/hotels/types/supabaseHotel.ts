import { Tables, TablesInsert, TablesUpdate } from '../../../../integrations/supabase/types';

// Base Supabase types
export type SupabaseHotel = Tables<'hotels'>;
export type SupabaseHotelInsert = TablesInsert<'hotels'>;
export type SupabaseHotelUpdate = TablesUpdate<'hotels'>;

export type SupabaseHotelRoomType = Tables<'hotel_room_types'>;
export type SupabaseHotelRoomTypeInsert = TablesInsert<'hotel_room_types'>;
export type SupabaseHotelRoomTypeUpdate = TablesUpdate<'hotel_room_types'>;

// Extended types for UI components (combining Supabase data with UI-specific fields)
export interface ExtendedHotel extends SupabaseHotel {
  roomTypes?: ExtendedHotelRoomType[];
  // UI-specific computed fields
  minRate?: number;
  maxRate?: number;
  totalRooms?: number;
  availableRooms?: number;
}

export interface ExtendedHotelRoomType extends SupabaseHotelRoomType {
  hotel?: Pick<SupabaseHotel, 'id' | 'name' | 'city' | 'country' | 'star_rating'>;
  // UI-specific computed fields
  totalPrice?: number;
  discountedPrice?: number;
  isAvailable?: boolean;
}

// Type guards and converters
export const isSupabaseHotel = (hotel: any): hotel is SupabaseHotel => {
  return hotel && typeof hotel.id === 'string' && typeof hotel.name === 'string';
};

export const isSupabaseHotelRoomType = (roomType: any): roomType is SupabaseHotelRoomType => {
  return roomType && typeof roomType.id === 'string' && typeof roomType.hotel_id === 'string';
};

// Conversion utilities between legacy types and Supabase types
export const convertLegacyHotelToSupabase = (legacyHotel: any): SupabaseHotelInsert => {
  const payload: any = {
    name: legacyHotel.name,
    city: legacyHotel.city,
    country: legacyHotel.country,
    description: legacyHotel.description || null,
    star_rating: legacyHotel.starRating || null,
    category: legacyHotel.category || null,
    status: legacyHotel.status || 'active',
    location: legacyHotel.location || null,
    latitude: legacyHotel.latitude || null,
    longitude: legacyHotel.longitude || null,
    google_map_link: legacyHotel.googleMapLink || null,
    check_in_time: legacyHotel.checkInTime || null,
    check_out_time: legacyHotel.checkOutTime || null,
    address: legacyHotel.address ? {
      street: legacyHotel.address.street,
      city: legacyHotel.address.city,
      state: legacyHotel.address.state,
      zipCode: legacyHotel.address.zipCode,
      country: legacyHotel.address.country
    } : null,
    contact_info: legacyHotel.contactInfo ? {
      phone: legacyHotel.contactInfo.phone,
      email: legacyHotel.contactInfo.email,
      website: legacyHotel.contactInfo.website
    } : null,
    facilities: legacyHotel.facilities || null,
    amenities: legacyHotel.amenities || null,
    images: legacyHotel.images || null,
    policies: legacyHotel.policies ? {
      cancellation: legacyHotel.policies.cancellation,
      children: legacyHotel.policies.children,
      pets: legacyHotel.policies.pets,
      payment: legacyHotel.policies.payment
    } : null,
    // Currency fields (persist per-hotel)
    currency: legacyHotel.currency || null,
    currency_symbol: legacyHotel.currencySymbol || null,
    external_id: legacyHotel.externalId || null
  };

  return payload as SupabaseHotelInsert;
};

export const convertLegacyRoomTypeToSupabase = (
  legacyRoomType: any,
  hotelId: string
): SupabaseHotelRoomTypeInsert => {
  return {
    hotel_id: hotelId,
    name: legacyRoomType.name,
    description: legacyRoomType.description || null,
    capacity: legacyRoomType.capacity || { adults: 2, children: 0 },
    configuration: legacyRoomType.configuration || null,
    meal_plan: legacyRoomType.mealPlan || null,
    adult_price: legacyRoomType.adultPrice || 0,
    child_price: legacyRoomType.childPrice || 0,
    extra_bed_price: legacyRoomType.extraBedPrice || 0,
    amenities: legacyRoomType.amenities || null,
    images: legacyRoomType.images || null,
    status: legacyRoomType.status || 'active',
    valid_from: legacyRoomType.validFrom || null,
    valid_to: legacyRoomType.validTo || null,
    external_id: legacyRoomType.externalId || null
  };
};

export const convertSupabaseHotelToLegacy = (supabaseHotel: SupabaseHotel): any => {
  const anyHotel = supabaseHotel as any;
  return {
    id: supabaseHotel.id,
    name: supabaseHotel.name,
    city: supabaseHotel.city,
    country: supabaseHotel.country,
    description: supabaseHotel.description || '',
    starRating: supabaseHotel.star_rating || 3,
    category: supabaseHotel.category || '',
    status: supabaseHotel.status,
    location: supabaseHotel.location || '',
    latitude: supabaseHotel.latitude || 0,
    longitude: supabaseHotel.longitude || 0,
    googleMapLink: supabaseHotel.google_map_link || '',
    checkInTime: supabaseHotel.check_in_time || '14:00',
    checkOutTime: supabaseHotel.check_out_time || '11:00',
    address: supabaseHotel.address || {
      street: '',
      city: supabaseHotel.city,
      state: '',
      zipCode: '',
      country: supabaseHotel.country
    },
    contactInfo: supabaseHotel.contact_info || {
      phone: '',
      email: '',
      website: ''
    },
    facilities: supabaseHotel.facilities || [],
    amenities: supabaseHotel.amenities || [],
    images: supabaseHotel.images || [],
    policies: supabaseHotel.policies || {
      cancellation: '',
      children: '',
      pets: '',
      payment: ''
    },
    currency: anyHotel.currency || undefined,
    currencySymbol: anyHotel.currency_symbol || undefined,
    createdAt: supabaseHotel.created_at || new Date().toISOString(),
    updatedAt: supabaseHotel.updated_at || new Date().toISOString(),
    lastUpdated: supabaseHotel.last_updated || new Date().toISOString(),
    roomTypes: []
  };
};

export const convertSupabaseRoomTypeToLegacy = (supabaseRoomType: SupabaseHotelRoomType): any => {
  return {
    id: supabaseRoomType.id,
    name: supabaseRoomType.name,
    description: supabaseRoomType.description || '',
    capacity: supabaseRoomType.capacity || { adults: 2, children: 0 },
    configuration: supabaseRoomType.configuration || '',
    mealPlan: supabaseRoomType.meal_plan || 'Room Only',
    adultPrice: supabaseRoomType.adult_price,
    childPrice: supabaseRoomType.child_price,
    extraBedPrice: supabaseRoomType.extra_bed_price,
    amenities: supabaseRoomType.amenities || [],
    images: supabaseRoomType.images || [],
    status: supabaseRoomType.status,
    validFrom: supabaseRoomType.valid_from || '',
    validTo: supabaseRoomType.valid_to || ''
  };
};

// Filter types for Supabase queries
export interface HotelFilters {
  city?: string;
  country?: string;
  status?: string;
  star_rating?: number;
  category?: string;
  search?: string;
}

export interface RoomTypeFilters {
  hotel_id?: string;
  status?: string;
  meal_plan?: string;
  min_price?: number;
  max_price?: number;
}

// Response types for API calls
export interface HotelListResponse {
  hotels: ExtendedHotel[];
  total: number;
  page: number;
  limit: number;
}

export interface RoomTypeListResponse {
  roomTypes: ExtendedHotelRoomType[];
  total: number;
  page: number;
  limit: number;
}