
import { useMemo } from 'react';
import { Hotel } from '../types/hotel';

export const useHotelSearch = (hotels: Hotel[], searchTerm: string) => {
  // Filter hotels by search term
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hotels, searchTerm]);

  return {
    filteredHotels
  };
};
