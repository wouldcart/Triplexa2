
import { useState } from 'react';
import { Hotel, RoomType } from '../types/hotel';
import { useToast } from '@/hooks/use-toast';

export const useHotelCrud = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const { toast } = useToast();

  // Load hotels data from localStorage
  const loadHotels = () => {
    try {
      const savedHotels = localStorage.getItem('savedHotels');
      if (savedHotels) {
        const parsedHotels = JSON.parse(savedHotels);
        setHotels(parsedHotels);
        console.log('Loaded hotels from localStorage:', parsedHotels.length, 'hotels found');
        return parsedHotels;
      }
      return [];
    } catch (error) {
      console.error('Error loading hotels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hotels data. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Save hotels data to localStorage
  const saveHotels = (hotelsData: Hotel[]) => {
    try {
      localStorage.setItem('savedHotels', JSON.stringify(hotelsData));
      console.log('Hotel data saved to localStorage:', hotelsData.length, 'hotels total');
      return true;
    } catch (error) {
      console.error('Error saving hotels:', error);
      toast({
        title: 'Error',
        description: 'Failed to save hotels data. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Add a new hotel
  const addHotel = (hotel: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding new hotel with data:', hotel);
      
      // Make sure roomTypes is defined and properly formatted
      if (!hotel.roomTypes || !Array.isArray(hotel.roomTypes)) {
        console.warn('Hotel being added has no room types or invalid room types format');
        hotel.roomTypes = [];
      }
      
      const newHotel: Hotel = {
        ...hotel,
        id: `hotel${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedHotels = [...hotels, newHotel];
      setHotels(updatedHotels);
      
      // Save to localStorage
      const saveResult = saveHotels(updatedHotels);
      if (!saveResult) {
        throw new Error('Failed to save hotel data');
      }
      
      toast({
        title: 'Success',
        description: `${hotel.name} has been added successfully with ${hotel.roomTypes?.length || 0} room types.`,
      });
      return newHotel;
    } catch (error) {
      console.error('Error adding hotel:', error);
      toast({
        title: 'Error',
        description: 'Failed to add hotel. Please check the console for details.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update an existing hotel
  const updateHotel = (id: string, updatedHotel: Partial<Hotel>) => {
    try {
      console.log('Updating hotel with ID:', id, 'with data:', updatedHotel);
      
      const hotelExists = hotels.find(hotel => hotel.id === id);
      if (!hotelExists) {
        toast({
          title: 'Error',
          description: 'Hotel not found.',
          variant: 'destructive',
        });
        return null;
      }
      
      const updatedHotels = hotels.map(hotel => 
        hotel.id === id 
          ? { 
              ...hotel, 
              ...updatedHotel, 
              updatedAt: new Date().toISOString() 
            } 
          : hotel
      );
      
      setHotels(updatedHotels);
      
      // Save to localStorage
      const saveResult = saveHotels(updatedHotels);
      if (!saveResult) {
        throw new Error('Failed to save hotel data');
      }
      
      toast({
        title: 'Success',
        description: 'Hotel information has been updated successfully.',
      });
      
      return updatedHotels.find(h => h.id === id);
    } catch (error) {
      console.error('Error updating hotel:', error);
      toast({
        title: 'Error',
        description: 'Failed to update hotel. Please check the console for details.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a hotel
  const deleteHotel = (id: string) => {
    try {
      const hotelToDelete = hotels.find(hotel => hotel.id === id);
      if (!hotelToDelete) {
        toast({
          title: 'Error',
          description: 'Hotel not found.',
          variant: 'destructive',
        });
        return;
      }

      const updatedHotels = hotels.filter(hotel => hotel.id !== id);
      setHotels(updatedHotels);
      
      // Save to localStorage
      const saveResult = saveHotels(updatedHotels);
      if (!saveResult) {
        throw new Error('Failed to save hotel data');
      }
      
      toast({
        title: 'Success',
        description: `${hotelToDelete.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete hotel. Please check the console for details.',
        variant: 'destructive',
      });
    }
  };

  return {
    hotels,
    setHotels,
    loadHotels,
    saveHotels,
    addHotel,
    updateHotel,
    deleteHotel
  };
};
