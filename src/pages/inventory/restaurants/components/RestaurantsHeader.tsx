
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface RestaurantsHeaderProps {
  onAddSuccess: () => void;
  totalRestaurants: number;
}

const RestaurantsHeader: React.FC<RestaurantsHeaderProps> = ({ onAddSuccess, totalRestaurants }) => {
  const handleAddRestaurant = () => {
    // Call the onAddSuccess callback when adding a restaurant
    onAddSuccess();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Restaurants</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage restaurant listings for itineraries and packages ({totalRestaurants} restaurants)
        </p>
      </div>
      
      <Button 
        className="mt-4 md:mt-0 bg-brand-blue hover:bg-brand-blue/90 flex items-center"
        onClick={handleAddRestaurant}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Restaurant
      </Button>
    </div>
  );
};

export default RestaurantsHeader;
