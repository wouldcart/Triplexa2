
export type StarRating = 1 | 2 | 3 | 4 | 5;
export type FilterStarRating = StarRating | 'all';
export type HotelStatus = 'active' | 'inactive' | 'draft';
export type FilterHotelStatus = HotelStatus | 'all';
export type MealPlan = 'Room Only' | 'EP (European Plan)' | 'CP (Continental Plan)' | 'MAP (Modified American Plan)' | 'Bed & Breakfast' | 'Half Board' | 'Full Board' | 'All Inclusive';

export interface HotelAmenity {
  id: string;
  name: string;
  category: string;
}

export interface HotelRoom {
  id: string;
  name: string;
  type: string;
  bedType: string;
  maxOccupancy: number;
  amenities: string[];
  size: number;
  sizeUnit: string;
  basePrice: number;
  discountPrice?: number;
  images: string[];
  description?: string;
  status: HotelStatus;
  rates?: {
    base: number;
    perNight: number;
    withBreakfast: number;
    withHalfBoard: number;
    withFullBoard: number;
  };
}

export interface HotelImage {
  id: string;
  url: string;
  isPrimary?: boolean;
  alt?: string;
}

export interface RoomImage {
  id: string;
  url: string;
  isPrimary?: boolean;
  alt?: string;
}

export interface RoomType {
  id: string;
  name: string;
  capacity: {
    adults: number;
    children: number;
  };
  configuration: string;
  mealPlan: MealPlan;
  validFrom: string;
  validTo: string;
  adultPrice: number;
  childPrice: number;
  extraBedPrice: number;
  description: string;
  amenities: string[];
  images: RoomImage[];
  status: HotelStatus;
  // Make these properties optional since they're new and not present in existing data
  maxOccupancy?: number;
  bedType?: string;
  seasonStart?: string;
  seasonEnd?: string;
  adultRate?: number;
  childRate?: number;
  inventory?: number;
  // Added currency properties
  currency?: string;
  currencySymbol?: string;
}

export interface HotelFilters {
  country: string;
  city: string;
  location: string;
  starRating: FilterStarRating;
  status: FilterHotelStatus;
  category: string; // New: hotel category filter
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  roomTypes: string[];
  facilities: string[]; // New: hotel facilities filter
  priceRange: { // New: price range filter
    min: number;
    max: number;
  };
}

export interface Hotel {
  id: string;
  name: string;
  brand?: string;
  starRating: StarRating;
  category: string;
  description: string;
  country: string;
  city: string;
  location: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  latitude: number;
  longitude: number;
  googleMapLink: string;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  facilities: string[];
  amenities: string[];
  roomTypes: RoomType[];
  images: HotelImage[];
  price?: number;
  minRate?: number;
  checkInTime: string;
  checkOutTime: string;
  policies: {
    cancellation: string;
    children: string;
    pets: string;
    payment: string;
  };
  status: HotelStatus;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
  // Added currency properties
  currency?: string;
  currencySymbol?: string;
}
