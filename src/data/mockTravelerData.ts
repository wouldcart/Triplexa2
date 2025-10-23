import { TravelerTrip, TripActivity, TravelerNotification, TodayActivity } from '@/types/travelerTypes';

export const mockTravelerTrips: TravelerTrip[] = [
  {
    id: 'trip-001',
    destination: 'Golden Triangle Tour',
    country: 'India',
    cities: ['Delhi', 'Agra', 'Jaipur'],
    startDate: '2024-07-20',
    endDate: '2024-07-27',
    duration: 7,
    status: 'in-progress',
    imageUrl: '/placeholder.svg',
    description: 'Explore the iconic Golden Triangle of India',
    tags: ['leisure'],
    agentDetails: {
      name: 'Rajesh Kumar',
      company: 'Golden India Tours',
      phone: '+91-9876543210',
      email: 'rajesh@goldenindiatours.com'
    }
  },
  {
    id: 'trip-002',
    destination: 'Dubai Luxury Experience',
    country: 'UAE',
    cities: ['Dubai', 'Abu Dhabi'],
    startDate: '2024-08-15',
    endDate: '2024-08-22',
    duration: 7,
    status: 'upcoming',
    imageUrl: '/placeholder.svg',
    description: 'Experience the luxury and modern marvels of Dubai',
    tags: ['leisure'],
    agentDetails: {
      name: 'Ahmed Al-Mansouri',
      company: 'Desert Pearl Tours',
      phone: '+971-50-123-4567',
      email: 'ahmed@desertpearl.ae'
    }
  },
  {
    id: 'trip-003',
    destination: 'Thailand Adventure',
    country: 'Thailand',
    cities: ['Bangkok', 'Phuket', 'Chiang Mai'],
    startDate: '2024-09-10',
    endDate: '2024-09-18',
    duration: 8,
    status: 'upcoming',
    imageUrl: '/placeholder.svg',
    description: 'Discover the beauty of Thailand from temples to beaches',
    tags: ['leisure'],
    agentDetails: {
      name: 'Siriporn Thanakit',
      company: 'Amazing Thailand Tours',
      phone: '+66-81-234-5678',
      email: 'siriporn@amazingthailand.com'
    }
  },
  {
    id: 'trip-004',
    destination: 'Kerala Backwaters',
    country: 'India',
    cities: ['Kochi', 'Alleppey', 'Munnar'],
    startDate: '2024-06-15',
    endDate: '2024-06-22',
    duration: 7,
    status: 'completed',
    imageUrl: '/placeholder.svg',
    description: 'Peaceful backwater cruise and hill station experience',
    tags: ['leisure'],
    agentDetails: {
      name: 'Priya Nair',
      company: 'Kerala Backwater Tours',
      phone: '+91-9876543211',
      email: 'priya@keralabackwater.com'
    }
  },
  {
    id: 'trip-005',
    destination: 'Business Trip Mumbai',
    country: 'India',
    cities: ['Mumbai'],
    startDate: '2024-05-10',
    endDate: '2024-05-13',
    duration: 3,
    status: 'completed',
    imageUrl: '/placeholder.svg',
    description: 'Corporate meetings and site visits',
    tags: ['business'],
    agentDetails: {
      name: 'Vikram Sharma',
      company: 'Corporate Travel Solutions',
      phone: '+91-9876543212',
      email: 'vikram@corptravelsol.com'
    }
  }
];

