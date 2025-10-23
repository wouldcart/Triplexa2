import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { hotelService, hotelRoomTypeService, hotelCombinedService } from '../../../../integrations/supabase/services/hotelService';
import {
  ExtendedHotel,
  ExtendedHotelRoomType,
  SupabaseHotelInsert,
  SupabaseHotelUpdate,
  SupabaseHotelRoomTypeInsert,
  SupabaseHotelRoomTypeUpdate,
  HotelFilters,
  convertSupabaseHotelToLegacy,
  convertSupabaseRoomTypeToLegacy,
  convertLegacyHotelToSupabase,
  convertLegacyRoomTypeToSupabase
} from '../types/supabaseHotel';

export interface UseSupabaseHotelsDataReturn {
  hotels: any[];
  loading: boolean;
  error: string | null;
  refreshHotels: () => Promise<void>;
  addHotel: (hotel: any) => Promise<void>;
  updateHotel: (id: string, updates: any) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;
  searchHotels: (searchTerm: string) => Promise<any[]>;
  filterHotels: (filters: HotelFilters) => Promise<any[]>;
  getHotelById: (id: string) => Promise<any | null>;
  
  // Room type operations
  getRoomTypesByHotelId: (hotelId: string) => Promise<any[]>;
  addRoomType: (roomType: any) => Promise<void>;
  updateRoomType: (id: string, updates: any) => Promise<void>;
  deleteRoomType: (id: string) => Promise<void>;
  updateRoomTypeStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  
  // Combined operations
  getHotelWithRoomTypes: (hotelId: string) => Promise<any>;
  addHotelWithRoomTypes: (hotel: any, roomTypes: any[]) => Promise<void>;
  deleteHotelWithRoomTypes: (hotelId: string) => Promise<void>;
}

