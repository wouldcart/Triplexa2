
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
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  area?: string;
  cuisineTypes: CuisineType[];
  description?: string;
  priceCategory: '$' | '$$' | '$$$' | '$$$$';
  averageCost: number;
  openingTime: string;
  closingTime: string;
  vegOptions: boolean;
  rating: number;
  reviewCount: number;
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
  currencyCode: string;
  currencySymbol: string;
  status: 'active' | 'disabled';
  isPreferred: boolean;
}
