import { useState, useEffect } from 'react';
import { Restaurant, RESTAURANTS_STORAGE_KEY } from '../types/restaurantTypes';
import { initialRestaurants } from '../data/restaurantData';

export const useRestaurantStorage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    // Try to load from localStorage first
    const storedData = localStorage.getItem(RESTAURANTS_STORAGE_KEY);
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (error) {
        console.error('Error parsing stored restaurants data:', error);
        return initialRestaurants;
      }
    }
    // Otherwise, use the initial data
    return initialRestaurants;
  });

  // Save to localStorage whenever restaurants change
  useEffect(() => {
    localStorage.setItem(RESTAURANTS_STORAGE_KEY, JSON.stringify(restaurants));
  }, [restaurants]);

  // Function to save restaurants (used by other hooks/components)
  const saveRestaurants = (updatedRestaurants: Restaurant[]): boolean => {
    try {
      setRestaurants(updatedRestaurants);
      localStorage.setItem(RESTAURANTS_STORAGE_KEY, JSON.stringify(updatedRestaurants));
      return true;
    } catch (error) {
      console.error('Error saving restaurants data:', error);
      return false;
    }
  };

  return {
    restaurants,
    setRestaurants,
    saveRestaurants
  };
};

export default useRestaurantStorage;
