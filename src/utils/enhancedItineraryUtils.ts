import {
  ItineraryDay,
  EnhancedAccommodationOption,
  EnhancedSightseeingActivity,
  EnhancedTransportRoute,
  EnhancedTransferConfiguration
} from '@/types/itinerary';

export interface EnhancedItineraryData {
  days: ItineraryDay[];
  accommodationOptions: Record<string, EnhancedAccommodationOption[]>; // dayId -> options
  sightseeingActivities: Record<string, EnhancedSightseeingActivity[]>; // dayId -> activities
  transportRoutes: Record<string, EnhancedTransportRoute[]>; // dayId -> routes
  transferConfigurations: Record<string, EnhancedTransferConfiguration[]>; // dayId -> transfers
}

export interface ComprehensiveProposalData {
  queryId: string;
  days: any[];
  accommodationSelections?: any[];
  enhancedData?: EnhancedItineraryData;
  version: number;
  savedAt: string;
  totalCost: number;
}

/**
 * Load comprehensive day-wise itinerary data from all possible storage locations
 */
export const loadComprehensiveItineraryData = (queryId: string): ComprehensiveProposalData | null => {
  try {
    // Priority order of storage keys to check
    const storageKeys = [
      `proposal_draft_${queryId}`,           // Main day-wise draft
      `proposal_complete_${queryId}`,        // Complete proposal data
      `itinerary_builder_${queryId}`,       // Advanced itinerary builder
      `itinerary_${queryId}`,               // Central itinerary
      `enquiry_workflow_${queryId}`,        // Workflow context data
      `comprehensive_proposal_${queryId}`,   // Comprehensive proposal manager
      `enhanced_proposal_modules_${queryId}` // Enhanced modules
    ];

    for (const key of storageKeys) {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log(`Loaded data from ${key}:`, {
            daysCount: parsed.days?.length || 0,
            accommodationsCount: parsed.accommodationSelections?.length || 0,
            hasEnhancedData: !!parsed.enhancedData
          });

          // Transform and normalize the data
          return transformToComprehensiveData(queryId, parsed);
        } catch (parseError) {
          console.error(`Error parsing data from ${key}:`, parseError);
          continue;
        }
      }
    }

    console.log(`No existing data found for query ${queryId}`);
    return null;
  } catch (error) {
    console.error('Error loading comprehensive itinerary data:', error);
    return null;
  }
};

/**
 * Transform various data formats to comprehensive format
 */
const transformToComprehensiveData = (queryId: string, rawData: any): ComprehensiveProposalData => {
  const defaultData: ComprehensiveProposalData = {
    queryId,
    days: [],
    accommodationSelections: [],
    enhancedData: {
      days: [],
      accommodationOptions: {},
      sightseeingActivities: {},
      transportRoutes: {},
      transferConfigurations: {}
    },
    version: Date.now(),
    savedAt: new Date().toISOString(),
    totalCost: 0
  };

  try {
    // Handle different data structures
    if (rawData.days && Array.isArray(rawData.days)) {
      defaultData.days = rawData.days;
      defaultData.totalCost = rawData.totalCost || calculateTotalCost(rawData.days);
    }

    if (rawData.accommodationSelections && Array.isArray(rawData.accommodationSelections)) {
      defaultData.accommodationSelections = rawData.accommodationSelections;
    }

    // Extract enhanced data from days
    if (rawData.days && Array.isArray(rawData.days)) {
      defaultData.enhancedData = extractEnhancedDataFromDays(rawData.days);
    }

    // Preserve existing enhanced data if available
    if (rawData.enhancedData) {
      defaultData.enhancedData = { ...defaultData.enhancedData, ...rawData.enhancedData };
    }

    // Preserve metadata
    if (rawData.version) defaultData.version = rawData.version;
    if (rawData.savedAt) defaultData.savedAt = rawData.savedAt;
    if (rawData.timestamp) defaultData.savedAt = rawData.timestamp;

    return defaultData;
  } catch (error) {
    console.error('Error transforming data:', error);
    return defaultData;
  }
};

/**
 * Extract enhanced data structures from legacy day data
 */
