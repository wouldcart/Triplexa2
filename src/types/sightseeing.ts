
// Basic sightseeing types to maintain compatibility with query components

export interface Sightseeing {
  id: number;
  name: string;
  description?: string;
  country: string;
  city: string;
  category?: string;
  status: 'active' | 'inactive';
  activities?: string[];
  imageUrl?: string;
  images?: Image[];
  lastUpdated: string;
  createdAt: string;
  duration?: string;
  transferTypes?: string[];
  transferOptions?: TransferOption[];
  address?: string;
  googleMapLink?: string;
  latitude?: number;
  longitude?: number;
  price?: {
    adult: number;
    child: number;
  };
  difficultyLevel?: 'Easy' | 'Moderate' | 'Difficult';
  season?: string;
  allowedAgeGroup?: string;
  daysOfWeek?: string[];
  timing?: string;
  pickupTime?: string;
  packageOptions?: PackageOption[];
  groupSizeOptions?: GroupSizeOption[];
  pricingOptions?: PricingOption[];
  otherInclusions?: string;
  advisory?: string;
  cancellationPolicy?: string;
  refundPolicy?: string;
  confirmationPolicy?: string;
  termsConditions?: string;
  isFree?: boolean;
  // Add the policies object to store highlights, inclusions, etc.
  policies?: {
    // Support both array and single-string values
    highlights?: string[] | string;
    inclusions?: string[] | string;
    exclusions?: string[] | string;
    // Text fields stored within the JSONB policies object
    advisory?: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    confirmationPolicy?: string;
    termsConditions?: string;
  };
  // New validity period fields
  validityPeriod?: {
    startDate: string;
    endDate: string;
  } | null;
  isExpired?: boolean;
  expirationNotified?: boolean;
  // Currency field for localized pricing
  currency?: string;
  currencySymbol?: string;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
  // SIC availability management
  sicAvailable?: boolean;
  sicPricing?: {
    adult: number;
    child: number;
  };
  requiresMandatoryTransfer?: boolean;
  transferMandatory?: boolean;
}

export interface Image {
  id: number;
  url: string;
  isPrimary?: boolean;
  name?: string;
  altText?: string;
}

export interface PackageOption {
  id: number;
  name: string;
  type: string;
  description: string;
  adultPrice: number;
  childPrice: number;
  isEnabled: boolean;
  customType?: string;
  transferIncluded?: boolean;
  requiresPrivateTransfer?: boolean;
}

export interface GroupSizeOption {
  id: number;
  minPeople: number;
  maxPeople: number;
  adultPrice: number;
  childPrice: number;
}

export interface TransferOption {
  id: number;
  vehicleType: string;
  capacity: string | number;
  price: number;
  priceUnit: 'Per Person' | 'Per Vehicle';
  isEnabled: boolean;
  transportTypeId?: string; // New field to store the transport type ID reference
  type?: string; // Add type property for SIC/Private transfers
}

export interface PricingOption {
  id: number;
  type: string;  // Changed from union type to string to allow custom values
  adultPrice: number;
  childPrice: number;
  isEnabled: boolean;
  name?: string; // Add name property 
  description?: string; // Add description property
  customType?: string; // For custom type input
}
