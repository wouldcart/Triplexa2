import { Hotel, RoomType } from '../types/hotel';
import { 
  hotelService, 
  hotelRoomTypeService, 
  hotelCombinedService 
} from '../../../../integrations/supabase/services/hotelService';
import {
  convertLegacyHotelToSupabase,
  convertLegacyRoomTypeToSupabase,
  convertSupabaseHotelToLegacy,
  convertSupabaseRoomTypeToLegacy
} from '../types/supabaseHotel';

// JSON export/import data structure
export interface HotelExportData {
  version: string;
  exportDate: string;
  hotels: Hotel[];
  roomTypes: RoomType[];
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Import statistics
export interface ImportStatistics {
  totalHotels: number;
  importedHotels: number;
  skippedHotels: number;
  totalRoomTypes: number;
  importedRoomTypes: number;
  skippedRoomTypes: number;
  errors: ValidationError[];
}

/**
 * Export hotels and room types to JSON format
 */
export const exportHotelsToJson = async (hotelIds?: string[]): Promise<string> => {
  try {
    let hotels: any[] = [];
    
    if (hotelIds && hotelIds.length > 0) {
      // Export specific hotels
      for (const hotelId of hotelIds) {
        const hotel = await hotelService.getHotelById(hotelId);
        if (hotel) {
          const roomTypes = await hotelRoomTypeService.getRoomTypesByHotelId(hotelId);
          const legacyHotel = convertSupabaseHotelToLegacy(hotel);
          legacyHotel.roomTypes = roomTypes.map(convertSupabaseRoomTypeToLegacy);
          hotels.push(legacyHotel);
        }
      }
    } else {
      // Export all hotels
      const allHotels = await hotelService.getHotels();
      for (const hotel of allHotels) {
        const roomTypes = await hotelRoomTypeService.getRoomTypesByHotelId(hotel.id);
        const legacyHotel = convertSupabaseHotelToLegacy(hotel);
        legacyHotel.roomTypes = roomTypes.map(convertSupabaseRoomTypeToLegacy);
        hotels.push(legacyHotel);
      }
    }

    // Flatten room types for separate handling
    const allRoomTypes = hotels.flatMap(hotel => 
      hotel.roomTypes.map((roomType: RoomType) => ({
        ...roomType,
        hotelId: hotel.id,
        hotelName: hotel.name
      }))
    );

    const exportData: HotelExportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      hotels: hotels.map(({ roomTypes, ...hotel }) => hotel), // Remove roomTypes from hotels
      roomTypes: allRoomTypes
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting hotels to JSON:', error);
    throw new Error('Failed to export hotels data');
  }
};

/**
 * Validate hotel data before import
 */
const validateHotelData = (hotel: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!hotel.name?.trim()) {
    errors.push({ field: 'name', message: 'Hotel name is required', severity: 'error' });
  } else if (hotel.name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Hotel name must be less than 200 characters', severity: 'error' });
  }
  
  if (!hotel.country?.trim()) {
    errors.push({ field: 'country', message: 'Country is required', severity: 'error' });
  } else if (hotel.country.trim().length > 100) {
    errors.push({ field: 'country', message: 'Country name must be less than 100 characters', severity: 'error' });
  }
  
  if (!hotel.city?.trim()) {
    errors.push({ field: 'city', message: 'City is required', severity: 'error' });
  } else if (hotel.city.trim().length > 100) {
    errors.push({ field: 'city', message: 'City name must be less than 100 characters', severity: 'error' });
  }

  // Star rating validation
  if (hotel.starRating && (hotel.starRating < 1 || hotel.starRating > 5)) {
    errors.push({ field: 'starRating', message: 'Star rating must be between 1 and 5', severity: 'error' });
  }

  // Price validation
  if (hotel.minRate && hotel.minRate < 0) {
    errors.push({ field: 'minRate', message: 'Minimum rate cannot be negative', severity: 'error' });
  }

