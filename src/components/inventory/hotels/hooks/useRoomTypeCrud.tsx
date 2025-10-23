
import { Hotel } from '../types/hotel';
import { useToast } from '@/hooks/use-toast';

export const useRoomTypeCrud = (hotels: Hotel[], setHotels: React.Dispatch<React.SetStateAction<Hotel[]>>, saveHotels: (hotels: Hotel[]) => boolean) => {
  const { toast } = useToast();

  // Add room type to a hotel
  const addRoomType = (hotelId: string, roomType: Omit<Hotel['roomTypes'][0], 'id'>) => {
    try {
      console.log('Adding room type to hotel ID:', hotelId, 'with data:', roomType);
      
      const newRoomType = {
        ...roomType,
        id: `room${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };

      const updatedHotels = hotels.map(hotel => 
        hotel.id === hotelId 
          ? { 
              ...hotel, 
              roomTypes: [...hotel.roomTypes, newRoomType],
              updatedAt: new Date().toISOString() 
            } 
          : hotel
      );
      
      console.log('Updated hotels array:', updatedHotels);
      setHotels(updatedHotels);
      
      // Save to localStorage with proper error handling
      try {
        const saveResult = saveHotels(updatedHotels);
        console.log('Save result:', saveResult);
        
        if (!saveResult) {
          throw new Error('Failed to save hotel data to localStorage');
        }
        
        // Verify the save by checking localStorage
        const savedData = localStorage.getItem('savedHotels');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Verified saved data in localStorage:', parsedData);
        }
        
        toast({
          title: 'Success',
          description: `${roomType.name} has been added successfully and saved to local storage.`,
        });
      } catch (saveError) {
        console.error('Error saving to localStorage:', saveError);
        toast({
          title: 'Warning',
          description: 'Room type added but failed to save to local storage.',
          variant: 'destructive',
        });
      }
      
      return newRoomType;
    } catch (error) {
      console.error('Error adding room type:', error);
      toast({
        title: 'Error',
        description: 'Failed to add room type. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Add room type to a hotel - updated version with better error handling
  const addRoomTypeToHotel = (hotelId: string, roomType: Hotel['roomTypes'][0]) => {
    try {
      console.log('Adding room type to hotel ID:', hotelId, 'with data:', roomType);
      
      // Ensure all required fields are present
      if (!roomType.id) {
        roomType.id = `room${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      
      const updatedHotels = hotels.map(hotel => 
        hotel.id === hotelId 
          ? { 
              ...hotel, 
              roomTypes: [...hotel.roomTypes, roomType],
              updatedAt: new Date().toISOString() 
            } 
          : hotel
      );
      
      console.log('Updated hotels array:', updatedHotels);
      setHotels(updatedHotels);
      
      // Save to localStorage with proper error handling
      try {
        const saveResult = saveHotels(updatedHotels);
        console.log('Save result:', saveResult);
        
        if (!saveResult) {
          throw new Error('Failed to save hotel data to localStorage');
        }
        
        // Verify the save by checking localStorage
        const savedData = localStorage.getItem('savedHotels');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Verified saved data in localStorage:', parsedData);
        }
        
        toast({
          title: 'Success',
          description: `${roomType.name} room type has been added successfully and saved to local storage.`,
        });
      } catch (saveError) {
        console.error('Error saving to localStorage:', saveError);
        toast({
          title: 'Warning',
          description: 'Room type added but failed to save to local storage.',
          variant: 'destructive',
        });
      }
      
      return roomType;
    } catch (error) {
      console.error('Error adding room type:', error);
      toast({
        title: 'Error',
        description: 'Failed to add room type. Please check the console for details.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update room type
  const updateRoomType = (hotelId: string, roomTypeId: string, updatedRoomType: Partial<Hotel['roomTypes'][0]>) => {
    try {
      console.log('Updating room type:', roomTypeId, 'in hotel:', hotelId, 'with data:', updatedRoomType);
      
      const updatedHotels = hotels.map(hotel => 
        hotel.id === hotelId 
          ? { 
              ...hotel, 
              roomTypes: hotel.roomTypes.map(roomType => 
                roomType.id === roomTypeId 
                  ? { ...roomType, ...updatedRoomType } 
                  : roomType
              ),
              updatedAt: new Date().toISOString() 
            } 
          : hotel
      );
      
      console.log('Updated hotels array:', updatedHotels);
      setHotels(updatedHotels);
      
      // Save to localStorage with proper error handling
      try {
        const saveResult = saveHotels(updatedHotels);
        console.log('Save result:', saveResult);
        
        if (!saveResult) {
          throw new Error('Failed to save hotel data to localStorage');
        }
        
        // Verify the save by checking localStorage
        const savedData = localStorage.getItem('savedHotels');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Verified saved data in localStorage:', parsedData);
        }
        
        toast({
          title: 'Success',
          description: 'Room type has been updated successfully and saved to local storage.',
        });
      } catch (saveError) {
        console.error('Error saving to localStorage:', saveError);
        toast({
          title: 'Warning',
          description: 'Room type updated but failed to save to local storage.',
          variant: 'destructive',
        });
      }
      
      return updatedHotels.find(h => h.id === hotelId)?.roomTypes.find(r => r.id === roomTypeId);
    } catch (error) {
      console.error('Error updating room type:', error);
      toast({
        title: 'Error',
        description: 'Failed to update room type. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete room type
  const deleteRoomType = (hotelId: string, roomTypeId: string) => {
    try {
      const hotel = hotels.find(h => h.id === hotelId);
      if (!hotel) {
        toast({
          title: 'Error',
          description: 'Hotel not found.',
          variant: 'destructive',
        });
        return;
      }

      const roomType = hotel.roomTypes.find(r => r.id === roomTypeId);
      if (!roomType) {
        toast({
          title: 'Error',
          description: 'Room type not found.',
          variant: 'destructive',
        });
        return;
      }

      const updatedHotels = hotels.map(hotel => 
        hotel.id === hotelId 
          ? { 
              ...hotel, 
              roomTypes: hotel.roomTypes.filter(roomType => roomType.id !== roomTypeId),
              updatedAt: new Date().toISOString() 
            } 
          : hotel
      );
      
      console.log('Updated hotels array after deletion:', updatedHotels);
      setHotels(updatedHotels);
      
      // Save to localStorage with proper error handling
      try {
        const saveResult = saveHotels(updatedHotels);
        console.log('Save result:', saveResult);
        
        if (!saveResult) {
          throw new Error('Failed to save hotel data to localStorage');
        }
        
        // Verify the save by checking localStorage
        const savedData = localStorage.getItem('savedHotels');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Verified saved data in localStorage:', parsedData);
        }
        
        toast({
          title: 'Success',
          description: `${roomType.name} has been deleted successfully and saved to local storage.`,
        });
      } catch (saveError) {
        console.error('Error saving to localStorage:', saveError);
        toast({
          title: 'Warning',
          description: 'Room type deleted but failed to save to local storage.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting room type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete room type. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    addRoomType,
    addRoomTypeToHotel,
    updateRoomType,
    deleteRoomType
  };
};
