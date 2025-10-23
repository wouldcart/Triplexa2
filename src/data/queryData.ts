import { Query } from '@/types/query';

export const mockQueries: Query[] = [
  {
    id: 'TQ-2024-001',
    agentId: 101,
    agentName: 'Dream Tours Agency',
    destination: {
      country: 'Thailand',
      cities: ['Bangkok', 'Phuket', 'Chiang Mai']
    },
    paxDetails: {
      adults: 2,
      children: 1,
      infants: 0
    },
    travelDates: {
      from: '2024-03-15',
      to: '2024-03-25'
    },
    tripDuration: {
      nights: 10,
      days: 11
    },
    packageType: 'luxury',
    specialRequests: ['Airport transfers', 'Spa treatments', 'Cultural tours'],
    budget: {
      min: 4000,
      max: 6000,
      currency: 'USD'
    },
    status: 'assigned',
    assignedTo: 'Sarah Sales',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    priority: 'high',
    notes: 'VIP client, requires premium accommodations',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 2,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'TQ-2024-002',
    agentId: 102,
    agentName: 'Premium Travel Solutions',
    destination: {
      country: 'Japan',
      cities: ['Tokyo', 'Kyoto', 'Osaka']
    },
    paxDetails: {
      adults: 4,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2024-04-10',
      to: '2024-04-20'
    },
    tripDuration: {
      nights: 10,
      days: 11
    },
    packageType: 'business',
    specialRequests: ['Business class flights', 'High-speed rail passes'],
    budget: {
      min: 8000,
      max: 12000,
      currency: 'USD'
    },
    status: 'in-progress',
    assignedTo: 'Sarah Sales',
    createdAt: '2024-01-16T11:15:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    priority: 'medium',
    notes: 'Corporate group booking',
    communicationPreference: 'phone',
    hotelDetails: {
      rooms: 4,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'TQ-2024-003',
    agentId: 103,
    agentName: 'Adventure Seekers',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Abu Dhabi']
    },
    paxDetails: {
      adults: 2,
      children: 2,
      infants: 1
    },
    travelDates: {
      from: '2024-02-28',
      to: '2024-03-08'
    },
    tripDuration: {
      nights: 8,
      days: 9
    },
    packageType: 'family',
    specialRequests: ['Kids club', 'Family rooms', 'Desert safari'],
    budget: {
      min: 3500,
      max: 5000,
      currency: 'USD'
    },
    status: 'proposal-sent',
    assignedTo: 'Mike Marketing',
    createdAt: '2024-01-12T08:45:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    priority: 'normal',
    notes: 'Family with young children',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 2,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'half-board'
    }
  },
  {
    id: 'TQ-2024-004',
    agentId: 104,
    agentName: 'Luxury Escapes',
    destination: {
      country: 'Maldives',
      cities: ['Male', 'Hulhumale']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2024-05-15',
      to: '2024-05-22'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'luxury',
    specialRequests: ['Overwater villa', 'Private dining', 'Seaplane transfers'],
    budget: {
      min: 10000,
      max: 15000,
      currency: 'USD'
    },
    status: 'confirmed',
    assignedTo: 'Sarah Sales',
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-22T09:15:00Z',
    priority: 'high',
    notes: 'Honeymoon package',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: 'luxury'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'all-meals'
    }
  },
  {
    id: 'TQ-2024-005',
    agentId: 105,
    agentName: 'Cultural Journeys',
    destination: {
      country: 'Turkey',
      cities: ['Istanbul', 'Cappadocia', 'Pamukkale']
    },
    paxDetails: {
      adults: 6,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2024-04-05',
      to: '2024-04-15'
    },
    tripDuration: {
      nights: 10,
      days: 11
    },
    packageType: 'cultural',
    specialRequests: ['Historical tours', 'Local cuisine experiences', 'Photography permits'],
    budget: {
      min: 2000,
      max: 3000,
      currency: 'USD'
    },
    status: 'new',
    assignedTo: null,
    createdAt: '2024-01-18T16:30:00Z',
    updatedAt: '2024-01-18T16:30:00Z',
    priority: 'normal',
    notes: 'Group of photographers',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 3,
      category: '3★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'sic',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'TQ-2024-006',
    agentId: 106,
    agentName: 'Beach Paradise',
    destination: {
      country: 'Malaysia',
      cities: ['Kuala Lumpur', 'Langkawi', 'Penang']
    },
    paxDetails: {
      adults: 3,
      children: 1,
      infants: 0
    },
    travelDates: {
      from: '2024-03-20',
      to: '2024-03-28'
    },
    tripDuration: {
      nights: 8,
      days: 9
    },
    packageType: 'leisure',
    specialRequests: ['Beach resort', 'City tours', 'Food tours'],
    budget: {
      min: 2500,
      max: 4000,
      currency: 'USD'
    },
    status: 'modify-proposal',
    assignedTo: 'Operations Staff',
    createdAt: '2024-01-14T10:15:00Z',
    updatedAt: '2024-01-21T13:45:00Z',
    priority: 'low',
    notes: 'Budget-conscious travelers',
    communicationPreference: 'phone',
    hotelDetails: {
      rooms: 2,
      category: '3★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'sic',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'TQ-2024-007',
    agentId: 107,
    agentName: 'Mountain Adventures',
    destination: {
      country: 'Nepal',
      cities: ['Kathmandu', 'Pokhara', 'Chitwan']
    },
    paxDetails: {
      adults: 4,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2024-06-01',
      to: '2024-06-12'
    },
    tripDuration: {
      nights: 11,
      days: 12
    },
    packageType: 'adventure',
    specialRequests: ['Trekking permits', 'Mountain guides', 'Emergency insurance'],
    budget: {
      min: 1500,
      max: 2500,
      currency: 'USD'
    },
    status: 'converted',
    assignedTo: 'Sarah Sales',
    createdAt: '2024-01-08T07:45:00Z',
    updatedAt: '2024-01-25T11:20:00Z',
    priority: 'medium',
    notes: 'Experienced trekkers',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 2,
      category: '3★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  
  // New Thailand Enquiries (10)
  {
    id: 'ENQ20250001',
    agentId: 108,
    agentName: 'Bangkok Explorer Tours',
    destination: {
      country: 'Thailand',
      cities: ['Bangkok', 'Ayutthaya']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-02-14',
      to: '2025-02-19'
    },
    tripDuration: {
      nights: 5,
      days: 6
    },
    packageType: 'cultural',
    specialRequests: ['Temple tours', 'Floating market visit', 'Traditional massage'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'new',
    assignedTo: null,
    createdAt: '2025-01-20T10:30:00Z',
    updatedAt: '2025-01-20T10:30:00Z',
    priority: 'normal',
    notes: 'First time visitors to Thailand, interested in cultural experiences',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250002',
    agentId: 109,
    agentName: 'Island Paradise Travel',
    destination: {
      country: 'Thailand',
      cities: ['Phuket', 'Krabi']
    },
    paxDetails: {
      adults: 4,
      children: 2,
      infants: 0
    },
    travelDates: {
      from: '2025-03-10',
      to: '2025-03-17'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'family',
    specialRequests: ['Beach activities', 'Island hopping', 'Kids-friendly restaurants'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'assigned',
    assignedTo: 'Sarah Sales',
    createdAt: '2025-01-18T14:15:00Z',
    updatedAt: '2025-01-19T09:20:00Z',
    priority: 'high',
    notes: 'Large family group, need family-friendly accommodations',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 3,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'half-board'
    }
  },
  {
    id: 'ENQ20250003',
    agentId: 110,
    agentName: 'Luxury Thailand Escapes',
    destination: {
      country: 'Thailand',
      cities: ['Koh Samui', 'Bangkok']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-04-20',
      to: '2025-04-28'
    },
    tripDuration: {
      nights: 8,
      days: 9
    },
    packageType: 'luxury',
    specialRequests: ['Private villa', 'Yacht charter', 'Michelin star dining'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'in-progress',
    assignedTo: 'Mike Marketing',
    createdAt: '2025-01-16T11:45:00Z',
    updatedAt: '2025-01-21T16:30:00Z',
    priority: 'urgent',
    notes: 'Honeymoon couple, looking for ultra-luxury experience',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: 'luxury'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'all-meals'
    }
  },
  {
    id: 'ENQ20250004',
    agentId: 111,
    agentName: 'Adventure Thailand Tours',
    destination: {
      country: 'Thailand',
      cities: ['Chiang Mai', 'Pai']
    },
    paxDetails: {
      adults: 6,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-05-05',
      to: '2025-05-12'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'adventure',
    specialRequests: ['Elephant sanctuary visit', 'Trekking', 'White water rafting'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'proposal-sent',
    assignedTo: 'Operations Staff',
    createdAt: '2025-01-14T08:20:00Z',
    updatedAt: '2025-01-22T12:15:00Z',
    priority: 'medium',
    notes: 'Group of friends, very active and adventurous',
    communicationPreference: 'phone',
    hotelDetails: {
      rooms: 3,
      category: '3★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'sic',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250005',
    agentId: 112,
    agentName: 'Business Travel Thailand',
    destination: {
      country: 'Thailand',
      cities: ['Bangkok']
    },
    paxDetails: {
      adults: 1,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-02-28',
      to: '2025-03-05'
    },
    tripDuration: {
      nights: 5,
      days: 6
    },
    packageType: 'business',
    specialRequests: ['Airport transfers', 'Business center access', 'Meeting rooms'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'confirmed',
    assignedTo: 'Sarah Sales',
    createdAt: '2025-01-12T09:10:00Z',
    updatedAt: '2025-01-23T14:45:00Z',
    priority: 'high',
    notes: 'Executive business traveler, needs efficient service',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: false,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250006',
    agentId: 113,
    agentName: 'Thai Beach Holidays',
    destination: {
      country: 'Thailand',
      cities: ['Pattaya', 'Koh Chang']
    },
    paxDetails: {
      adults: 3,
      children: 1,
      infants: 1
    },
    travelDates: {
      from: '2025-06-15',
      to: '2025-06-22'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'leisure',
    specialRequests: ['Baby crib', 'Family pool', 'Kids activities'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'converted',
    assignedTo: 'Mike Marketing',
    createdAt: '2025-01-10T15:30:00Z',
    updatedAt: '2025-01-24T10:20:00Z',
    priority: 'normal',
    notes: 'Young family with infant, need baby-friendly facilities',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 2,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'half-board'
    }
  },
  {
    id: 'ENQ20250007',
    agentId: 114,
    agentName: 'Wellness Thailand Retreats',
    destination: {
      country: 'Thailand',
      cities: ['Hua Hin', 'Bangkok']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-07-10',
      to: '2025-07-17'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'leisure',
    specialRequests: ['Spa treatments', 'Yoga classes', 'Healthy cuisine'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'modify-proposal',
    assignedTo: 'Operations Staff',
    createdAt: '2025-01-08T12:45:00Z',
    updatedAt: '2025-01-25T09:30:00Z',
    priority: 'low',
    notes: 'Wellness-focused travelers, interested in health and relaxation',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'all-meals'
    }
  },
  {
    id: 'ENQ20250008',
    agentId: 115,
    agentName: 'Foodie Tours Thailand',
    destination: {
      country: 'Thailand',
      cities: ['Bangkok', 'Chiang Mai']
    },
    paxDetails: {
      adults: 4,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-08-05',
      to: '2025-08-12'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'cultural',
    specialRequests: ['Cooking classes', 'Street food tours', 'Market visits'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'new',
    assignedTo: null,
    createdAt: '2025-01-22T16:20:00Z',
    updatedAt: '2025-01-22T16:20:00Z',
    priority: 'normal',
    notes: 'Food enthusiasts, want authentic culinary experiences',
    communicationPreference: 'phone',
    hotelDetails: {
      rooms: 2,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'sic',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250009',
    agentId: 116,
    agentName: 'Backpacker Thailand',
    destination: {
      country: 'Thailand',
      cities: ['Bangkok', 'Koh Phi Phi', 'Chiang Mai']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-09-01',
      to: '2025-09-14'
    },
    tripDuration: {
      nights: 13,
      days: 14
    },
    packageType: 'adventure',
    specialRequests: ['Budget accommodations', 'Local transport', 'Hostel stays'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'assigned',
    assignedTo: 'Sarah Sales',
    createdAt: '2025-01-19T13:10:00Z',
    updatedAt: '2025-01-20T11:25:00Z',
    priority: 'low',
    notes: 'Budget backpackers, want authentic local experience',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '3★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'sic',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250010',
    agentId: 101,
    agentName: 'Dream Tours Agency',
    destination: {
      country: 'Thailand',
      cities: ['Phuket', 'Krabi', 'Koh Samui']
    },
    paxDetails: {
      adults: 8,
      children: 4,
      infants: 2
    },
    travelDates: {
      from: '2025-12-20',
      to: '2025-12-30'
    },
    tripDuration: {
      nights: 10,
      days: 11
    },
    packageType: 'family',
    specialRequests: ['Multi-generational family', 'Connecting rooms', 'Child care services'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'in-progress',
    assignedTo: 'Mike Marketing',
    createdAt: '2025-01-15T10:40:00Z',
    updatedAt: '2025-01-21T15:55:00Z',
    priority: 'urgent',
    notes: 'Large extended family group for Christmas holidays',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 6,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'all-meals'
    }
  },

  // New UAE Enquiries (10)
  {
    id: 'ENQ20250011',
    agentId: 102,
    agentName: 'Premium Travel Solutions',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Abu Dhabi']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-02-10',
      to: '2025-02-15'
    },
    tripDuration: {
      nights: 5,
      days: 6
    },
    packageType: 'luxury',
    specialRequests: ['Burj Khalifa visit', 'Desert safari', 'Shopping tour'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'new',
    assignedTo: null,
    createdAt: '2025-01-21T09:15:00Z',
    updatedAt: '2025-01-21T09:15:00Z',
    priority: 'normal',
    notes: 'Anniversary celebration, want iconic experiences',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250012',
    agentId: 103,
    agentName: 'Adventure Seekers',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Ras Al Khaimah']
    },
    paxDetails: {
      adults: 4,
      children: 2,
      infants: 0
    },
    travelDates: {
      from: '2025-03-25',
      to: '2025-04-02'
    },
    tripDuration: {
      nights: 8,
      days: 9
    },
    packageType: 'family',
    specialRequests: ['Theme parks', 'Aquarium visit', 'Adventure activities'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'assigned',
    assignedTo: 'Sarah Sales',
    createdAt: '2025-01-17T14:30:00Z',
    updatedAt: '2025-01-18T10:45:00Z',
    priority: 'high',
    notes: 'Family with teenagers, want adventure and entertainment',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 2,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'half-board'
    }
  },
  {
    id: 'ENQ20250013',
    agentId: 104,
    agentName: 'Luxury Escapes',
    destination: {
      country: 'UAE',
      cities: ['Dubai']
    },
    paxDetails: {
      adults: 1,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-04-08',
      to: '2025-04-12'
    },
    tripDuration: {
      nights: 4,
      days: 5
    },
    packageType: 'business',
    specialRequests: ['Conference attendance', 'Business lounge access', 'Corporate dinners'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'in-progress',
    assignedTo: 'Operations Staff',
    createdAt: '2025-01-13T11:20:00Z',
    updatedAt: '2025-01-20T16:10:00Z',
    priority: 'urgent',
    notes: 'Business conference attendee, needs professional arrangements',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: false,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250014',
    agentId: 105,
    agentName: 'Cultural Journeys',
    destination: {
      country: 'UAE',
      cities: ['Abu Dhabi', 'Sharjah']
    },
    paxDetails: {
      adults: 3,
      children: 1,
      infants: 0
    },
    travelDates: {
      from: '2025-05-20',
      to: '2025-05-27'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'cultural',
    specialRequests: ['Sheikh Zayed Mosque', 'Heritage village', 'Art galleries'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'proposal-sent',
    assignedTo: 'Mike Marketing',
    createdAt: '2025-01-11T15:45:00Z',
    updatedAt: '2025-01-22T13:30:00Z',
    priority: 'medium',
    notes: 'Interested in UAE culture and heritage',
    communicationPreference: 'phone',
    hotelDetails: {
      rooms: 2,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250015',
    agentId: 106,
    agentName: 'Beach Paradise',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Fujairah']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-06-12',
      to: '2025-06-18'
    },
    tripDuration: {
      nights: 6,
      days: 7
    },
    packageType: 'leisure',
    specialRequests: ['Beach resort', 'Spa treatments', 'Water sports'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'confirmed',
    assignedTo: 'Sarah Sales',
    createdAt: '2025-01-09T12:30:00Z',
    updatedAt: '2025-01-23T11:15:00Z',
    priority: 'normal',
    notes: 'Couple looking for relaxation and beach activities',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'all-meals'
    }
  },
  {
    id: 'ENQ20250016',
    agentId: 107,
    agentName: 'Mountain Adventures',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Hatta']
    },
    paxDetails: {
      adults: 6,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-07-03',
      to: '2025-07-10'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'adventure',
    specialRequests: ['Mountain biking', 'Rock climbing', 'Kayaking'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'converted',
    assignedTo: 'Operations Staff',
    createdAt: '2025-01-07T08:25:00Z',
    updatedAt: '2025-01-24T14:40:00Z',
    priority: 'medium',
    notes: 'Adventure sports group, very active travelers',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 3,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250017',
    agentId: 108,
    agentName: 'Bangkok Explorer Tours',
    destination: {
      country: 'UAE',
      cities: ['Dubai']
    },
    paxDetails: {
      adults: 1,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-02-05',
      to: '2025-02-07'
    },
    tripDuration: {
      nights: 2,
      days: 3
    },
    packageType: 'business',
    specialRequests: ['Airport lounge', 'Fast track immigration', 'City tour'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'modify-proposal',
    assignedTo: 'Mike Marketing',
    createdAt: '2025-01-23T17:10:00Z',
    updatedAt: '2025-01-25T12:20:00Z',
    priority: 'high',
    notes: 'Short stopover, wants to see Dubai highlights',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250018',
    agentId: 109,
    agentName: 'Island Paradise Travel',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Abu Dhabi']
    },
    paxDetails: {
      adults: 5,
      children: 3,
      infants: 1
    },
    travelDates: {
      from: '2025-08-15',
      to: '2025-08-25'
    },
    tripDuration: {
      nights: 10,
      days: 11
    },
    packageType: 'family',
    specialRequests: ['Multi-generational trip', 'Wheelchair accessibility', 'Baby facilities'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'new',
    assignedTo: null,
    createdAt: '2025-01-20T13:45:00Z',
    updatedAt: '2025-01-20T13:45:00Z',
    priority: 'normal',
    notes: 'Large family including elderly and infants, need special arrangements',
    communicationPreference: 'phone',
    hotelDetails: {
      rooms: 4,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'half-board'
    }
  },
  {
    id: 'ENQ20250019',
    agentId: 110,
    agentName: 'Luxury Thailand Escapes',
    destination: {
      country: 'UAE',
      cities: ['Dubai']
    },
    paxDetails: {
      adults: 2,
      children: 1,
      infants: 0
    },
    travelDates: {
      from: '2025-09-10',
      to: '2025-09-17'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'shopping',
    specialRequests: ['Mall tours', 'Personal shopper', 'Gold souk visit'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'assigned',
    assignedTo: 'Sarah Sales',
    createdAt: '2025-01-16T09:30:00Z',
    updatedAt: '2025-01-19T14:25:00Z',
    priority: 'low',
    notes: 'Shopping enthusiasts, want guided retail experiences',
    communicationPreference: 'whatsapp',
    hotelDetails: {
      rooms: 1,
      category: '5★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'breakfast'
    }
  },
  {
    id: 'ENQ20250020',
    agentId: 111,
    agentName: 'Adventure Thailand Tours',
    destination: {
      country: 'UAE',
      cities: ['Dubai', 'Abu Dhabi', 'Sharjah']
    },
    paxDetails: {
      adults: 12,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2025-11-15',
      to: '2025-11-22'
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: 'group',
    specialRequests: ['Group coordinator', 'Charter bus', 'Group dining'],
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    status: 'in-progress',
    assignedTo: 'Operations Staff',
    createdAt: '2025-01-12T16:15:00Z',
    updatedAt: '2025-01-21T10:50:00Z',
    priority: 'urgent',
    notes: 'Large corporate group, need comprehensive group arrangements',
    communicationPreference: 'email',
    hotelDetails: {
      rooms: 6,
      category: '4★'
    },
    inclusions: {
      sightseeing: true,
      transfers: 'private',
      mealPlan: 'all-meals'
    }
  }
];

// Destinations for dropdowns
export const destinations = [
  {
    country: 'Thailand',
    cities: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi', 'Koh Samui']
  },
  {
    country: 'Japan',
    cities: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Yokohama']
  },
  {
    country: 'UAE',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman']
  },
  {
    country: 'Maldives',
    cities: ['Male', 'Hulhumale', 'Addu City']
  },
  {
    country: 'Turkey',
    cities: ['Istanbul', 'Cappadocia', 'Pamukkale', 'Antalya', 'Ankara']
  },
  {
    country: 'Malaysia',
    cities: ['Kuala Lumpur', 'Langkawi', 'Penang', 'Johor Bahru', 'Malacca']
  },
  {
    country: 'Nepal',
    cities: ['Kathmandu', 'Pokhara', 'Chitwan', 'Lumbini']
  }
];

// Helper functions
export const getQueryById = (id: string): Query | undefined => {
  return mockQueries.find(query => query.id === id);
};

export const updateQuery = (updatedQuery: Query): void => {
  const index = mockQueries.findIndex(query => query.id === updatedQuery.id);
  if (index !== -1) {
    mockQueries[index] = { ...updatedQuery, updatedAt: new Date().toISOString() };
  }
};

export const getEnquirySettings = () => {
  const defaultSettings = {
    prefix: 'ENQ',
    includeYear: true,
    numberLength: 5  // Changed from 8 to 5 for simpler format
  };
  
  try {
    const saved = localStorage.getItem('enquirySettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const generateQueryId = (): string => {
  const settings = getEnquirySettings();
  const year = settings.includeYear ? new Date().getFullYear().toString() : '';
  const nextNumber = mockQueries.length + 1;
  const paddedNumber = nextNumber.toString().padStart(settings.numberLength, '0');
  
  return `${settings.prefix}${year}${paddedNumber}`;
};

export const addQuery = (query: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>): Query => {
  const newQuery: Query = {
    ...query,
    id: generateQueryId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockQueries.push(newQuery);
  return newQuery;
};

export const getProposalsByQueryId = (queryId: string) => {
  // Mock proposals data - you can expand this as needed
  return [];
};

export default mockQueries;
