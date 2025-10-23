import { Hotel, RoomType } from '../types/hotel';

export const createThailandLuxuryHotels = (): Hotel[] => {
  const now = new Date().toISOString();
  
  // Common luxury amenities
  const luxuryAmenities = [
    'Free WiFi', 'Swimming Pool', 'Spa', 'Fitness Center', 'Restaurant', 
    'Bar', 'Room Service', 'Concierge', 'Valet Parking', 'Business Center',
    'Butler Service', 'Private Beach', 'Kids Club', 'Golf Course'
  ];

  const luxuryFacilities = [
    'Swimming Pool', 'Spa & Wellness Center', 'Fitness Center', 'Multiple Restaurants',
    'Rooftop Bar', 'Private Beach Access', 'Golf Course', 'Tennis Court',
    'Kids Club', 'Business Center', 'Meeting Rooms', 'Helipad'
  ];

  // Common room types for luxury hotels
  const createLuxuryRoomTypes = (hotelId: string): RoomType[] => [
    {
      id: `${hotelId}_deluxe`,
      name: 'Deluxe Room',
      capacity: { adults: 2, children: 1 },
      configuration: '1 King Bed or 2 Twin Beds',
      mealPlan: 'Bed & Breakfast',
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      adultPrice: 4500,
      childPrice: 2250,
      extraBedPrice: 1500,
      description: 'Elegant room with modern amenities, marble bathroom, and city or garden views',
      amenities: ['Free WiFi', 'Air Conditioning', 'Minibar', 'Coffee Machine', 'Safe', 'Bathrobe'],
      images: [],
      status: 'active',
      maxOccupancy: 3,
      bedType: 'King/Twin',
      inventory: 20,
      currency: 'THB',
      currencySymbol: '฿'
    },
    {
      id: `${hotelId}_suite`,
      name: 'Executive Suite',
      capacity: { adults: 3, children: 2 },
      configuration: '1 King Bed + Living Area',
      mealPlan: 'Bed & Breakfast',
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      adultPrice: 8500,
      childPrice: 4250,
      extraBedPrice: 2500,
      description: 'Spacious suite with separate living area, premium amenities, and stunning views',
      amenities: ['Free WiFi', 'Air Conditioning', 'Minibar', 'Coffee Machine', 'Safe', 'Bathrobe', 'Butler Service'],
      images: [],
      status: 'active',
      maxOccupancy: 5,
      bedType: 'King',
      inventory: 8,
      currency: 'THB',
      currencySymbol: '฿'
    },
    {
      id: `${hotelId}_villa`,
      name: 'Private Pool Villa',
      capacity: { adults: 4, children: 2 },
      configuration: '2 Bedrooms + Private Pool',
      mealPlan: 'Half Board',
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      adultPrice: 15000,
      childPrice: 7500,
      extraBedPrice: 4000,
      description: 'Luxurious private villa with pool, dedicated butler, and exclusive amenities',
      amenities: ['Private Pool', 'Butler Service', 'Kitchen', 'Free WiFi', 'Air Conditioning', 'Safe'],
      images: [],
      status: 'active',
      maxOccupancy: 6,
      bedType: 'King',
      inventory: 5,
      currency: 'THB',
      currencySymbol: '฿'
    }
  ];

  const hotels: Hotel[] = [
    // Bangkok Hotels
    {
      id: `hotel_${Date.now()}_bangkok_1`,
      name: 'The Oriental Residence Bangkok',
      brand: 'Oriental Collection',
      starRating: 5,
      category: 'Luxury Hotel',
      description: 'An iconic luxury hotel offering unparalleled service and elegance in the heart of Bangkok',
      country: 'Thailand',
      city: 'Bangkok',
      location: 'Sathorn District',
      address: {
        street: '136 Silom Road',
        city: 'Bangkok',
        state: 'Bangkok',
        zipCode: '10500',
        country: 'Thailand'
      },
      latitude: 13.7244,
      longitude: 100.5316,
      googleMapLink: 'https://maps.google.com/?q=13.7244,100.5316',
      contactInfo: {
        phone: '+66 2 659 9000',
        email: 'reservations@oriental-residence.com',
        website: 'https://www.oriental-residence.com'
      },
      facilities: luxuryFacilities,
      amenities: luxuryAmenities,
      roomTypes: createLuxuryRoomTypes('bangkok_1'),
      images: [],
      minRate: 4500,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 24 hours before check-in',
        children: 'Children under 12 stay free when using existing bedding',
        pets: 'Pets not allowed',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    },
    {
      id: `hotel_${Date.now()}_bangkok_2`,
      name: 'Shangri-La Bangkok',
      brand: 'Shangri-La Hotels',
      starRating: 5,
      category: 'Luxury Hotel',
      description: 'Luxury hotel with river views and world-class amenities in Bangkok\'s business district',
      country: 'Thailand',
      city: 'Bangkok',
      location: 'Saphan Taksin',
      address: {
        street: '89 Soi Wat Suan Plu',
        city: 'Bangkok',
        state: 'Bangkok',
        zipCode: '10120',
        country: 'Thailand'
      },
      latitude: 13.7210,
      longitude: 100.5200,
      googleMapLink: 'https://maps.google.com/?q=13.7210,100.5200',
      contactInfo: {
        phone: '+66 2 236 7777',
        email: 'slbk@shangri-la.com',
        website: 'https://www.shangri-la.com/bangkok'
      },
      facilities: luxuryFacilities,
      amenities: luxuryAmenities,
      roomTypes: createLuxuryRoomTypes('bangkok_2'),
      images: [],
      minRate: 4200,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 24 hours before check-in',
        children: 'Children under 12 stay free when using existing bedding',
        pets: 'Service animals only',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    },
    
    // Phuket Hotels
    {
      id: `hotel_${Date.now()}_phuket_1`,
      name: 'Amanpuri Phuket',
      brand: 'Aman Resorts',
      starRating: 5,
      category: 'Luxury Resort',
      description: 'Ultra-luxury beachfront resort offering unparalleled privacy and sophistication',
      country: 'Thailand',
      city: 'Phuket',
      location: 'Pansea Beach',
      address: {
        street: '118 Moo 3, Pansea Beach',
        city: 'Phuket',
        state: 'Phuket',
        zipCode: '83110',
        country: 'Thailand'
      },
      latitude: 7.9919,
      longitude: 98.2968,
      googleMapLink: 'https://maps.google.com/?q=7.9919,98.2968',
      contactInfo: {
        phone: '+66 76 324 333',
        email: 'amanpuri@aman.com',
        website: 'https://www.aman.com/resorts/amanpuri'
      },
      facilities: [...luxuryFacilities, 'Private Beach', 'Yacht Charter'],
      amenities: [...luxuryAmenities, 'Private Beach', 'Yacht Service'],
      roomTypes: createLuxuryRoomTypes('phuket_1'),
      images: [],
      minRate: 12000,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 48 hours before check-in',
        children: 'Children of all ages welcome',
        pets: 'Pets not allowed',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    },
    {
      id: `hotel_${Date.now()}_phuket_2`,
      name: 'Banyan Tree Phuket',
      brand: 'Banyan Tree',
      starRating: 5,
      category: 'Luxury Resort',
      description: 'Award-winning resort featuring private pool villas and world-class spa facilities',
      country: 'Thailand',
      city: 'Phuket',
      location: 'Laguna',
      address: {
        street: '33 Moo 4, Srisoonthorn Road',
        city: 'Phuket',
        state: 'Phuket',
        zipCode: '83110',
        country: 'Thailand'
      },
      latitude: 8.0180,
      longitude: 98.2980,
      googleMapLink: 'https://maps.google.com/?q=8.0180,98.2980',
      contactInfo: {
        phone: '+66 76 372 400',
        email: 'phuket@banyantree.com',
        website: 'https://www.banyantree.com/phuket'
      },
      facilities: luxuryFacilities,
      amenities: luxuryAmenities,
      roomTypes: createLuxuryRoomTypes('phuket_2'),
      images: [],
      minRate: 8500,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 24 hours before check-in',
        children: 'Children under 12 stay free when using existing bedding',
        pets: 'Pets not allowed',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    },

    // Chiang Mai Hotels
    {
      id: `hotel_${Date.now()}_chiangmai_1`,
      name: 'Four Seasons Resort Chiang Mai',
      brand: 'Four Seasons',
      starRating: 5,
      category: 'Luxury Resort',
      description: 'Stunning resort nestled in the mountains with traditional Lanna architecture',
      country: 'Thailand',
      city: 'Chiang Mai',
      location: 'Mae Rim',
      address: {
        street: '502 Moo 1, Mae Rim-Samoeng Old Road',
        city: 'Chiang Mai',
        state: 'Chiang Mai',
        zipCode: '50180',
        country: 'Thailand'
      },
      latitude: 18.8308,
      longitude: 98.8597,
      googleMapLink: 'https://maps.google.com/?q=18.8308,98.8597',
      contactInfo: {
        phone: '+66 53 298 181',
        email: 'chiangmai.reservations@fourseasons.com',
        website: 'https://www.fourseasons.com/chiangmai'
      },
      facilities: luxuryFacilities,
      amenities: luxuryAmenities,
      roomTypes: createLuxuryRoomTypes('chiangmai_1'),
      images: [],
      minRate: 6800,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 24 hours before check-in',
        children: 'Children under 18 stay free when using existing bedding',
        pets: 'Pets not allowed',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    },

    // Krabi Hotels
    {
      id: `hotel_${Date.now()}_krabi_1`,
      name: 'Rayavadee Resort Krabi',
      brand: 'Rayavadee',
      starRating: 5,
      category: 'Luxury Resort',
      description: 'Exclusive beachfront resort on Railay Beach with stunning limestone cliffs',
      country: 'Thailand',
      city: 'Krabi',
      location: 'Railay Beach',
      address: {
        street: '214 Moo 2, Railay Beach',
        city: 'Krabi',
        state: 'Krabi',
        zipCode: '81000',
        country: 'Thailand'
      },
      latitude: 8.0128,
      longitude: 98.8428,
      googleMapLink: 'https://maps.google.com/?q=8.0128,98.8428',
      contactInfo: {
        phone: '+66 75 620 740',
        email: 'rayavadee@rayavadee.com',
        website: 'https://www.rayavadee.com'
      },
      facilities: [...luxuryFacilities, 'Rock Climbing', 'Cave Exploration'],
      amenities: [...luxuryAmenities, 'Private Beach', 'Rock Climbing'],
      roomTypes: createLuxuryRoomTypes('krabi_1'),
      images: [],
      minRate: 9500,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 48 hours before check-in',
        children: 'Children under 12 stay free when using existing bedding',
        pets: 'Pets not allowed',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    },

    // Koh Samui Hotels
    {
      id: `hotel_${Date.now()}_kohsamui_1`,
      name: 'Six Senses Samui',
      brand: 'Six Senses',
      starRating: 5,
      category: 'Luxury Resort',
      description: 'Dramatic clifftop resort with infinity pools and sustainable luxury',
      country: 'Thailand',
      city: 'Koh Samui',
      location: 'Samrong Bay',
      address: {
        street: '9/10 Moo 5, Baan Plai Laem',
        city: 'Koh Samui',
        state: 'Surat Thani',
        zipCode: '84320',
        country: 'Thailand'
      },
      latitude: 9.5370,
      longitude: 100.0925,
      googleMapLink: 'https://maps.google.com/?q=9.5370,100.0925',
      contactInfo: {
        phone: '+66 77 245 678',
        email: 'reservations-samui@sixsenses.com',
        website: 'https://www.sixsenses.com/samui'
      },
      facilities: [...luxuryFacilities, 'Organic Garden', 'Sustainability Center'],
      amenities: [...luxuryAmenities, 'Organic Garden', 'Eco Activities'],
      roomTypes: createLuxuryRoomTypes('kohsamui_1'),
      images: [],
      minRate: 11000,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: 'Free cancellation up to 48 hours before check-in',
        children: 'Children of all ages welcome',
        pets: 'Pets not allowed',
        payment: 'All major credit cards accepted'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastUpdated: now,
      currency: 'THB',
      currencySymbol: '฿'
    }
  ];

  return hotels;
};

// Function to import the sample data
export const importThailandLuxuryHotels = (
  addHotel: (hotel: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>) => Hotel
) => {
  const sampleHotels = createThailandLuxuryHotels();
  const importedHotels: Hotel[] = [];

  sampleHotels.forEach(hotel => {
    try {
      // Remove id, createdAt, updatedAt as they will be generated by addHotel
      const { id, createdAt, updatedAt, ...hotelData } = hotel;
      const newHotel = addHotel(hotelData);
      importedHotels.push(newHotel);
    } catch (error) {
      console.error(`Failed to import hotel: ${hotel.name}`, error);
    }
  });

  return importedHotels;
};