export const useSupabaseHotelsData = (): UseSupabaseHotelsDataReturn => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load hotels from Supabase
  const loadHotels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabaseHotels = await hotelService.getHotels();
      
      // Convert Supabase hotels to legacy format for compatibility
      const legacyHotels = supabaseHotels.map(convertSupabaseHotelToLegacy);
      
      // Load room types for each hotel
      const hotelsWithRoomTypes = await Promise.all(
        legacyHotels.map(async (hotel) => {
          try {
            const roomTypes = await hotelRoomTypeService.getRoomTypesByHotelId(hotel.id);
            const legacyRoomTypes = roomTypes.map(convertSupabaseRoomTypeToLegacy);
            return {
              ...hotel,
              roomTypes: legacyRoomTypes
            };
          } catch (err) {
            console.warn(`Failed to load room types for hotel ${hotel.id}:`, err);
            return {
              ...hotel,
              roomTypes: []
            };
          }
        })
      );
      
      setHotels(hotelsWithRoomTypes);
    } catch (err) {
      console.error('Error loading hotels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hotels');
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  // Refresh hotels
  const refreshHotels = useCallback(async () => {
    await loadHotels();
  }, [loadHotels]);

  // Add a new hotel
  const addHotel = useCallback(async (hotel: any) => {
    try {
      setLoading(true);
      const supabaseHotel = convertLegacyHotelToSupabase(hotel);
      const createdHotel = await hotelService.createHotel(supabaseHotel);
      
      toast.success('Hotel added successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error adding hotel:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add hotel';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshHotels]);

  // Update an existing hotel
  const updateHotel = useCallback(async (id: string, updates: any) => {
    try {
      setLoading(true);
      const supabaseUpdates = convertLegacyHotelToSupabase(updates);
      await hotelService.updateHotel(id, supabaseUpdates);
      
      toast.success('Hotel updated successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error updating hotel:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update hotel';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshHotels]);

  // Delete a hotel
  const deleteHotel = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await hotelCombinedService.deleteHotelWithRoomTypes(id);
      
      toast.success('Hotel deleted successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error deleting hotel:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete hotel';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshHotels]);

  // Search hotels
  const searchHotels = useCallback(async (searchTerm: string) => {
    try {
      const supabaseHotels = await hotelService.searchHotels(searchTerm);
      return supabaseHotels.map(convertSupabaseHotelToLegacy);
    } catch (err) {
      console.error('Error searching hotels:', err);
      toast.error('Failed to search hotels');
      return [];
    }
  }, []);

  // Filter hotels
  const filterHotels = useCallback(async (filters: HotelFilters) => {
    try {
      const supabaseHotels = await hotelService.getHotels(filters);
      return supabaseHotels.map(convertSupabaseHotelToLegacy);
    } catch (err) {
      console.error('Error filtering hotels:', err);
      toast.error('Failed to filter hotels');
      return [];
    }
  }, []);

  // Get hotel by ID
  const getHotelById = useCallback(async (id: string) => {
    try {
      const supabaseHotel = await hotelService.getHotelById(id);
      return convertSupabaseHotelToLegacy(supabaseHotel);
    } catch (err) {
      console.error('Error getting hotel by ID:', err);
      return null;
    }
  }, []);

  // Room type operations
  const getRoomTypesByHotelId = useCallback(async (hotelId: string) => {
    try {
      const roomTypes = await hotelRoomTypeService.getRoomTypesByHotelId(hotelId);
      return roomTypes.map(convertSupabaseRoomTypeToLegacy);
    } catch (err) {
      console.error('Error getting room types:', err);
      return [];
    }
  }, []);

  const addRoomType = useCallback(async (roomType: any) => {
    try {
      console.log('[RoomType] Start add room type (legacy):', roomType);
      const supabaseRoomType = convertLegacyRoomTypeToSupabase(roomType, roomType.hotelId);
      console.log('[RoomType] Converted to Supabase payload:', supabaseRoomType);
      // Use external_id-aware creation
      const created = await hotelRoomTypeService.createRoomTypeWithExternalId(supabaseRoomType as any);
      console.log('[RoomType] Created room type response:', created);
      
      toast.success('Room type added successfully');
      console.log('[RoomType] Refreshing hotels after creation');
      await refreshHotels();
    } catch (err) {
      console.error('Error adding room type:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add room type';
      toast.error(errorMessage);
      throw err;
    }
  }, [refreshHotels]);

  const updateRoomType = useCallback(async (id: string, updates: any) => {
    try {
      const supabaseUpdates = convertLegacyRoomTypeToSupabase(updates, updates.hotelId || '');
      await hotelRoomTypeService.updateRoomType(id, supabaseUpdates);
      
      toast.success('Room type updated successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error updating room type:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room type';
      toast.error(errorMessage);
      throw err;
    }
  }, [refreshHotels]);

  const deleteRoomType = useCallback(async (id: string) => {
    try {
      await hotelRoomTypeService.deleteRoomType(id);
      
      toast.success('Room type deleted successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error deleting room type:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room type';
      toast.error(errorMessage);
      throw err;
    }
  }, [refreshHotels]);

  // Update only the status of a room type (avoids clobbering other fields)
  const updateRoomTypeStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
    try {
      await hotelRoomTypeService.updateRoomType(id, { status } as any);
      toast.success(`Room type status updated to ${status}`);
      await refreshHotels();
    } catch (err) {
      console.error('Error updating room type status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room type status';
      toast.error(errorMessage);
      throw err;
    }
  }, [refreshHotels]);

  // Combined operations
  const getHotelWithRoomTypes = useCallback(async (hotelId: string) => {
    try {
      const hotelWithRoomTypes = await hotelCombinedService.getHotelWithRoomTypes(hotelId);
      const legacyHotel = convertSupabaseHotelToLegacy(hotelWithRoomTypes);
      const legacyRoomTypes = hotelWithRoomTypes.roomTypes?.map(convertSupabaseRoomTypeToLegacy) || [];
      
      return {
        ...legacyHotel,
        roomTypes: legacyRoomTypes
      };
    } catch (err) {
      console.error('Error getting hotel with room types:', err);
      return null;
    }
  }, []);

  const addHotelWithRoomTypes = useCallback(async (hotel: any, roomTypes: any[]) => {
    try {
      setLoading(true);
      const supabaseHotel = convertLegacyHotelToSupabase(hotel);
      const supabaseRoomTypes = roomTypes.map(rt => convertLegacyRoomTypeToSupabase(rt, ''));
      
      await hotelCombinedService.createHotelWithRoomTypes(supabaseHotel, supabaseRoomTypes);
      
      toast.success('Hotel with room types added successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error adding hotel with room types:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add hotel with room types';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshHotels]);

  const deleteHotelWithRoomTypes = useCallback(async (hotelId: string) => {
    try {
      setLoading(true);
      await hotelCombinedService.deleteHotelWithRoomTypes(hotelId);
      
      toast.success('Hotel and room types deleted successfully');
      await refreshHotels();
    } catch (err) {
      console.error('Error deleting hotel with room types:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete hotel with room types';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshHotels]);

  return {
    hotels,
    loading,
    error,
    refreshHotels,
    addHotel,
    updateHotel,
    deleteHotel,
    searchHotels,
    filterHotels,
    getHotelById,
    getRoomTypesByHotelId,
    addRoomType,
    updateRoomType,
    deleteRoomType,
    updateRoomTypeStatus,
    getHotelWithRoomTypes,
    addHotelWithRoomTypes,
    deleteHotelWithRoomTypes
  };
};