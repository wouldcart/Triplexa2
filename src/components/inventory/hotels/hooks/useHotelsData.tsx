import { useState, useEffect } from 'react';
import { Hotel } from '../types/hotel';
import { useToast } from '@/hooks/use-toast';
import { mockHotels } from '../data/hotelData';
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
        
        // If we have saved hotels, use those
        if (savedHotels) {
          const parsedHotels = JSON.parse(savedHotels);
          setHotels(parsedHotels);
          console.log('Loaded hotels from localStorage:', parsedHotels.length, 'hotels found');
        } else {
          // Otherwise use mock data
          setTimeout(() => {
            // Enrich mock data with the new required properties for compatibility
            const enrichedHotels = mockHotels.map(hotel => ({
              ...hotel,
              roomTypes: hotel.roomTypes.map(roomType => ({
                ...roomType,
                // Add the missing properties with calculated values
                maxOccupancy: roomType.capacity?.adults + roomType.capacity?.children || 2,
                bedType: roomType.configuration?.split(' ')[0] || 'King',
                seasonStart: roomType.validFrom,
                seasonEnd: roomType.validTo,
                adultRate: roomType.adultPrice,
                childRate: roomType.childPrice,
                inventory: 10,
                amenities: roomType.amenities || [],
                images: roomType.images || []
              }))
            }));
            
            setHotels(enrichedHotels);
            
            // Store the initial data in localStorage
            saveHotels(enrichedHotels);
            
            console.log('Loaded mock hotels:', enrichedHotels.length, 'hotels found');
          }, 100);
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
