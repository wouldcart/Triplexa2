
import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TransportRoute } from '../types/transportTypes';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { formatCurrency, formatPriceForCountry } from '../utils/currencyUtils';
import { Map, Pin, Calendar, Clock, Route, Compass, ArrowRight, Info, Truck, MapPin } from 'lucide-react';
import Badge from './Badge';
import { getTransportRouteDetails, type TransportRouteDetails } from '@/services/transportRouteDetailsService';

interface ViewRouteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  route: TransportRoute | null;
  onEdit: () => void;
}

const ViewRouteSheet: React.FC<ViewRouteSheetProps> = ({ isOpen, onClose, route, onEdit }) => {
  const hasRoute = !!route;
  
  // Legacy flags no longer used in read-only view
  // const hasRouteSegments = route.routeSegments && route.routeSegments.length > 0;
  // const hasIntermediateStops = route.intermediateStops && route.intermediateStops.length > 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeDetails, setRouteDetails] = useState<TransportRouteDetails | null>(null);

  // Convert status to a normalized string for the Badge component
  const getStatusString = (status: unknown): 'active' | 'inactive' => {
    if (typeof status === 'boolean') {
      return status ? 'active' : 'inactive';
    }
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      return s === 'active' ? 'active' : 'inactive';
    }
    return 'inactive';
  };
  
  useEffect(() => {
    const run = async () => {
      setError(null);
      setRouteDetails(null);
      if (!route?.id || !isOpen) return;
      setLoading(true);
      try {
        const details = await getTransportRouteDetails(route.id);
        setRouteDetails(details);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [route?.id, isOpen]);

  const formatCoords = (coords: any): string => {
    if (!coords || typeof coords !== 'object') return 'N/A';
    const lat = (coords as any).lat ?? (coords as any).latitude;
    const lng = (coords as any).lng ?? (coords as any).longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    return 'N/A';
  };

  // Helpers: parse duration strings like "2h 30m" or "150m" to minutes, then format back
  const parseDurationToMinutes = (str: unknown): number => {
    if (typeof str !== 'string') return 0;
    const s = str.trim().toLowerCase();
    let total = 0;
    const hMatch = s.match(/(\d+)\s*h/);
    const mMatch = s.match(/(\d+)\s*m/);
    if (hMatch) total += parseInt(hMatch[1], 10) * 60;
    if (mMatch) total += parseInt(mMatch[1], 10);
    if (!hMatch && !mMatch) {
      const num = parseFloat(s);
      if (!isNaN(num)) total += num; // assume minutes
    }
    return total;
  };

  const formatMinutesToHM = (minutes: number): string => {
    if (!minutes || minutes <= 0) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const totalDurationMinutes = Array.isArray(routeDetails?.vehicleTypes)
    ? routeDetails!.vehicleTypes.reduce((sum: number, v: any) => sum + parseDurationToMinutes(v?.duration), 0)
    : 0;

  // Extract (lat,lng) consistently
  const coordPair = (obj: any): { lat: number; lng: number } | null => {
    if (!obj || typeof obj !== 'object') return null;
    const lat = obj.lat ?? obj.latitude;
    const lng = obj.lng ?? obj.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    return null;
  };

  // Haversine distance in km (rounded to nearest km)
  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return Math.round(R * c);
  };

  // Compute distance: Multi-Stop sum, else Start-End (Round-trip multiplies by 2)
  const computeDistanceKm = (): string => {
    const start = coordPair(routeDetails?.start_coordinates);
    const end = coordPair(routeDetails?.end_coordinates);
    const stops = Array.isArray(routeDetails?.stops) ? routeDetails!.stops : [];
    const stopCoords: Array<{ lat: number; lng: number }> = stops
      .map((s: any) => coordPair(s?.coordinates))
      .filter((p: any) => p !== null) as Array<{ lat: number; lng: number }>;

    // Multi-Stop: need start, each stop, and end to form legs
    if (stopCoords.length > 0) {
      if (!start || !end) return 'N/A';
      const points = [start, ...stopCoords, end];
      // Validate all points
      if (points.some(p => !p)) return 'N/A';
      const sum = points.reduce((acc, curr, idx) => {
        if (idx === 0) return 0;
        return acc + haversineKm(points[idx - 1], curr);
      }, 0);
      return `${sum} km`;
    }

    // Basic Start-End distance
    if (start && end) {
      let dist = haversineKm(start, end);
      const tt = routeDetails?.transfer_type?.toLowerCase() || '';
      const isRoundTrip = tt.includes('round') || tt.includes('return') || tt.includes('two-way');
      if (isRoundTrip) dist = dist * 2;
      return `${dist} km`;
    }
    return 'N/A';
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[700px] overflow-y-auto">
        <SheetHeader className="pb-2 mb-2 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-xl">
                {routeDetails
                  ? `${routeDetails.start_location_full_name || routeDetails.start_location || 'N/A'} → ${routeDetails.end_location_full_name || routeDetails.end_location || 'N/A'}`
                  : (route?.name || 'Transport Route')}
                <Badge status={getStatusString(routeDetails?.status ?? (route?.status ?? 'inactive'))} className="ml-2" />
              </span>
            </SheetTitle>
            {/* Export button removed from here */}
          </div>
          <div className="flex justify-between items-center">
            <SheetDescription className="flex items-center">
              Transport route details
            </SheetDescription>
            <div className="text-sm font-medium text-muted-foreground">
              {routeDetails?.route_code && (
                <span className="font-mono">Code: {routeDetails.route_code}</span>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <div className="py-4 space-y-6">
          {loading && hasRoute && (
            <div className="p-4 text-sm text-muted-foreground">Loading route…</div>
          )}
          {error && hasRoute && (
            <div className="p-4 text-sm text-destructive">{error}</div>
          )}
          {!loading && !error && hasRoute && routeDetails && (
            <>
            {/* Heading: Route Name or Full Name */}
            <h1 className="text-2xl font-bold mb-4">
              {routeDetails.route_name 
                || (routeDetails.start_location_full_name && routeDetails.end_location_full_name 
                      ? `${routeDetails.start_location_full_name} → ${routeDetails.end_location_full_name}`
                      : 'Transport Route Details')}
            </h1>
            {/* Quick summary */}
            <div className="rounded-lg bg-muted p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Country</p>
                  <p className="font-medium">{routeDetails.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transfer Type</p>
                  <p className="font-medium">{routeDetails.transfer_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium">{formatMinutesToHM(totalDurationMinutes)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Distance</p>
                  <p className="font-medium">{computeDistanceKm()}</p>
                </div>
              </div>
            </div>

          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Route Information
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Compass className="h-4 w-4" />
                  Route Code
                </div>
                <p className="font-medium">{routeDetails.route_code || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Map className="h-4 w-4" />
                  Country
                </div>
                <p className="font-medium">{routeDetails.country || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Transfer Type
                </div>
                <p className="font-medium">{routeDetails.transfer_type || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Notes
                </div>
                <p className="font-medium">{routeDetails.notes || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Route Segments removed in View per spec */}
          
          {/* Locations */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Locations
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded mr-3">
                  <Pin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Location</p>
                  <p>{routeDetails.start_location_full_name || routeDetails.start_location || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{routeDetails.start_location || ''}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-red-100 p-2 rounded mr-3">
                  <Pin className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Location</p>
                  <p>{routeDetails.end_location_full_name || routeDetails.end_location || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{routeDetails.end_location || ''}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transport Details & Pricing - Updated to show all vehicle types prominently */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Transport Options
            </h3>
            
            <div className="overflow-x-auto">
              {(Array.isArray(routeDetails.vehicleTypes) && routeDetails.vehicleTypes.length > 0) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transport Type / Vehicle</TableHead>
                      <TableHead className="text-center">Capacity</TableHead>
                      <TableHead className="text-center">Duration</TableHead>
                      <TableHead className="text-center">Luggage</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeDetails.vehicleTypes.map((v: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {(v.transport_type || 'N/A')}
                          {v.vehicle_name ? ` / ${v.vehicle_name}` : ''}
                        </TableCell>
                        <TableCell className="text-center">{v.seating_capacity ?? 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            {v.duration || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const match = Array.isArray(routeDetails.luggageCapacity)
                              ? routeDetails.luggageCapacity.find((l: any) => l.transport_type === v.transport_type)
                              : undefined;
                            return match?.bags != null ? String(match.bags) : 'N/A';
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof v?.price === 'number'
                            ? (routeDetails.country 
                                ? formatPriceForCountry(v.price, routeDetails.country) 
                                : formatCurrency(v.price))
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">No transport options are available for this route.</div>
              )}
            </div>
          </div>
          

          
          {/* Sightseeing Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Sightseeing Options
            </h3>
            <div className="overflow-x-auto">
              {(Array.isArray(routeDetails.sightseeing) && routeDetails.sightseeing.length > 0) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sightseeing Location</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Adult Price</TableHead>
                      <TableHead className="text-right">Child Price</TableHead>
                      <TableHead className="text-right">Additional Charges</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeDetails.sightseeing.map((option: any) => (
                      <TableRow key={option.id}>
                        <TableCell className="font-medium">{option.location || 'N/A'}</TableCell>
                        <TableCell>{option.description || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {routeDetails.country
                            ? formatPriceForCountry(option.adult_price ?? 0, routeDetails.country)
                            : formatCurrency(option.adult_price ?? 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {routeDetails.country
                            ? formatPriceForCountry(option.child_price ?? 0, routeDetails.country)
                            : formatCurrency(option.child_price ?? 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {routeDetails.country
                            ? formatPriceForCountry(option.additional_charges ?? 0, routeDetails.country)
                            : formatCurrency(option.additional_charges ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">No sightseeing options available for this route.</div>
              )}
            </div>
          </div>
          
          {/* Intermediate Stops */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Intermediate Stops
            </h3>
            <div className="overflow-x-auto">
              {(() => {
                const displayedStops = Array.isArray(routeDetails.stops)
                  ? routeDetails.stops.filter((s: any) => {
                      const st = s.status;
                      if (st === undefined || st === null) return true;
                      if (typeof st === 'boolean') return st;
                      if (typeof st === 'string') return st.toLowerCase() === 'active';
                      return true;
                    })
                  : [];
                return displayedStops.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stop Order</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Transfer Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedStops.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.stop_order ?? 'N/A'}</TableCell>
                        <TableCell>{s.location_code || s.location || 'N/A'}</TableCell>
                        <TableCell>{s.full_name || s.location_details?.full_name || 'N/A'}</TableCell>
                        <TableCell>{s.coordinates ? formatCoords(s.coordinates) : 'N/A'}</TableCell>
                        <TableCell>{s.transfer_method_notes ?? s.notes ?? 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">No intermediate stops for this route.</div>
              );})()}
            </div>
          </div>
          
          {/* Additional Information */}
          {routeDetails?.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Description
              </h3>
              <p className="text-sm">{routeDetails.description}</p>
            </div>
          )}
          
          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Notes
            </h3>
            <p className="text-sm">{routeDetails?.notes || 'N/A'}</p>
          </div>
          </>
          )}
        </div>
        
        <SheetFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} className="sm:w-auto w-full">
            Back to Routes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ViewRouteSheet;
