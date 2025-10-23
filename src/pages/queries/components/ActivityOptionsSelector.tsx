import React from 'react';
import { Button } from '@/components/ui/button';
import { Hotel } from "@/components/inventory/hotels/types/hotel";
import { Sightseeing } from '@/types/sightseeing';
import { Restaurant } from '@/pages/inventory/restaurants/types/restaurantTypes';

interface ActivityOptionsSelectorProps {
  hotels: Hotel[];
  sightseeings: Sightseeing[];
  restaurants: Restaurant[];
  selectedActivities: {
    hotels: string[];
    sightseeings: string[];
    restaurants: string[];
  };
  onActivitySelect: (type: string, id: string) => void;
  onActivityDeselect: (type: string, id: string) => void;
}

const ActivityOptionsSelector: React.FC<ActivityOptionsSelectorProps> = ({
  hotels,
  sightseeings,
  restaurants,
  selectedActivities,
  onActivitySelect,
  onActivityDeselect,
}) => {
  const handleActivityToggle = (type: string, id: string) => {
    if (selectedActivities[type].includes(id)) {
      onActivityDeselect(type, id);
    } else {
      onActivitySelect(type, id);
    }
  };

  return (
    <div>
      {/* Hotels */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Hotels</h3>
        <div className="flex flex-wrap gap-2">
          {hotels.map((hotel) => (
            <Button
              key={hotel.id}
              variant={selectedActivities.hotels.includes(hotel.id) ? "default" : "outline"}
              onClick={() => handleActivityToggle('hotels', hotel.id)}
            >
              {hotel.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Sightseeings */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Sightseeings</h3>
        <div className="flex flex-wrap gap-2">
          {sightseeings.map((sightseeing) => (
            <Button
              key={sightseeing.id}
              variant={selectedActivities.sightseeings.includes(String(sightseeing.id)) ? "default" : "outline"}
              onClick={() => handleActivityToggle('sightseeings', String(sightseeing.id))}
            >
              {sightseeing.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Restaurants */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Restaurants</h3>
        <div className="flex flex-wrap gap-2">
          {restaurants.map((restaurant) => {
            // Convert restaurant.id to string if it's a number
            const restaurantId = typeof restaurant.id === 'number' ? String(restaurant.id) : restaurant.id;
            return (
              <Button
                key={restaurantId}
                variant={selectedActivities.restaurants.includes(restaurantId) ? "default" : "outline"}
                onClick={() => handleActivityToggle('restaurants', restaurantId)}
              >
                {restaurant.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityOptionsSelector;
