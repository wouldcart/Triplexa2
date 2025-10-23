
import { TransportRoute } from "../types/transportTypes";

/**
 * Formats a route ID by removing "00" prefix from the first 5 routes
 * @param routeId The route ID to format
 * @param index The index of the route in the list
 * @returns The formatted route ID
 */
export const formatRouteId = (routeId: string, index: number): string => {
  const numericId = routeId.toString().replace(/\D/g, '');
  
  // For the first 5 routes, remove "00" prefix if present
  if (index < 5 && numericId.startsWith('00')) {
    return numericId.substring(2); // Remove first two characters if they are "00"
  }
  
  return numericId;
};

/**
 * Gets the price of a transport route
 * @param route The transport route
 * @returns The price of the route
 */
export const getPrice = (route: TransportRoute): number => {
  // First try to get the price directly from the route
  if (route.price !== undefined) {
    return route.price;
  }
  
  // Then try to get it from the first transport type
  if (route.transportTypes && route.transportTypes.length > 0) {
    return route.transportTypes[0].price;
  }
  
  // Default to 0 if no price is available
  return 0;
};

/**
 * Gets the vehicle type of a transport route
 * @param route The transport route
 * @returns The vehicle type of the route
 */
export const getVehicleType = (route: TransportRoute): string => {
  // First try to get the vehicle type directly from the route
  if (route.vehicleType) {
    return route.vehicleType;
  }
  
  // Then try to get it from the first transport type
  if (route.transportTypes && route.transportTypes.length > 0) {
    return route.transportTypes[0].type;
  }
  
  // Default to empty string if no vehicle type is available
  return 'N/A';
};

/**
 * Gets the origin location of a transport route
 * @param route The transport route
 * @returns The origin location of the route
 */
export const getOrigin = (route: TransportRoute): string => {
  return route.origin || route.startLocationFullName || route.startLocation;
};

/**
 * Gets the destination location of a transport route
 * @param route The transport route
 * @returns The destination location of the route
 */
export const getDestination = (route: TransportRoute): string => {
  return route.destination || route.endLocationFullName || route.endLocation;
};
