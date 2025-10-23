
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Route, MapPin, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TransportRoute, TransportType, LocationCode, SightseeingOption, Stop } from '@/pages/inventory/transport/types/transportTypes';
import { Country } from '@/pages/inventory/countries/types/country';
import { Sightseeing } from '@/types/sightseeing';
import { loadSightseeingData } from '@/pages/inventory/sightseeing/services/storageService';
import { ValidatedInput, ValidatedNumberInput, ValidatedTextarea } from './ValidatedInput';
import { useRouteForm } from '../hooks/useRouteForm';
import { locationResolutionService } from '@/services/locationResolutionService';
import type { CompleteTransportRoute } from '@/services/comprehensiveTransportService';
import { supabase } from '@/lib/supabaseClient';
import { getTransportRouteDetails } from '@/services/transportRouteDetailsService';

interface EditRouteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routeData: Partial<TransportRoute>) => void;
  route: CompleteTransportRoute | null;
  countries: Country[];
  locations: LocationCode[];
  transportTypes: TransportType[];
}

const EditRouteSheet: React.FC<EditRouteSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  route,
  countries,
  locations,
  transportTypes
}) => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [sightseeingLocations, setSightseeingLocations] = useState<Sightseeing[]>([]);
  
  // New state for real-time location name display
  const [startLocationName, setStartLocationName] = useState<string>('');
  const [endLocationName, setEndLocationName] = useState<string>('');
  const [isLoadingStartLocation, setIsLoadingStartLocation] = useState(false);
  const [isLoadingEndLocation, setIsLoadingEndLocation] = useState(false);

  // Helpers to normalize varied data shapes to UI form expectations
  const parseJsonArraySafely = (value: unknown): any[] => {
    try {
      if (Array.isArray(value)) return value as any[];
      if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      }
      if (value && typeof value === 'object') return [value as any];
      return [];
    } catch {
      return [];
    }
  };

  const mapVehicleTypesToUI = (rawVehicleTypes: any[]): any[] => {
    return rawVehicleTypes.map((vt: any, index: number) => ({
      id: String(index + 1),
      type: vt.transport_type ?? vt.type ?? 'N/A',
      vehicleName: vt.vehicle_name ?? vt.vehicleName ?? undefined,
      seatingCapacity: Number(vt.seating_capacity ?? vt.seatingCapacity ?? 0),
      luggageCapacity: Number(vt.luggage_capacity ?? vt.luggageCapacity ?? 0),
      duration: vt.duration ?? '',
      price: Number(vt.price ?? 0),
    }));
  };

  const mapStopsToUI = (stops: any[] = []): any[] => {
    return stops.map((stop: any) => ({
      id: stop.id ?? String(Math.random()),
      locationCode: stop.location_code ?? stop.locationCode ?? '',
      fullName: stop.full_name ?? stop.fullName ?? '',
      transferMethod: stop.transfer_method_notes ?? stop.transferMethod ?? ''
    }));
  };

  const mapSightseeingToUI = (options: any[] = []): any[] => {
    return options.map((opt: any) => ({
      id: opt.id,
      location: opt.location ?? opt.location_code ?? '',
      description: opt.description ?? '',
      adultPrice: Number(opt.adult_price ?? opt.adultPrice ?? 0),
      childPrice: Number(opt.child_price ?? opt.childPrice ?? 0),
      additionalCharges: Number(opt.additional_charges ?? opt.additionalCharges ?? 0)
    }));
  };

  // Allowed transfer types for strict typing
  const allowedTransferTypes = ['One-Way', 'Round-Trip', 'Multi-Stop', 'en route', 'Private', 'SIC'] as const;
  type AllowedTransferType = typeof allowedTransferTypes[number];

  // Sanitize incoming transfer type values to the allowed union
  const sanitizeTransferType = (raw: any): AllowedTransferType => {
    const val = String(raw ?? '').trim();
    return (allowedTransferTypes as readonly string[]).includes(val)
      ? (val as AllowedTransferType)
      : 'One-Way';
  };

  // Convert boolean active flag to status literal
  const toStatusLiteral = (isActive: boolean) => (isActive ? 'active' as const : 'inactive' as const);

  const getInitialData = () => {
    if (!route) return {};

    // Vehicle types can be stored under different keys depending on schema evolution
    const rawVehicleTypes = parseJsonArraySafely(
      (route as any).vehicle_types ?? (route as any).transport_types ?? (route as any).transport_entries
    );

    const normalizedIsActive = typeof (route as any).is_active === 'boolean'
      ? Boolean((route as any).is_active)
      : String((route as any).status || '').toLowerCase() === 'active';

    return {
      id: route.id,
      code: route.route_code || '',
      name: route.route_name || '',
      country: (route as any).country || '',
      transferType: sanitizeTransferType((route as any).transfer_type),
      startLocation: (route as any).start_location || '',
      endLocation: (route as any).end_location || '',
      notes: (route as any).notes || '',
      status: toStatusLiteral(normalizedIsActive),
      isActive: normalizedIsActive,
      intermediateStops: mapStopsToUI(route.intermediate_stops || []),
      transportTypes: mapVehicleTypesToUI(rawVehicleTypes),
      sightseeingOptions: mapSightseeingToUI(route.sightseeing_options || [])
    };
  };

  const { 
    routeData, 
    setRouteData,
    onChange, 
    filteredLocations, 
    filteredSightseeingLocations, 
    routeSegments, 
    validateField, 
    errors, 
  } = useRouteForm(getInitialData(), locations, sightseeingLocations);

  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    const sightseeingData = loadSightseeingData();
    const activeSightseeings = sightseeingData.filter(item => item.status === 'active');
    setSightseeingLocations(activeSightseeings);
  }, []);

  // Fetch full route details for editing when sheet opens
  useEffect(() => {
    const fetchRouteDetails = async () => {
      if (!isOpen || !route?.id) return;
      try {
        const details = await getTransportRouteDetails(route.id);

        const normalizedIsActive = String(details.status || '').toLowerCase() === 'active';
        const vehicleTypes = Array.isArray(details.vehicleTypes) ? details.vehicleTypes : [];
        const stops = Array.isArray(details.stops) ? details.stops : [];
        const sightseeing = Array.isArray(details.sightseeing) ? details.sightseeing : [];

        setRouteData(prev => ({
          ...prev,
          id: details.id,
          code: details.route_code || '',
          name: details.route_name || '',
          notes: details.notes || '',
          country: details.country || '',
          transferType: sanitizeTransferType((details as any).transfer_type),
          startLocation: details.start_location || '',
          endLocation: details.end_location || '',
          startLocationFullName: (details as any).start_location_full_name || '',
          endLocationFullName: (details as any).end_location_full_name || '',
          intermediateStops: mapStopsToUI(stops),
          transportTypes: mapVehicleTypesToUI(vehicleTypes),
          enableSightseeing: !!details.enable_sightseeing,
          sightseeingOptions: mapSightseeingToUI(sightseeing),
          status: toStatusLiteral(normalizedIsActive),
          isActive: normalizedIsActive
        }));
      } catch (error) {
        console.error('Error fetching route for edit:', error);
      }
    };

    fetchRouteDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, route?.id]);

  // Load initial location names when route data is available
  useEffect(() => {
    const loadInitialLocationNames = async () => {
      if (routeData.startLocation) {
        setIsLoadingStartLocation(true);
        try {
          const locationName = await locationResolutionService.getLocationFullName(routeData.startLocation);
          setStartLocationName(locationName || '');
        } catch (error) {
          console.error('Error fetching start location name:', error);
        } finally {
          setIsLoadingStartLocation(false);
        }
      }
      
      if (routeData.endLocation) {
        setIsLoadingEndLocation(true);
        try {
          const locationName = await locationResolutionService.getLocationFullName(routeData.endLocation);
          setEndLocationName(locationName || '');
        } catch (error) {
          console.error('Error fetching end location name:', error);
        } finally {
          setIsLoadingEndLocation(false);
        }
      }
    };

    loadInitialLocationNames();
  }, [routeData.startLocation, routeData.endLocation]);

  // Enhanced onChange function to handle location name resolution
  const handleLocationChange = async (field: string, value: any) => {
    onChange(field, value);
    
    // Handle real-time location name display
    if (field === 'startLocation') {
      if (value) {
        setIsLoadingStartLocation(true);
        try {
          const locationName = await locationResolutionService.getLocationFullName(value);
          setStartLocationName(locationName || '');
          // Also update the form data with the full name
          onChange('startLocationFullName', locationName || '');
        } catch (error) {
          console.error('Error fetching start location name:', error);
          setStartLocationName('');
        } finally {
          setIsLoadingStartLocation(false);
        }
      } else {
        setStartLocationName('');
        onChange('startLocationFullName', '');
      }
    } else if (field === 'endLocation') {
      if (value) {
        setIsLoadingEndLocation(true);
        try {
          const locationName = await locationResolutionService.getLocationFullName(value);
          setEndLocationName(locationName || '');
          // Also update the form data with the full name
          onChange('endLocationFullName', locationName || '');
        } catch (error) {
          console.error('Error fetching end location name:', error);
          setEndLocationName('');
        } finally {
          setIsLoadingEndLocation(false);
        }
      } else {
        setEndLocationName('');
        onChange('endLocationFullName', '');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Normalize values before handing off to save handler
    const cleanedTransportTypes = (routeData.transportTypes || []).map(tt => ({
      ...tt,
      seatingCapacity: Number(tt.seatingCapacity) || 0,
      luggageCapacity: Number(tt.luggageCapacity) || 0,
      price: Number(tt.price) || 0,
      duration: String(tt.duration || '')
    }));

    const cleanedStops = (routeData.intermediateStops || []).map(stop => ({
      ...stop,
      fullName: (stop as any).fullName ?? '',
      transferMethod: (stop as any).transferMethod ?? ''
    }));

    const cleanedSightseeing = (routeData.sightseeingOptions || []).map(opt => ({
      ...opt,
      adultPrice: Number(opt.adultPrice) || 0,
      childPrice: Number(opt.childPrice) || 0,
      additionalCharges: Number(opt.additionalCharges) || 0,
      description: opt.description ?? ''
    }));

    const normalizedStatus = (routeData.status === 'active' || routeData.status === 'inactive')
      ? routeData.status
      : ((routeData as any).isActive ? 'active' : 'inactive');

    const payload = {
      ...routeData,
      transferType: sanitizeTransferType(routeData.transferType as any),
      status: normalizedStatus as 'active' | 'inactive',
      transportTypes: cleanedTransportTypes,
      intermediateStops: cleanedStops,
      sightseeingOptions: cleanedSightseeing,
      // Map UI Notes textarea to description for saving/editing
      description: (routeData as any).notes ?? routeData.description ?? ''
    };
    await onSave(payload);
    setIsSaving(false);
    onClose();
  };

  const onAddStop = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newStop: Stop = { id: `stop-${Date.now()}`, locationCode: '', fullName: '', transferMethod: '' };
    const updatedStops = [...(routeData.intermediateStops || []), newStop];
    setRouteData(prev => ({...prev, intermediateStops: updatedStops}));
  };

  const onRemoveStop = (stopId: string) => {
    const updatedStops = routeData.intermediateStops?.filter(stop => stop.id !== stopId);
    setRouteData(prev => ({...prev, intermediateStops: updatedStops}));
  };

  const onStopChange = (stopId: string, locationCode: string) => {
    const updatedStops = routeData.intermediateStops?.map(stop => 
      stop.id === stopId ? { ...stop, locationCode } : stop
    );
    setRouteData(prev => ({...prev, intermediateStops: updatedStops}));
  };

  const onTransferMethodChange = (index: number, value: string) => {
    const updatedStops = [...(routeData.intermediateStops || [])];
    if (updatedStops[index]) {
      updatedStops[index] = { ...updatedStops[index], transferMethod: value } as Stop;
      setRouteData(prev => ({ ...prev, intermediateStops: updatedStops }));
    }
  };

  const onAddTransportType = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newTransportType = {
      id: `tt-${Date.now()}`,
      type: '',
      seatingCapacity: 0,
      luggageCapacity: 0,
      price: 0,
      duration: ''
    };
    const updatedTransportTypes = [...(routeData.transportTypes || []), newTransportType];
    setRouteData(prev => ({...prev, transportTypes: updatedTransportTypes}));
  };

  const onRemoveTransportType = (typeId: string) => {
    const updatedTransportTypes = routeData.transportTypes?.filter(type => type.id !== typeId);
    setRouteData(prev => ({...prev, transportTypes: updatedTransportTypes}));
  };

  const onTransportTypeChange = (typeId: string, field: string, value: any) => {
    const updatedTransportTypes = routeData.transportTypes?.map(type =>
      type.id === typeId ? { ...type, [field]: value } : type
    );
    setRouteData(prev => ({...prev, transportTypes: updatedTransportTypes}));
  };

  const onAddSightseeingOption = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newSightseeingOption: SightseeingOption = {
      id: `so-${Date.now()}`,
      location: '',
      adultPrice: 0,
      childPrice: 0,
      description: '',
      additionalCharges: 0
    };
    const updatedSightseeingOptions = [...(routeData.sightseeingOptions || []), newSightseeingOption];
    setRouteData(prev => ({...prev, sightseeingOptions: updatedSightseeingOptions}));
  };

  const onRemoveSightseeingOption = (optionId: string) => {
    const updatedSightseeingOptions = routeData.sightseeingOptions?.filter(option => option.id !== optionId);
    setRouteData(prev => ({...prev, sightseeingOptions: updatedSightseeingOptions}));
  };

  const onSightseeingOptionChange = (optionId: string, field: string, value: any) => {
    const updatedSightseeingOptions = routeData.sightseeingOptions?.map(option =>
      option.id === optionId ? { ...option, [field]: value } : option
    );
    setRouteData(prev => ({...prev, sightseeingOptions: updatedSightseeingOptions}));
  };
  
  const handleStatusChange = (checked: boolean | "indeterminate") => {
    onChange('status', checked ? ('active' as const) : ('inactive' as const));
  };

  if (!route) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:max-w-[1000px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Transport Route</SheetTitle>
          <SheetDescription>
            Update the details of the transport route.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Basic Info */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Select
                  value={routeData.country}
                  onValueChange={(value) => onChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => {
                      const raw = country?.name?.trim();
                      const safeValue = raw && raw.length > 0 ? country.name : `country-${country.id}`;
                      if (!raw) {
                        console.warn('[EditRouteSheet] Country name missing or empty for id:', country?.id, country);
                      }
                      return (
                        <SelectItem key={country.id} value={safeValue}>
                          {raw && raw.length > 0 ? country.name : 'Unknown'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <ValidatedInput
                  label="Route Name"
                  value={routeData.name || ''}
                  onChange={(value) => onChange('name', value)}
                  onValidate={(value) => validateField('name', value)}
                  placeholder="Route name"
                  required
                  helpText="Auto-generated based on selected locations"
                />
              </div>

              <div className="col-span-2">
                <ValidatedTextarea
                  label="Notes"
                  value={routeData.notes || ''}
                  onChange={(value) => onChange('notes', value)}
                  onValidate={(value) => validateField('description', value)}
                  placeholder="Add any notes for this route..."
                  helpText="Optional notes about this route"
                />
              </div>

              {/* Route Code */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Route Code</label>
                <Input
                  value={routeData.code || ''}
                  readOnly
                  className="bg-muted border-input text-foreground font-mono"
                  placeholder="Auto-generated"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from locations with detailed format
                </p>
                
                {/* Display route segments */}
                {routeSegments.length > 0 && (
                  <div className="mt-2 bg-muted p-2 rounded-md">
                    <p className="text-xs font-medium mb-1">Route Segments:</p>
                    <div className="space-y-1">
                      {routeSegments.map((segment, index) => (
                        <div key={index} className="text-xs font-mono pl-2 border-l-2 border-primary">
                          {segment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Transfer Type & Stops */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold">Transfer Type & Stops</h3>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                {['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'].map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={routeData.transferType === type}
                      onChange={() => onChange('transferType', type)}
                      className="h-4 w-4 text-primary"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Location</label>
                  <Select
                    value={routeData.startLocation}
                    onValueChange={(value) => handleLocationChange('startLocation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start location" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.map((location) => {
                        const rawCode = location?.code?.trim();
                        const safeValue = rawCode && rawCode.length > 0 ? location.code : `loc-${location.id}`;
                        const labelName = location?.fullName || location?.name || rawCode || 'Unknown';
                        if (!rawCode) {
                          console.warn('[EditRouteSheet] Start location code missing for id:', location?.id, location);
                        }
                        return (
                          <SelectItem key={location.id} value={safeValue}>
                            {(rawCode && rawCode.length > 0 ? rawCode : `LOC-${location.id}`)} - {labelName} ({location.category || 'N/A'})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Real-time Start Location Name Display */}
                  {routeData.startLocation && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          {isLoadingStartLocation ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
                              <span className="text-sm text-blue-600">Loading location name...</span>
                            </div>
                          ) : startLocationName ? (
                            <div>
                              <p className="text-sm font-medium text-blue-900">{startLocationName}</p>
                              <p className="text-xs text-blue-600">Code: {routeData.startLocation}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-blue-600">Location name not found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Location</label>
                  <Select
                    value={routeData.endLocation}
                    onValueChange={(value) => handleLocationChange('endLocation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end location" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.map((location) => {
                        const rawCode = location?.code?.trim();
                        const safeValue = rawCode && rawCode.length > 0 ? location.code : `loc-${location.id}`;
                        const labelName = location?.fullName || location?.name || rawCode || 'Unknown';
                        if (!rawCode) {
                          console.warn('[EditRouteSheet] End location code missing for id:', location?.id, location);
                        }
                        return (
                          <SelectItem key={location.id} value={safeValue}>
                            {(rawCode && rawCode.length > 0 ? rawCode : `LOC-${location.id}`)} - {labelName} ({location.category || 'N/A'})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Real-time End Location Name Display */}
                  {routeData.endLocation && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          {isLoadingEndLocation ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full"></div>
                              <span className="text-sm text-green-600">Loading location name...</span>
                            </div>
                          ) : endLocationName ? (
                            <div>
                              <p className="text-sm font-medium text-green-900">{endLocationName}</p>
                              <p className="text-xs text-green-600">Code: {routeData.endLocation}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-green-600">Location name not found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Intermediate Stops */}
              {(routeData.transferType === 'Multi-Stop' || routeData.transferType === 'en route') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Intermediate Stops</label>
                  
                  {routeData.intermediateStops && routeData.intermediateStops.map((stop) => (
                    <div key={stop.id} className="flex items-center space-x-2 mb-2">
                      <Select
                        value={stop.locationCode}
                        onValueChange={(value) => onStopChange(stop.id, value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select stop location" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredLocations.map((location) => {
                            const rawCode = location?.code?.trim();
                            const safeValue = rawCode && rawCode.length > 0 ? location.code : `loc-${location.id}`;
                            const labelName = location?.fullName || location?.name || rawCode || 'Unknown';
                            if (!rawCode) {
                              console.warn('[EditRouteSheet] Stop location code missing for id:', location?.id, location);
                            }
                            return (
                              <SelectItem key={location.id} value={safeValue}>
                                {(rawCode && rawCode.length > 0 ? rawCode : `LOC-${location.id}`)} - {labelName} ({location.category || 'N/A'})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveStop(stop.id)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddStop}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stop
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Method Notes */}
          {(routeData.transferType === 'Multi-Stop' || routeData.transferType === 'en route') && (
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-lg font-semibold">Transfer Method Notes</h3>
              <p className="text-sm text-muted-foreground">
                Add notes about transfer methods for each segment (e.g., "Road transfer PVT + Ferry on SIC")
              </p>
              
              {routeData.intermediateStops && routeData.intermediateStops.length > 0 && (
                <div className="space-y-3">
                  {routeData.intermediateStops.map((_, index) => (
                    <div key={index} className="flex flex-col">
                      <label className="text-sm font-medium mb-1">
                        {routeSegments[index]}
                      </label>
                      <Input
                        placeholder="e.g., Road transfer PVT + Ferry on SIC"
                        value={routeData.intermediateStops?.[index]?.transferMethod || ''}
                        onChange={(e) => onTransferMethodChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Transport Information */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transport Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddTransportType}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Transport Type
              </Button>
            </div>
            
            {routeData.transportTypes && routeData.transportTypes.map((type, index) => (
              <div key={type.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md">
                <div>
                  <label className="block text-sm font-medium mb-1">Transport Type</label>
                  <Select
                    value={type.type}
                    onValueChange={(value) => onTransportTypeChange(type.id, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportTypes.map((t) => {
                        const raw = t?.name?.trim();
                        const safeValue = raw && raw.length > 0 ? t.name : `type-${t.id}`;
                        if (!raw) {
                          console.warn('[EditRouteSheet] Transport type name missing for id:', t?.id, t);
                        }
                        return (
                          <SelectItem key={t.id} value={safeValue}>
                            {raw && raw.length > 0 ? t.name : 'Unknown'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <ValidatedNumberInput
                    label="Seating Capacity"
                    value={type.seatingCapacity}
                    onChange={(value) => onTransportTypeChange(type.id, 'seatingCapacity', value)}
                    onValidate={(value) => validateField('transportTypes.seatingCapacity', value)}
                    min={0}
                    required
                  />
                </div>
                
                <div>
                  <ValidatedNumberInput
                    label="Luggage Capacity"
                    value={type.luggageCapacity}
                    onChange={(value) => onTransportTypeChange(type.id, 'luggageCapacity', value)}
                    onValidate={(value) => validateField('transportTypes.luggageCapacity', value)}
                    min={0}
                    required
                  />
                </div>
                
                <div>
                  <ValidatedInput
                    label="Duration"
                    value={type.duration}
                    onChange={(value) => onTransportTypeChange(type.id, 'duration', value)}
                    onValidate={(value) => validateField('transportTypes.duration', value)}
                    placeholder="e.g., 1h 30m"
                    helpText="Format: 1h 30m"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <div className="flex-1">
                    <ValidatedNumberInput
                      label="Price"
                      value={type.price}
                      onChange={(value) => onTransportTypeChange(type.id, 'price', value)}
                      onValidate={(value) => validateField('transportTypes.price', value)}
                      min={0}
                      step={0.01}
                      required
                    />
                  </div>
                  
                  {routeData.transportTypes && routeData.transportTypes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveTransportType(type.id)}
                      className="ml-2 mb-[2px] text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Sightseeing Options */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Sightseeing Options</h3>
              {routeData.enableSightseeing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddSightseeingOption}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sightseeing
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enableSightseeing"
                checked={!!routeData.enableSightseeing}
                onCheckedChange={(checked) => onChange('enableSightseeing', !!checked)}
              />
              <label
                htmlFor="enableSightseeing"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Sightseeing Options
              </label>
            </div>
            
            {routeData.enableSightseeing && (
              <div className="space-y-4">
                {filteredSightseeingLocations.length === 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-md">
                    No active sightseeing locations found for {routeData.country || "the selected country"}. 
                    Add sightseeing locations in the Sightseeing module first.
                  </div>
                )}
                
                {routeData.sightseeingOptions && routeData.sightseeingOptions.length > 0 ? (
                  routeData.sightseeingOptions.map((option) => (
                    <div key={option.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveSightseeingOption(option.id)}
                        className="absolute right-2 top-2 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Sightseeing Location</label>
                        <Select
                          value={option.location}
                          onValueChange={(value) => onSightseeingOptionChange(option.id, 'location', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSightseeingLocations.map((location) => {
                              const raw = location?.name?.trim();
                              const safeValue = raw && raw.length > 0 ? location.name : `sight-${location.id}`;
                              if (!raw) {
                                console.warn('[EditRouteSheet] Sightseeing location name missing for id:', location?.id, location);
                              }
                              return (
                                <SelectItem key={location.id} value={safeValue}>
                                  {(raw && raw.length > 0 ? location.name : 'Unknown')} - {location.city || 'N/A'}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <ValidatedNumberInput
                          label="Adult Price"
                          value={option.adultPrice}
                          onChange={(value) => onSightseeingOptionChange(option.id, 'adultPrice', value)}
                          onValidate={(value) => validateField('sightseeingOptions.adultPrice', value)}
                          min={0}
                          step={0.01}
                          required
                        />
                      </div>
                      
                      <div>
                        <ValidatedNumberInput
                          label="Child Price"
                          value={option.childPrice}
                          onChange={(value) => onSightseeingOptionChange(option.id, 'childPrice', value)}
                          onValidate={(value) => validateField('sightseeingOptions.childPrice', value)}
                          min={0}
                          step={0.01}
                          required
                        />
                      </div>
                      
                      <div>
                        <ValidatedNumberInput
                          label="Additional Charges"
                          value={option.additionalCharges}
                          onChange={(value) => onSightseeingOptionChange(option.id, 'additionalCharges', value)}
                          onValidate={(value) => validateField('sightseeingOptions.additionalCharges', value)}
                          min={0}
                          step={0.01}
                          helpText="Optional extra charges"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <ValidatedInput
                          label="Description"
                          value={option.description || ''}
                          onChange={(value) => onSightseeingOptionChange(option.id, 'description', value)}
                          onValidate={(value) => validateField('sightseeingOptions.description', value)}
                          placeholder="Description of the sightseeing option"
                          helpText="Brief description of the sightseeing activity"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddSightseeingOption}
                    className="w-full py-8 border-dashed"
                    disabled={filteredSightseeingLocations.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sightseeing Option
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Status</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="routeStatus"
                checked={(routeData.status === 'active') || routeData.isActive === true}
                onCheckedChange={handleStatusChange}
              />
              <span className="text-sm font-medium">
                {((routeData.status === 'active') || routeData.isActive === true) ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={hasErrors || isSaving}
            className={hasErrors ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditRouteSheet;