  // Email validation
  if (hotel.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hotel.email)) {
    errors.push({ field: 'email', message: 'Invalid email format', severity: 'error' });
  }

  // Phone validation
  if (hotel.phone && hotel.phone.length > 50) {
    errors.push({ field: 'phone', message: 'Phone number must be less than 50 characters', severity: 'error' });
  }

  // URL validation
  if (hotel.website && !/^https?:\/\//.test(hotel.website)) {
    errors.push({ field: 'website', message: 'Website must be a valid URL starting with http:// or https://', severity: 'error' });
  }

  // Address validation
  if (hotel.address && hotel.address.length > 500) {
    errors.push({ field: 'address', message: 'Address must be less than 500 characters', severity: 'error' });
  }

  // Description validation
  if (hotel.description && hotel.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be less than 2000 characters', severity: 'error' });
  }

  return errors;
};

/**
 * Validate room type data before import
 */
const validateRoomTypeData = (roomType: any, hotelName: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!roomType.name?.trim()) {
    errors.push({ 
      field: 'name', 
      message: `Room type name is required for hotel: ${hotelName}`, 
      severity: 'error' 
    });
  } else if (roomType.name.trim().length > 100) {
    errors.push({ 
      field: 'name', 
      message: `Room type name must be less than 100 characters for hotel: ${hotelName}`, 
      severity: 'error' 
    });
  }
  
  if (!roomType.adultPrice && roomType.adultPrice !== 0) {
    errors.push({ 
      field: 'adultPrice', 
      message: `Adult price is required for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  // Price validation
  if (roomType.adultPrice < 0) {
    errors.push({ 
      field: 'adultPrice', 
      message: `Adult price cannot be negative for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  if (roomType.childPrice < 0) {
    errors.push({ 
      field: 'childPrice', 
      message: `Child price cannot be negative for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  // Capacity validation
  if (roomType.maxAdults && roomType.maxAdults < 1) {
    errors.push({ 
      field: 'maxAdults', 
      message: `Maximum adults must be at least 1 for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  if (roomType.maxChildren && roomType.maxChildren < 0) {
    errors.push({ 
      field: 'maxChildren', 
      message: `Maximum children cannot be negative for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  if (roomType.maxOccupancy && roomType.maxOccupancy < 1) {
    errors.push({ 
      field: 'maxOccupancy', 
      message: `Maximum occupancy must be at least 1 for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  // Description validation
  if (roomType.description && roomType.description.length > 1000) {
    errors.push({ 
      field: 'description', 
      message: `Description must be less than 1000 characters for room type: ${roomType.name}`, 
      severity: 'error' 
    });
  }

  return errors;
};

/**
 * Validate export data structure and content
 */
const validateExportData = (exportData: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!exportData) {
    errors.push({ field: 'exportData', message: 'Export data is missing', severity: 'error' });
    return errors;
  }

  if (!exportData.hotels || !Array.isArray(exportData.hotels)) {
    errors.push({ field: 'hotels', message: 'Hotels array is missing or invalid', severity: 'error' });
  }

  if (!exportData.roomTypes || !Array.isArray(exportData.roomTypes)) {
    errors.push({ field: 'roomTypes', message: 'Room types array is missing or invalid', severity: 'error' });
  }

  // Check for orphaned room types (room types without corresponding hotels)
  if (exportData.hotels && exportData.roomTypes) {
    const hotelIds = new Set(exportData.hotels.map((h: any) => h.id));
    const orphanedRoomTypes = exportData.roomTypes.filter((rt: any) => !hotelIds.has(rt.hotelId));
    
    if (orphanedRoomTypes.length > 0) {
      errors.push({
        field: 'roomTypes',
        message: `Found ${orphanedRoomTypes.length} room types without corresponding hotels`,
        severity: 'warning'
      });
    }
  }

  return errors;
};

/**
 * Check for duplicate hotels
 */
const checkForDuplicateHotel = async (hotel: any): Promise<boolean> => {
  try {
    const existingHotels = await hotelService.getHotels();
    return existingHotels.some(existing => 
      existing.name.toLowerCase() === hotel.name.toLowerCase() &&
      existing.city.toLowerCase() === hotel.city.toLowerCase() &&
      existing.country.toLowerCase() === hotel.country.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking for duplicate hotel:', error);
    return false;
  }
};

/**
 * Import hotels and room types from JSON data
 */
export const importHotelsFromJson = async (
  jsonData: string,
  options: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  } = { skipDuplicates: true, updateExisting: false }
): Promise<ImportStatistics> => {
  const statistics: ImportStatistics = {
    totalHotels: 0,
    importedHotels: 0,
    skippedHotels: 0,
    totalRoomTypes: 0,
    importedRoomTypes: 0,
    skippedRoomTypes: 0,
    errors: []
  };

  try {
    let exportData: HotelExportData;
    
    try {
      exportData = JSON.parse(jsonData);
    } catch (parseError) {
      throw new Error('Invalid JSON format: Unable to parse the data');
    }
    
    // Validate export data structure
    const dataValidationErrors = validateExportData(exportData);
    if (dataValidationErrors.some(error => error.severity === 'error')) {
      statistics.errors.push(...dataValidationErrors);
      throw new Error('Invalid export data format');
    }
    statistics.errors.push(...dataValidationErrors.filter(error => error.severity === 'warning'));

    if (!exportData.hotels || !exportData.roomTypes) {
      throw new Error('Invalid export data format: missing hotels or roomTypes');
    }

    statistics.totalHotels = exportData.hotels.length;
    statistics.totalRoomTypes = exportData.roomTypes.length;

    // Import hotels
    for (const hotel of exportData.hotels) {
      try {
        // Validate hotel data
        const hotelErrors = validateHotelData(hotel);
        if (hotelErrors.length > 0) {
          statistics.errors.push(...hotelErrors);
          statistics.skippedHotels++;
          continue;
        }

        // Check for duplicates
        const isDuplicate = await checkForDuplicateHotel(hotel);
        if (isDuplicate && options.skipDuplicates) {
          statistics.skippedHotels++;
          statistics.errors.push({
            field: 'name',
            message: `Skipped duplicate hotel: ${hotel.name} in ${hotel.city}, ${hotel.country}`,
            severity: 'warning'
          });
          continue;
        }

        // Convert to Supabase format and create hotel
        const supabaseHotel = convertLegacyHotelToSupabase(hotel);
        const createdHotel = await hotelService.createHotel(supabaseHotel);
        
        // Import room types for this hotel
        const hotelRoomTypes = exportData.roomTypes.filter(rt => rt.hotelId === hotel.id);
        let importedRoomTypesCount = 0;

        for (const roomType of hotelRoomTypes) {
          try {
            // Validate room type data
            const roomTypeErrors = validateRoomTypeData(roomType, hotel.name);
            if (roomTypeErrors.length > 0) {
              statistics.errors.push(...roomTypeErrors);
              statistics.skippedRoomTypes++;
              continue;
            }

            // Convert to Supabase format and create room type
            const supabaseRoomType = convertLegacyRoomTypeToSupabase(roomType, createdHotel.id);
            await hotelRoomTypeService.createRoomType(supabaseRoomType);
            importedRoomTypesCount++;
          } catch (roomTypeError) {
            console.error(`Error importing room type ${roomType.name}:`, roomTypeError);
            statistics.errors.push({
              field: 'roomType',
              message: `Failed to import room type ${roomType.name}: ${roomTypeError instanceof Error ? roomTypeError.message : 'Unknown error'}`,
              severity: 'error'
            });
            statistics.skippedRoomTypes++;
          }
        }

        statistics.importedHotels++;
        statistics.importedRoomTypes += importedRoomTypesCount;

      } catch (hotelError) {
        console.error(`Error importing hotel ${hotel.name}:`, hotelError);
        statistics.errors.push({
          field: 'hotel',
          message: `Failed to import hotel ${hotel.name}: ${hotelError instanceof Error ? hotelError.message : 'Unknown error'}`,
          severity: 'error'
        });
        statistics.skippedHotels++;
      }
    }

    return statistics;

  } catch (error) {
    console.error('Error importing hotels from JSON:', error);
    statistics.errors.push({
      field: 'import',
      message: `Failed to parse JSON data: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
      severity: 'error'
    });
    throw new Error('Failed to import hotels data');
  }
};

/**
 * Download JSON file
 */
export const downloadJsonFile = (data: string, filename: string) => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};