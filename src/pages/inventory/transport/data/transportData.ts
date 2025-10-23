import { TransportRoute } from '../types/transportTypes';
import { LocationCode, TransportType } from '../types/transportTypes';

export const locationCodes = [
  // Sample location codes data from the table
  {
    id: "101",
    code: "HKT APT",
    fullName: "Phuket International Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Phuket",
    status: "active" as const,
    latitude: "7.8804° N",
    longitude: "98.3069° E",
    notes: "Main gateway to Phuket; located in Thalang district.",
    name: "Phuket International Airport"
  },
  {
    id: "102",
    code: "HKT HTL",
    fullName: "Phuket Hotel",
    category: "hotel" as const,
    country: "Thailand",
    city: "Phuket",
    status: "active" as const,
    notes: "Placeholder for hotel in Phuket.",
    name: "Phuket Hotel"
  },
  {
    id: "103",
    code: "KBV APT",
    fullName: "Krabi International Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Krabi",
    status: "active" as const,
    latitude: "8.1100° N",
    longitude: "98.9183° E",
    notes: "Serves Krabi province; located in Nuea Khlong district.",
    name: "Krabi International Airport"
  },
  {
    id: "104",
    code: "KBV HTL",
    fullName: "Krabi Hotel",
    category: "hotel" as const,
    country: "Thailand",
    city: "Krabi",
    status: "active" as const,
    notes: "Placeholder for hotel in Krabi.",
    name: "Krabi Hotel"
  },
  {
    id: "105",
    code: "Donsak Pier",
    fullName: "Donsak Pier",
    category: "pier" as const,
    country: "Thailand",
    city: "Surat Thani",
    status: "active" as const,
    latitude: "9.1417° N",
    longitude: "99.3133° E",
    notes: "Primary ferry terminal to Koh Samui; located in Donsak district.",
    name: "Donsak Pier"
  },
  {
    id: "106",
    code: "KOH Samui HTL",
    fullName: "Koh Samui Hotel",
    category: "hotel" as const,
    country: "Thailand",
    city: "Koh Samui",
    status: "active" as const,
    notes: "Placeholder for hotel in Koh Samui.",
    name: "Koh Samui Hotel"
  },
  {
    id: "107",
    code: "BKK APT",
    fullName: "Suvarnabhumi Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Bangkok",
    status: "active" as const,
    latitude: "13.6900° N",
    longitude: "100.7500° E",
    notes: "Main international airport in Bangkok; located in Samut Prakan province.",
    name: "Suvarnabhumi Airport"
  },
  {
    id: "108",
    code: "BKK HTL",
    fullName: "Bangkok Hotel",
    category: "hotel" as const,
    country: "Thailand",
    city: "Bangkok",
    status: "active" as const,
    notes: "Placeholder for hotel in Bangkok.",
    name: "Bangkok Hotel"
  },
  {
    id: "109",
    code: "PHI PHI",
    fullName: "Phi Phi Islands",
    category: "other" as const,
    country: "Thailand",
    city: "Phi Phi Islands",
    status: "active" as const,
    latitude: "7.7400° N",
    longitude: "98.7700° E",
    notes: "Famous archipelago; includes Ko Phi Phi Don and Ko Phi Phi Le.",
    name: "Phi Phi Islands"
  },
  {
    id: "110",
    code: "USM APT",
    fullName: "Samui International Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Koh Samui",
    status: "active" as const,
    latitude: "9.5500° N",
    longitude: "100.0600° E",
    notes: "Main airport on Koh Samui; located in Bo Phut subdistrict.",
    name: "Samui International Airport"
  },
  {
    id: "111",
    code: "PTY HTL",
    fullName: "Pattaya Hotel",
    category: "hotel" as const,
    country: "Thailand",
    city: "Pattaya",
    status: "active" as const,
    notes: "Placeholder for hotel in Pattaya.",
    name: "Pattaya Hotel"
  },
  {
    id: "112",
    code: "Ao Po Pier",
    fullName: "Ao Po Grand Marina Pier",
    category: "pier" as const,
    country: "Thailand",
    city: "Phuket",
    status: "active" as const,
    notes: "Main pier for boats to Phang Nga Bay and the east coast islands.",
    name: "Ao Po Grand Marina Pier"
  },
  {
    id: "113",
    code: "Santhiya HTL",
    fullName: "Santhiya Resort",
    category: "hotel" as const,
    country: "Thailand",
    city: "Koh Yao Yai",
    status: "active" as const,
    notes: "Luxury resort on Koh Yao Yai island.",
    name: "Santhiya Resort"
  },
  // Keep the original location codes below
  {
    id: "1",
    code: "BKK",
    fullName: "Suvarnabhumi Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Bangkok",
    status: "active" as const,
    name: "Suvarnabhumi Airport"
  },
  {
    id: "2",
    code: "CNX",
    fullName: "Chiang Mai International Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Chiang Mai",
    status: "active" as const,
    name: "Chiang Mai International Airport"
  },
  {
    id: "3",
    code: "HKT",
    fullName: "Phuket International Airport",
    category: "airport" as const,
    country: "Thailand",
    city: "Phuket",
    status: "active" as const,
    name: "Phuket International Airport"
  },
  {
    id: "4",
    code: "DMK",
    fullName: "Don Mueang International Airport",
    category: "airport" as const, 
    country: "Thailand",
    city: "Bangkok",
    status: "active" as const,
    name: "Don Mueang International Airport"
  },
  {
    id: "5",
    code: "BKKCITY",
    fullName: "Bangkok City Center",
    category: "other" as const,
    country: "Thailand", 
    city: "Bangkok",
    status: "active" as const, 
    name: "Bangkok City Center"
  },
  {
    id: "6",
    code: "PHUKCITY",
    fullName: "Phuket City Center",
    category: "other" as const,
    country: "Thailand",
    city: "Phuket",
    status: "active" as const,
    name: "Phuket City Center"
  }
];