export const mockTripActivities: TripActivity[] = [
  // Add today's activities for the current trip
  {
    id: 'activity-today-001',
    tripId: 'trip-001',
    title: 'Morning Yoga Session',
    description: 'Start your day with a relaxing yoga session at the hotel rooftop',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: '06:30',
    location: 'Hotel Rooftop Garden',
    type: 'other',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-today-002',
    tripId: 'trip-001',
    title: 'Breakfast at Hotel',
    description: 'Continental breakfast at the hotel restaurant',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: '08:00',
    location: 'The Imperial Hotel Restaurant',
    type: 'meal',
    status: 'completed',
    isStaffAssigned: true
  },
  {
    id: 'activity-today-003',
    tripId: 'trip-001',
    title: 'City Walking Tour',
    description: 'Guided walking tour of Old Delhi with historical insights',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: '10:00',
    location: 'Old Delhi Heritage Walk',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: true,
    coordinates: { lat: 28.6506, lng: 77.2334 }
  },
  {
    id: 'activity-today-004',
    tripId: 'trip-001',
    title: 'Traditional Lunch',
    description: 'Experience authentic Delhi cuisine at a local restaurant',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: '13:00',
    location: 'Karim\'s Restaurant, Jama Masjid',
    type: 'meal',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-today-005',
    tripId: 'trip-001',
    title: 'Shopping at Connaught Place',
    description: 'Free time for shopping and exploring the vibrant market',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: '15:30',
    location: 'Connaught Place Market',
    type: 'sightseeing',
    status: 'pending',
    isStaffAssigned: false
  },
  {
    id: 'activity-today-006',
    tripId: 'trip-001',
    title: 'Evening Cultural Show',
    description: 'Traditional dance and music performance',
    date: new Date().toISOString().split('T')[0], // Today's date
    time: '19:00',
    location: 'India Habitat Centre',
    type: 'other',
    status: 'confirmed',
    isStaffAssigned: true
  },
  
  // Current trip activities (Golden Triangle) - other days
  {
    id: 'activity-001',
    tripId: 'trip-001',
    title: 'Flight to Delhi',
    description: 'Departure to Delhi International Airport',
    date: '2024-07-20',
    time: '06:00',
    location: 'Delhi Airport (DEL)',
    type: 'flight',
    status: 'completed',
    isStaffAssigned: true
  },
  {
    id: 'activity-002',
    tripId: 'trip-001',
    title: 'Hotel Check-in',
    description: 'Check-in at The Imperial Hotel',
    date: '2024-07-20',
    time: '14:00',
    location: 'The Imperial Hotel, Delhi',
    type: 'hotel',
    status: 'completed',
    isStaffAssigned: true
  },
  {
    id: 'activity-003',
    tripId: 'trip-001',
    title: 'Red Fort Visit',
    description: 'Guided tour of the historic Red Fort',
    date: '2024-07-25',
    time: '09:00',
    location: 'Red Fort, Delhi',
    type: 'sightseeing',
    status: 'pending',
    isStaffAssigned: true,
    coordinates: { lat: 28.6562, lng: 77.2410 }
  },
  {
    id: 'activity-004',
    tripId: 'trip-001',
    title: 'Taj Mahal Sunrise',
    description: 'Early morning visit to the Taj Mahal',
    date: '2024-07-25',
    time: '05:30',
    location: 'Taj Mahal, Agra',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: true,
    coordinates: { lat: 27.1751, lng: 78.0421 }
  },
  {
    id: 'activity-005',
    tripId: 'trip-001',
    title: 'Local Market Shopping',
    description: 'Explore Chandni Chowk market',
    date: '2024-07-25',
    time: '15:00',
    location: 'Chandni Chowk, Delhi',
    type: 'sightseeing',
    status: 'pending',
    isStaffAssigned: false
  },
  {
    id: 'activity-006',
    tripId: 'trip-001',
    title: 'Return Flight',
    description: 'Flight back home',
    date: '2024-07-27',
    time: '18:00',
    location: 'Delhi Airport (DEL)',
    type: 'flight',
    status: 'confirmed',
    isStaffAssigned: true
  },

  // Dubai trip activities
  {
    id: 'activity-101',
    tripId: 'trip-002',
    title: 'Flight to Dubai',
    description: 'Emirates flight to Dubai International Airport',
    date: '2024-08-15',
    time: '02:00',
    location: 'Dubai Airport (DXB)',
    type: 'flight',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-102',
    tripId: 'trip-002',
    title: 'Burj Khalifa Visit',
    description: 'Visit the world\'s tallest building',
    date: '2024-08-16',
    time: '19:00',
    location: 'Burj Khalifa, Dubai',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: true,
    coordinates: { lat: 25.1972, lng: 55.2744 }
  },
  {
    id: 'activity-103',
    tripId: 'trip-002',
    title: 'Desert Safari',
    description: 'Experience the Arabian desert with dune bashing and BBQ',
    date: '2024-08-17',
    time: '15:00',
    location: 'Dubai Desert Conservation Reserve',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-104',
    tripId: 'trip-002',
    title: 'Dubai Mall Shopping',
    description: 'Shopping at the world\'s largest mall',
    date: '2024-08-18',
    time: '10:00',
    location: 'Dubai Mall',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: false
  },

  // Thailand trip activities
  {
    id: 'activity-201',
    tripId: 'trip-003',
    title: 'Flight to Bangkok',
    description: 'Thai Airways flight to Suvarnabhumi Airport',
    date: '2024-09-10',
    time: '07:00',
    location: 'Bangkok Airport (BKK)',
    type: 'flight',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-202',
    tripId: 'trip-003',
    title: 'Grand Palace Tour',
    description: 'Explore the magnificent Grand Palace complex',
    date: '2024-09-11',
    time: '09:00',
    location: 'Grand Palace, Bangkok',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: true,
    coordinates: { lat: 13.7500, lng: 100.4913 }
  },
  {
    id: 'activity-203',
    tripId: 'trip-003',
    title: 'Floating Market Visit',
    description: 'Traditional floating market experience',
    date: '2024-09-12',
    time: '08:00',
    location: 'Damnoen Saduak Floating Market',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-204',
    tripId: 'trip-003',
    title: 'Flight to Phuket',
    description: 'Domestic flight to Phuket',
    date: '2024-09-13',
    time: '14:00',
    location: 'Phuket Airport (HKT)',
    type: 'flight',
    status: 'confirmed',
    isStaffAssigned: true
  },
  {
    id: 'activity-205',
    tripId: 'trip-003',
    title: 'Beach Day at Patong',
    description: 'Relax at the famous Patong Beach',
    date: '2024-09-14',
    time: '10:00',
    location: 'Patong Beach, Phuket',
    type: 'sightseeing',
    status: 'confirmed',
    isStaffAssigned: false
  }
];

