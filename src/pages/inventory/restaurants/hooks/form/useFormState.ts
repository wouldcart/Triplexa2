
import { useState } from 'react';
import { Restaurant } from '../../types/restaurantTypes';

export const useFormState = () => {
  // Initialize form with a default empty restaurant
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    name: '',
    address: '',
    city: '',
    country: '',
    location: '',
    area: '',
    cuisineTypes: [],
    description: '',
    priceRange: 'Mid-Range',
    priceCategory: '$',
    averageCost: 0,
    averagePrice: 0,
    openingHours: '',
    openingTime: '09:00',
    closingTime: '22:00',
    vegOptions: false,
    rating: 0,
    reviewCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070',
    features: {
      outdoorSeating: false,
      privateRooms: false,
      wifi: false,
      parking: false,
      liveMusic: false,
      cardAccepted: false,
    },
    mealTypes: {
      breakfast: false,
      lunch: false,
      dinner: false,
      snacks: false,
      beverages: false,
    },
    dietaryOptions: {
      pureVeg: false,
      veganFriendly: false,
      vegetarian: false,
      seafood: false,
      poultry: false,
      redMeat: false,
      aLaCarte: false,
    },
    currencyCode: 'USD',
    currencySymbol: '$',
    status: 'active',
    isPreferred: false,
  });
  
  return {
    formData,
    setFormData
  };
};
