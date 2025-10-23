
// Restaurant types definition

export interface CityOption {
  id: number;
  name: string;
  country: string;
}

export interface CountryOption {
  id: string;
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
}

export type CuisineType = 
  | 'Thai' 
  | 'Indian' 
  | 'Chinese' 
  | 'Japanese' 
  | 'Italian' 
  | 'French' 
  | 'Mexican' 
  | 'Mediterranean' 
  | 'American' 
  | 'Seafood'
  | 'Steakhouse'
  | 'Vegetarian'
  | 'Vegan'
  | 'Fusion'
  | 'Street Food'
  | 'Fine Dining'
  | 'Casual Dining'
  | 'Local'
  | 'Pakistani'
  | 'Middle Eastern';

export interface Restaurant {
  id: string;
  externalId?: string;
  name: string;
  location?: string;
  cuisine?: string;
  address: string;
  city: string;
  country: string;
  area?: string;
  priceRange?: string;
  priceCategory: '$' | '$$' | '$$$' | '$$$$';
  averagePrice?: number;
  averageCost: number;
  rating: number;
  reviewCount: number;
  openingHours?: string;
  openingTime: string;
  closingTime: string;
  contact?: string;
  description: string;
  images?: string[];
  imageUrl: string;
  features: {
    outdoorSeating: boolean;
    privateRooms: boolean;
    wifi: boolean;
    parking: boolean;
    liveMusic: boolean;
    cardAccepted: boolean;
  };
  mealTypes: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
    beverages: boolean;
  };
  dietaryOptions: {
    pureVeg: boolean;
    veganFriendly: boolean;
    vegetarian: boolean;
    seafood: boolean;
    poultry: boolean;
    redMeat: boolean;
    aLaCarte: boolean;
  };
  cuisineTypes: CuisineType[];
  status: 'active' | 'inactive';
  isPreferred: boolean;
  currencySymbol: string;
  currencyCode?: string;
  lastUpdated?: string;
  vegOptions?: boolean;
}

// Added export for local storage key for consistency
export const RESTAURANTS_STORAGE_KEY = 'inventory-restaurants';
