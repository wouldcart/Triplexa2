// Enhanced activity type definitions for improved data storage and validation

export interface EnhancedItineraryActivity {
  id: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: 'sightseeing' | 'transport' | 'meal' | 'accommodation' | 'activity';
  
  // Enhanced fields
  category?: string;
  effectivePax?: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  
  // Transport specific fields
  from?: string;
  to?: string;
  transportType?: string;
  transportLabel?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  seatingCapacity?: number;
  vehicleCount?: number;
  routeCode?: string;
  
  // Sightseeing specific fields
  selectedOptions?: string[];
  packageOptions?: Array<{
    id: string;
    name: string;
    price: number;
    included: boolean;
  }>;
  pricingOptions?: Array<{
    id: string;
    name: string;
    type: string;
    adultPrice: number;
    childPrice: number;
    isEnabled: boolean;
  }>;
  transferOptions?: Array<{
    id: string;
    type: string;
    vehicleType: string;
    price: number;
    isEnabled: boolean;
  }>;
  
  // Data source tracking
  dataSource?: 'manual' | 'sightseeing' | 'transport' | 'accommodation';
  originalData?: any;
  
  // Pricing breakdown
  priceBreakdown?: {
    basePrice: number;
    taxes?: number;
    fees?: number;
    discount?: number;
    finalPrice: number;
  };
}

export interface EnhancedItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  city: string;
  description: string;
  date: string;
  activities: EnhancedItineraryActivity[];
  transport?: any[];
  accommodations?: any[];
  accommodation?: any;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  totalCost: number;
}