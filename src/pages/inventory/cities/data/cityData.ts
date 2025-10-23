
export interface City {
  id: number;
  name: string;
  country: string;  // This should match the country ID as string
  region: string;
  hasAirport: boolean;
  isPopular: boolean;
  status: "active" | "disabled";
}

// Initial data for cities
export const initialCities: City[] = [
  { id: 1, name: 'Bangkok', country: 'Thailand', region: 'Central', hasAirport: true, isPopular: true, status: 'active' },
  { id: 2, name: 'Phuket', country: 'Thailand', region: 'South', hasAirport: true, isPopular: true, status: 'active' },
  { id: 3, name: 'Chiang Mai', country: 'Thailand', region: 'North', hasAirport: true, isPopular: true, status: 'active' },
  { id: 4, name: 'Pattaya', country: 'Thailand', region: 'East', hasAirport: false, isPopular: true, status: 'active' },
  { id: 5, name: 'Dubai', country: 'UAE', region: 'Dubai', hasAirport: true, isPopular: true, status: 'active' },
  { id: 6, name: 'Abu Dhabi', country: 'UAE', region: 'Abu Dhabi', hasAirport: true, isPopular: false, status: 'active' },
  { id: 7, name: 'Sharjah', country: 'UAE', region: 'Sharjah', hasAirport: true, isPopular: false, status: 'disabled' },
  { id: 8, name: 'Ajman', country: 'UAE', region: 'Ajman', hasAirport: false, isPopular: false, status: 'disabled' },
  { id: 9, name: 'Hua Hin', country: 'Thailand', region: 'Central', hasAirport: false, isPopular: false, status: 'active' },
  { id: 10, name: 'Krabi', country: 'Thailand', region: 'South', hasAirport: true, isPopular: true, status: 'active' },
  { id: 11, name: 'Koh Samui', country: 'Thailand', region: 'South', hasAirport: true, isPopular: true, status: 'active' },
  { id: 12, name: 'Koh Phangan', country: 'Thailand', region: 'South', hasAirport: false, isPopular: false, status: 'active' },
  
  // Additional cities for better transport route coverage
  { id: 13, name: 'Phi Phi Islands', country: 'Thailand', region: 'South', hasAirport: false, isPopular: true, status: 'active' },
  { id: 14, name: 'Koh Yao Yai', country: 'Thailand', region: 'South', hasAirport: false, isPopular: false, status: 'active' },
  { id: 15, name: 'Rayong', country: 'Thailand', region: 'East', hasAirport: false, isPopular: false, status: 'active' },
  { id: 16, name: 'Kanchanaburi', country: 'Thailand', region: 'West', hasAirport: false, isPopular: false, status: 'active' },
  { id: 17, name: 'Ayutthaya', country: 'Thailand', region: 'Central', hasAirport: false, isPopular: false, status: 'active' },
  
  // UAE additional cities
  { id: 18, name: 'Fujairah', country: 'UAE', region: 'Fujairah', hasAirport: true, isPopular: false, status: 'active' },
  { id: 19, name: 'Ras Al Khaimah', country: 'UAE', region: 'Ras Al Khaimah', hasAirport: true, isPopular: false, status: 'active' },
  { id: 20, name: 'Umm Al Quwain', country: 'UAE', region: 'Umm Al Quwain', hasAirport: false, isPopular: false, status: 'active' },
];
