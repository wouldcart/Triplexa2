
import { CuisineType } from '../types/restaurantTypes';

export interface Restaurant {
  id: string;
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
}

// Export initialRestaurants with typed cuisineTypes
export const initialRestaurants: Restaurant[] = [
  {
    id: "rest001",
    name: "Blue Elephant",
    location: "Bangkok",
    city: "Bangkok",
    country: "Thailand",
    cuisine: "Thai",
    address: "233 South Sathorn Road, Yannawa, Sathorn, Bangkok 10120",
    priceRange: "$$$$",
    priceCategory: "$$$$",
    averagePrice: 2500,
    averageCost: 2500,
    rating: 4.8,
    reviewCount: 450,
    openingHours: "11:30 AM - 10:30 PM",
    openingTime: "11:30 AM",
    closingTime: "10:30 PM",
    contact: "+66 2 673 9353",
    description: "Authentic Thai cuisine in a colonial-style mansion with a cooking school.",
    images: ["https://images.unsplash.com/photo-1552566626-52f8b828add9"],
    imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
    cuisineTypes: ["Thai", "Fine Dining", "Local"],
    features: {
      outdoorSeating: true,
      privateRooms: true,
      wifi: true,
      parking: true,
      liveMusic: false,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: false,
      lunch: true,
      dinner: true,
      snacks: false,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: true,
      vegetarian: true,
      seafood: true,
      poultry: true,
      redMeat: true,
      aLaCarte: true
    },
    status: "active",
    isPreferred: true,
    currencySymbol: "฿",
    currencyCode: "THB"
  },
  {
    id: "rest002",
    name: "Siam Supper Club",
    location: "Phuket",
    city: "Phuket",
    country: "Thailand",
    cuisine: "Western",
    address: "36-40 Lagoon Road, Cherngtalay, Thalang, Phuket 83110",
    priceRange: "$$$",
    priceCategory: "$$$",
    averagePrice: 1800,
    averageCost: 1800,
    rating: 4.6,
    reviewCount: 320,
    openingHours: "6:00 PM - 1:00 AM",
    openingTime: "6:00 PM",
    closingTime: "1:00 AM",
    contact: "+66 76 270 936",
    description: "A sophisticated bar and restaurant with live jazz music and international cuisine.",
    images: ["https://images.unsplash.com/photo-1514933651103-005eec06c04b"],
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
    cuisineTypes: ["American", "Steakhouse", "Fine Dining"],
    features: {
      outdoorSeating: false,
      privateRooms: true,
      wifi: true,
      parking: true,
      liveMusic: true,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: false,
      lunch: false,
      dinner: true,
      snacks: true,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: false,
      vegetarian: true,
      seafood: true,
      poultry: true,
      redMeat: true,
      aLaCarte: true
    },
    status: "active",
    isPreferred: false,
    currencySymbol: "฿",
    currencyCode: "THB"
  },
  {
    id: "rest003",
    name: "Gaggan",
    location: "Bangkok",
    city: "Bangkok",
    country: "Thailand",
    cuisine: "Progressive Indian",
    address: "68/1 Soi Langsuan, Ploenchit Road, Lumpini, Bangkok 10330",
    priceRange: "$$$$$",
    priceCategory: "$$$$",
    averagePrice: 4000,
    averageCost: 4000,
    rating: 4.9,
    reviewCount: 620,
    openingHours: "6:00 PM - 11:00 PM",
    openingTime: "6:00 PM",
    closingTime: "11:00 PM",
    contact: "+66 2 652 1700",
    description: "Award-winning progressive Indian cuisine with a creative twist.",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0"],
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
    cuisineTypes: ["Indian", "Fusion", "Fine Dining"],
    features: {
      outdoorSeating: false,
      privateRooms: true,
      wifi: true,
      parking: true,
      liveMusic: false,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: false,
      lunch: false,
      dinner: true,
      snacks: false,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: true,
      vegetarian: true,
      seafood: true,
      poultry: true,
      redMeat: true,
      aLaCarte: false
    },
    status: "active",
    isPreferred: true,
    currencySymbol: "฿",
    currencyCode: "THB"
  },
  {
    id: "rest004",
    name: "Arabian Nights",
    location: "Dubai",
    city: "Dubai",
    country: "UAE",
    cuisine: "Middle Eastern",
    address: "Sheikh Zayed Road, Downtown Dubai, UAE",
    priceRange: "$$$",
    priceCategory: "$$$",
    averagePrice: 350,
    averageCost: 350,
    rating: 4.7,
    reviewCount: 480,
    openingHours: "5:00 PM - 12:00 AM",
    openingTime: "5:00 PM",
    closingTime: "12:00 AM",
    contact: "+971 4 123 4567",
    description: "Authentic Middle Eastern cuisine with traditional entertainment.",
    images: ["https://images.unsplash.com/photo-1590846406792-0adc7f938f1d"],
    imageUrl: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d",
    cuisineTypes: ["Middle Eastern", "Local", "Fine Dining"],
    features: {
      outdoorSeating: true,
      privateRooms: true,
      wifi: true,
      parking: true,
      liveMusic: true,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: false,
      lunch: false,
      dinner: true,
      snacks: true,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: true,
      vegetarian: true,
      seafood: true,
      poultry: true,
      redMeat: true,
      aLaCarte: true
    },
    status: "active",
    isPreferred: false,
    currencySymbol: "د.إ",
    currencyCode: "AED"
  },
  {
    id: "rest005",
    name: "Marina View Restaurant",
    location: "Dubai",
    city: "Dubai",
    country: "UAE",
    cuisine: "Seafood",
    address: "Dubai Marina, JBR, Dubai, UAE",
    priceRange: "$$$$",
    priceCategory: "$$$$",
    averagePrice: 450,
    averageCost: 450,
    rating: 4.5,
    reviewCount: 365,
    openingHours: "12:00 PM - 11:30 PM",
    openingTime: "12:00 PM",
    closingTime: "11:30 PM",
    contact: "+971 4 456 7890",
    description: "Premium seafood restaurant with stunning views of Dubai Marina.",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5"],
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    cuisineTypes: ["Seafood", "Mediterranean", "Fine Dining"],
    features: {
      outdoorSeating: true,
      privateRooms: true,
      wifi: true,
      parking: true,
      liveMusic: false,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: false,
      lunch: true,
      dinner: true,
      snacks: false,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: false,
      vegetarian: true,
      seafood: true,
      poultry: true,
      redMeat: false,
      aLaCarte: true
    },
    status: "active",
    isPreferred: true,
    currencySymbol: "د.إ",
    currencyCode: "AED"
  }
];

// Export for backward compatibility - required by useInventoryData.ts
export const allRestaurants = initialRestaurants;
