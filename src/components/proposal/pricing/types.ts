export interface PricingData {
  adultPrice: number;
  childPrice: number;
  extraBedPrice: number;
  currency: string;
  isEditable: boolean;
}

export interface AccommodationPricing {
  id: string;
  numberOfRooms: number;
  numberOfNights: number;
  numberOfChildren: number;
  numberOfExtraBeds: number;
  pricing: PricingData;
  customPricing?: {
    totalPrice: number;
    isCustom: boolean;
  };
}

export interface PriceBreakdownItem {
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  nights?: number;
}