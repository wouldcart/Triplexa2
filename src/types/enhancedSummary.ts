
export interface TransportRouteItem {
  id: string;
  from: string;
  to: string;
  vehicleType: string;
  duration: string;
  distance: number;
  basePrice: number;
  finalPrice: number;
  currency: string;
  paxCount: number;
  routeDetails?: {
    pickup: string;
    dropoff: string;
    stops?: string[];
  };
}

export interface SightseeingPackageItem {
  id: string;
  name: string;
  location: string;
  duration: string;
  basePrice: number;
  finalPrice: number;
  currency: string;
  includesTransport: boolean;
  transportCost?: number;
  entryFees: number;
  guideCost: number;
  addOns?: {
    name: string;
    price: number;
  }[];
}

export interface HotelOptionItem {
  optionNumber: 1 | 2 | 3;
  hotels: {
    id: string;
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomType: string;
    roomCount: number;
    basePrice: number;
    finalPrice: number;
    currency: string;
  }[];
  totalCost: number;
  isSelected: boolean;
}

export interface ChildPricingConfig {
  equalCostMode: boolean;
  childDiscountPercentage: number;
  infantDiscountPercentage: number;
}

export interface MarkupConfig {
  type: 'percentage' | 'fixed';
  value: number;
  applyTo: 'per-person' | 'total';
  currency: string;
  isEditable: boolean;
}

export interface PricingBreakdown {
  landPackageSubtotal: number;
  sightseeingSubtotal: number;
  hotelSubtotal: number;
  baseTotal: number;
  markupAmount: number;
  finalTotal: number;
  currency: string;
  perPersonBreakdown: {
    adults: { count: number; costPerPerson: number; total: number };
    children: { count: number; costPerPerson: number; total: number };
    infants: { count: number; costPerPerson: number; total: number };
  };
}
