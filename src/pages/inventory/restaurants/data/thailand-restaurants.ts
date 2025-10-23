
import { Restaurant } from './types';

export const thailandRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'The Golden Spoon',
    address: '123 Restaurant Avenue, Manhattan',
    city: 'Bangkok',
    area: 'Sukhumvit',
    country: 'Thailand',
    cuisineTypes: ['Thai', 'Fusion'],
    description: 'A luxurious fine dining experience with the best of Thai fusion cuisine in the heart of the city.',
    priceCategory: '$$$',
    averageCost: 2500,
    openingTime: '11:00',
    closingTime: '22:00',
    vegOptions: true,
    rating: 4.5,
    reviewCount: 128,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070',
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
    currencyCode: 'THB',
    currencySymbol: '฿',
    status: 'active',
    isPreferred: true
  },
  {
    id: 2,
    name: 'Spice Garden',
    address: '456 Food Street, Brooklyn',
    city: 'Phuket',
    area: 'Patong',
    country: 'Thailand',
    cuisineTypes: ['Indian', 'Vegetarian'],
    description: 'Authentic Indian cuisine with a wide variety of vegetarian options.',
    priceCategory: '$$',
    averageCost: 1200,
    openingTime: '12:00',
    closingTime: '23:00',
    vegOptions: true,
    rating: 4.2,
    reviewCount: 89,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974',
    features: {
      outdoorSeating: false,
      privateRooms: true,
      wifi: true,
      parking: false,
      liveMusic: false,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: false,
      lunch: true,
      dinner: true,
      snacks: true,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: true,
      veganFriendly: true,
      vegetarian: true,
      seafood: false,
      poultry: false,
      redMeat: false,
      aLaCarte: true
    },
    currencyCode: 'THB',
    currencySymbol: '฿',
    status: 'active',
    isPreferred: false
  },
  {
    id: 3,
    name: 'Ocean Blue',
    address: '789 Seafood Lane, Manhattan',
    city: 'Pattaya',
    area: 'Beach Road',
    country: 'Thailand',
    cuisineTypes: ['Seafood', 'Thai', 'Japanese'],
    description: 'Premium seafood restaurant with oceanfront views and the freshest catch of the day.',
    priceCategory: '$$$$',
    averageCost: 3500,
    openingTime: '17:00',
    closingTime: '23:00',
    vegOptions: false,
    rating: 4.7,
    reviewCount: 156,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974',
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
      snacks: false,
      beverages: true
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: false,
      vegetarian: false,
      seafood: true,
      poultry: false,
      redMeat: false,
      aLaCarte: true
    },
    currencyCode: 'THB',
    currencySymbol: '฿',
    status: 'active',
    isPreferred: true
  },
  {
    id: 5,
    name: 'Chiang Mai Kitchen',
    address: '45 Old City Road',
    city: 'Chiang Mai',
    area: 'Old City',
    country: 'Thailand',
    cuisineTypes: ['Thai', 'Local', 'Street Food'],
    description: 'Authentic Northern Thai cuisine in a traditional Lanna setting.',
    priceCategory: '$',
    averageCost: 600,
    openingTime: '10:00',
    closingTime: '21:00',
    vegOptions: true,
    rating: 4.6,
    reviewCount: 320,
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070',
    features: {
      outdoorSeating: true,
      privateRooms: false,
      wifi: true,
      parking: false,
      liveMusic: false,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: true,
      lunch: true,
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
      aLaCarte: false
    },
    currencyCode: 'THB',
    currencySymbol: '฿',
    status: 'active',
    isPreferred: false
  }
];
