
export interface AdvancedProposalModule {
  id: string;
  type: ModuleType;
  name: string;
  category: string;
  data: any;
  pricing: ModulePricing;
  status: 'draft' | 'active' | 'inactive';
  dependencies?: string[];
  metadata?: ModuleMetadata;
}

export type ModuleType = 
  | 'transport' 
  | 'hotel' 
  | 'sightseeing' 
  | 'restaurant' 
  | 'insurance'
  | 'technology'
  | 'luxury'
  | 'shopping'
  | 'entertainment'
  | 'airport-services';

export interface ModulePricing {
  basePrice: number;
  finalPrice: number;
  currency: string;
  discounts?: Discount[];
  markup?: number;
  commission?: number;
  breakdown?: PricingBreakdown;
}

export interface Discount {
  type: 'percentage' | 'fixed' | 'volume' | 'seasonal';
  value: number;
  description: string;
  conditions?: any;
}

export interface PricingBreakdown {
  [key: string]: number;
}

export interface ModuleMetadata {
  supplier?: string;
  bookingReference?: string;
  confirmationRequired?: boolean;
  cancellationPolicy?: string;
  validityPeriod?: {
    startDate: string;
    endDate: string;
  };
  tags?: string[];
}

export interface InsuranceModule {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'adventure' | 'medical';
  coverage: InsuranceCoverage;
  price: number;
  currency: string;
  provider: string;
  policyNumber?: string;
}

export interface InsuranceCoverage {
  medicalExpenses: number;
  tripCancellation: number;
  baggageLoss: number;
  personalAccident: number;
  emergencyEvacuation: number;
  adventureActivities?: boolean;
  preExistingConditions?: boolean;
}

export interface TechnologyModule {
  id: string;
  name: string;
  type: 'wifi' | 'translation' | 'photography' | 'navigation';
  specification: any;
  price: number;
  currency: string;
  rental?: boolean;
  duration?: number;
}

export interface LuxuryModule {
  id: string;
  name: string;
  type: 'vip-airport' | 'butler' | 'luxury-transport' | 'exclusive-access' | 'concierge';
  description: string;
  inclusions: string[];
  price: number;
  currency: string;
  availability: string;
}

export interface ShoppingModule {
  id: string;
  name: string;
  type: 'guided-tour' | 'personal-shopper' | 'exclusive-access' | 'tax-free';
  locations: string[];
  specialties: string[];
  price: number;
  currency: string;
  duration: string;
}
