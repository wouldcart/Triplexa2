
export interface TransportRoute {
  id: string;
  from: string;
  to: string;
  distance: number;
  duration: string;
  transportType: string;
  price: number;
  name?: string;
  country?: string;
  code?: string;
  transferType?: string;
  startLocationFullName?: string;
  endLocationFullName?: string;
}

export interface ItineraryBuilderActivity {
  type: string;
  title?: string;
  description?: string;
  time?: string;
  cost?: number;
  selectedOptions?: any;
  options?: any;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export interface ItineraryBuilderDay {
  day: number;
  date: string;
  activities: ItineraryBuilderActivity[];
}

export interface ProposalOptions {
  currency: string;
  currencySymbol: string;
  addMarkup: boolean;
  markupPercentage: number;
  hotelCategory?: string[];
  mealPlan?: string[];
  transferType?: string[];
  includeGuide?: boolean;
  tourPackageType?: string;
}
