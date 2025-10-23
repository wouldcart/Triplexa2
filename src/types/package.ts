
import { Country, City } from '@/components/inventory/packages/types/packageTypes';

export interface ItineraryDay {
  id: string;
  day: number;
  title: string;
  description?: string;
  city: string; // Adding city property
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  accommodation?: {
    hotelId?: string;
    hotelName?: string;
    customHotelName?: string; // For custom hotel entry
  };
  activities: {
    id: string;
    type: string;
    title: string;
    description?: string;
    duration?: string;
    sightseeingId?: string;
    name?: string; // Adding name property for backward compatibility
  }[];
  transportation?: {
    type: string;
    description?: string;
    from?: string;
    to?: string;
    routeId?: string; // Added for transport route reference
    price?: number;   // Added for transport price
    vehicleType?: string; // Added for vehicle type
  };
}

// Define an activity type for internal use
export interface ItineraryActivity {
  type: string;
  name: string;
  description?: string;
}

export interface Destination {
  country: string;
  cities: string[];
}

export interface TourPackage {
  id: string;
  name: string;
  summary?: string; // For short description
  description?: string; // For longer description
  minPax: number;
  maxPax?: number;
  days: number;
  nights: number;
  isFixedDeparture: boolean;
  departureDate?: string;
  returnDate?: string;
  totalSeats?: number;
  startCity: string;
  endCity: string;
  destinations: Destination[];
  packageType: 'domestic' | 'international' | 'custom' | 'inbound'; // Added 'inbound'
  themes: string[];
  banners: string[];
  itinerary: ItineraryDay[];
  baseCost: number;
  markup: number;
  commission?: number; // Added commission property
  finalPrice: number;
  pricePerPerson: number;
  currency: string;
  inclusions?: string;
  exclusions?: string;
  cancellationPolicy?: string;
  paymentPolicy?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt?: string;
}
