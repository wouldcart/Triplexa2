
import { ItineraryDay } from '@/types/itinerary';

export interface AccommodationOption {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'guesthouse' | 'apartment' | 'villa' | 'hostel';
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  starRating: number;
  pricePerNight: number;
  totalPrice: number;
  amenities: string[];
  description: string;
  address: string;
  phone: string;
  email: string;
  dayIds: string[]; // Which days this accommodation covers
  option: 1 | 2 | 3; // Option number for comparison
  similarOptions?: any[]; // Similar hotel options for alternatives
}

export interface AccommodationOptionSet {
  option1: AccommodationOption[];
  option2: AccommodationOption[];
  option3: AccommodationOption[];
}

export const extractAccommodationsFromDays = (days: any[]): AccommodationOptionSet => {
  const optionSet: AccommodationOptionSet = {
    option1: [],
    option2: [],
    option3: []
  };

  days.forEach(day => {
    if (day.accommodations && Array.isArray(day.accommodations)) {
      day.accommodations.forEach((acc: any, index: number) => {
        const accommodation: AccommodationOption = {
          id: acc.id || `acc_${day.id}_${index}`,
          name: acc.name || 'Unnamed Accommodation',
          type: acc.type || 'hotel',
          city: acc.city || day.city,
          checkIn: acc.checkIn || day.date,
          checkOut: acc.checkOut || day.date,
          nights: acc.nights || 1,
          roomType: acc.roomType || 'Standard Room',
          starRating: acc.starRating || 3,
          pricePerNight: acc.pricePerNight || 0,
          totalPrice: acc.totalPrice || acc.pricePerNight || 0,
          amenities: acc.amenities || [],
          description: acc.description || '',
          address: acc.address || '',
          phone: acc.phone || '',
          email: acc.email || '',
          dayIds: [day.id],
          option: (acc.option || 1) as 1 | 2 | 3
        };

        if (accommodation.option === 1) {
          optionSet.option1.push(accommodation);
        } else if (accommodation.option === 2) {
          optionSet.option2.push(accommodation);
        } else if (accommodation.option === 3) {
          optionSet.option3.push(accommodation);
        }
      });
    }
  });

  return optionSet;
};

export const mapAccommodationsToDays = (
  accommodations: AccommodationOption[],
  days: any[]
): any[] => {
  return days.map(day => {
    const dayAccommodations = accommodations.filter(acc => 
      acc.dayIds.includes(day.id) || 
      acc.city === day.city ||
      (acc.checkIn <= day.date && acc.checkOut >= day.date)
    );

    return {
      ...day,
      accommodations: dayAccommodations.map(acc => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        city: acc.city,
        checkIn: acc.checkIn,
        checkOut: acc.checkOut,
        nights: acc.nights,
        roomType: acc.roomType,
        starRating: acc.starRating,
        pricePerNight: acc.pricePerNight,
        totalPrice: acc.totalPrice,
        amenities: acc.amenities,
        description: acc.description,
        address: acc.address,
        phone: acc.phone,
        email: acc.email,
        option: acc.option
      }))
    };
  });
};

export const saveAccommodationData = (queryId: string, accommodations: AccommodationOption[], days: any[]) => {
  try {
    // Update days with accommodation data
    const updatedDays = mapAccommodationsToDays(accommodations, days);
    
    // Save to localStorage with the same key used by proposal builder
    const draftData = {
      queryId,
      days: updatedDays,
      totalCost: updatedDays.reduce((sum, day) => sum + (day.totalCost || 0), 0),
      savedAt: new Date().toISOString(),
      accommodations: accommodations,
      version: Date.now()
    };
    
    localStorage.setItem(`proposal_draft_${queryId}`, JSON.stringify(draftData));
    
    // Also save accommodation-specific data
    localStorage.setItem(`accommodations_${queryId}`, JSON.stringify(accommodations));
    
    console.log('Accommodation data saved for query:', queryId, draftData);
    return true;
  } catch (error) {
    console.error('Error saving accommodation data:', error);
    return false;
  }
};

export const loadAccommodationData = (queryId: string): AccommodationOption[] => {
  try {
    // First try to load from accommodation-specific storage
    const accommodationData = localStorage.getItem(`accommodations_${queryId}`);
    if (accommodationData) {
      return JSON.parse(accommodationData);
    }
    
    // Fallback to extracting from draft data
    const draftData = localStorage.getItem(`proposal_draft_${queryId}`);
    if (draftData) {
      const parsed = JSON.parse(draftData);
      if (parsed.accommodations) {
        return parsed.accommodations;
      }
      if (parsed.days) {
        const extracted = extractAccommodationsFromDays(parsed.days);
        return [...extracted.option1, ...extracted.option2, ...extracted.option3];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error loading accommodation data:', error);
    return [];
  }
};

export const calculateAccommodationTimeline = (
  accommodations: AccommodationOption[],
  days: any[]
): Array<{
  dayId: string;
  date: string;
  city: string;
  accommodations: AccommodationOption[];
  isCheckIn: boolean;
  isCheckOut: boolean;
}> => {
  return days.map(day => {
    const dayAccommodations = accommodations.filter(acc =>
      acc.checkIn <= day.date && acc.checkOut >= day.date
    );

    const isCheckIn = accommodations.some(acc => acc.checkIn === day.date);
    const isCheckOut = accommodations.some(acc => acc.checkOut === day.date);

    return {
      dayId: day.id,
      date: day.date,
      city: day.city,
      accommodations: dayAccommodations,
      isCheckIn,
      isCheckOut
    };
  });
};
