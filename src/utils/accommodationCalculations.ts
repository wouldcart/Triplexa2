
export interface AccommodationStay {
  id: string;
  city: string;
  hotelId: string;
  hotelName: string;
  hotelCategory: string;
  numberOfNights: number;
  numberOfRooms: number;
  roomType: string;
  pricePerNightPerRoom: number;
  totalPrice: number;
  checkInDay: number;
  checkOutDay: number;
  stayDays: number[];
  optionNumber: 1 | 2 | 3;
  // Extended properties for pricing
  numberOfChildren?: number;
  extraBeds?: number;
  pricePerNight?: number; // Legacy compatibility
  // New properties for room details
  configuration?: string;
  mealPlan?: string;
}

export interface AccommodationCalculationResult {
  totalAccommodationCost: number;
  accommodationsByCity: Record<string, AccommodationStay[]>;
  accommodationsByDay: Record<number, AccommodationStay[]>;
  accommodationsByOption: Record<1 | 2 | 3, AccommodationStay[]>;
}

export const calculateAccommodationStay = (
  city: string,
  hotelId: string,
  hotelName: string,
  hotelCategory: string,
  numberOfNights: number,
  numberOfRooms: number,
  roomType: string,
  pricePerNightPerRoom: number,
  startDay: number,
  optionNumber: 1 | 2 | 3 = 1
): AccommodationStay => {
  const checkInDay = startDay;
  const checkOutDay = startDay + numberOfNights;
  const stayDays = Array.from({ length: numberOfNights }, (_, i) => startDay + i);
  const totalPrice = numberOfNights * numberOfRooms * pricePerNightPerRoom;

  return {
    id: `accommodation_${Date.now()}_${Math.random()}`,
    city,
    hotelId,
    hotelName,
    hotelCategory,
    numberOfNights,
    numberOfRooms,
    roomType,
    pricePerNightPerRoom,
    totalPrice,
    checkInDay,
    checkOutDay,
    stayDays,
    optionNumber
  };
};

export const calculateTotalAccommodationCost = (accommodations: AccommodationStay[]): number => {
  return accommodations.reduce((total, accommodation) => total + accommodation.totalPrice, 0);
};

export const calculateTotalAccommodationCostByOption = (accommodations: AccommodationStay[], optionNumber: 1 | 2 | 3): number => {
  return accommodations
    .filter(acc => acc.optionNumber === optionNumber)
    .reduce((total, accommodation) => total + accommodation.totalPrice, 0);
};

export const groupAccommodationsByCity = (accommodations: AccommodationStay[]): Record<string, AccommodationStay[]> => {
  return accommodations.reduce((groups, accommodation) => {
    if (!groups[accommodation.city]) {
      groups[accommodation.city] = [];
    }
    groups[accommodation.city].push(accommodation);
    return groups;
  }, {} as Record<string, AccommodationStay[]>);
};

export const groupAccommodationsByDay = (accommodations: AccommodationStay[]): Record<number, AccommodationStay[]> => {
  const dayGroups: Record<number, AccommodationStay[]> = {};
  
  accommodations.forEach(accommodation => {
    accommodation.stayDays.forEach(day => {
      if (!dayGroups[day]) {
        dayGroups[day] = [];
      }
      dayGroups[day].push(accommodation);
    });
  });
  
  return dayGroups;
};

export const groupAccommodationsByOption = (accommodations: AccommodationStay[]): Record<1 | 2 | 3, AccommodationStay[]> => {
  const optionGroups: Record<1 | 2 | 3, AccommodationStay[]> = {
    1: [],
    2: [],
    3: []
  };
  
  accommodations.forEach(accommodation => {
    optionGroups[accommodation.optionNumber].push(accommodation);
  });
  
  return optionGroups;
};

export const getAccommodationsByDayAndOption = (
  accommodations: AccommodationStay[], 
  dayNumber: number, 
  optionNumber: 1 | 2 | 3
): AccommodationStay[] => {
  return accommodations.filter(acc => 
    acc.optionNumber === optionNumber && acc.stayDays.includes(dayNumber)
  );
};
