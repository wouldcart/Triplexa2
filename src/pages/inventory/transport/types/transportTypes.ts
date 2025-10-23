
export interface TransportType {
  id: string;
  name: string;
  category: string;
  seatingCapacity: number;
  luggageCapacity: number;
  active: boolean;
}

export interface LocationCode {
  id: string;
  code: string;
  fullName: string;
  category: 'airport' | 'hotel' | 'pier' | 'other';
  country: string;
  city: string;
  status: 'active' | 'inactive';  // This is a union type restricted to these two values
  notes?: string;
  latitude?: string;
  longitude?: string;
  name?: string; // Added name property
}

export interface Stop {
  id: string;
  locationCode: string;
  fullName: string;
  transferMethod?: string; // Added for specifying transfer method (PVT, SIC, etc)
}

export interface TransportRouteType {
  id: string;
  type: string;
  vehicleName?: string;
  seatingCapacity: number;
  luggageCapacity: number;
  duration: string;
  price: number;
}

export interface SightseeingOption {
  id: string;
  location: string;
  adultPrice: number;
  childPrice: number;
  additionalCharges: number;
  description?: string;
  notes?: string;
}

export interface RouteSegment {
  fromLocation: string;
  toLocation: string;
  transferMethod?: string;
  distance?: string;    // Added missing property
  duration?: string;    // Added missing property
}

export interface TransportRoute {
  id: string;
  code: string;
  name: string;
  country: string;
  notes?: string;
  transferType: 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route' | 'Private' | 'SIC'; // Updated with new types
  startLocation: string;
  startLocationFullName?: string;
  endLocation: string;
  endLocationFullName?: string;
  intermediateStops?: Stop[];
  transportTypes: TransportRouteType[];
  enableSightseeing: boolean;
  sightseeingOptions?: SightseeingOption[];
  
  // Status field - supporting both legacy string and new boolean format
  status: 'active' | 'inactive' | boolean;
  isActive?: boolean; // New boolean status field from database migration
  
  // User tracking fields
  createdBy?: string;      // User ID who created this route
  updatedBy?: string;      // User ID who last updated this route
  createdByUser?: string;  // Database field name (UUID reference to auth.users)
  updatedByUser?: string;  // Database field name (UUID reference to auth.users)
  
  // Timestamps
  createdAt?: string | Date;
  updatedAt?: string | Date;
  
  routePath?: string[];
  routeSegments?: RouteSegment[];
  
  // Adding the missing properties referenced in TransportRoutesTable.tsx
  origin?: string;          // For backward compatibility
  destination?: string;     // For backward compatibility
  vehicleType?: string;     // For backward compatibility
  price?: number;           // For backward compatibility
  roundTripPrice?: number;
  distance?: number;        // Changed from string to number
  duration?: string;
  description?: string;
  
  // For backward compatibility with original data
  from?: string;
  to?: string;
  transportType?: string;
}
