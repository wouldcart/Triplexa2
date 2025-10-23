
import { useState, useMemo } from 'react';
import { Hotel, HotelFilters, FilterStarRating, FilterHotelStatus } from '../types/hotel';

// Default filters
export const defaultFilters: HotelFilters = {
  country: '',
  city: '',
  location: '',
  starRating: 'all',
  status: 'all', 
  category: '',
  dateRange: {
    from: null,
    to: null,
  },
  roomTypes: [],
  facilities: [],
  priceRange: {
    min: 0,
    max: 10000
  }
};

export const useHotelFilters = (hotels: Hotel[]) => {
  const [filters, setFilters] = useState<HotelFilters>(defaultFilters);

  // Apply filters
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      // Filter by country
      if (filters.country && filters.country !== 'all' && hotel.country !== filters.country) {
        return false;
      }

      // Filter by city
      if (filters.city && filters.city !== 'all' && hotel.city !== filters.city) {
        return false;
      }

      // Filter by location
      if (filters.location && filters.location !== 'all' && hotel.location !== filters.location) {
        return false;
      }

      // Filter by star rating
      if (filters.starRating !== 'all' && hotel.starRating !== filters.starRating) {
        return false;
      }

      // Filter by status
      if (filters.status !== 'all' && hotel.status !== filters.status) {
        return false;
      }
      
      // Filter by category
      if (filters.category && filters.category !== 'all' && hotel.category !== filters.category) {
        return false;
      }

      // Filter by room types
      if (filters.roomTypes.length > 0) {
        const hotelRoomTypes = hotel.roomTypes.map(room => room.name);
        const hasMatchingRoomType = filters.roomTypes.some(roomType => 
          hotelRoomTypes.includes(roomType)
        );
        if (!hasMatchingRoomType) {
          return false;
        }
      }
      
      // Filter by facilities
      if (filters.facilities.length > 0) {
        const hasAllFacilities = filters.facilities.every(facility => 
          hotel.facilities.includes(facility)
        );
        if (!hasAllFacilities) {
          return false;
        }
      }
      
      // Filter by price range
      if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
        const minRoomPrice = Math.min(...hotel.roomTypes.map(room => room.adultPrice));
        if (minRoomPrice < filters.priceRange.min || minRoomPrice > filters.priceRange.max) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange.from && filters.dateRange.to) {
        const fromDate = new Date(filters.dateRange.from);
        const toDate = new Date(filters.dateRange.to);
        
        // Check if any room types are valid during the specified date range
        const hasValidRoomType = hotel.roomTypes.some(roomType => {
          const validFrom = new Date(roomType.validFrom);
          const validTo = new Date(roomType.validTo);
          
          // Check if there's any overlap between the date ranges
          return (
            (validFrom <= toDate && validTo >= fromDate) ||
            (fromDate <= validTo && toDate >= validFrom)
          );
        });
        
        if (!hasValidRoomType) {
          return false;
        }
      }

      return true;
    });
  }, [hotels, filters]);

  return {
    filters,
    setFilters,
    filteredHotels
  };
};
