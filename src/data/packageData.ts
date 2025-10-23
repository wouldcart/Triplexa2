
import { TourPackage } from '@/types/package';

export const mockPackages: TourPackage[] = [
  {
    id: 'PKG001',
    name: 'Thailand Adventure Tour',
    minPax: 2,
    days: 6,
    nights: 5,
    isFixedDeparture: false,
    startCity: 'Bangkok',
    endCity: 'Phuket',
    destinations: [
      {
        country: 'Thailand',
        cities: ['Bangkok', 'Phuket', 'Krabi']
      }
    ],
    packageType: 'international',
    themes: ['Adventure', 'Beach'],
    banners: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2070',
      'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?q=80&w=2070'
    ],
    itinerary: [
      {
        id: 'day-1',
        day: 1,
        city: 'Bangkok',
        title: 'Bangkok Arrival',
        activities: [
          {
            id: 'act-1',
            type: 'hotel',
            title: 'Hotel Check-in',
            description: 'Check in at the hotel and relax'
          },
          {
            id: 'act-2',
            type: 'sightseeing',
            title: 'City Tour',
            description: 'Evening city tour including local markets'
          }
        ],
        meals: {
          breakfast: false,
          lunch: false,
          dinner: true
        },
        accommodation: {
          hotelName: 'Bangkok Hotel',
          customHotelName: 'Bangkok Hotel'
        },
        description: 'Arrive in Bangkok and transfer to your hotel. Evening city tour followed by welcome dinner.'
      },
      {
        id: 'day-2',
        day: 2,
        city: 'Bangkok',
        title: 'Bangkok Temple Tour',
        activities: [
          {
            id: 'act-3',
            type: 'sightseeing',
            title: 'Temple Tour',
            description: 'Visit famous temples of Bangkok'
          }
        ],
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        },
        accommodation: {
          hotelName: 'Bangkok Hotel',
          customHotelName: 'Bangkok Hotel'
        },
        description: 'Full day temple tour including Grand Palace and Wat Pho.'
      },
      {
        id: 'day-3',
        day: 3,
        city: 'Phuket',
        title: 'Transfer to Phuket',
        activities: [
          {
            id: 'act-4',
            type: 'transport',
            title: 'Domestic Flight',
            description: 'Flight from Bangkok to Phuket'
          },
          {
            id: 'act-5',
            type: 'hotel',
            title: 'Hotel Check-in',
            description: 'Check in at the beach resort'
          }
        ],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: true
        },
        accommodation: {
          hotelName: 'Phuket Resort',
          customHotelName: 'Phuket Resort'
        },
        description: 'Transfer to Phuket via domestic flight. Evening at leisure by the beach.'
      },
      {
        id: 'day-4',
        day: 4,
        city: 'Krabi',
        title: 'Island Hopping',
        activities: [
          {
            id: 'act-6',
            type: 'sightseeing',
            title: 'Island Hopping Tour',
            description: 'Visit the stunning islands of Krabi'
          }
        ],
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        },
        accommodation: {
          hotelName: 'Phuket Resort',
          customHotelName: 'Phuket Resort'
        },
        description: 'Full day island hopping tour to Phi Phi Islands with lunch included.'
      },
      {
        id: 'day-5',
        day: 5,
        city: 'Phuket',
        title: 'Free Day',
        activities: [
          {
            id: 'act-7',
            type: 'free',
            title: 'Free Day',
            description: 'Enjoy the beach or optional activities'
          }
        ],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: true
        },
        accommodation: {
          hotelName: 'Phuket Resort',
          customHotelName: 'Phuket Resort'
        },
        description: 'Free day at leisure with optional activities available. Farewell dinner in the evening.'
      },
      {
        id: 'day-6',
        day: 6,
        city: 'Phuket',
        title: 'Departure Day',
        activities: [],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: false
        },
        accommodation: {
          hotelName: '',
          customHotelName: ''
        },
        description: 'Check out and transfer to Phuket International Airport for departure.'
      }
    ],
    baseCost: 85000,
    markup: 15,
    commission: 10,
    finalPrice: 97750,
    pricePerPerson: 48875,
    currency: 'INR',
    inclusions: '• 5 nights accommodation\n• Daily breakfast\n• Transfers per itinerary\n• Sightseeing as mentioned\n• English speaking guide\n• All applicable taxes',
    exclusions: '• International airfare\n• Personal expenses\n• Travel insurance\n• Any items not mentioned in inclusions',
    cancellationPolicy: '• 30 days before: Full refund minus processing fee\n• 15-29 days before: 50% refund\n• 7-14 days before: 25% refund\n• Less than 7 days: No refund',
    paymentPolicy: '• 25% deposit at the time of booking\n• Remaining balance 30 days before departure',
    status: 'published',
    createdAt: '2025-03-10T10:00:00Z'
  },
  {
    id: 'PKG002',
    name: 'Dubai Luxury Experience',
    minPax: 2,
    days: 5,
    nights: 4,
    isFixedDeparture: true,
    totalSeats: 20,
    departureDate: '2025-07-15T00:00:00Z',
    startCity: 'Dubai',
    endCity: 'Dubai',
    destinations: [
      {
        country: 'UAE',
        cities: ['Dubai', 'Abu Dhabi']
      }
    ],
    packageType: 'international',
    themes: ['Luxury'],
    banners: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070'
    ],
    itinerary: [
      {
        id: 'day-1-dxb',
        day: 1,
        city: 'Dubai',
        title: 'Dubai Arrival',
        activities: [
          {
            id: 'act-1-dxb',
            type: 'hotel',
            title: 'Hotel Check-in',
            description: 'Check in at luxury hotel'
          }
        ],
        meals: {
          breakfast: false,
          lunch: false,
          dinner: true
        },
        accommodation: {
          hotelName: 'Luxury Dubai Hotel',
          customHotelName: 'Luxury Dubai Hotel'
        },
        description: 'Arrive in Dubai and transfer to your luxury hotel. Welcome dinner included.'
      },
      {
        id: 'day-2-dxb',
        day: 2,
        city: 'Dubai',
        title: 'Dubai City Tour',
        activities: [
          {
            id: 'act-2-dxb',
            type: 'sightseeing',
            title: 'Dubai City Tour',
            description: 'Explore the highlights of Dubai'
          },
          {
            id: 'act-3-dxb',
            type: 'sightseeing',
            title: 'Burj Khalifa Visit',
            description: 'Visit the tallest building in the world'
          }
        ],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: false
        },
        accommodation: {
          hotelName: 'Luxury Dubai Hotel',
          customHotelName: 'Luxury Dubai Hotel'
        },
        description: 'Full day city tour including Burj Khalifa visit with skip-the-line tickets.'
      },
      {
        id: 'day-3-dxb',
        day: 3,
        city: 'Abu Dhabi',
        title: 'Abu Dhabi Day Trip',
        activities: [
          {
            id: 'act-4-dxb',
            type: 'transport',
            title: 'Private Transfer',
            description: 'Transfer to Abu Dhabi'
          },
          {
            id: 'act-5-dxb',
            type: 'sightseeing',
            title: 'Sheikh Zayed Mosque Visit',
            description: 'Visit the stunning white mosque'
          }
        ],
        meals: {
          breakfast: true,
          lunch: true,
          dinner: false
        },
        accommodation: {
          hotelName: 'Luxury Dubai Hotel',
          customHotelName: 'Luxury Dubai Hotel'
        },
        description: 'Day trip to Abu Dhabi visiting Sheikh Zayed Mosque and other attractions.'
      },
      {
        id: 'day-4-dxb',
        day: 4,
        city: 'Dubai',
        title: 'Free Day & Desert Safari',
        activities: [
          {
            id: 'act-6-dxb',
            type: 'free',
            title: 'Free Day',
            description: 'Free day for shopping or optional activities'
          },
          {
            id: 'act-7-dxb',
            type: 'gala',
            title: 'Desert Safari with BBQ Dinner',
            description: 'Evening desert experience with entertainment'
          }
        ],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: true
        },
        accommodation: {
          hotelName: 'Luxury Dubai Hotel',
          customHotelName: 'Luxury Dubai Hotel'
        },
        description: 'Morning at leisure for shopping. Evening desert safari with BBQ dinner and entertainment.'
      },
      {
        id: 'day-5-dxb',
        day: 5,
        city: 'Dubai',
        title: 'Departure Day',
        activities: [],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: false
        },
        accommodation: {
          hotelName: '',
          customHotelName: ''
        },
        description: 'Check out and transfer to Dubai International Airport for departure.'
      }
    ],
    baseCost: 150000,
    markup: 20,
    commission: 12,
    finalPrice: 180000,
    pricePerPerson: 90000,
    currency: 'INR',
    inclusions: '• 4 nights luxury accommodation\n• Daily breakfast\n• Private transfers\n• Sightseeing as mentioned\n• English speaking guide\n• Desert safari with BBQ dinner\n• All applicable taxes',
    exclusions: '• International airfare\n• Personal expenses\n• Travel insurance\n• Optional activities\n• Any items not mentioned in inclusions',
    cancellationPolicy: '• 45 days before: Full refund minus processing fee\n• 30-44 days before: 75% refund\n• 15-29 days before: 50% refund\n• Less than 15 days: No refund',
    paymentPolicy: '• 30% deposit at the time of booking\n• Remaining balance 45 days before departure',
    status: 'published',
    createdAt: '2025-04-01T14:30:00Z'
  },
  {
    id: 'PKG003',
    name: 'Golden Triangle India',
    minPax: 4,
    days: 7,
    nights: 6,
    isFixedDeparture: false,
    startCity: 'Delhi',
    endCity: 'Delhi',
    destinations: [
      {
        country: 'India',
        cities: ['Delhi', 'Agra', 'Jaipur']
      }
    ],
    packageType: 'inbound',
    themes: ['Cultural'],
    banners: [
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071'
    ],
    itinerary: [
      {
        id: 'day-1-india',
        day: 1,
        city: 'Delhi',
        title: 'Delhi Arrival',
        activities: [
          {
            id: 'act-1-india',
            type: 'hotel',
            title: 'Hotel Check-in',
            description: 'Check in at hotel in Delhi'
          }
        ],
        meals: {
          breakfast: false,
          lunch: false,
          dinner: true
        },
        accommodation: {
          hotelName: 'Delhi Hotel',
          customHotelName: 'Delhi Hotel'
        },
        description: 'Arrive in Delhi and transfer to your hotel. Welcome dinner included.'
      },
      {
        id: 'day-2-india',
        day: 2,
        city: 'Delhi',
        title: 'Delhi Sightseeing',
        activities: [
          {
            id: 'act-2-india',
            type: 'sightseeing',
            title: 'Old & New Delhi Tour',
            description: 'Explore the contrasts of Delhi'
          }
        ],
        meals: {
          breakfast: true,
          lunch: false,
          dinner: false
        },
        accommodation: {
          hotelName: 'Delhi Hotel',
          customHotelName: 'Delhi Hotel'
        },
        description: 'Full day tour of Old and New Delhi visiting major attractions.'
      }
    ],
    baseCost: 60000,
    markup: 15,
    finalPrice: 69000,
    pricePerPerson: 17250,
    currency: 'INR',
    status: 'draft',
    createdAt: '2025-04-20T09:15:00Z'
  }
];
