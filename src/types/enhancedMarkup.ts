export interface AccommodationOption {
  id: string;
  hotelName: string;
  roomType: string;
  nights: number;
  pricePerNight: number;
  numberOfRooms: number;
  totalPrice: number;
  type: 'standard' | 'optional' | 'alternative';
  dayId: string;
  city: string;
}

export interface ServiceCost {
  sightseeing: {
    adultPrice?: number;
    childPrice?: number;
    flatRate?: number;
    total: number;
  };
  transport: {
    totalCost: number;
    perPersonCost: number;
  };
  dining: {
    adultPrice?: number;
    childPrice?: number;
    flatRate?: number;
    total: number;
  };
  accommodation: {
    totalCost: number;
    perPersonCost: number;
    totalRooms: number;
    totalNights: number;
  };
}

export interface MarkupSlab {
  minAmount: number;
  maxAmount: number;
  percentage: number;
}

export interface MarkupSettings {
  type: 'percentage' | 'slab';
  percentage?: number;
  slabs?: MarkupSlab[];
}

export interface PricingDistribution {
  method: 'separate' | 'even';
  adultPrice: number;
  childPrice: number;
  totalPrice: number;
}

export interface AccommodationPricingOption {
  type: 'standard' | 'optional' | 'alternative';
  accommodations: AccommodationOption[];
  serviceCosts: ServiceCost;
  baseTotal: number;
  markup: number;
  finalTotal: number;
  distribution: PricingDistribution;
}

export interface EnhancedMarkupData {
  options: AccommodationPricingOption[];
  selectedOption: 'standard' | 'optional' | 'alternative';
  markupSettings: MarkupSettings;
  adults: number;
  children: number;
  totalPax: number;
}