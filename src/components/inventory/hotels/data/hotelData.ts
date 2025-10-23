
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

// Initial mock data for hotels
export const mockHotels: Hotel[] = [
  {
    id: 'hotel001',
    name: 'Grand Hyatt Bangkok',
    starRating: 5,
    category: 'Luxury',
    country: 'Thailand',
    city: 'Bangkok',
    location: 'Central',
    address: {
      street: '494 Rajdamri Road',
      city: 'Bangkok',
      state: 'Bangkok',
      zipCode: '10330',
      country: 'Thailand'
    },
    latitude: 13.7437,
    longitude: 100.5408,
    googleMapLink: 'https://maps.google.com/?q=13.7437,100.5408',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    description: 'Grand Hyatt Bangkok offers luxury accommodations in the heart of Bangkok\'s commercial district, steps from shopping at Central World Plaza.',
    amenities: ['wifi', 'parking', 'aircon', 'pool', 'fitness', 'restaurant', 'bar', 'spa'],
    images: [
      { id: 'img001', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', isPrimary: true },
      { id: 'img002', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa' },
      { id: 'img003', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4' },
    ],
    roomTypes: [
      {
        id: 'room001',
        name: 'Deluxe Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 King Bed or 2 Twin Beds',
        mealPlan: 'Bed & Breakfast',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 12500,
        childPrice: 6000,
        extraBedPrice: 2500,
        description: 'Spacious room with city views and modern amenities.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe'],
        images: [
          { id: 'rimg001', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd', isPrimary: true },
          { id: 'rimg002', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6' },
        ],
        status: 'active'
      },
      {
        id: 'room002',
        name: 'Executive Suite',
        capacity: { adults: 2, children: 2 },
        configuration: '1 King Bed with Separate Living Area',
        mealPlan: 'Half Board',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 18500,
        childPrice: 9000,
        extraBedPrice: 3000,
        description: 'Luxurious suite with separate living room and executive lounge access.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'bathtub', 'workspace'],
        images: [
          { id: 'rimg003', url: 'https://images.unsplash.com/photo-1529551739587-e242c564f727', isPrimary: true },
          { id: 'rimg004', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6' },
        ],
        status: 'active'
      }
    ],
    contactInfo: {
      phone: '+66 2 254 1234',
      email: 'bangkok.grand@hyatt.com',
      website: 'https://www.hyatt.com/bangkok'
    },
    facilities: ['Conference Center', 'Spa', 'Outdoor Pool', 'Restaurant', 'Fitness Center'],
    policies: {
      cancellation: 'Free cancellation up to 24 hours before check-in',
      children: 'Children of all ages are welcome',
      pets: 'Pets are not allowed',
      payment: 'All major credit cards accepted'
    },
    status: 'active',
    createdAt: '2023-01-15T09:00:00Z',
    updatedAt: '2023-06-20T14:30:00Z',
    lastUpdated: '2023-06-20T14:30:00Z'
  },
  {
    id: 'hotel002',
    name: 'Marriott Resort Phuket',
    starRating: 5,
    category: 'Beach Resort',
    country: 'Thailand',
    city: 'Phuket',
    location: 'Patong Beach',
    address: {
      street: '230 Thaveewong Road',
      city: 'Phuket',
      state: 'Phuket',
      zipCode: '83150',
      country: 'Thailand'
    },
    latitude: 7.8965,
    longitude: 98.3035,
    googleMapLink: 'https://maps.google.com/?q=7.8965,98.3035',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    description: 'Beachfront luxury resort offering stunning views of the Andaman Sea with private beach access and multiple swimming pools.',
    amenities: ['wifi', 'parking', 'aircon', 'pool', 'beach', 'restaurant', 'bar', 'spa', 'fitness'],
    images: [
      { id: 'img004', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', isPrimary: true },
      { id: 'img005', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa' },
      { id: 'img006', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
    ],
    roomTypes: [
      {
        id: 'room003',
        name: 'Garden View Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 King Bed or 2 Queen Beds',
        mealPlan: 'Bed & Breakfast',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 15800,
        childPrice: 7900,
        extraBedPrice: 3000,
        description: 'Comfortable room with private balcony overlooking the tropical gardens.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'balcony'],
        images: [
          { id: 'rimg005', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6', isPrimary: true },
          { id: 'rimg006', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd' },
        ],
        status: 'active'
      },
      {
        id: 'room004',
        name: 'Ocean View Suite',
        capacity: { adults: 3, children: 2 },
        configuration: '1 King Bed with Sofa Bed',
        mealPlan: 'Full Board',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 24500,
        childPrice: 12000,
        extraBedPrice: 4000,
        description: 'Spacious suite with panoramic ocean views, separate living area, and private balcony.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'balcony', 'bathtub', 'workspace'],
        images: [
          { id: 'rimg007', url: 'https://images.unsplash.com/photo-1529551739587-e242c564f727', isPrimary: true },
          { id: 'rimg008', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd' },
        ],
        status: 'active'
      }
    ],
    contactInfo: {
      phone: '+66 76 340 480',
      email: 'phuketreservations@marriott.com',
      website: 'https://www.marriott.com/phuket'
    },
    facilities: ['Private Beach', 'Spa', 'Multiple Pools', 'Restaurant', 'Fitness Center'],
    policies: {
      cancellation: 'Free cancellation up to 3 days before check-in',
      children: 'Children of all ages are welcome',
      pets: 'Pets are not allowed',
      payment: 'All major credit cards accepted'
    },
    status: 'active',
    createdAt: '2023-02-10T10:15:00Z',
    updatedAt: '2023-07-05T16:45:00Z',
    lastUpdated: '2023-07-05T16:45:00Z'
  },
  {
    id: 'hotel003',
    name: 'Pullman Bangkok',
    starRating: 4,
    category: 'Business',
    country: 'Thailand',
    city: 'Bangkok',
    location: 'Sukhumvit',
    address: {
      street: '30 Sukhumvit 21 (Asoke) Road',
      city: 'Bangkok',
      state: 'Bangkok',
      zipCode: '10110',
      country: 'Thailand'
    },
    latitude: 13.7367,
    longitude: 100.5637,
    googleMapLink: 'https://maps.google.com/?q=13.7367,100.5637',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    description: 'Contemporary hotel in Bangkok\'s business district with easy access to shopping and dining options.',
    amenities: ['wifi', 'parking', 'aircon', 'pool', 'fitness', 'restaurant', 'bar'],
    images: [
      { id: 'img007', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa', isPrimary: true },
      { id: 'img008', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4' },
    ],
    roomTypes: [
      {
        id: 'room005',
        name: 'Superior Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 King Bed or 2 Twin Beds',
        mealPlan: 'Bed & Breakfast',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 9800,
        childPrice: 4900,
        extraBedPrice: 2000,
        description: 'Modern, well-appointed room with city views.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe'],
        images: [
          { id: 'rimg009', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6', isPrimary: true }
        ],
        status: 'active'
      },
      {
        id: 'room006',
        name: 'Deluxe Suite',
        capacity: { adults: 2, children: 2 },
        configuration: '1 King Bed with Separate Living Area',
        mealPlan: 'Half Board',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 15500,
        childPrice: 7700,
        extraBedPrice: 2800,
        description: 'Spacious suite with separate living area and executive benefits.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'bathtub', 'workspace'],
        images: [
          { id: 'rimg010', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd', isPrimary: true }
        ],
        status: 'active'
      }
    ],
    contactInfo: {
      phone: '+66 2 204 4000',
      email: 'info@pullmanbangkok.com',
      website: 'https://www.pullmanbangkok.com'
    },
    facilities: ['Business Center', 'Meeting Rooms', 'Outdoor Pool', 'Restaurant', 'Fitness Center'],
    policies: {
      cancellation: 'Free cancellation up to 24 hours before check-in',
      children: 'Children of all ages are welcome',
      pets: 'Pets are not allowed',
      payment: 'All major credit cards accepted'
    },
    status: 'active',
    createdAt: '2023-03-05T11:30:00Z',
    updatedAt: '2023-08-12T13:20:00Z',
    lastUpdated: '2023-08-12T13:20:00Z'
  },
  {
    id: 'hotel004',
    name: 'Atlantis The Palm',
    starRating: 5,
    category: 'Luxury Resort',
    country: 'UAE',
    city: 'Dubai',
    location: 'Palm Jumeirah',
    address: {
      street: 'Crescent Road',
      city: 'The Palm',
      state: 'Dubai',
      zipCode: '',
      country: 'UAE'
    },
    latitude: 25.1304,
    longitude: 55.1171,
    googleMapLink: 'https://maps.google.com/?q=25.1304,55.1171',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    description: 'Iconic luxury resort located on the Palm Jumeirah with its own waterpark and marine experiences.',
    amenities: ['wifi', 'parking', 'aircon', 'pool', 'beach', 'restaurant', 'bar', 'spa', 'fitness'],
    images: [
      { id: 'img009', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd', isPrimary: true },
      { id: 'img010', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4' },
    ],
    roomTypes: [
      {
        id: 'room007',
        name: 'Ocean View Room',
        capacity: { adults: 2, children: 2 },
        configuration: '1 King Bed or 2 Queen Beds',
        mealPlan: 'Half Board',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 24500,
        childPrice: 12250,
        extraBedPrice: 4500,
        description: 'Stylish room with stunning views of the Arabian Gulf.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'balcony'],
        images: [
          { id: 'rimg011', url: 'https://images.unsplash.com/photo-1529551739587-e242c564f727', isPrimary: true }
        ],
        status: 'active'
      },
      {
        id: 'room008',
        name: 'Imperial Club Suite',
        capacity: { adults: 3, children: 2 },
        configuration: '1 King Bed with Separate Living Area',
        mealPlan: 'All Inclusive',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 35000,
        childPrice: 17500,
        extraBedPrice: 6000,
        description: 'Luxurious suite with exclusive club lounge access and dedicated concierge service.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'bathtub', 'workspace', 'balcony'],
        images: [
          { id: 'rimg012', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd', isPrimary: true }
        ],
        status: 'active'
      }
    ],
    contactInfo: {
      phone: '+971 4 426 2000',
      email: 'info@atlantisthepalm.com',
      website: 'https://www.atlantisthepalm.com'
    },
    facilities: ['Waterpark', 'Marine Experiences', 'Private Beach', 'Multiple Pools', 'Fine Dining'],
    policies: {
      cancellation: 'Free cancellation up to 7 days before check-in',
      children: 'Children of all ages are welcome, Kids Club available',
      pets: 'Pets are not allowed',
      payment: 'All major credit cards accepted'
    },
    status: 'active',
    createdAt: '2023-04-18T08:45:00Z',
    updatedAt: '2023-09-22T10:10:00Z',
    lastUpdated: '2023-09-22T10:10:00Z'
  },
  {
    id: 'hotel005',
    name: 'Jumeirah Beach Hotel',
    starRating: 5,
    category: 'Beach Resort',
    country: 'UAE',
    city: 'Dubai',
    location: 'Jumeirah Beach',
    address: {
      street: 'Jumeirah Beach Road',
      city: 'Dubai',
      state: 'Dubai',
      zipCode: '',
      country: 'UAE'
    },
    latitude: 25.1415,
    longitude: 55.1901,
    googleMapLink: 'https://maps.google.com/?q=25.1415,55.1901',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    description: 'Wave-shaped 5-star hotel offering panoramic views of the Arabian Gulf and private beach access.',
    amenities: ['wifi', 'parking', 'aircon', 'pool', 'beach', 'restaurant', 'bar', 'spa', 'fitness'],
    images: [
      { id: 'img011', url: 'https://images.unsplash.com/photo-1529551739587-e242c564f727', isPrimary: true },
      { id: 'img012', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4' },
    ],
    roomTypes: [
      {
        id: 'room009',
        name: 'Ocean Deluxe Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 King Bed or 2 Twin Beds',
        mealPlan: 'Bed & Breakfast',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 18700,
        childPrice: 9350,
        extraBedPrice: 3500,
        description: 'Spacious room with floor-to-ceiling windows offering beautiful sea views.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'balcony'],
        images: [
          { id: 'rimg013', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6', isPrimary: true }
        ],
        status: 'active'
      },
      {
        id: 'room010',
        name: 'Family Suite',
        capacity: { adults: 4, children: 2 },
        configuration: '2 Bedrooms with 1 King Bed and 2 Twin Beds',
        mealPlan: 'Full Board',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 28500,
        childPrice: 14250,
        extraBedPrice: 4500,
        description: 'Two-bedroom suite ideal for families, with plenty of space and stunning sea views.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'bathtub', 'workspace', 'balcony'],
        images: [
          { id: 'rimg014', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd', isPrimary: true }
        ],
        status: 'active'
      }
    ],
    contactInfo: {
      phone: '+971 4 348 0000',
      email: 'info@jumeirahbeach.com',
      website: 'https://www.jumeirahbeach.com'
    },
    facilities: ['Wild Wadi Waterpark Access', 'Private Beach', 'Multiple Pools', 'Kids Club', 'Sports Activities'],
    policies: {
      cancellation: 'Free cancellation up to 7 days before check-in',
      children: 'Children of all ages are welcome, Kids Club available',
      pets: 'Pets are not allowed',
      payment: 'All major credit cards accepted'
    },
    status: 'active',
    createdAt: '2023-05-07T09:20:00Z',
    updatedAt: '2023-10-15T11:30:00Z',
    lastUpdated: '2023-10-15T11:30:00Z'
  },
  {
    id: 'hotel006',
    name: 'Patong Beach Resort',
    starRating: 4,
    category: 'Beach Resort',
    country: 'Thailand',
    city: 'Phuket',
    location: 'Patong',
    address: {
      street: '124 Thaveewong Road',
      city: 'Patong',
      state: 'Phuket',
      zipCode: '83150',
      country: 'Thailand'
    },
    latitude: 7.9016,
    longitude: 98.2987,
    googleMapLink: 'https://maps.google.com/?q=7.9016,98.2987',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    description: 'Mid-range resort just steps away from Patong Beach with multiple pools and restaurants.',
    amenities: ['wifi', 'parking', 'aircon', 'pool', 'beach', 'restaurant'],
    images: [
      { id: 'img013', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6', isPrimary: true },
      { id: 'img014', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4' },
    ],
    roomTypes: [
      {
        id: 'room011',
        name: 'Standard Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 Double Bed or 2 Twin Beds',
        mealPlan: 'Room Only',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 8500,
        childPrice: 4250,
        extraBedPrice: 1800,
        description: 'Comfortable room with all essential amenities.',
        amenities: ['wifi', 'aircon', 'tv', 'safe'],
        images: [
          { id: 'rimg015', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6', isPrimary: true }
        ],
        status: 'active'
      },
      {
        id: 'room012',
        name: 'Pool Access Room',
        capacity: { adults: 2, children: 1 },
        configuration: '1 King Bed',
        mealPlan: 'Bed & Breakfast',
        validFrom: '2023-01-01',
        validTo: '2024-12-31',
        adultPrice: 12000,
        childPrice: 6000,
        extraBedPrice: 2200,
        description: 'Ground floor room with direct access to the swimming pool.',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'safe', 'pool-access'],
        images: [
          { id: 'rimg016', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd', isPrimary: true }
        ],
        status: 'active'
      }
    ],
    contactInfo: {
      phone: '+66 76 340 511',
      email: 'info@patongbeachresort.com',
      website: 'https://www.patongbeachresort.com'
    },
    facilities: ['Multiple Pools', 'Restaurant', 'Bar', 'Massage Services', 'Tour Desk'],
    policies: {
      cancellation: 'Free cancellation up to 3 days before check-in',
      children: 'Children of all ages are welcome',
      pets: 'Pets are not allowed',
      payment: 'All major credit cards accepted'
    },
    status: 'inactive',
    createdAt: '2023-05-07T09:20:00Z',
    updatedAt: '2023-10-15T11:30:00Z',
    lastUpdated: '2023-10-15T11:30:00Z'
  }
];

export const formatCurrency = (value: number, currencyCode: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);
};
