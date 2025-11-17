
import { useState, useEffect, useMemo } from 'react';
import { Query } from '@/types/query';
import { transportRoutes } from '@/pages/inventory/transport/data/transportData';
import { sightseeingData } from '@/pages/inventory/sightseeing/data/initialData';
import { useHotelCrud } from '@/components/inventory/hotels/hooks/useHotelCrud';

interface SuggestionFilters {
  country: string;
  cities: string[];
  paxCount: number;
  budget?: {
    min: number;
    max: number;
  };
}

export const useInventorySuggestions = (query: Query) => {
  const [loading, setLoading] = useState(false);
  
  // Use hotel CRUD to get actual hotels from Supabase
  const { hotels: supabaseHotels } = useHotelCrud();

  const filters: SuggestionFilters = useMemo(() => ({
    country: query.destination.country,
    cities: query.destination.cities,
    paxCount: query.paxDetails.adults + query.paxDetails.children,
    budget: query.budget
  }), [query]);

  // Filter hotels by destination - use Supabase hotels instead of mock data
  const suggestedHotels = useMemo(() => {
    return supabaseHotels.filter(hotel => {
      const hotelCountry = hotel.country || '';
      const hotelCity = hotel.city || '';
      const hotelName = hotel.name || '';
      
      return hotelCountry.toLowerCase() === filters.country.toLowerCase() ||
        filters.cities.some(city => {
          const filterCity = city || '';
          return hotelCity.toLowerCase().includes(filterCity.toLowerCase()) ||
            hotelName.toLowerCase().includes(filterCity.toLowerCase());
        });
    }).slice(0, 12); // Limit to top 12 suggestions
  }, [filters, supabaseHotels]);

  // Filter transport by cities
  const suggestedTransport = useMemo(() => {
    return transportRoutes.filter(route => {
      const routeFrom = route.from || '';
      const routeTo = route.to || '';
      
      return filters.cities.some(city => {
        const filterCity = city || '';
        return routeFrom.toLowerCase().includes(filterCity.toLowerCase()) ||
          routeTo.toLowerCase().includes(filterCity.toLowerCase());
      });
    }).slice(0, 10);
  }, [filters]);

  // Filter sightseeing by cities
  const suggestedSightseeing = useMemo(() => {
    return sightseeingData.filter(activity => {
      const activityCity = activity.city || '';
      const activityName = activity.name || '';
      
      return filters.cities.some(city => {
        const filterCity = city || '';
        return activityCity.toLowerCase().includes(filterCity.toLowerCase()) ||
          activityName.toLowerCase().includes(filterCity.toLowerCase());
      });
    }).slice(0, 15);
  }, [filters]);

  // Calculate pricing based on PAX
  const calculateHotelPrice = (hotel: any, nights: number = 1) => {
    const roomTypes = hotel.roomTypes || [];
    const standardRoom = roomTypes.find(r => r.name?.toLowerCase().includes('standard')) || roomTypes[0];
    return (standardRoom?.adultPrice || hotel.minRate || 100) * nights;
  };

  const calculateTransportPrice = (transport: any) => {
    return transport.price || transport.costPerPerson * filters.paxCount;
  };

  const calculateSightseeingPrice = (activity: any) => {
    const basePrice = typeof activity.price === 'object' ? activity.price.adult : activity.price || 0;
    return basePrice * filters.paxCount;
  };

  return {
    suggestedHotels,
    suggestedTransport,
    suggestedSightseeing,
    calculateHotelPrice,
    calculateTransportPrice,
    calculateSightseeingPrice,
    loading,
    filters
  };
};
