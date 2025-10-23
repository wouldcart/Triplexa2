
export interface ItineraryLocation {
  id: string;
  name: string;
  country: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ItineraryTransport {
  id: string;
  type: 'flight' | 'car' | 'bus' | 'train' | 'boat';
  from: ItineraryLocation;
  to: ItineraryLocation;
  duration: string;
  price: number;
  details?: string;
}

export interface EnhancedTransportRoute {
  id: string;
  routeName: string;
  routeCode: string;
  from: ItineraryLocation;
  to: ItineraryLocation;
  pickupLocations: string[];
  vehicleConfiguration: {
    vehicleType: string;
    numberOfVehicles: number;
    capacity: number;
    totalCapacity: number;
  };
  duration: string;
  price: number;
  schedules?: {
    departureTime: string;
    arrivalTime: string;
    pickupTimes: { location: string; time: string }[];
  }[];
}

export interface ItineraryAccommodation {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'guesthouse' | 'apartment';
  location: ItineraryLocation;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  price: number;
  starRating?: number;
  amenities?: string[];
  option?: 1 | 2 | 3; // Support for 3 accommodation options
  rooms?: number;
  address?: string;
  phone?: string;
  email?: string;
  totalPrice?: number;
  pricePerNight?: number;
}

export interface EnhancedAccommodationOption {
  id: string;
  hotelName: string;
  hotelType: 'hotel' | 'resort' | 'guesthouse' | 'apartment' | 'villa' | 'hostel';
  roomType: string;
  numberOfRooms: number;
  city: string;
  numberOfNights: number;
  checkInDate: string;
  checkOutDate: string;
  starRating?: number;
  amenities?: string[];
  price: number;
  pricePerNight: number;
  option: 1 | 2 | 3;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ItineraryActivity {
  id: string;
  name: string;
  type: 'sightseeing' | 'adventure' | 'cultural' | 'relaxation' | 'dining';
  location: ItineraryLocation;
  startTime: string;
  endTime: string;
  duration: string;
  price: number;
  description?: string;
  inclusions?: string[];
}

export interface EnhancedSightseeingActivity {
  id: string;
  sightseeingName: string;
  sightseeingDescription: string;
  sightseeingType: 'SIC' | 'PVT'; // Seat-in-Coach or Private
  category: 'adventure' | 'cultural' | 'relaxation' | 'sightseeing' | 'dining' | 'entertainment';
  groupSize: number;
  packageIncludes: string[];
  location: ItineraryLocation;
  startTime?: string;
  endTime?: string;
  duration: string;
  price: number;
  transferConfiguration?: EnhancedTransferConfiguration;
}

export interface EnhancedTransferConfiguration {
  id: string;
  vehicleName: string;
  vehicleType: 'private_car' | 'sedan' | 'suv' | 'van' | 'bus' | 'coach';
  vehicleNumbers: string[];
  transferType: 'PVT' | 'SIC'; // Private or Seat-in-Coach
  pickupLocation: string;
  dropLocation: string;
  pickupTime?: string;
  dropTime?: string;
  capacity: number;
  price: number;
  driverDetails?: {
    name?: string;
    phone?: string;
    license?: string;
  };
}

export interface ItineraryMeal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  restaurant: string;
  location: ItineraryLocation;
  cuisine: string;
  price: number;
  time: string;
}

export interface ItineraryDay {
  id: string;
  day: number;
  date: string;
  location: ItineraryLocation;
  accommodation?: ItineraryAccommodation;
  accommodationOptions?: EnhancedAccommodationOption[]; // Support for 3 options
  transport?: ItineraryTransport[];
  transportRoutes?: EnhancedTransportRoute[];
  activities: ItineraryActivity[];
  enhancedActivities?: EnhancedSightseeingActivity[];
  meals: ItineraryMeal[];
  totalCost: number;
  notes?: string;
}

export interface ItineraryPreferences {
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  interests: string[];
  accommodationType: 'budget' | 'mid-range' | 'luxury';
  transportPreference: 'economy' | 'business' | 'first-class';
  dietaryRestrictions?: string[];
  accessibility?: string[];
}

export interface CentralItinerary {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: {
    days: number;
    nights: number;
  };
  destinations: ItineraryLocation[];
  preferences: ItineraryPreferences;
  days: ItineraryDay[];
  pricing: {
    baseCost: number;
    markup: number;
    markupType: 'percentage' | 'fixed' | 'slab';
    finalPrice: number;
    currency: string;
  };
  status: 'draft' | 'generated' | 'approved' | 'booked';
  context: 'query' | 'proposal' | 'package';
  contextId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ItineraryGenerationRequest {
  destinations: string[];
  startDate: string;
  endDate: string;
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  preferences: {
    interests: string[];
    accommodationType: 'budget' | 'mid-range' | 'luxury';
    transportPreference: 'economy' | 'business' | 'first-class';
    dietaryRestrictions?: string[];
  };
  context: 'query' | 'proposal' | 'package';
  contextId?: string;
}