const extractEnhancedDataFromDays = (days: any[]): EnhancedItineraryData => {
  const enhancedData: EnhancedItineraryData = {
    days: [],
    accommodationOptions: {},
    sightseeingActivities: {},
    transportRoutes: {},
    transferConfigurations: {}
  };

  days.forEach((day, index) => {
    const dayId = day.id || `day_${index + 1}`;

    // Extract accommodation options (support for 3 options)
    if (day.accommodations && Array.isArray(day.accommodations)) {
      enhancedData.accommodationOptions[dayId] = day.accommodations.map((acc: any, optionIndex: number): EnhancedAccommodationOption => ({
        id: acc.id || `acc_${dayId}_${optionIndex}`,
        hotelName: acc.name || acc.hotel || `Hotel ${optionIndex + 1}`,
        hotelType: acc.type || 'hotel',
        roomType: acc.roomType || 'Standard Room',
        numberOfRooms: acc.rooms || 1,
        city: day.city || acc.city || '',
        numberOfNights: acc.nights || 1,
        checkInDate: acc.checkIn || day.date || '',
        checkOutDate: acc.checkOut || '',
        starRating: acc.starRating || 3,
        amenities: acc.amenities || [],
        price: acc.totalPrice || acc.price || 0,
        pricePerNight: acc.pricePerNight || acc.price || 0,
        option: (optionIndex + 1) as 1 | 2 | 3,
        address: acc.address || '',
        phone: acc.phone || '',
        email: acc.email || ''
      })).slice(0, 3); // Limit to 3 options
    }

    // Extract enhanced sightseeing activities
    if (day.activities && Array.isArray(day.activities)) {
      enhancedData.sightseeingActivities[dayId] = day.activities.map((activity: any): EnhancedSightseeingActivity => ({
        id: activity.id || `activity_${dayId}_${Date.now()}`,
        sightseeingName: activity.name || 'Sightseeing Activity',
        sightseeingDescription: activity.description || '',
        sightseeingType: activity.category === 'private' || activity.transportType === 'private_car' ? 'PVT' : 'SIC',
        category: activity.category || activity.type || 'sightseeing',
        groupSize: activity.effectivePax || activity.groupSize || 2,
        packageIncludes: activity.packageOptions || activity.selectedOptions || activity.inclusions || [],
        location: {
          id: `loc_${dayId}`,
          name: day.city || 'Location',
          country: 'Thailand', // Default - should come from query
          city: day.city || '',
          coordinates: undefined
        },
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        duration: activity.duration || '2 hours',
        price: activity.cost || activity.price || 0,
        transferConfiguration: activity.vehicleType ? {
          id: `transfer_${activity.id}`,
          vehicleName: activity.vehicleType || 'Private Car',
          vehicleType: activity.vehicleType === 'private_car' ? 'private_car' : 'sedan',
          vehicleNumbers: [`${activity.vehicleType}_001`],
          transferType: activity.transportType === 'private_car' ? 'PVT' : 'SIC',
          pickupLocation: activity.pickupLocation || day.city || '',
          dropLocation: activity.dropoffLocation || day.city || '',
          pickupTime: activity.startTime || '',
          dropTime: activity.endTime || '',
          capacity: activity.seatingCapacity || 4,
          price: 0 // Usually included in activity price
        } : undefined
      }));
    }

    // Extract transport routes
    if (day.transport && Array.isArray(day.transport)) {
      enhancedData.transportRoutes[dayId] = day.transport.map((transport: any): EnhancedTransportRoute => ({
        id: transport.id || `route_${dayId}_${Date.now()}`,
        routeName: transport.name || `${transport.from} to ${transport.to}`,
        routeCode: transport.routeCode || `RT_${dayId}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        from: {
          id: `from_${transport.id}`,
          name: typeof transport.from === 'string' ? transport.from : transport.from?.name || 'Origin',
          country: 'Thailand',
          city: typeof transport.from === 'string' ? transport.from : transport.from?.city || day.city || '',
          coordinates: undefined
        },
        to: {
          id: `to_${transport.id}`,
          name: typeof transport.to === 'string' ? transport.to : transport.to?.name || 'Destination',
          country: 'Thailand',
          city: typeof transport.to === 'string' ? transport.to : transport.to?.city || day.city || '',
          coordinates: undefined
        },
        pickupLocations: [transport.pickupLocation || 'Hotel Pickup'].filter(Boolean),
        vehicleConfiguration: {
          vehicleType: transport.vehicleType || 'Private Car',
          numberOfVehicles: transport.vehicleCount || 1,
          capacity: transport.seatingCapacity || 4,
          totalCapacity: transport.totalCapacity || (transport.seatingCapacity || 4) * (transport.vehicleCount || 1)
        },
        duration: transport.duration || '1 hour',
        price: transport.price || 0,
        schedules: transport.pickupTime && transport.dropTime ? [{
          departureTime: transport.pickupTime,
          arrivalTime: transport.dropTime,
          pickupTimes: [{ location: transport.pickupLocation || 'Hotel', time: transport.pickupTime }]
        }] : undefined
      }));
    }

    // Extract transfer configurations for activities
    if (day.activities && Array.isArray(day.activities)) {
      const transfers = day.activities
        .filter((activity: any) => activity.vehicleType || activity.transportType)
        .map((activity: any): EnhancedTransferConfiguration => ({
          id: `transfer_${activity.id}_${dayId}`,
          vehicleName: activity.vehicleType || 'Private Car',
          vehicleType: activity.vehicleType === 'private_car' ? 'private_car' : 'sedan',
          vehicleNumbers: [`${activity.vehicleType || 'car'}_${Math.random().toString(36).substr(2, 4)}`],
          transferType: activity.transportType === 'private_car' || activity.category === 'private' ? 'PVT' : 'SIC',
          pickupLocation: activity.pickupLocation || day.city || 'Hotel',
          dropLocation: activity.dropoffLocation || day.city || 'Activity Location',
          pickupTime: activity.startTime || '',
          dropTime: activity.endTime || '',
          capacity: activity.seatingCapacity || 4,
          price: 0 // Usually included in activity price
        }));

      if (transfers.length > 0) {
        enhancedData.transferConfigurations[dayId] = transfers;
      }
    }
  });

  return enhancedData;
};

/**
 * Calculate total cost from days data
 */
const calculateTotalCost = (days: any[]): number => {
  return days.reduce((total, day) => total + (day.totalCost || 0), 0);
};

/**
 * Save comprehensive itinerary data
 */
export const saveComprehensiveItineraryData = (data: ComprehensiveProposalData): void => {
  try {
    const dataToSave = {
      ...data,
      savedAt: new Date().toISOString(),
      version: Date.now()
    };

    // Save to multiple keys for compatibility
    localStorage.setItem(`proposal_draft_${data.queryId}`, JSON.stringify(dataToSave));
    localStorage.setItem(`proposal_complete_${data.queryId}`, JSON.stringify(dataToSave));
    
    console.log('Saved comprehensive itinerary data:', {
      queryId: data.queryId,
      daysCount: data.days.length,
      accommodationsCount: data.accommodationSelections?.length || 0,
      hasEnhancedData: !!data.enhancedData,
      totalCost: data.totalCost
    });
  } catch (error) {
    console.error('Error saving comprehensive itinerary data:', error);
  }
};

/**
 * Generate default accommodation options for a day
 */
export const generateDefaultAccommodationOptions = (dayData: any): EnhancedAccommodationOption[] => {
  const baseOption: Partial<EnhancedAccommodationOption> = {
    hotelType: 'hotel',
    roomType: 'Standard Room',
    numberOfRooms: 1,
    city: dayData.city || '',
    numberOfNights: 1,
    checkInDate: dayData.date || '',
    checkOutDate: dayData.date || '',
    starRating: 3,
    amenities: ['wifi', 'parking'],
    pricePerNight: 100
  };

  return [
    {
      ...baseOption,
      id: `acc_${dayData.id}_1`,
      hotelName: 'Budget Hotel Option',
      hotelType: 'hotel',
      starRating: 3,
      price: 100,
      pricePerNight: 100,
      option: 1
    },
    {
      ...baseOption,
      id: `acc_${dayData.id}_2`,
      hotelName: 'Mid-Range Hotel Option',
      hotelType: 'hotel',
      starRating: 4,
      price: 200,
      pricePerNight: 200,
      option: 2,
      amenities: ['wifi', 'parking', 'gym', 'pool']
    },
    {
      ...baseOption,
      id: `acc_${dayData.id}_3`,
      hotelName: 'Luxury Hotel Option',
      hotelType: 'resort',
      starRating: 5,
      price: 400,
      pricePerNight: 400,
      option: 3,
      amenities: ['wifi', 'parking', 'gym', 'pool', 'spa', 'restaurant']
    }
  ] as EnhancedAccommodationOption[];
};

/**
 * Ensure each day has 3 accommodation options
 */
export const ensureThreeAccommodationOptions = (data: ComprehensiveProposalData): ComprehensiveProposalData => {
  if (!data.enhancedData) {
    data.enhancedData = {
      days: [],
      accommodationOptions: {},
      sightseeingActivities: {},
      transportRoutes: {},
      transferConfigurations: {}
    };
  }

  data.days.forEach((day) => {
    const dayId = day.id;
    const existingOptions = data.enhancedData!.accommodationOptions[dayId] || [];
    
    if (existingOptions.length < 3) {
      const defaultOptions = generateDefaultAccommodationOptions(day);
      // Keep existing options and fill with defaults
      const filledOptions = [...existingOptions];
      
      for (let i = existingOptions.length; i < 3; i++) {
        filledOptions.push({
          ...defaultOptions[i],
          option: (i + 1) as 1 | 2 | 3
        });
      }
      
      data.enhancedData!.accommodationOptions[dayId] = filledOptions;
    }
  });

  return data;
};
