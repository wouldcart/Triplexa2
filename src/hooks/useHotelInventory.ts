
import { useState, useEffect } from 'react';
import { Hotel } from '@/components/inventory/hotels/types/hotel';
import { hotelService } from '@/integrations/supabase/services/hotelService';
import { convertSupabaseHotelToLegacy } from '@/components/inventory/hotels/types/supabaseHotel';

interface UseHotelInventoryProps {
  country: string;
  cities: string[];
}

export const useHotelInventory = ({ country, cities }: UseHotelInventoryProps) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        
        // Get all hotels from Supabase
        const supabaseHotels = await hotelService.getHotels();
        
        // Convert to legacy format
        const legacyHotels = supabaseHotels.map(convertSupabaseHotelToLegacy);
        
        // Filter hotels by country and cities
        const filteredHotels = legacyHotels.filter((hotel: Hotel) => {
          const matchesCountry = hotel.country?.toLowerCase() === country.toLowerCase();
          const matchesCities = cities.some(city => 
            hotel.city?.toLowerCase().includes(city.toLowerCase())
          );
          return matchesCountry || matchesCities;
        });
        
        setHotels(filteredHotels);
      } catch (error) {
        console.error('Error loading hotels:', error);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    if (country && cities.length > 0) {
      loadHotels();
    } else {
      setLoading(false);
    }
  }, [country, cities]);

  return { hotels, loading };
};
