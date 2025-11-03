
import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableLocationSelect } from '@/components/ui/searchable-location-select';
import { SearchableTransportTypeAdd } from '@/components/ui/searchable-transport-type-add';
import { TransportRoute, LocationCode, TransportType, SightseeingOption, Stop } from '../types/transportTypes';
import { Country } from '../../countries/types/country';
import { Plus, X, Route, MapPin } from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';
import { loadSightseeingData } from '../../sightseeing/services/storageService';
import { ValidatedInput, ValidatedNumberInput, ValidatedTextarea } from './ValidatedInput';
import { useRouteForm } from '../hooks/useRouteForm';
import { locationResolutionService } from '@/services/locationResolutionService';

interface AddRouteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routeData: Partial<TransportRoute>) => void;
  countries: Country[];
  locations: LocationCode[];
  transportTypes: TransportType[];
}

const AddRouteSheet: React.FC<AddRouteSheetProps> = ({
  isOpen,
  onClose,
  onSave,
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
  
  // State for intermediate stop location names
  const [stopLocationNames, setStopLocationNames] = useState<Record<string, string>>({});
  const [loadingStopIds, setLoadingStopIds] = useState<Set<string>>(new Set());
  
  const { 
    routeData, 
    setRouteData,
    onChange, 
    filteredLocations, 
    filteredSightseeingLocations, 
    routeSegments, 
    validateField, 
    errors, 
    onRemoveTransportType,
    onTransportTypeChange,
  } = useRouteForm({}, locations, sightseeingLocations);

  const onAddTransportType = (value: string) => {
    const selectedType = transportTypes.find(t => t.id === value);
    if (!selectedType) return;

    const newTransportType = {
      id: `tt-${Date.now()}`,
      type: selectedType.name,
      seatingCapacity: selectedType.seatingCapacity,
      luggageCapacity: selectedType.luggageCapacity,
      price: 0, // Default price, can be adjusted
      duration: '' // Default duration, can be adjusted
    };
    const updatedTransportTypes = [...(routeData.transportTypes || []), newTransportType];
    setRouteData(prev => ({...prev, transportTypes: updatedTransportTypes}));
  };

  useEffect(() => {
    const sightseeingData = loadSightseeingData();
    const activeSightseeings = sightseeingData.filter(item => item.status === 'active');
    setSightseeingLocations(activeSightseeings);
  }, []);

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      // Reset form data
      setRouteData({
        status: 'active',
        isActive: true,
        enableSightseeing: false
      });
      // Reset location names
      setStartLocationName('');
      setEndLocationName('');
      setStopLocationNames({});
      setLoadingStopIds(new Set());
    }
  }, [isOpen, setRouteData]);

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
    
    try {
      if (Object.keys(errors).length > 0) {
        console.warn('Form has validation errors, cannot submit');
        return;
      }
      
      // Ensure location full names are set
      const formDataWithFullNames = {
        ...routeData,
        startLocationFullName: startLocationName || routeData.startLocationFullName,
        endLocationFullName: endLocationName || routeData.endLocationFullName,
        // Map UI Notes textarea to description for saving
        description: (routeData as any).notes ?? routeData.description ?? ''
      };
      
      await onSave(formDataWithFullNames);
      onClose();
    } catch (error) {
      console.error('Error saving route:', error);
    } finally {
      setIsSaving(false);
    }
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
    
    // Clean up location name state
    setStopLocationNames(prev => {
      const updated = { ...prev };
      delete updated[stopId];
      return updated;
    });
    setLoadingStopIds(prev => {
      const updated = new Set(prev);
      updated.delete(stopId);
      return updated;
    });
  };

  const onStopChange = async (stopId: string, locationCode: string) => {
    const updatedStops = routeData.intermediateStops?.map(stop => 
      stop.id === stopId ? { ...stop, locationCode } : stop
    );
    setRouteData(prev => ({...prev, intermediateStops: updatedStops}));
    
    // Handle location name resolution for intermediate stops
    if (locationCode) {
      setLoadingStopIds(prev => new Set(prev).add(stopId));
      try {
        const locationName = await locationResolutionService.getLocationFullName(locationCode);
        setStopLocationNames(prev => ({
          ...prev,
          [stopId]: locationName || ''
        }));
      } catch (error) {
        console.error('Error fetching stop location name:', error);
        setStopLocationNames(prev => ({
          ...prev,
          [stopId]: ''
        }));
      } finally {
        setLoadingStopIds(prev => {
          const updated = new Set(prev);
          updated.delete(stopId);
          return updated;
        });
      }
    } else {
      // Clear location name if no location code
      setStopLocationNames(prev => {
        const updated = { ...prev };
        delete updated[stopId];
        return updated;
      });
    }
  };

  const onTransferMethodChange = (index: number, value: string) => {
    const updatedStops = [...(routeData.intermediateStops || [])];
    if (updatedStops[index]) {
      updatedStops[index] = { ...updatedStops[index], transferMethod: value } as Stop;
      setRouteData(prev => ({ ...prev, intermediateStops: updatedStops }));
    }
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
    const isOn = checked === true;
    onChange('status', isOn ? 'active' : 'inactive');
    onChange('isActive', isOn);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:max-w-[1000px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Transport Route</SheetTitle>
          <SheetDescription>
            Manage and organize transport routes efficiently
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Basic Info */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <Select
                  value={routeData.country}
                  onValueChange={(value) => {
                    onChange('country', value);
                    validateField('country', value);
                  }}
                >
                  <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                )}
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
                  onValidate={(value) => validateField('notes', value)}
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
              <div>
                <label className="block text-sm font-medium mb-2">
                  Transfer Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-6">
                  {['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'].map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={routeData.transferType === type}
                        onChange={() => {
                          onChange('transferType', type);
                          validateField('transferType', type);
                        }}
                        className="h-4 w-4 text-primary"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {errors.transferType && (
                  <p className="text-red-500 text-sm mt-1">{errors.transferType}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Location <span className="text-red-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    locations={filteredLocations}
                    value={routeData.startLocation}
                    onValueChange={(value) => {
                      handleLocationChange('startLocation', value);
                      validateField('startLocation', value);
                    }}
                    placeholder="Select start location"
                    className={errors.startLocation ? 'border-red-500' : ''}
                  />
                  {errors.startLocation && (
                    <p className="text-red-500 text-sm mt-1">{errors.startLocation}</p>
                  )}
                  
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
                  <label className="block text-sm font-medium mb-1">
                    End Location <span className="text-red-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    locations={filteredLocations}
                    value={routeData.endLocation}
                    onValueChange={(value) => {
                      handleLocationChange('endLocation', value);
                      validateField('endLocation', value);
                    }}
                    placeholder="Select end location"
                    className={errors.endLocation ? 'border-red-500' : ''}
                  />
                  {errors.endLocation && (
                    <p className="text-red-500 text-sm mt-1">{errors.endLocation}</p>
                  )}
                  
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
                    <div key={stop.id} className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <SearchableLocationSelect
                          locations={filteredLocations}
                          value={stop.locationCode}
                          onValueChange={(value) => onStopChange(stop.id, value)}
                          placeholder="Select stop location"
                          className="flex-1"
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveStop(stop.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Real-time Stop Location Name Display */}
                      {stop.locationCode && (
                        <div className="ml-0 p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <div className="flex-1">
                              {loadingStopIds.has(stop.id) ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin h-3 w-3 border border-orange-600 border-t-transparent rounded-full"></div>
                                  <span className="text-sm text-orange-600">Loading location name...</span>
                                </div>
                              ) : stopLocationNames[stop.id] ? (
                                <div>
                                  <p className="text-sm font-medium text-orange-900">{stopLocationNames[stop.id]}</p>
                                  <p className="text-xs text-orange-600">Code: {stop.locationCode}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-orange-600">Location name not found</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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
              <SearchableTransportTypeAdd
                transportTypes={transportTypes}
                onSelectType={(value) => onAddTransportType(value)}
              />
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
                      {transportTypes.filter((tt) => (tt as any).active !== false).map((t) => (
                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                      ))}
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
                            {filteredSightseeingLocations.map((location) => (
                              <SelectItem key={location.id} value={location.name}>
                                {location.name} - {location.city}
                              </SelectItem>
                            ))}
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
            disabled={Object.keys(errors).length > 0 || isSaving}
            className={Object.keys(errors).length > 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSaving ? "Saving..." : "Save Route"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AddRouteSheet;
