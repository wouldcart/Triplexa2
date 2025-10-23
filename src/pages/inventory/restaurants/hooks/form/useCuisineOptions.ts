
import { CuisineType } from '../../types/restaurantTypes';

export const useCuisineOptions = () => {
  // Cuisine types options
  const cuisineOptions: CuisineType[] = [
    'Thai', 'Indian', 'Chinese', 'Japanese', 'Italian', 'French', 
    'Mexican', 'Mediterranean', 'American', 'Seafood', 'Steakhouse', 
    'Vegetarian', 'Vegan', 'Fusion', 'Street Food', 'Fine Dining', 
    'Casual Dining', 'Local', 'Pakistani', 'Middle Eastern'
  ];

  return { cuisineOptions };
};
