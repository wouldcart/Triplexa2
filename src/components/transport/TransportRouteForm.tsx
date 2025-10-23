import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, MapPin, Clock, DollarSign, Users, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { locationResolutionService, type LocationCodeRow } from '@/services/locationResolutionService';
import type { CompleteTransportRoute, TransportRouteFormData, TransportType } from '@/services/comprehensiveTransportService';

interface TransportRouteFormProps {
  route?: CompleteTransportRoute | null;
  transportTypes: TransportType[];
  onSubmit: (data: TransportRouteFormData) => Promise<void>;
  onCancel: () => void;
}

interface IntermediateStopForm {
  id?: string;
  location_code: string;
  full_name: string;
  coordinates?: string; // JSON string in database
  stop_order: number;
}

interface SightseeingOptionForm {
  id?: string;
  location: string;
  adult_price: number;
  child_price: number;
  additional_charges?: number;
  description?: string;
}

export const TransportRouteForm: React.FC<TransportRouteFormProps> = ({
  route,
  transportTypes,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<TransportRouteFormData>({
    route_name: '',
    route_code: '',
    name: '',
    country: '',
    transfer_type: 'One-Way',
    start_location: '',
    start_location_full_name: '',
    end_location: '',
    end_location_full_name: '',
    distance: 0,
    duration: '',
    description: '',
    notes: '',
    status: 'active',
    enable_sightseeing: false,
    intermediate_stops: [],
    sightseeing_options: [],
  });

  const [intermediateStops, setIntermediateStops] = useState<IntermediateStopForm[]>([]);
  const [sightseeingOptions, setSightseeingOptions] = useState<SightseeingOptionForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Location search state
  const [locationCodes, setLocationCodes] = useState<LocationCodeRow[]>([]);
  const [startLocationOpen, setStartLocationOpen] = useState(false);
  const [endLocationOpen, setEndLocationOpen] = useState(false);
  const [startLocationSearch, setStartLocationSearch] = useState('');
  const [endLocationSearch, setEndLocationSearch] = useState('');

  // Initialize form with existing route data
  useEffect(() => {
    if (route) {
      setFormData({
        route_name: route.route_name || '',
        route_code: route.route_code || '',
        name: route.name || '',
        country: route.country || '',
        transfer_type: (route.transfer_type as 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route') || 'One-Way',
        start_location: route.start_location || '',
        start_location_full_name: route.start_location_full_name || '',
        end_location: route.end_location || '',
        end_location_full_name: route.end_location_full_name || '',
        distance: route.distance || 0,
        duration: route.duration || '',
        description: route.description || '',
        notes: route.notes || '',
        status: route.status || 'active',
        enable_sightseeing: route.enable_sightseeing || false,
        intermediate_stops: [],
        sightseeing_options: [],
      });

      // Set intermediate stops
      if (route.intermediate_stops) {
        setIntermediateStops(route.intermediate_stops.map(stop => ({
          location_code: stop.location_code,
          full_name: stop.full_name,
          stop_order: stop.stop_order,
          coordinates: typeof stop.coordinates === 'string' ? stop.coordinates : JSON.stringify(stop.coordinates || {}),
        })));
      }

      // Set sightseeing options
      if (route.sightseeing_options) {
        setSightseeingOptions(route.sightseeing_options.map(option => ({
          location: option.location,
          description: option.description || '',
          adult_price: option.adult_price || 0,
          child_price: option.child_price || 0,
          additional_charges: option.additional_charges || 0,
        })));
      }
    }
  }, [route]);

  // Load location codes on component mount
  useEffect(() => {
    const loadLocationCodes = async () => {
      try {
        const codes = await locationResolutionService.getAllLocationCodes();
        setLocationCodes(codes);
      } catch (error) {
        console.error('Failed to load location codes:', error);
      }
    };

    loadLocationCodes();
  }, []);

  // Handle location selection with auto-population
  const handleLocationSelect = (field: 'start' | 'end', locationCode: LocationCodeRow) => {
    if (field === 'start') {
      setFormData(prev => ({
        ...prev,
        start_location: locationCode.code,
        start_location_full_name: locationCode.full_name,
      }));
      setStartLocationOpen(false);
      setStartLocationSearch('');
    } else {
      setFormData(prev => ({
        ...prev,
        end_location: locationCode.code,
        end_location_full_name: locationCode.full_name,
      }));
      setEndLocationOpen(false);
      setEndLocationSearch('');
    }
    
    // Clear any existing errors for these fields
    setErrors(prev => ({
      ...prev,
      [`${field}_location`]: '',
      [`${field}_location_full_name`]: '',
    }));
  };

  // Handle intermediate stop location selection
  const handleIntermediateStopLocationSelect = (index: number, locationCode: LocationCodeRow) => {
    const updated = [...intermediateStops];
    updated[index] = {
      ...updated[index],
      location_code: locationCode.code,
      full_name: locationCode.full_name,
      coordinates: locationCode.coordinates ? JSON.stringify(locationCode.coordinates) : '',
    };
    setIntermediateStops(updated);
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof TransportRouteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Add intermediate stop
  const addIntermediateStop = () => {
    const newStop: IntermediateStopForm = {
      location_code: '',
      full_name: '',
      stop_order: intermediateStops.length + 1,
    };
    setIntermediateStops([...intermediateStops, newStop]);
  };

  // Update intermediate stop
  const updateIntermediateStop = (index: number, field: keyof IntermediateStopForm, value: any) => {
    const updated = [...intermediateStops];
    updated[index] = { ...updated[index], [field]: value };
    setIntermediateStops(updated);
  };

  // Remove intermediate stop
  const removeIntermediateStop = (index: number) => {
    const updated = intermediateStops.filter((_, i) => i !== index);
    // Reorder stop_order
    updated.forEach((stop, i) => {
      stop.stop_order = i + 1;
    });
    setIntermediateStops(updated);
  };

  // Add sightseeing option
  const addSightseeingOption = () => {
    const newOption: SightseeingOptionForm = {
      location: '',
      adult_price: 0,
      child_price: 0,
    };
    setSightseeingOptions([...sightseeingOptions, newOption]);
  };

  // Update sightseeing option
  const updateSightseeingOption = (index: number, field: keyof SightseeingOptionForm, value: any) => {
    const updated = [...sightseeingOptions];
    updated[index] = { ...updated[index], [field]: value };
    setSightseeingOptions(updated);
  };

  // Remove sightseeing option
  const removeSightseeingOption = (index: number) => {
    setSightseeingOptions(sightseeingOptions.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.route_name.trim()) {
      newErrors.route_name = 'Route name is required';
    }
    if (!formData.start_location.trim()) {
      newErrors.start_location = 'Start location is required';
    }
    if (!formData.start_location_full_name.trim()) {
      newErrors.start_location_full_name = 'Start location full name is required';
    }
    if (!formData.end_location.trim()) {
      newErrors.end_location = 'End location is required';
    }
    if (!formData.end_location_full_name.trim()) {
      newErrors.end_location_full_name = 'End location full name is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }
    if (!formData.distance || formData.distance <= 0) {
      newErrors.distance = 'Distance must be greater than 0';
    }

    // Validate intermediate stops
    intermediateStops.forEach((stop, index) => {
      if (!stop.location_code.trim()) {
        newErrors[`stop_${index}_name`] = 'Stop location code is required';
      }
    });

    // Validate sightseeing options
    sightseeingOptions.forEach((option, index) => {
      if (!option.location.trim()) {
        newErrors[`option_${index}_name`] = 'Option location is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const submitData: TransportRouteFormData = {
        ...formData,
        intermediate_stops: intermediateStops,
        sightseeing_options: sightseeingOptions,
      };

      await onSubmit(submitData);
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transfer type options
  const transferTypeOptions = ['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'];

  // Currency options
  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">
              {route ? 'Edit Transport Route' : 'Add Transport Route'}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="route_name">Route Name *</Label>
                    <Input
                      id="route_name"
                      value={formData.route_name}
                      onChange={(e) => handleFieldChange('route_name', e.target.value)}
                      placeholder="e.g., Tokyo to Osaka Express"
                      className={errors.route_name ? 'border-red-500' : ''}
                    />
                    {errors.route_name && (
                      <p className="text-sm text-red-500 mt-1">{errors.route_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="e.g., Express Route"
                    />
                  </div>

                  <div>
                    <Label htmlFor="route_code">Route Code</Label>
                    <Input
                      id="route_code"
                      value={formData.route_code || ''}
                      onChange={(e) => handleFieldChange('route_code', e.target.value)}
                      placeholder="e.g., TR001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="start_location">Start Location *</Label>
                    <Popover open={startLocationOpen} onOpenChange={setStartLocationOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={startLocationOpen}
                          className={`w-full justify-between ${errors.start_location ? 'border-red-500' : ''}`}
                        >
                          {formData.start_location ? (
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {formData.start_location} - {formData.start_location_full_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Select start location...</span>
                          )}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search locations..." 
                            value={startLocationSearch}
                            onValueChange={setStartLocationSearch}
                          />
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {locationCodes
                              .filter(location => 
                                location.code.toLowerCase().includes(startLocationSearch.toLowerCase()) ||
                                location.full_name.toLowerCase().includes(startLocationSearch.toLowerCase())
                              )
                              .map((location) => (
                                <CommandItem
                                  key={location.id}
                                  value={location.code}
                                  onSelect={() => handleLocationSelect('start', location)}
                                  className="flex items-center gap-2"
                                >
                                  <MapPin className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{location.code}</span>
                                    <span className="text-sm text-muted-foreground">{location.full_name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.start_location && (
                      <p className="text-sm text-red-500 mt-1">{errors.start_location}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="end_location">End Location *</Label>
                    <Popover open={endLocationOpen} onOpenChange={setEndLocationOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={endLocationOpen}
                          className={`w-full justify-between ${errors.end_location ? 'border-red-500' : ''}`}
                        >
                          {formData.end_location ? (
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {formData.end_location} - {formData.end_location_full_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Select end location...</span>
                          )}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search locations..." 
                            value={endLocationSearch}
                            onValueChange={setEndLocationSearch}
                          />
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {locationCodes
                              .filter(location => 
                                location.code.toLowerCase().includes(endLocationSearch.toLowerCase()) ||
                                location.full_name.toLowerCase().includes(endLocationSearch.toLowerCase())
                              )
                              .map((location) => (
                                <CommandItem
                                  key={location.id}
                                  value={location.code}
                                  onSelect={() => handleLocationSelect('end', location)}
                                  className="flex items-center gap-2"
                                >
                                  <MapPin className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{location.code}</span>
                                    <span className="text-sm text-muted-foreground">{location.full_name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.end_location && (
                      <p className="text-sm text-red-500 mt-1">{errors.end_location}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      placeholder="e.g., Japan"
                      className={errors.country ? 'border-red-500' : ''}
                    />
                    {errors.country && (
                      <p className="text-sm text-red-500 mt-1">{errors.country}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="transfer_type">Transfer Type *</Label>
                    <Select
                      value={formData.transfer_type}
                      onValueChange={(value) => handleFieldChange('transfer_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transferTypeOptions.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing and Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={formData.duration || ''}
                      onChange={(e) => handleFieldChange('duration', e.target.value)}
                      placeholder="2 hours"
                      className={errors.duration ? 'border-red-500' : ''}
                    />
                    {errors.duration && (
                      <p className="text-sm text-red-500 mt-1">{errors.duration}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="distance">Distance (km) *</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      value={formData.distance || ''}
                      onChange={(e) => handleFieldChange('distance', parseFloat(e.target.value) || 0)}
                      placeholder="150.5"
                      className={errors.distance ? 'border-red-500' : ''}
                    />
                    {errors.distance && (
                      <p className="text-sm text-red-500 mt-1">{errors.distance}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="transfer_type">Transfer Type</Label>
                    <Select
                      value={formData.transfer_type || ''}
                      onValueChange={(value) => handleFieldChange('transfer_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transferTypeOptions.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description and Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Description & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Describe this transport route..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Add any additional notes about this route..."
                    rows={3}
                  />
                </div>



                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_sightseeing"
                    checked={formData.enable_sightseeing || false}
                    onCheckedChange={(checked) => handleFieldChange('enable_sightseeing', checked)}
                  />
                  <Label htmlFor="enable_sightseeing">Enable Sightseeing Options</Label>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'active'}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Intermediate Stops */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Intermediate Stops
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addIntermediateStop}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stop
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {intermediateStops.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No intermediate stops. Click "Add Stop" to add one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {intermediateStops.map((stop, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="outline">Stop {stop.stop_order}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIntermediateStop(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Location *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {stop.location_code ? (
                                    <span className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      {stop.location_code} - {stop.full_name}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Select location...</span>
                                  )}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search locations..." />
                                  <CommandEmpty>No location found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {locationCodes.map((location) => (
                                      <CommandItem
                                        key={location.id}
                                        value={location.code}
                                        onSelect={() => handleIntermediateStopLocationSelect(index, location)}
                                        className="flex items-center gap-2"
                                      >
                                        <MapPin className="h-4 w-4" />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{location.code}</span>
                                          <span className="text-sm text-muted-foreground">{location.full_name}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {errors[`stop_${index}_name`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`stop_${index}_name`]}</p>
                            )}
                          </div>

                          {stop.coordinates && (
                            <div>
                              <Label>Coordinates</Label>
                              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {stop.coordinates}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sightseeing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Sightseeing Options
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.enable_sightseeing}
                        onCheckedChange={(checked) => handleFieldChange('enable_sightseeing', checked)}
                      />
                      <Label>Enable Sightseeing</Label>
                    </div>
                    {formData.enable_sightseeing && (
                      <Button type="button" variant="outline" size="sm" onClick={addSightseeingOption}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.enable_sightseeing ? (
                  <p className="text-muted-foreground text-center py-4">
                    Enable sightseeing to add options.
                  </p>
                ) : sightseeingOptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No sightseeing options. Click "Add Option" to add one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sightseeingOptions.map((option, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="outline">Option {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSightseeingOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Location *</Label>
                            <Input
                              value={option.location}
                              onChange={(e) => updateSightseeingOption(index, 'location', e.target.value)}
                              placeholder="Temple of Heaven"
                              className={errors[`option_${index}_name`] ? 'border-red-500' : ''}
                            />
                            {errors[`option_${index}_name`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`option_${index}_name`]}</p>
                            )}
                          </div>

                          <div>
                            <Label>Adult Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={option.adult_price || ''}
                              onChange={(e) => updateSightseeingOption(index, 'adult_price', parseFloat(e.target.value) || 0)}
                              placeholder="25.00"
                            />
                          </div>

                          <div>
                            <Label>Child Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={option.child_price || ''}
                              onChange={(e) => updateSightseeingOption(index, 'child_price', parseFloat(e.target.value) || 0)}
                              placeholder="15.00"
                            />
                          </div>

                          <div>
                            <Label>Additional Charges</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={option.additional_charges || ''}
                              onChange={(e) => updateSightseeingOption(index, 'additional_charges', parseFloat(e.target.value) || 0)}
                              placeholder="5.00"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              value={option.description || ''}
                              onChange={(e) => updateSightseeingOption(index, 'description', e.target.value)}
                              placeholder="Description of the sightseeing option"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 p-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : route ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};