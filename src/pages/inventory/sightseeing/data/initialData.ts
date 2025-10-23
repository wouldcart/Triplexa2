
import { Sightseeing } from '@/types/sightseeing';

// Additional data exports that are used by form components
export const sightseeingCategories = [
  'Landmarks',
  'Architecture', 
  'City Views',
  'Temples',
  'Culture',
  'History',
  'Parks',
  'Nature',
  'Walking Tours',
  'Tours',
  'Free Activities',
  'Adventure',
  'Entertainment',
  'Food & Dining',
  'Shopping',
  'Religious Sites'
];

export const difficultyLevels = ['Easy', 'Moderate', 'Difficult'];

export const seasons = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Year'];

export const daysOfWeek = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

export const packageTypes = [
  'Ticket Only',
  'Entry Fee', 
  'SIC',
  'Private Tour',
  'Group Tour',
  'Half Day',
  'Full Day'
];

export const sampleSightseeingData: Sightseeing[] = [
  // Dubai Attractions
  {
    id: 1,
    name: "Burj Khalifa Observation Deck",
    description: "Experience breathtaking views from the world's tallest building. The Burj Khalifa offers unparalleled 360-degree views of Dubai from its observation decks on levels 124, 125, and 148.",
    country: "United Arab Emirates",
    city: "Dubai",
    category: "Landmarks, Architecture, City Views",
    status: "active",
    duration: "1.5 hours",
    timing: "8:30 AM - 11:00 PM",
    difficultyLevel: "Easy",
    allowedAgeGroup: "All Ages",
    address: "1 Sheikh Mohammed bin Rashid Boulevard, Dubai",
    googleMapLink: "https://maps.google.com/?q=Burj+Khalifa+Dubai",
    price: {
      adult: 149,
      child: 105
    },
    isFree: false,
    sicAvailable: true,
    sicPricing: {
      adult: 125,
      child: 90
    },
    requiresMandatoryTransfer: true,
    transferMandatory: true,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 50,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      },
      {
        id: 2,
        vehicleType: "Shared Transfer",
        capacity: "1-8",
        price: 25,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Standard Entry",
        name: "Levels 124 & 125",
        adultPrice: 149,
        childPrice: 105,
        isEnabled: true,
        description: "Access to observation decks on levels 124 & 125"
      },
      {
        id: 2,
        type: "National Park Fee",
        name: "Premium Level Access",
        adultPrice: 370,
        childPrice: 290,
        isEnabled: true,
        description: "Access to all observation decks including premium Level 148"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Burj Khalifa + Dubai Mall",
        type: "Combo",
        description: "Visit Burj Khalifa + Dubai Mall shopping voucher",
        adultPrice: 199,
        childPrice: 149,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 1,
        maxPeople: 4,
        adultPrice: 149,
        childPrice: 105
      },
      {
        id: 2,
        minPeople: 5,
        maxPeople: 15,
        adultPrice: 135,
        childPrice: 95
      }
    ],
    policies: {
      highlights: [
        "World's tallest building observation deck",
        "360-degree panoramic views of Dubai",
        "High-speed elevators",
        "Interactive multimedia presentations"
      ],
      inclusions: [
        "Access to observation deck",
        "Multimedia guide",
        "Complimentary refreshments"
      ],
      exclusions: [
        "Transportation",
        "Meals",
        "Personal expenses"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours before the activity"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2070",
        isPrimary: true,
        altText: "Burj Khalifa exterior view"
      }
    ],
    lastUpdated: "2024-12-10T08:00:00.000Z",
    createdAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: 2,
    name: "Dubai Desert Safari",
    description: "Experience the thrill of the Arabian desert with dune bashing, camel riding, traditional entertainment, and authentic Bedouin-style dinner under the stars.",
    country: "United Arab Emirates",
    city: "Dubai",
    category: "Adventure, Culture, Entertainment",
    status: "active",
    duration: "6 hours",
    timing: "3:00 PM - 9:00 PM",
    difficultyLevel: "Moderate",
    allowedAgeGroup: "5+ years",
    address: "Lehbab Desert, Dubai",
    googleMapLink: "https://maps.google.com/?q=Lehbab+Desert+Dubai",
    price: {
      adult: 65,
      child: 45
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "4WD Vehicle",
        capacity: "1-6",
        price: 0,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Standard Safari",
        name: "Evening Desert Safari",
        adultPrice: 65,
        childPrice: 45,
        isEnabled: true,
        description: "Dune bashing, camel ride, BBQ dinner, entertainment"
      },
      {
        id: 2,
        type: "Premium Safari",
        name: "VIP Desert Experience",
        adultPrice: 120,
        childPrice: 85,
        isEnabled: true,
        description: "Private table, premium menu, falcon show, quad biking"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Desert Safari + Dubai City Tour",
        type: "Full Day",
        description: "Morning city tour + evening desert safari",
        adultPrice: 145,
        childPrice: 105,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 2,
        maxPeople: 6,
        adultPrice: 65,
        childPrice: 45
      },
      {
        id: 2,
        minPeople: 7,
        maxPeople: 20,
        adultPrice: 58,
        childPrice: 40
      }
    ],
    policies: {
      highlights: [
        "Thrilling dune bashing adventure",
        "Traditional camel riding",
        "Authentic Bedouin camp experience",
        "Live entertainment and BBQ dinner"
      ],
      inclusions: [
        "Hotel pickup and drop-off",
        "Dune bashing in 4WD vehicle",
        "Camel riding",
        "BBQ dinner buffet",
        "Traditional entertainment",
        "Soft drinks and water"
      ],
      exclusions: [
        "Alcoholic beverages",
        "Quad biking (optional extra)",
        "Personal expenses",
        "Tips"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours before the tour"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?q=80&w=2070",
        isPrimary: true,
        altText: "Camels in desert landscape"
      }
    ],
    lastUpdated: "2024-12-10T09:30:00.000Z",
    createdAt: "2024-02-01T10:00:00.000Z"
  },
  {
    id: 3,
    name: "Dubai Marina Dhow Cruise",
    description: "Sail along Dubai Marina aboard a traditional wooden dhow while enjoying a sumptuous buffet dinner and spectacular views of the illuminated skyline.",
    country: "United Arab Emirates",
    city: "Dubai",
    category: "Entertainment, Culture, City Views",
    status: "active",
    duration: "2 hours",
    timing: "8:00 PM - 10:00 PM",
    difficultyLevel: "Easy",
    allowedAgeGroup: "All Ages",
    address: "Dubai Marina, Dubai",
    googleMapLink: "https://maps.google.com/?q=Dubai+Marina",
    price: {
      adult: 55,
      child: 35
    },
    isFree: false,
    sicAvailable: true,
    sicPricing: {
      adult: 45,
      child: 30
    },
    requiresMandatoryTransfer: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 30,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      },
      {
        id: 2,
        vehicleType: "Shared Transfer",
        capacity: "1-8",
        price: 15,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Standard Cruise",
        name: "Marina Dhow Dinner",
        adultPrice: 55,
        childPrice: 35,
        isEnabled: true,
        description: "2-hour cruise with buffet dinner"
      },
      {
        id: 2,
        type: "VIP Cruise",
        name: "Premium Marina Experience",
        adultPrice: 95,
        childPrice: 65,
        isEnabled: true,
        description: "VIP seating, premium menu, live entertainment"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Dhow Cruise + Burj Al Arab Photo Stop",
        type: "Combo",
        description: "Marina cruise + Burj Al Arab visit",
        adultPrice: 85,
        childPrice: 55,
        isEnabled: true
      }
    ],
    policies: {
      highlights: [
        "Traditional wooden dhow cruise",
        "Spectacular Marina skyline views",
        "International buffet dinner",
        "Live entertainment onboard"
      ],
      inclusions: [
        "2-hour dhow cruise",
        "Welcome drinks",
        "International buffet dinner",
        "Live entertainment",
        "Tea, coffee, soft drinks"
      ],
      exclusions: [
        "Hotel transfers",
        "Alcoholic beverages",
        "Personal expenses"
      ],
      cancellationPolicy: "Free cancellation up to 48 hours before cruise"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2070",
        isPrimary: true,
        altText: "Dubai Marina at night"
      }
    ],
    lastUpdated: "2024-12-10T11:00:00.000Z",
    createdAt: "2024-03-01T09:00:00.000Z"
  },
  {
    id: 4,
    name: "Dubai Aquarium & Underwater Zoo",
    description: "Discover the wonders of marine life at one of the world's largest suspended aquariums, featuring over 33,000 aquatic animals and immersive underwater experiences.",
    country: "United Arab Emirates",
    city: "Dubai",
    category: "Entertainment, Nature, Family",
    status: "active",
    duration: "2 hours",
    timing: "10:00 AM - 12:00 AM",
    difficultyLevel: "Easy",
    allowedAgeGroup: "All Ages",
    address: "Dubai Mall, Downtown Dubai",
    googleMapLink: "https://maps.google.com/?q=Dubai+Aquarium+Dubai+Mall",
    price: {
      adult: 40,
      child: 30
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Metro + Walking",
        capacity: "1-10",
        price: 5,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      },
      {
        id: 2,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 25,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Basic Entry",
        name: "Aquarium Tunnel",
        adultPrice: 40,
        childPrice: 30,
        isEnabled: true,
        description: "Access to main aquarium tunnel and underwater zoo"
      },
      {
        id: 2,
        type: "Explorer Package",
        name: "Behind the Scenes",
        adultPrice: 70,
        childPrice: 55,
        isEnabled: true,
        description: "Includes glass boat ride and behind-the-scenes tour"
      },
      {
        id: 3,
        type: "VIP Experience",
        name: "Shark Encounter",
        adultPrice: 150,
        childPrice: 120,
        isEnabled: true,
        description: "Cage snorkeling with sharks (age 12+)"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Aquarium + Dubai Mall Tour",
        type: "Half Day",
        description: "Aquarium visit + guided mall tour",
        adultPrice: 65,
        childPrice: 50,
        isEnabled: true
      }
    ],
    policies: {
      highlights: [
        "World's largest suspended aquarium",
        "Over 33,000 marine animals",
        "Walk-through tunnel experience",
        "Interactive underwater zoo"
      ],
      inclusions: [
        "Aquarium tunnel access",
        "Underwater zoo entry",
        "Interactive exhibits",
        "Educational presentations"
      ],
      exclusions: [
        "Transportation",
        "Food and beverages",
        "Optional activities",
        "Dubai Mall shopping"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours in advance"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2070",
        isPrimary: true,
        altText: "Underwater aquarium tunnel view"
      }
    ],
    lastUpdated: "2024-12-10T12:30:00.000Z",
    createdAt: "2024-04-01T14:00:00.000Z"
  },

  // Thailand Attractions
  {
    id: 5,
    name: "Grand Palace & Emerald Buddha",
    description: "Discover Thailand's most sacred temple and the former royal residence. The Grand Palace complex houses the revered Emerald Buddha and showcases magnificent Thai architecture and artistry.",
    country: "Thailand",
    city: "Bangkok",
    category: "Temples, Culture, History",
    status: "active",
    duration: "2-3 hours",
    timing: "8:30 AM - 3:30 PM",
    difficultyLevel: "Moderate",
    allowedAgeGroup: "All Ages",
    address: "Na Phra Lan Road, Phra Nakhon, Bangkok",
    googleMapLink: "https://maps.google.com/?q=Grand+Palace+Bangkok",
    price: {
      adult: 500,
      child: 0
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Tuk Tuk",
        capacity: "1-3",
        price: 200,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      },
      {
        id: 2,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 800,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      },
      {
        id: 3,
        vehicleType: "Shared Minivan",
        capacity: "1-8",
        price: 150,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Entry Fee",
        name: "Grand Palace Entry",
        adultPrice: 500,
        childPrice: 0,
        isEnabled: true,
        description: "Temple admission with audio guide"
      },
      {
        id: 2,
        type: "Guided Tour",
        name: "Private Guide Service",
        adultPrice: 1200,
        childPrice: 600,
        isEnabled: true,
        description: "Entry + 2-hour private English guide"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Grand Palace + Wat Pho Temple",
        type: "Half Day",
        description: "Visit both temples with guide",
        adultPrice: 1500,
        childPrice: 750,
        isEnabled: true
      },
      {
        id: 2,
        name: "Bangkok Temples & River Cruise",
        type: "Full Day",
        description: "Temples tour + Chao Phraya boat ride",
        adultPrice: 2200,
        childPrice: 1100,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 1,
        maxPeople: 5,
        adultPrice: 500,
        childPrice: 0
      },
      {
        id: 2,
        minPeople: 6,
        maxPeople: 15,
        adultPrice: 450,
        childPrice: 0
      }
    ],
    policies: {
      highlights: [
        "Thailand's most sacred Buddhist temple",
        "Stunning Thai architecture and art",
        "Former royal residence",
        "Home to the Emerald Buddha"
      ],
      inclusions: [
        "Temple admission",
        "Audio guide available",
        "Dress code guidance"
      ],
      exclusions: [
        "Transportation",
        "Food and beverages",
        "Private guide",
        "Photography fees"
      ],
      cancellationPolicy: "No refund for no-shows. Free cancellation 48 hours in advance"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?q=80&w=2070",
        isPrimary: true,
        altText: "Grand Palace Bangkok golden architecture"
      }
    ],
    lastUpdated: "2024-12-09T14:30:00.000Z",
    createdAt: "2024-02-01T09:00:00.000Z"
  },
  {
    id: 6,
    name: "Floating Market & Longtail Boat Tour",
    description: "Experience authentic Thai culture at the famous Damnoen Saduak Floating Market. Navigate traditional canals by longtail boat and discover local vendors selling fresh fruits, food, and crafts.",
    country: "Thailand",
    city: "Bangkok",
    category: "Culture, Food & Dining, Adventure",
    status: "active",
    duration: "5 hours",
    timing: "7:00 AM - 12:00 PM",
    difficultyLevel: "Easy",
    allowedAgeGroup: "All Ages",
    address: "Damnoen Saduak, Ratchaburi Province",
    googleMapLink: "https://maps.google.com/?q=Damnoen+Saduak+Floating+Market",
    price: {
      adult: 1200,
      child: 800
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Air-conditioned Van",
        capacity: "1-8",
        price: 0,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "SIC"
      },
      {
        id: 2,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 1500,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Group Tour",
        name: "Shared Boat Experience",
        adultPrice: 1200,
        childPrice: 800,
        isEnabled: true,
        description: "Shared longtail boat + market visit"
      },
      {
        id: 2,
        type: "Private Tour",
        name: "Private Boat & Guide",
        adultPrice: 2000,
        childPrice: 1400,
        isEnabled: true,
        description: "Private boat + English speaking guide"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Floating Market + Coconut Farm",
        type: "Full Day",
        description: "Market visit + coconut sugar farm tour",
        adultPrice: 1800,
        childPrice: 1200,
        isEnabled: true
      },
      {
        id: 2,
        name: "Market + Railway Market",
        type: "Full Day",
        description: "Both famous markets in one day",
        adultPrice: 1600,
        childPrice: 1000,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 2,
        maxPeople: 8,
        adultPrice: 1200,
        childPrice: 800
      },
      {
        id: 2,
        minPeople: 9,
        maxPeople: 20,
        adultPrice: 1000,
        childPrice: 700
      }
    ],
    policies: {
      highlights: [
        "Authentic floating market experience",
        "Traditional longtail boat ride",
        "Local fruit and food tastings",
        "Cultural immersion with vendors"
      ],
      inclusions: [
        "Hotel pickup and drop-off",
        "Longtail boat ride",
        "English speaking guide",
        "Market entrance",
        "Fresh fruit samples"
      ],
      exclusions: [
        "Lunch",
        "Personal shopping",
        "Tips for boat driver",
        "Optional activities"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours before tour"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=2070",
        isPrimary: true,
        altText: "Traditional floating market boats"
      }
    ],
    lastUpdated: "2024-12-10T10:15:00.000Z",
    createdAt: "2024-03-15T11:00:00.000Z"
  },
  {
    id: 7,
    name: "Elephant Sanctuary Ethical Tour",
    description: "Visit an ethical elephant sanctuary where rescued elephants roam freely. Learn about elephant conservation, feed them, and observe their natural behaviors in a responsible tourism environment.",
    country: "Thailand",
    city: "Chiang Mai",
    category: "Nature, Adventure, Conservation",
    status: "active",
    duration: "6 hours",
    timing: "8:00 AM - 2:00 PM",
    difficultyLevel: "Moderate",
    allowedAgeGroup: "5+ years",
    address: "Mae Taeng District, Chiang Mai",
    googleMapLink: "https://maps.google.com/?q=Elephant+Sanctuary+Chiang+Mai",
    price: {
      adult: 2500,
      child: 1800
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Shared Songthaew",
        capacity: "1-10",
        price: 0,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      },
      {
        id: 2,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 1200,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Half Day",
        name: "Elephant Encounter",
        adultPrice: 2500,
        childPrice: 1800,
        isEnabled: true,
        description: "Feeding, bathing, and observation experience"
      },
      {
        id: 2,
        type: "Full Day",
        name: "Mahout Experience",
        adultPrice: 3500,
        childPrice: 2500,
        isEnabled: true,
        description: "Full day with elephant care training"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Elephant Sanctuary + Sticky Waterfall",
        type: "Full Day",
        description: "Elephant visit + unique limestone waterfall",
        adultPrice: 3200,
        childPrice: 2300,
        isEnabled: true
      },
      {
        id: 2,
        name: "Elephant & Hill Tribe Village",
        type: "Full Day",
        description: "Sanctuary visit + local village tour",
        adultPrice: 3800,
        childPrice: 2700,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 2,
        maxPeople: 6,
        adultPrice: 2500,
        childPrice: 1800
      },
      {
        id: 2,
        minPeople: 7,
        maxPeople: 15,
        adultPrice: 2200,
        childPrice: 1600
      }
    ],
    policies: {
      highlights: [
        "Ethical elephant sanctuary visit",
        "No riding - observation only",
        "Elephant feeding and bathing",
        "Conservation education program"
      ],
      inclusions: [
        "Hotel pickup and drop-off",
        "English speaking guide",
        "Elephant feeding experience",
        "Traditional Thai lunch",
        "Bottled water",
        "Insurance"
      ],
      exclusions: [
        "Personal expenses",
        "Tips for guides",
        "Optional activities",
        "Cameras (rental available)"
      ],
      cancellationPolicy: "Free cancellation up to 48 hours before tour"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2070",
        isPrimary: true,
        altText: "Elephants in natural sanctuary setting"
      }
    ],
    lastUpdated: "2024-12-10T13:45:00.000Z",
    createdAt: "2024-05-01T10:30:00.000Z"
  },
  {
    id: 8,
    name: "Doi Suthep Temple & City View",
    description: "Visit Chiang Mai's most famous temple perched on a mountain top. Climb the 309 steps of the Naga staircase to reach the golden chedi and enjoy panoramic views of the city below.",
    country: "Thailand",
    city: "Chiang Mai",
    category: "Temples, Culture, City Views",
    status: "active",
    duration: "3 hours",
    timing: "8:00 AM - 6:00 PM",
    difficultyLevel: "Moderate",
    allowedAgeGroup: "All Ages",
    address: "Doi Suthep-Pui National Park, Chiang Mai",
    googleMapLink: "https://maps.google.com/?q=Doi+Suthep+Temple+Chiang+Mai",
    price: {
      adult: 30,
      child: 0
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Red Songthaew",
        capacity: "1-10",
        price: 200,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      },
      {
        id: 2,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 800,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      },
      {
        id: 3,
        vehicleType: "Motorbike",
        capacity: "1-2",
        price: 300,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Temple Entry",
        name: "Basic Admission",
        adultPrice: 30,
        childPrice: 0,
        isEnabled: true,
        description: "Temple entrance fee only"
      },
      {
        id: 2,
        type: "Guided Tour",
        name: "Temple + Guide",
        adultPrice: 400,
        childPrice: 200,
        isEnabled: true,
        description: "Entry + English speaking guide"
      },
      {
        id: 3,
        type: "Sunset Tour",
        name: "Evening Temple Visit",
        adultPrice: 600,
        childPrice: 300,
        isEnabled: true,
        description: "Late afternoon visit for sunset views"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Doi Suthep + Hmong Village",
        type: "Half Day",
        description: "Temple visit + hill tribe village",
        adultPrice: 800,
        childPrice: 400,
        isEnabled: true
      },
      {
        id: 2,
        name: "Temple Hopping Tour",
        type: "Full Day",
        description: "Doi Suthep + 3 other temples",
        adultPrice: 1200,
        childPrice: 600,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 1,
        maxPeople: 4,
        adultPrice: 30,
        childPrice: 0
      },
      {
        id: 2,
        minPeople: 5,
        maxPeople: 15,
        adultPrice: 25,
        childPrice: 0
      }
    ],
    policies: {
      highlights: [
        "Chiang Mai's most sacred temple",
        "Panoramic city and mountain views",
        "Golden chedi and Buddhist artifacts",
        "Traditional Lanna architecture"
      ],
      inclusions: [
        "Temple entrance fee",
        "Parking fees",
        "Basic information guide"
      ],
      exclusions: [
        "Transportation",
        "Food and drinks",
        "Professional guide",
        "Cable car (if available)"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours in advance"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1466442929976-97f336a657be?q=80&w=2070",
        isPrimary: true,
        altText: "Golden temple with mountain views"
      }
    ],
    lastUpdated: "2024-12-10T15:00:00.000Z",
    createdAt: "2024-06-01T12:00:00.000Z"
  },
  {
    id: 9,
    name: "Phi Phi Islands Day Trip",
    description: "Explore the stunning Phi Phi Islands made famous by the movie 'The Beach'. Enjoy crystal-clear waters, pristine beaches, snorkeling, and breathtaking limestone cliffs.",
    country: "Thailand",
    city: "Phuket",
    category: "Nature, Adventure, Island Hopping",
    status: "active",
    duration: "8 hours",
    timing: "7:00 AM - 3:00 PM",
    difficultyLevel: "Easy",
    allowedAgeGroup: "All Ages",
    address: "Phi Phi Islands, Krabi Province",
    googleMapLink: "https://maps.google.com/?q=Phi+Phi+Islands+Thailand",
    price: {
      adult: 1800,
      child: 1200
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Hotel Transfer + Speedboat",
        capacity: "1-30",
        price: 0,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      },
      {
        id: 2,
        vehicleType: "Private Speedboat",
        capacity: "1-12",
        price: 15000,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Group Tour",
        name: "Shared Speedboat",
        adultPrice: 1800,
        childPrice: 1200,
        isEnabled: true,
        description: "Shared boat tour with lunch included"
      },
      {
        id: 2,
        type: "Premium Tour",
        name: "Small Group (Max 15)",
        adultPrice: 2400,
        childPrice: 1800,
        isEnabled: true,
        description: "Smaller group, better service, premium lunch"
      },
      {
        id: 3,
        type: "Private Charter",
        name: "Exclusive Boat",
        adultPrice: 4500,
        childPrice: 3500,
        isEnabled: true,
        description: "Private boat for your group only"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Phi Phi + James Bond Island",
        type: "Full Day",
        description: "Visit both famous island destinations",
        adultPrice: 2800,
        childPrice: 2100,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 2,
        maxPeople: 15,
        adultPrice: 1800,
        childPrice: 1200
      },
      {
        id: 2,
        minPeople: 16,
        maxPeople: 30,
        adultPrice: 1600,
        childPrice: 1100
      }
    ],
    policies: {
      highlights: [
        "Visit Maya Bay (The Beach movie location)",
        "Snorkeling in crystal-clear waters",
        "Limestone cliffs and pristine beaches",
        "Monkey Beach wildlife viewing"
      ],
      inclusions: [
        "Hotel pickup and drop-off",
        "Speedboat transfers",
        "Professional guide",
        "Buffet lunch",
        "Snorkeling equipment",
        "Life jackets",
        "Fresh fruits and drinks",
        "National park fees"
      ],
      exclusions: [
        "Personal expenses",
        "Underwater camera rental",
        "Tips for guide and crew",
        "Alcoholic beverages"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours before departure. Weather-dependent"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=2070",
        isPrimary: true,
        altText: "Phi Phi Islands limestone cliffs and clear water"
      }
    ],
    lastUpdated: "2024-12-10T16:30:00.000Z",
    createdAt: "2024-07-01T09:00:00.000Z"
  },
  {
    id: 10,
    name: "Thai Cooking Class & Market Tour",
    description: "Learn to cook authentic Thai dishes from local chefs. Start with a traditional market visit to select fresh ingredients, then master the art of Thai cuisine in a hands-on cooking class.",
    country: "Thailand",
    city: "Phuket",
    category: "Food & Dining, Culture, Learning",
    status: "active",
    duration: "4 hours",
    timing: "9:00 AM - 1:00 PM / 3:00 PM - 7:00 PM",
    difficultyLevel: "Easy",
    allowedAgeGroup: "10+ years",
    address: "Local Cooking School, Phuket",
    googleMapLink: "https://maps.google.com/?q=Thai+Cooking+Class+Phuket",
    price: {
      adult: 1200,
      child: 900
    },
    isFree: false,
    transferOptions: [
      {
        id: 1,
        vehicleType: "Hotel Pickup",
        capacity: "1-8",
        price: 0,
        priceUnit: "Per Person",
        isEnabled: true,
        type: "SIC"
      },
      {
        id: 2,
        vehicleType: "Private Car",
        capacity: "1-4",
        price: 600,
        priceUnit: "Per Vehicle",
        isEnabled: true,
        type: "Private"
      }
    ],
    pricingOptions: [
      {
        id: 1,
        type: "Group Class",
        name: "Standard Cooking Class",
        adultPrice: 1200,
        childPrice: 900,
        isEnabled: true,
        description: "Learn 4-5 dishes in group setting"
      },
      {
        id: 2,
        type: "Private Class",
        name: "Personal Chef Experience",
        adultPrice: 2200,
        childPrice: 1600,
        isEnabled: true,
        description: "Private instruction, customize menu"
      },
      {
        id: 3,
        type: "Premium Class",
        name: "Master Chef Program",
        adultPrice: 1800,
        childPrice: 1300,
        isEnabled: true,
        description: "Advanced techniques, 6-7 dishes, wine pairing"
      }
    ],
    packageOptions: [
      {
        id: 1,
        name: "Cooking Class + Farm Visit",
        type: "Full Day",
        description: "Market tour + cooking + organic farm visit",
        adultPrice: 1800,
        childPrice: 1300,
        isEnabled: true
      },
      {
        id: 2,
        name: "Evening Class + Cultural Show",
        type: "Evening",
        description: "Cooking class + traditional Thai performance",
        adultPrice: 1600,
        childPrice: 1200,
        isEnabled: true
      }
    ],
    groupSizeOptions: [
      {
        id: 1,
        minPeople: 2,
        maxPeople: 8,
        adultPrice: 1200,
        childPrice: 900
      },
      {
        id: 2,
        minPeople: 9,
        maxPeople: 16,
        adultPrice: 1000,
        childPrice: 800
      }
    ],
    policies: {
      highlights: [
        "Hands-on Thai cooking experience",
        "Traditional market tour",
        "Learn 4-5 authentic dishes",
        "Take home recipe book"
      ],
      inclusions: [
        "Market tour with chef",
        "All ingredients and equipment",
        "English-speaking chef instructor",
        "Full meal of cooked dishes",
        "Recipe book to take home",
        "Apron and certificate",
        "Soft drinks and water"
      ],
      exclusions: [
        "Hotel transfers (optional)",
        "Alcoholic beverages",
        "Personal expenses",
        "Tips for chef"
      ],
      cancellationPolicy: "Free cancellation up to 24 hours before class"
    },
    validityPeriod: {
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1466442929976-97f336a657be?q=80&w=2070",
        isPrimary: true,
        altText: "Thai cooking class with fresh ingredients"
      }
    ],
    lastUpdated: "2024-12-10T17:45:00.000Z",
    createdAt: "2024-08-01T11:30:00.000Z"
  }
];

// Export as both named and default exports for compatibility
export const sightseeingData = sampleSightseeingData;
export default sampleSightseeingData;
