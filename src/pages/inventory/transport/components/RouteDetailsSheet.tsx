
import React from 'react';
import { TransportRoute } from '../types/transportTypes';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MapPin } from 'lucide-react';
import { formatCurrency, formatPriceForCountry } from '../utils/currencyUtils';

interface RouteDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  route: TransportRoute | null;
  onEdit: (route: TransportRoute) => void;
  routeIndex: number;
  formatRouteId?: (routeId: string, index: number) => string; // Added this prop
}

const RouteDetailsSheet: React.FC<RouteDetailsSheetProps> = ({
  isOpen,
  onClose,
  route,
  onEdit,
  routeIndex,
  formatRouteId
}) => {
  if (!route) return null;
  
  // Get origin and destination helper functions
  const getOrigin = (route: TransportRoute): string => {
    return route.origin || route.startLocationFullName || route.startLocation;
  };
  
  const getDestination = (route: TransportRoute): string => {
    return route.destination || route.endLocationFullName || route.endLocation;
  };
  
  // Get price helper function
  const getPrice = (route: TransportRoute): number => {
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
  
  // Format route ID using the provided function or a default implementation
  const formatRouteIdSafe = (routeId: string, index: number): string => {
    if (formatRouteId) {
      return formatRouteId(routeId, index);
    }
    
    // Default implementation if formatRouteId is not provided
    const numericId = routeId.toString().replace(/\D/g, '');
    return numericId;
  };
  
  // Get status badge
  const getStatusBadge = (status: string | boolean) => {
    // Convert boolean status to string if needed
    const statusStr = typeof status === 'boolean' 
      ? (status ? 'active' : 'inactive') 
      : status;
    
    switch (statusStr) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-500">Disabled</Badge>;
      default:
        return <Badge variant="outline">{statusStr}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="md:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>Route Details</SheetTitle>
          <SheetDescription>
            View detailed information about this transport route.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Route ID</h3>
            <p className="text-sm font-mono bg-muted px-2 py-1 rounded-md inline-block">
              {formatRouteIdSafe(route.id, routeIndex)}
            </p>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Route Code</h3>
            <p className="text-sm text-gray-500">{route.code}</p>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Origin</h3>
            <p className="text-sm text-gray-500">{getOrigin(route)}</p>
          </div>
          
          {route.intermediateStops && route.intermediateStops.length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Intermediate Stops</h3>
              <div className="space-y-1">
                {route.intermediateStops.map((stop, index) => (
                  <div key={stop.id} className="text-sm text-gray-500 flex items-center">
                    <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full inline-flex items-center justify-center mr-2 text-xs">
                      {index + 1}
                    </span>
                    {stop.fullName}
                    {stop.transferMethod && (
                      <span className="ml-2 text-xs italic">({stop.transferMethod})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Destination</h3>
            <p className="text-sm text-gray-500">{getDestination(route)}</p>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Vehicle Types</h3>
            <div className="space-y-2">
              {route.transportTypes && route.transportTypes.map((type, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                  <div>
                    <p className="text-sm">{type.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.seatingCapacity} seats / {type.luggageCapacity} luggage
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {route.country 
                      ? formatPriceForCountry(type.price, route.country) 
                      : formatCurrency(type.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Price (one-way)</h3>
            <p className="text-sm text-gray-500">
              {route.country 
                ? formatPriceForCountry(getPrice(route), route.country) 
                : formatCurrency(getPrice(route))}
            </p>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Round Trip Price</h3>
            <p className="text-sm text-gray-500">
              {route.country 
                ? formatPriceForCountry(route.roundTripPrice || getPrice(route) * 1.8, route.country) 
                : formatCurrency(route.roundTripPrice || getPrice(route) * 1.8)}
            </p>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Distance</h3>
            <p className="text-sm text-gray-500">{route.distance || 'N/A'}</p>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Duration</h3>
            <p className="text-sm text-gray-500">
              {route.duration || 
               (route.transportTypes && route.transportTypes[0]?.duration) || 
               'N/A'}
            </p>
          </div>
          
          {route.country && (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Country</h3>
              <p className="text-sm text-gray-500">{route.country}</p>
            </div>
          )}
          
          {route.transferType && (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Transfer Type</h3>
              <p className="text-sm text-gray-500">{route.transferType}</p>
            </div>
          )}
          
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Description</h3>
            <p className="text-sm text-gray-500">{route.description || "No description provided."}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Status:</h3>
            {getStatusBadge(route.status)}
          </div>
        </div>
        
        <SheetFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="sm:w-auto w-full">Close</Button>
          </SheetClose>
          <Button onClick={() => {
            onClose();
            if (route) onEdit(route);
          }} className="sm:w-auto w-full">
            <Edit className="h-4 w-4 mr-2" />
            Edit Route
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RouteDetailsSheet;