export const transportTypes: TransportType[] = [
  { id: "1", name: "Sedan", category: "Economy", seatingCapacity: 3, luggageCapacity: 2, active: true },
  { id: "2", name: "SUV", category: "Standard", seatingCapacity: 5, luggageCapacity: 3, active: true },
  { id: "3", name: "Van", category: "Premium", seatingCapacity: 9, luggageCapacity: 5, active: true },
  { id: "4", name: "Coach", category: "Standard", seatingCapacity: 40, luggageCapacity: 20, active: true },
  { id: "5", name: "Ferry", category: "Economy", seatingCapacity: 100, luggageCapacity: 50, active: true }
];

export const transportCategories = [
  { id: "1", name: "Economy" },
  { id: "2", name: "Standard" },
  { id: "3", name: "Premium" },
  { id: "4", name: "Luxury" }
];

export const sightseeingLocations = [
  { id: "1", name: "Grand Palace", city: "Bangkok", country: "Thailand" },
  { id: "2", name: "Wat Arun", city: "Bangkok", country: "Thailand" },
  { id: "3", name: "Phi Phi Islands", city: "Phuket", country: "Thailand" },
  { id: "4", name: "Patong Beach", city: "Phuket", country: "Thailand" }
];

export const transportRoutes: TransportRoute[] = [
  // ============ EN ROUTE TRANSFERS ============
  // Routes with passenger pickup/drop-off along the way
  {
    id: "er-001",
    name: "Bangkok Airport to Pattaya (En Route Pickups)",
    code: "BKK-PTY-ER",
    startLocation: "BKK APT",
    startLocationFullName: "Suvarnabhumi Airport",
    endLocation: "PTY HTL",
    endLocationFullName: "Pattaya Hotel",
    country: "Thailand",
    transferType: "en route",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "3h 30m",
        price: 850
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK APT",
        toLocation: "BKK HTL",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "45m"
      },
      {
        fromLocation: "BKK HTL",
        toLocation: "PTY HTL",
        transferMethod: "SIC",
        distance: "120 km",
        duration: "2h 45m"
      }
    ],
    distance: 155,
    duration: "3h 30m",
    enableSightseeing: false,
    description: "Shared transfer with en route hotel pickups"
  },
  {
    id: "er-002",
    name: "Phuket Airport to Southern Hotels (En Route)",
    code: "HKT-STH-ER",
    startLocation: "HKT APT",
    startLocationFullName: "Phuket International Airport",
    endLocation: "HKT HTL",
    endLocationFullName: "Phuket Southern Hotels",
    country: "Thailand",
    transferType: "en route",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "2h 15m",
        price: 650
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT APT",
        toLocation: "PHUKCITY",
        transferMethod: "SIC",
        distance: "45 km",
        duration: "1h"
      },
      {
        fromLocation: "PHUKCITY",
        toLocation: "HKT HTL",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "1h 15m"
      }
    ],
    distance: 80,
    duration: "2h 15m",
    enableSightseeing: false,
    description: "En route stops at multiple beach hotels"
  },
  {
    id: "er-003",
    name: "Chiang Mai Airport to City Hotels (En Route)",
    code: "CNX-CTY-ER",
    startLocation: "CNX",
    startLocationFullName: "Chiang Mai International Airport",
    endLocation: "BKKCITY",
    endLocationFullName: "Chiang Mai City Hotels",
    country: "Thailand",
    transferType: "en route",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "1h 30m",
        price: 450
      }
    ],
    routeSegments: [
      {
        fromLocation: "CNX",
        toLocation: "BKKCITY",
        transferMethod: "SIC",
        distance: "25 km",
        duration: "1h 30m"
      }
    ],
    distance: 25,
    duration: "1h 30m",
    enableSightseeing: false,
    description: "Multiple hotel stops in Chiang Mai city center"
  },

  // ============ MULTI-STOP ROUTES ============
  // Routes with multiple planned destinations
  {
    id: "ms-001",
    name: "Southern Thailand Island Hopping",
    code: "HKT-KBV-KSM-MS",
    startLocation: "HKT APT",
    startLocationFullName: "Phuket International Airport",
    endLocation: "USM APT",
    endLocationFullName: "Samui International Airport",
    country: "Thailand",
    transferType: "Multi-Stop",
    status: "active",
    intermediateStops: [
      {
        id: "stop-1",
        locationCode: "HKT HTL",
        fullName: "Phuket Hotel",
        transferMethod: "PVT"
      },
      {
        id: "stop-2",
        locationCode: "KBV HTL",
        fullName: "Krabi Hotel",
        transferMethod: "PVT"
      },
      {
        id: "stop-3",
        locationCode: "Donsak Pier",
        fullName: "Donsak Pier",
        transferMethod: "SIC"
      }
    ],
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "8h",
        price: 2800
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT APT",
        toLocation: "HKT HTL",
        transferMethod: "PVT",
        distance: "50 km",
        duration: "1h"
      },
      {
        fromLocation: "HKT HTL",
        toLocation: "KBV HTL",
        transferMethod: "PVT",
        distance: "170 km",
        duration: "3h"
      },
      {
        fromLocation: "KBV HTL",
        toLocation: "Donsak Pier",
        transferMethod: "PVT",
        distance: "180 km",
        duration: "3h"
      },
      {
        fromLocation: "Donsak Pier",
        toLocation: "USM APT",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "1h"
      }
    ],
    distance: 435,
    duration: "8h",
    enableSightseeing: false,
    description: "Complete island hopping tour with multiple stops"
  },
  {
    id: "ms-002",
    name: "Bangkok to Eastern Beaches Multi-Stop",
    code: "BKK-PTY-KBV-MS",
    startLocation: "BKK APT",
    startLocationFullName: "Suvarnabhumi Airport",
    endLocation: "KBV APT",
    endLocationFullName: "Krabi International Airport",
    country: "Thailand",
    transferType: "Multi-Stop",
    status: "active",
    intermediateStops: [
      {
        id: "stop-1",
        locationCode: "BKK HTL",
        fullName: "Bangkok Hotel",
        transferMethod: "PVT"
      },
      {
        id: "stop-2",
        locationCode: "PTY HTL",
        fullName: "Pattaya Hotel",
        transferMethod: "PVT"
      }
    ],
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "12h",
        price: 3500
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK APT",
        toLocation: "BKK HTL",
        transferMethod: "PVT",
        distance: "35 km",
        duration: "1h"
      },
      {
        fromLocation: "BKK HTL",
        toLocation: "PTY HTL",
        transferMethod: "PVT",
        distance: "150 km",
        duration: "3h"
      },
      {
        fromLocation: "PTY HTL",
        toLocation: "KBV APT",
        transferMethod: "PVT",
        distance: "650 km",
        duration: "8h"
      }
    ],
    distance: 835,
    duration: "12h",
    enableSightseeing: false,
    description: "Multi-destination tour from Bangkok to southern Thailand"
  },
  {
    id: "ms-003",
    name: "Phuket Phi Phi Krabi Circuit",
    code: "HKT-PHI-KBV-MS",
    startLocation: "HKT APT",
    startLocationFullName: "Phuket International Airport",
    endLocation: "KBV APT",
    endLocationFullName: "Krabi International Airport",
    country: "Thailand",
    transferType: "Multi-Stop",
    status: "active",
    intermediateStops: [
      {
        id: "stop-1",
        locationCode: "Ao Po Pier",
        fullName: "Ao Po Grand Marina Pier",
        transferMethod: "PVT"
      },
      {
        id: "stop-2",
        locationCode: "PHI PHI",
        fullName: "Phi Phi Islands",
        transferMethod: "SIC"
      }
    ],
    transportTypes: [
      {
        id: "1",
        type: "Ferry",
        seatingCapacity: 100,
        luggageCapacity: 50,
        duration: "6h",
        price: 1800
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT APT",
        toLocation: "Ao Po Pier",
        transferMethod: "PVT",
        distance: "40 km",
        duration: "1h"
      },
      {
        fromLocation: "Ao Po Pier",
        toLocation: "PHI PHI",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "2h"
      },
      {
        fromLocation: "PHI PHI",
        toLocation: "KBV APT",
        transferMethod: "SIC",
        distance: "45 km",
        duration: "3h"
      }
    ],
    distance: 120,
    duration: "6h",
    enableSightseeing: false,
    description: "Island hopping circuit with ferry connections"
  },

  // ============ PRIVATE TRANSFERS ============
  // Dedicated private transfer routes
  {
    id: "pvt-001",
    name: "Bangkok Airport Private Transfer",
    code: "BKK-CTY-PVT",
    startLocation: "BKK APT",
    startLocationFullName: "Suvarnabhumi Airport",
    endLocation: "BKK HTL",
    endLocationFullName: "Bangkok City Hotels",
    country: "Thailand",
    transferType: "Private",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Sedan",
        seatingCapacity: 3,
        luggageCapacity: 2,
        duration: "45m",
        price: 1200
      },
      {
        id: "2",
        type: "SUV",
        seatingCapacity: 5,
        luggageCapacity: 3,
        duration: "45m",
        price: 1600
      },
      {
        id: "3",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "45m",
        price: 2000
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK APT",
        toLocation: "BKK HTL",
        transferMethod: "PVT",
        distance: "35 km",
        duration: "45m"
      }
    ],
    distance: 35,
    duration: "45m",
    enableSightseeing: false,
    description: "Private direct transfer to city hotels"
  },
  {
    id: "pvt-002",
    name: "Phuket Airport Private Transfer",
    code: "HKT-HTL-PVT",
    startLocation: "HKT APT",
    startLocationFullName: "Phuket International Airport",
    endLocation: "HKT HTL",
    endLocationFullName: "Phuket Beach Hotels",
    country: "Thailand",
    transferType: "Private",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Sedan",
        seatingCapacity: 3,
        luggageCapacity: 2,
        duration: "1h",
        price: 1500
      },
      {
        id: "2",
        type: "SUV",
        seatingCapacity: 5,
        luggageCapacity: 3,
        duration: "1h",
        price: 2000
      },
      {
        id: "3",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "1h",
        price: 2500
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT APT",
        toLocation: "HKT HTL",
        transferMethod: "PVT",
        distance: "50 km",
        duration: "1h"
      }
    ],
    distance: 50,
    duration: "1h",
    enableSightseeing: false,
    description: "Private transfer to beach resort hotels"
  },
  {
    id: "pvt-003",
    name: "Krabi Airport Private Transfer",
    code: "KBV-HTL-PVT",
    startLocation: "KBV APT",
    startLocationFullName: "Krabi International Airport",
    endLocation: "KBV HTL",
    endLocationFullName: "Krabi Beach Hotels",
    country: "Thailand",
    transferType: "Private",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Sedan",
        seatingCapacity: 3,
        luggageCapacity: 2,
        duration: "30m",
        price: 900
      },
      {
        id: "2",
        type: "SUV",
        seatingCapacity: 5,
        luggageCapacity: 3,
        duration: "30m",
        price: 1200
      }
    ],
    routeSegments: [
      {
        fromLocation: "KBV APT",
        toLocation: "KBV HTL",
        transferMethod: "PVT",
        distance: "15 km",
        duration: "30m"
      }
    ],
    distance: 15,
    duration: "30m",
    enableSightseeing: false,
    description: "Private airport to hotel transfer"
  },
  {
    id: "pvt-004",
    name: "Bangkok to Pattaya Private Transfer",
    code: "BKK-PTY-PVT",
    startLocation: "BKK HTL",
    startLocationFullName: "Bangkok City Hotels",
    endLocation: "PTY HTL",
    endLocationFullName: "Pattaya Beach Hotels",
    country: "Thailand",
    transferType: "Private",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Sedan",
        seatingCapacity: 3,
        luggageCapacity: 2,
        duration: "2h 30m",
        price: 2800
      },
      {
        id: "2",
        type: "SUV",
        seatingCapacity: 5,
        luggageCapacity: 3,
        duration: "2h 30m",
        price: 3500
      },
      {
        id: "3",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "2h 30m",
        price: 4200
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK HTL",
        toLocation: "PTY HTL",
        transferMethod: "PVT",
        distance: "150 km",
        duration: "2h 30m"
      }
    ],
    distance: 150,
    duration: "2h 30m",
    enableSightseeing: false,
    description: "Direct private transfer to beach destination"
  },
  {
    id: "pvt-005",
    name: "Phuket to Krabi Private Transfer",
    code: "HKT-KBV-PVT",
    startLocation: "HKT HTL",
    startLocationFullName: "Phuket Hotels",
    endLocation: "KBV HTL",
    endLocationFullName: "Krabi Hotels",
    country: "Thailand",
    transferType: "Private",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "SUV",
        seatingCapacity: 5,
        luggageCapacity: 3,
        duration: "3h",
        price: 4500
      },
      {
        id: "2",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "3h",
        price: 5500
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT HTL",
        toLocation: "KBV HTL",
        transferMethod: "PVT",
        distance: "170 km",
        duration: "3h"
      }
    ],
    distance: 170,
    duration: "3h",
    enableSightseeing: false,
    description: "Inter-province private transfer"
  },

  // ============ SIC (SHARED) TRANSFERS ============
  // Shared/Seat-in-Coach routes
  {
    id: "sic-001",
    name: "Bangkok Airport Shared Transfer",
    code: "BKK-CTY-SIC",
    startLocation: "BKK APT",
    startLocationFullName: "Suvarnabhumi Airport",
    endLocation: "BKK HTL",
    endLocationFullName: "Bangkok City Hotels",
    country: "Thailand",
    transferType: "SIC",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "1h 15m",
        price: 350
      },
      {
        id: "2",
        type: "Coach",
        seatingCapacity: 40,
        luggageCapacity: 20,
        duration: "1h 30m",
        price: 250
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK APT",
        toLocation: "BKK HTL",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "1h 15m"
      }
    ],
    distance: 35,
    duration: "1h 15m",
    enableSightseeing: false,
    description: "Shared airport transfer with multiple hotel stops"
  },
  {
    id: "sic-002",
    name: "Phuket Airport Shared Transfer",
    code: "HKT-HTL-SIC",
    startLocation: "HKT APT",
    startLocationFullName: "Phuket International Airport",
    endLocation: "HKT HTL",
    endLocationFullName: "Phuket Beach Hotels",
    country: "Thailand",
    transferType: "SIC",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "1h 30m",
        price: 450
      },
      {
        id: "2",
        type: "Coach",
        seatingCapacity: 40,
        luggageCapacity: 20,
        duration: "1h 45m",
        price: 320
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT APT",
        toLocation: "HKT HTL",
        transferMethod: "SIC",
        distance: "50 km",
        duration: "1h 30m"
      }
    ],
    distance: 50,
    duration: "1h 30m",
    enableSightseeing: false,
    description: "Budget-friendly shared transfer to beach hotels"
  },
  {
    id: "sic-003",
    name: "Bangkok to Pattaya Shared Coach",
    code: "BKK-PTY-SIC",
    startLocation: "BKK HTL",
    startLocationFullName: "Bangkok City Hotels",
    endLocation: "PTY HTL",
    endLocationFullName: "Pattaya Beach Hotels",
    country: "Thailand",
    transferType: "SIC",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Coach",
        seatingCapacity: 40,
        luggageCapacity: 20,
        duration: "3h 30m",
        price: 650
      },
      {
        id: "2",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "3h",
        price: 850
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK HTL",
        toLocation: "PTY HTL",
        transferMethod: "SIC",
        distance: "150 km",
        duration: "3h 30m"
      }
    ],
    distance: 150,
    duration: "3h 30m",
    enableSightseeing: false,
    description: "Daily scheduled shared service to Pattaya"
  },
  {
    id: "sic-004",
    name: "Krabi to Koh Samui Ferry Connection (SIC)",
    code: "KBV-KSM-SIC",
    startLocation: "KBV HTL",
    startLocationFullName: "Krabi Hotels",
    endLocation: "KOH Samui HTL",
    endLocationFullName: "Koh Samui Hotels",
    country: "Thailand",
    transferType: "SIC",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Ferry",
        seatingCapacity: 100,
        luggageCapacity: 50,
        duration: "4h 30m",
        price: 950
      }
    ],
    routeSegments: [
      {
        fromLocation: "KBV HTL",
        toLocation: "Donsak Pier",
        transferMethod: "SIC",
        distance: "180 km",
        duration: "3h"
      },
      {
        fromLocation: "Donsak Pier",
        toLocation: "KOH Samui HTL",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "1h 30m"
      }
    ],
    distance: 215,
    duration: "4h 30m",
    enableSightseeing: false,
    description: "Combined road and ferry shared transfer"
  },
  {
    id: "sic-005",
    name: "Phi Phi Islands Shared Ferry",
    code: "HKT-PHI-SIC",
    startLocation: "HKT HTL",
    startLocationFullName: "Phuket Hotels",
    endLocation: "PHI PHI",
    endLocationFullName: "Phi Phi Islands",
    country: "Thailand",
    transferType: "SIC",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Ferry",
        seatingCapacity: 100,
        luggageCapacity: 50,
        duration: "2h 30m",
        price: 750
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT HTL",
        toLocation: "Ao Po Pier",
        transferMethod: "SIC",
        distance: "40 km",
        duration: "30m"
      },
      {
        fromLocation: "Ao Po Pier",
        toLocation: "PHI PHI",
        transferMethod: "SIC",
        distance: "35 km",
        duration: "2h"
      }
    ],
    distance: 75,
    duration: "2h 30m",
    enableSightseeing: false,
    description: "Popular island excursion ferry service"
  },

  // ============ ONE-WAY ROUTES (Updated) ============
  {
    id: "ow-001",
    name: "Phuket Airport to Hotel",
    code: "HKT-APT-HTL-OW",
    startLocation: "HKT APT",
    startLocationFullName: "Phuket International Airport",
    endLocation: "HKT HTL",
    endLocationFullName: "Phuket Hotel",
    country: "Thailand",
    transferType: "One-Way",
    status: "active",
    transportTypes: [
      {
        id: "1",
        type: "Sedan",
        seatingCapacity: 3,
        luggageCapacity: 2,
        duration: "1h",
        price: 800
      },
      {
        id: "2",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "1h",
        price: 1200
      }
    ],
    routeSegments: [
      {
        fromLocation: "HKT APT",
        toLocation: "HKT HTL",
        transferMethod: "PVT",
        distance: "50 km",
        duration: "1h"
      }
    ],
    distance: 50,
    duration: "1h",
    enableSightseeing: false
  },

  // ============ ROUND-TRIP ROUTES (Updated) ============
  {
    id: "rt-001",
    name: "Bangkok Airport Round Trip",
    code: "BKK-APT-RTN",
    startLocation: "BKK APT",
    startLocationFullName: "Suvarnabhumi Airport",
    endLocation: "BKK APT",
    endLocationFullName: "Suvarnabhumi Airport",
    country: "Thailand",
    transferType: "Round-Trip",
    status: "active",
    intermediateStops: [
      {
        id: "stop-1",
        locationCode: "BKK HTL",
        fullName: "Bangkok Hotel",
        transferMethod: "PVT"
      }
    ],
    transportTypes: [
      {
        id: "1",
        type: "Sedan",
        seatingCapacity: 3,
        luggageCapacity: 2,
        duration: "1h 30m",
        price: 1800
      },
      {
        id: "2",
        type: "Van",
        seatingCapacity: 9,
        luggageCapacity: 5,
        duration: "1h 30m",
        price: 2400
      }
    ],
    routeSegments: [
      {
        fromLocation: "BKK APT",
        toLocation: "BKK HTL",
        transferMethod: "PVT",
        distance: "35 km",
        duration: "45m"
      },
      {
        fromLocation: "BKK HTL",
        toLocation: "BKK APT",
        transferMethod: "PVT",
        distance: "35 km",
        duration: "45m"
      }
    ],
    distance: 70,
    duration: "1h 30m",
    enableSightseeing: false
  }
];

// Export aliases for compatibility with different imports
export const mockTransportRoutes = transportRoutes;
export const initialRoutes = transportRoutes;
