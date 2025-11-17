import { Hotel, HotelAmenity, RoomType, HotelImage } from '../types/hotel';

// Hotel amenities options
export const hotelAmenities: HotelAmenity[] = [
  // General amenities
  { id: 'wifi', name: 'Free WiFi', category: 'general' },
  { id: 'parking', name: 'Free Parking', category: 'general' },
  { id: 'aircon', name: 'Air Conditioning', category: 'general' },
  { id: 'elevator', name: 'Elevator', category: 'general' },
  { id: '24hr-front-desk', name: '24-hour Front Desk', category: 'general' },
  { id: 'non-smoking', name: 'Non-smoking Rooms', category: 'general' },
  
  // Room amenities
  { id: 'minibar', name: 'Minibar', category: 'room' },
  { id: 'safe', name: 'In-room Safe', category: 'room' },
  { id: 'tv', name: 'Flat-screen TV', category: 'room' },
  { id: 'kettle', name: 'Electric Kettle', category: 'room' },
  { id: 'balcony', name: 'Balcony', category: 'room' },
  { id: 'workspace', name: 'Work Desk', category: 'room' },
  
  // Bathroom amenities
  { id: 'toiletries', name: 'Free Toiletries', category: 'bathroom' },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom' },
  { id: 'shower', name: 'Shower', category: 'bathroom' },
  { id: 'hairdryer', name: 'Hairdryer', category: 'bathroom' },
  { id: 'slippers', name: 'Slippers', category: 'bathroom' },
  { id: 'bathrobes', name: 'Bathrobes', category: 'bathroom' },
  
  // Dining amenities
  { id: 'restaurant', name: 'Restaurant', category: 'dining' },
  { id: 'breakfast', name: 'Breakfast Included', category: 'dining' },
  { id: 'bar', name: 'Bar', category: 'dining' },
  { id: 'room-service', name: 'Room Service', category: 'dining' },
  
  // Services
  { id: 'concierge', name: 'Concierge Service', category: 'services' },
  { id: 'laundry', name: 'Laundry Service', category: 'services' },
  { id: 'airport-shuttle', name: 'Airport Shuttle', category: 'services' },
  { id: 'childcare', name: 'Childcare Services', category: 'services' },
  { id: 'spa', name: 'Spa Services', category: 'services' },
  
  // Activities
  { id: 'pool', name: 'Swimming Pool', category: 'activities' },
  { id: 'fitness', name: 'Fitness Center', category: 'activities' },
  { id: 'sauna', name: 'Sauna', category: 'activities' },
  { id: 'garden', name: 'Garden', category: 'activities' },
  { id: 'beach', name: 'Beach Access', category: 'activities' },
];

// Empty array - data should come from Supabase
export const mockHotels: Hotel[] = [];

export const formatCurrency = (value: number, currencyCode: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);
};