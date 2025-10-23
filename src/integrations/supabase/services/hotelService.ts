import { supabase } from '../client';
import { Tables, TablesInsert, TablesUpdate } from '../types';

export type Hotel = Tables<'hotels'>;
export type HotelInsert = TablesInsert<'hotels'>;
export type HotelUpdate = TablesUpdate<'hotels'>;

export type HotelRoomType = Tables<'hotel_room_types'>;
export type HotelRoomTypeInsert = TablesInsert<'hotel_room_types'>;
export type HotelRoomTypeUpdate = TablesUpdate<'hotel_room_types'>;

// Hotel CRUD Operations
export const hotelService = {
  // Get all hotels with optional filtering
  async getHotels(filters?: {
    city?: string;
    country?: string;
    status?: string;
    star_rating?: number;
  }) {
    let query = supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.country) {
      query = query.ilike('country', `%${filters.country}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.star_rating) {
      query = query.eq('star_rating', filters.star_rating);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get a single hotel by ID
  async getHotelById(id: string) {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new hotel
  async createHotel(hotel: HotelInsert) {
    const { data, error } = await supabase
      .from('hotels')
      .insert(hotel)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing hotel
  async updateHotel(id: string, updates: HotelUpdate) {
    const { data, error } = await supabase
      .from('hotels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a hotel
  async deleteHotel(id: string) {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search hotels by name
  async searchHotels(searchTerm: string) {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Generate next available external_id
  async generateNextExternalId(): Promise<number> {
    const { data: latestHotel, error } = await supabase
      .from('hotels')
      .select('external_id')
      .not('external_id', 'is', null)
      .order('external_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (latestHotel && latestHotel.length > 0) {
      return latestHotel[0].external_id! + 1;
    } else {
      return 10001; // Starting point
    }
  },

  // Check if external_id is unique
  async isExternalIdUnique(externalId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('hotels')
      .select('id')
      .eq('external_id', externalId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !data; // Returns true if no existing hotel found
  },

  // Create hotel with external_id validation and retry logic
  async createHotelWithExternalId(hotel: HotelInsert, maxRetries: number = 3): Promise<Hotel> {
    let attempts = 0;
    let currentExternalId = hotel.external_id;

    while (attempts < maxRetries) {
      try {
        // If no external_id provided, generate one
        if (!currentExternalId) {
          currentExternalId = await this.generateNextExternalId();
        }

        // Check uniqueness
        const isUnique = await this.isExternalIdUnique(currentExternalId);
        if (!isUnique) {
          // Generate new external_id and retry
          currentExternalId = await this.generateNextExternalId();
          attempts++;
          continue;
        }

        // Create hotel with external_id
        const hotelWithExternalId = {
          ...hotel,
          external_id: currentExternalId,
        };

        const { data, error } = await supabase
          .from('hotels')
          .insert(hotelWithExternalId)
          .select()
          .single();

        if (error) {
          // If it's a unique constraint violation, retry with new external_id
          if (error.code === '23505' && error.message.includes('external_id')) {
            currentExternalId = await this.generateNextExternalId();
            attempts++;
            continue;
          }
          throw error;
        }

        return data;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        // Generate new external_id for next attempt
        currentExternalId = await this.generateNextExternalId();
      }
    }

    throw new Error(`Failed to create hotel after ${maxRetries} attempts`);
  }
};

// Hotel Room Type CRUD Operations
export const hotelRoomTypeService = {
  // Generate next available external_id for room types
  async generateNextExternalId(): Promise<number> {
    const { data: latestRoomType, error } = await supabase
      .from('hotel_room_types')
      .select('external_id')
      .not('external_id', 'is', null)
      .order('external_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (latestRoomType && latestRoomType.length > 0) {
      return (latestRoomType[0].external_id as number) + 1;
    } else {
      return 10001; // Starting point
    }
  },

  // Check if a room type external_id is unique
  async isExternalIdUnique(externalId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('hotel_room_types')
      .select('id', { count: 'exact', head: true })
      .eq('external_id', externalId);

    if (error) throw error;
    // When head: true, supabase-js returns data as null and count as number in the meta; handle gracefully
    const count = (data as any)?.length ?? (data === null ? (error as any)?.count ?? 0 : 0);
    return count === 0;
  },
  // Get all room types for a hotel
  async getRoomTypesByHotelId(hotelId: string) {
    const { data, error } = await supabase
      .from('hotel_room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get a single room type by ID
  async getRoomTypeById(id: string) {
    const { data, error } = await supabase
      .from('hotel_room_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new room type
  async createRoomType(roomType: HotelRoomTypeInsert) {
    const { data, error } = await supabase
      .from('hotel_room_types')
      .insert(roomType)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new room type with auto-generated unique external_id and retry logic
  async createRoomTypeWithExternalId(roomType: Omit<HotelRoomTypeInsert, 'external_id'>, maxRetries: number = 3) {
    let attempts = 0;
    let currentExternalId = await this.generateNextExternalId();

    while (attempts < maxRetries) {
      try {
        // Ensure hotel_id is present
        if (!roomType.hotel_id) {
          throw new Error('hotel_id is required when creating a room type');
        }

        const payload = { ...roomType, external_id: currentExternalId } as HotelRoomTypeInsert;

        const { data, error } = await supabase
          .from('hotel_room_types')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        // Generate new external_id for next attempt
        currentExternalId = await this.generateNextExternalId();
      }
    }

    throw new Error(`Failed to create room type after ${maxRetries} attempts`);
  },

  // Update an existing room type
  async updateRoomType(id: string, updates: HotelRoomTypeUpdate) {
    const { data, error } = await supabase
      .from('hotel_room_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a room type
  async deleteRoomType(id: string) {
    const { error } = await supabase
      .from('hotel_room_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get all room types with hotel information
  async getAllRoomTypesWithHotels() {
    const { data, error } = await supabase
      .from('hotel_room_types')
      .select(`
        *,
        hotels (
          id,
          name,
          city,
          country,
          star_rating
        )
      `)
      .order('name');

    if (error) throw error;
    return data;
  }
};

// Combined service for operations that involve both hotels and room types
export const hotelCombinedService = {
  // Get hotel with all its room types
  async getHotelWithRoomTypes(hotelId: string) {
    const [hotel, roomTypes] = await Promise.all([
      hotelService.getHotelById(hotelId),
      hotelRoomTypeService.getRoomTypesByHotelId(hotelId)
    ]);

    return {
      ...hotel,
      roomTypes
    };
  },

  // Create hotel with initial room types
  async createHotelWithRoomTypes(
    hotel: HotelInsert,
    roomTypes: Omit<HotelRoomTypeInsert, 'hotel_id'>[]
  ) {
    const createdHotel = await hotelService.createHotel(hotel);
    
    if (roomTypes.length > 0) {
      const roomTypesWithHotelId = roomTypes.map(rt => ({
        ...rt,
        hotel_id: createdHotel.id
      }));

      const { data: createdRoomTypes, error } = await supabase
        .from('hotel_room_types')
        .insert(roomTypesWithHotelId)
        .select();

      if (error) throw error;

      return {
        ...createdHotel,
        roomTypes: createdRoomTypes
      };
    }

    return {
      ...createdHotel,
      roomTypes: []
    };
  },

  // Delete hotel and all its room types
  async deleteHotelWithRoomTypes(hotelId: string) {
    // First delete all room types
    await supabase
      .from('hotel_room_types')
      .delete()
      .eq('hotel_id', hotelId);

    // Then delete the hotel
    await hotelService.deleteHotel(hotelId);
  },

  // Bulk operations for import/export functionality
  async bulkCreateHotelsWithRoomTypes(hotelsData: Array<{
    hotel: HotelInsert;
    roomTypes: Omit<HotelRoomTypeInsert, 'hotel_id'>[];
  }>) {
    const results = [];
    
    for (const hotelData of hotelsData) {
      try {
        const result = await this.createHotelWithRoomTypes(
          hotelData.hotel,
          hotelData.roomTypes
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error, hotelName: hotelData.hotel.name });
      }
    }
    
    return results;
  },

  // Get all hotels with their room types for export
  async getAllHotelsWithRoomTypes() {
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .order('name');

    if (hotelsError) throw hotelsError;

    const hotelsWithRoomTypes = [];
    
    for (const hotel of hotels) {
      const { data: roomTypes, error: roomTypesError } = await supabase
        .from('hotel_room_types')
        .select('*')
        .eq('hotel_id', hotel.id)
        .order('name');

      if (roomTypesError) throw roomTypesError;

      hotelsWithRoomTypes.push({
        ...hotel,
        roomTypes: roomTypes || []
      });
    }

    return hotelsWithRoomTypes;
  }
};