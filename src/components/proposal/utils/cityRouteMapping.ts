
import { City } from '@/hooks/useCitiesData';
import { TransportRoute } from '@/pages/inventory/transport/types/transportTypes';

// Mapping of location codes to standardized city names
export const locationCodeToCityMap: { [key: string]: string } = {
  // Thailand locations
  'BKK APT': 'Bangkok',
  'BKK': 'Bangkok', 
  'Bangkok': 'Bangkok',
  'DMK APT': 'Bangkok',
  'Suvarnabhumi Airport': 'Bangkok',
  'Don Mueang Airport': 'Bangkok',
  
  'HKT APT': 'Phuket',
  'HKT': 'Phuket',
  'Phuket': 'Phuket',
  'Phuket Airport': 'Phuket',
  
  'CNX APT': 'Chiang Mai',
  'CNX': 'Chiang Mai',
  'Chiang Mai': 'Chiang Mai',
  'Chiang Mai Airport': 'Chiang Mai',
  
  'Pattaya': 'Pattaya',
  'U-Tapao Airport': 'Pattaya',
  'UTP APT': 'Pattaya',
  
  'Hua Hin': 'Hua Hin',
  'Krabi': 'Krabi',
  'KBV APT': 'Krabi',
  'Krabi Airport': 'Krabi',
  
  'USM APT': 'Koh Samui',
  'Koh Samui': 'Koh Samui',
  'Samui Airport': 'Koh Samui',
  
  'Koh Phangan': 'Koh Phangan',
  'Phi Phi Islands': 'Krabi', // Phi Phi is accessed via Krabi
  'Koh Yao Yai': 'Phuket', // Koh Yao Yai is accessed via Phuket
  
  // UAE locations
  'DXB APT': 'Dubai',
  'DXB': 'Dubai',
  'Dubai': 'Dubai',
  'Dubai Airport': 'Dubai',
  
  'AUH APT': 'Abu Dhabi',
  'AUH': 'Abu Dhabi',
  'Abu Dhabi': 'Abu Dhabi',
  'Abu Dhabi Airport': 'Abu Dhabi',
  
  'SHJ APT': 'Sharjah',
  'Sharjah': 'Sharjah',
  'Sharjah Airport': 'Sharjah',
  
  'Ajman': 'Ajman',
};

export const getCityNameFromLocationCode = (locationCode: string): string => {
  // Direct match first
  if (locationCodeToCityMap[locationCode]) {
    return locationCodeToCityMap[locationCode];
  }
  
  // Try to find partial matches
  const normalizedCode = locationCode.toLowerCase().trim();
  
  for (const [code, city] of Object.entries(locationCodeToCityMap)) {
    if (code.toLowerCase().includes(normalizedCode) || 
        normalizedCode.includes(code.toLowerCase())) {
      return city;
    }
  }
  
  // If no match found, return the original code
  return locationCode;
};

export const getRouteCities = (route: TransportRoute): string[] => {
  const startCity = getCityNameFromLocationCode(route.startLocation);
  const endCity = getCityNameFromLocationCode(route.endLocation);
  
  return [startCity, endCity];
};

export const isRouteRelevantForCities = (route: TransportRoute, queryCities: string[]): boolean => {
  const routeCities = getRouteCities(route);
  
  // Check if any of the route cities match query cities
  return routeCities.some(routeCity => 
    queryCities.some(queryCity => 
      routeCity.toLowerCase() === queryCity.toLowerCase() ||
      routeCity.toLowerCase().includes(queryCity.toLowerCase()) ||
      queryCity.toLowerCase().includes(routeCity.toLowerCase())
    )
  );
};

export const getConnectingRoutes = (routes: TransportRoute[], queryCities: string[]): TransportRoute[] => {
  return routes.filter(route => {
    const routeCities = getRouteCities(route);
    
    // Include routes that connect any two cities in the query
    const hasRelevantConnection = routeCities.some(routeCity =>
      queryCities.some(queryCity => 
        routeCity.toLowerCase() === queryCity.toLowerCase()
      )
    );
    
    // Also include routes that serve as connections between query cities
    const connectsQueryCities = routeCities.every(routeCity =>
      queryCities.some(queryCity =>
        routeCity.toLowerCase() === queryCity.toLowerCase()
      )
    );
    
    return hasRelevantConnection || connectsQueryCities;
  });
};
