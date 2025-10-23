
import { Restaurant } from './types';

export const uaeRestaurants: Restaurant[] = [
  {
    id: 4,
    name: 'Burj Al Arab',
    address: '123 Sheikh Zayed Road',
    city: 'Dubai',
    area: 'Jumeirah',
    country: 'UAE',
    cuisineTypes: ['Mediterranean', 'Fine Dining', 'Seafood'],
    description: 'Exquisite dining experience with breathtaking views of the Arabian Gulf.',
    priceCategory: '$$$$',
    averageCost: 5000,
    openingTime: '18:00',
    closingTime: '23:30',
    vegOptions: true,
    rating: 4.9,
    reviewCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070',
    features: {
      outdoorSeating: true,
      privateRooms: true,
      wifi: true,
      parking: true,
      liveMusic: false,
      cardAccepted: true
    },
    mealTypes: {
      breakfast: true,
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
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    status: 'active',
    isPreferred: true
  },
  {
    id: 6,
    name: 'Saffron & Spice',
    address: '67 Sheikh Zayed Road',
    city: 'Abu Dhabi',
    area: 'Downtown',
    country: 'UAE',
    cuisineTypes: ['Indian', 'Pakistani', 'Middle Eastern'],
    description: 'A fusion of Indian and Middle Eastern flavors in an elegant setting.',
    priceCategory: '$$$',
    averageCost: 450,
    openingTime: '12:00',
    closingTime: '23:00',
    vegOptions: true,
    rating: 4.4,
    reviewCount: 175,
    imageUrl: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=2070',
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
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    status: 'active',
    isPreferred: false
  }
];