export const mockTravelerNotifications: TravelerNotification[] = [
  {
    id: 'notif-001',
    title: 'Activity Reminder',
    message: 'Red Fort visit scheduled for tomorrow at 9:00 AM',
    type: 'activity',
    timestamp: '2024-07-24T20:00:00Z',
    isRead: false,
    actionRequired: false,
    relatedTripId: 'trip-001',
    relatedActivityId: 'activity-003'
  },
  {
    id: 'notif-002',
    title: 'Trip Update',
    message: 'Your Taj Mahal visit has been confirmed for sunrise viewing',
    type: 'trip-update',
    timestamp: '2024-07-24T15:30:00Z',
    isRead: false,
    actionRequired: false,
    relatedTripId: 'trip-001',
    relatedActivityId: 'activity-004'
  },
  {
    id: 'notif-003',
    title: 'Staff Message',
    message: 'Your guide will meet you at the hotel lobby at 8:30 AM',
    type: 'message',
    timestamp: '2024-07-24T12:00:00Z',
    isRead: true,
    actionRequired: false,
    relatedTripId: 'trip-001'
  },
  {
    id: 'notif-004',
    title: 'Activity Confirmation Required',
    message: 'Please confirm your attendance for the market shopping activity',
    type: 'confirmation',
    timestamp: '2024-07-24T10:00:00Z',
    isRead: false,
    actionRequired: true,
    relatedTripId: 'trip-001',
    relatedActivityId: 'activity-005'
  }
];

// Helper function to get today's activities
export const getTodayActivities = (activities: TripActivity[]): TodayActivity[] => {
  const today = new Date().toISOString().split('T')[0];
  
  return activities
    .filter(activity => activity.date === today)
    .map(activity => ({
      ...activity,
      isToday: true,
      timeUntil: calculateTimeUntil(activity.date, activity.time)
    }));
};

// Helper function to calculate time until activity
const calculateTimeUntil = (date: string, time: string): string => {
  const activityDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffMs = activityDateTime.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Past';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

export const getCurrentTrip = (): TravelerTrip | null => {
  return mockTravelerTrips.find(trip => trip.status === 'in-progress') || null;
};

export const getActivitiesForTrip = (tripId: string): TripActivity[] => {
  return mockTripActivities.filter(activity => activity.tripId === tripId);
};
