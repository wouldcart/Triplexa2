import { useState, useEffect } from 'react';
import { Hotel } from '../types/hotel';
import { useToast } from '@/hooks/use-toast';
import { useHotelFilters } from './useHotelFilters';
import { useHotelCrud } from './useHotelCrud';
import { useRoomTypeCrud } from './useRoomTypeCrud';
import { useHotelImportExport } from './useHotelImportExport';

export const useHotelsData = () => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Use the CRUD hook for hotels
  const { 
    hotels, 
    setHotels, 
    loadHotels, 
    saveHotels, 
    addHotel, 
    updateHotel, 
    deleteHotel 
  } = useHotelCrud();
  
  // Use the filters hook
  const { 
    filters, 
    setFilters, 
    filteredHotels 
  } = useHotelFilters(hotels);
  
  // Use the room type CRUD hook
  const { 
    addRoomType, 
    addRoomTypeToHotel, 
    updateRoomType, 
    deleteRoomType 
  } = useRoomTypeCrud(hotels, setHotels, saveHotels);
  
  // Use the import/export hook
  const { 
    importHotels, 
    exportHotels 
  } = useHotelImportExport(hotels, filteredHotels, setHotels, saveHotels);

  // Load hotels data
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        
        // Check for saved hotels in localStorage
        const savedHotels = localStorage.getItem('savedHotels');
        
        // Use only saved hotels from localStorage or Supabase - no mock data fallback
        if (savedHotels) {
          const parsedHotels = JSON.parse(savedHotels);
          setHotels(parsedHotels);
          console.log('Loaded hotels from localStorage:', parsedHotels.length, 'hotels found');
        } else {
          // If no saved hotels, use empty array - data should come from Supabase
          setHotels([]);
          console.log('No hotels found in localStorage - using empty array');
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        toast({
          title: 'Error',
          description: 'Failed to load hotels data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [toast, setHotels, saveHotels]);

  return {
    hotels,
    loading,
    filters,
    setFilters,
    filteredHotels,
    addHotel,
    updateHotel,
    deleteHotel,
    addRoomType,
    addRoomTypeToHotel,
    updateRoomType,
    deleteRoomType,
    exportHotels,
    importHotels,
  };
};
