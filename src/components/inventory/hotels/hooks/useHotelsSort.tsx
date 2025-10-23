
import { useState, useMemo } from 'react';
import { Hotel } from '../types/hotel';

export type SortField = 'name' | 'country' | 'city' | 'starRating' | 'price' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export const useHotelsSort = (hotels: Hotel[]) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedHotels = useMemo(() => {
    return [...hotels].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'country':
          comparison = a.country.localeCompare(b.country);
          break;
        case 'city':
          comparison = a.city.localeCompare(b.city);
          break;
        case 'starRating':
          // Ensure we're comparing numbers, not strings or 'all'
          const ratingA = typeof a.starRating === 'number' ? a.starRating : 0;
          const ratingB = typeof b.starRating === 'number' ? b.starRating : 0;
          comparison = ratingA - ratingB;
          break;
        case 'price': {
          const minPriceA = Math.min(...a.roomTypes.map(room => room.adultPrice));
          const minPriceB = Math.min(...b.roomTypes.map(room => room.adultPrice));
          comparison = minPriceA - minPriceB;
          break;
        }
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [hotels, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return {
    sortField,
    sortDirection,
    sortedHotels,
    handleSort
  };
};
