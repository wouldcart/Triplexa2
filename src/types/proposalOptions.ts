export interface ProposalComponentOption {
  id: string;
  componentType: 'sightseeing' | 'transfer' | 'dining' | 'guide' | 'activity';
  name: string;
  description: string;
  type: 'standard' | 'optional' | 'alternative' | 'upgrade';
  isSelected: boolean;
  isIncluded: boolean; // true for standard, false for optional
  priority: number;
  pricing: {
    basePrice: number;
    adultPrice?: number;
    childPrice?: number;
    totalPrice: number;
  };
  dayId?: string; // for day-specific options
  conditions?: string[]; // prerequisites or restrictions
  metadata?: Record<string, any>; // Flexible metadata object
}

export interface SightseeingOption extends ProposalComponentOption {
  componentType: 'sightseeing';
  metadata: {
    duration: string;
    capacity?: number;
    category: 'historical' | 'cultural' | 'adventure' | 'nature' | 'entertainment';
    inclusions?: string[];
    exclusions?: string[];
  } & Record<string, any>;
}

export interface TransferOption extends ProposalComponentOption {
  componentType: 'transfer';
  metadata: {
    vehicleType: string;
    capacity: number;
    route: {
      from: string;
      to: string;
      distance?: number;
      duration?: string;
    };
    pickupTime?: string;
    dropTime?: string;
  } & Record<string, any>;
}

export interface DiningOption extends ProposalComponentOption {
  componentType: 'dining';
  metadata: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'full_board';
    cuisine?: string;
    dietaryOptions?: string[];
    venue?: string;
  } & Record<string, any>;
}

export interface GuideOption extends ProposalComponentOption {
  componentType: 'guide';
  metadata: {
    languages: string[];
    specialization?: string[];
    coverage: 'full_trip' | 'city_specific' | 'day_specific';
    experience?: string;
  } & Record<string, any>;
}

export interface ActivityOption extends ProposalComponentOption {
  componentType: 'activity';
  metadata: {
    category: 'adventure' | 'cultural' | 'wellness' | 'shopping' | 'nightlife';
    duration: string;
    difficulty?: 'easy' | 'moderate' | 'difficult';
    ageRestrictions?: string;
    equipment?: string[];
  } & Record<string, any>;
}

export type AllOptionTypes = SightseeingOption | TransferOption | DiningOption | GuideOption | ActivityOption;

export interface ProposalPackage {
  id: string;
  name: string;
  type: 'basic' | 'standard' | 'premium' | 'custom';
  description: string;
  options: ProposalComponentOption[];
  basePrice: number;
  totalPrice: number;
  isSelected: boolean;
  savingsAmount?: number;
  savingsPercentage?: number;
}

export interface ProposalVariant {
  id: string;
  name: string;
  description: string;
  packages: ProposalPackage[];
  selectedPackage?: string;
  customOptions?: ProposalComponentOption[];
  totalPrice: number;
  estimatedSavings?: number;
}

export interface OptionDependency {
  optionId: string;
  dependsOn: string[];
  conflictsWith?: string[];
  conditions?: string[];
}

export interface OptionTemplate {
  id: string;
  name: string;
  description: string;
  componentType: ProposalComponentOption['componentType'];
  defaultOptions: Partial<ProposalComponentOption>[];
  rules?: OptionDependency[];
}