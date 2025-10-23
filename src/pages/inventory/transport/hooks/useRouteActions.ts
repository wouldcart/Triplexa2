import { useState, ChangeEvent, MouseEvent, useEffect } from 'react';
import { TransportRoute, LocationCode, TransportRouteType, Stop, SightseeingOption, RouteSegment } from '../types/transportTypes';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { integratedTransportService, type CreateTransportRoutePayload, type UpdateTransportRoutePayload } from '@/services/integratedTransportService';

// Create Zod schema for validation
  const routeFormSchema = z.object({
    country: z.string().min(1, { message: 'Country is required' }).max(100, { message: 'Country name too long' }),
    name: z.string()
      .min(2, { message: 'Route name must be at least 2 characters' })
      .max(200, { message: 'Route name must be less than 200 characters' })
      .regex(/^[a-zA-Z0-9\s\-_()→]+$/, { message: 'Route name contains invalid characters' }),
    transferType: z.enum(['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'], {
      errorMap: () => ({ message: 'Please select a valid transfer type' })
    }),
  startLocation: z.string().min(1, { message: 'Start location is required' }),
  endLocation: z.string().min(1, { message: 'End location is required' }),
  intermediateStops: z.array(z.object({
    id: z.string().min(1, { message: 'Stop ID is required' }),
    locationCode: z.string().min(1, { message: 'Location code is required' }),
    // Allow missing or empty fullName; backend resolves from locationCode
    fullName: z.preprocess(
      (val) => typeof val === 'string' && val.trim() === '' ? undefined : val,
      z.string().min(1, { message: 'Location name is required' }).optional()
    )
  })).optional(),
  transportTypes: z.array(z.object({
    id: z.string().min(1, { message: 'Transport type ID is required' }),
    type: z.string().min(1, { message: 'Transport type is required' }),
    seatingCapacity: z.number()
      .min(1, { message: 'Seating capacity must be at least 1' })
      .max(1000, { message: 'Seating capacity cannot exceed 1000' }),
    luggageCapacity: z.number()
      .min(0, { message: 'Luggage capacity cannot be negative' })
      .max(1000, { message: 'Luggage capacity cannot exceed 1000' }),
    duration: z.string()
      .min(1, { message: 'Duration is required' })
      .regex(/^(\d+h|\d+m|\d+h\s*\d+m|\d+:\d+)$/i, { message: 'Duration format is invalid (e.g., 1h, 30m, 1h 30m)' }),
    price: z.number()
      .min(0, { message: 'Price cannot be negative' })
      .max(999999, { message: 'Price cannot exceed 999,999' })
  })).min(1, { message: 'At least one transport type is required' }),
  enableSightseeing: z.boolean().default(false),
  sightseeingOptions: z.array(z.object({
    id: z.string().min(1, { message: 'Sightseeing option ID is required' }),
    location: z.string().min(1, { message: 'Sightseeing location is required' }),
    adultPrice: z.number()
      .min(0, { message: 'Adult price cannot be negative' })
      .max(99999, { message: 'Adult price cannot exceed 99,999' }),
    childPrice: z.number()
      .min(0, { message: 'Child price cannot be negative' })
      .max(99999, { message: 'Child price cannot exceed 99,999' }),
    additionalCharges: z.number()
      .min(0, { message: 'Additional charges cannot be negative' })
      .max(99999, { message: 'Additional charges cannot exceed 99,999' }),
    description: z.string().max(500, { message: 'Description must be less than 500 characters' }).optional()
  })).optional(),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Status must be either active or inactive' })
  }).default('active')
}).refine((data) => data.startLocation !== data.endLocation, {
  message: "Start and end locations cannot be the same",
  path: ["endLocation"]
}).refine((data) => {
  if (!data.intermediateStops || data.intermediateStops.length === 0) return true;
  const allLocations = [data.startLocation, data.endLocation];
  const duplicates = data.intermediateStops.some(stop => allLocations.includes(stop.locationCode));
  return !duplicates;
}, {
  message: "Intermediate stops cannot duplicate start or end locations",
  path: ["intermediateStops"]
}).refine((data) => {
  if (!data.enableSightseeing) return true;
  return data.sightseeingOptions && data.sightseeingOptions.length > 0;
}, {
  message: "At least one sightseeing option is required when sightseeing is enabled",
  path: ["sightseeingOptions"]
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

interface UseRouteActionsProps {
  routes: TransportRoute[];
  setRoutes: React.Dispatch<React.SetStateAction<TransportRoute[]>>;
  locations: LocationCode[];
  setSelectedRoute: React.Dispatch<React.SetStateAction<TransportRoute | null>>;
  setViewRouteDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditRouteDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteRouteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAddRouteDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  viewRouteDrawerOpen: boolean;
  editRouteDrawerOpen: boolean;
  deleteRouteDialogOpen: boolean;
  addRouteDrawerOpen: boolean;
  selectedRoute: TransportRoute | null;
}

export const useRouteActions = ({
  routes,
  setRoutes,
  locations,
  setSelectedRoute,
  setViewRouteDrawerOpen,
  setEditRouteDrawerOpen,
  setDeleteRouteDialogOpen,
  setAddRouteDrawerOpen,
  viewRouteDrawerOpen,
  editRouteDrawerOpen,
  deleteRouteDialogOpen,
  addRouteDrawerOpen,
  selectedRoute
}: UseRouteActionsProps) => {
  const { toast } = useToast();
  
  // Default transport types for new routes
  const defaultTransportTypes = [
    { 
      id: '1', 
      type: 'Sedan', 
      seatingCapacity: 4, 
      luggageCapacity: 3, 
      duration: '1h',
      price: 500 
    },
    { 
      id: '2', 
      type: 'SUV', 
      seatingCapacity: 6, 
      luggageCapacity: 5, 
      duration: '1h',
      price: 700 
    },
    { 
      id: '3', 
      type: 'Van', 
      seatingCapacity: 10, 
      luggageCapacity: 10, 
      duration: '1h',
      price: 900 
    },
    { 
      id: '4', 
      type: 'Ferry', 
      seatingCapacity: 100, 
      luggageCapacity: 50, 
      duration: '2h',
      price: 300 
    }
  ];
  
  // New route data
  const [newRouteData, setNewRouteData] = useState<Partial<TransportRoute>>({
    country: 'Thailand',
    transferType: 'One-Way',
    transportTypes: defaultTransportTypes,
    enableSightseeing: false,
    status: 'active' as const,
    intermediateStops: [],
    sightseeingOptions: [],
    description: ''
  });
  
  // Edit route data
  const [editRouteData, setEditRouteData] = useState<TransportRoute | null>(null);
  
  // Extract short code from location code
  const extractShortCode = (code: string) => {
    if (!code) return '';
    return code.split(' ')[0];
  };
  
  // Get location type description (APT, HTL, etc)
  const getLocationTypeDescription = (locationCode: string) => {
    const location = locations.find(loc => loc.code === locationCode);
    if (!location) return '';
    
    switch (location.category) {
      case 'airport': return 'APT';
      case 'hotel': return 'HTL';
      case 'pier': return 'PIER';
      default: return location.category.slice(0, 3).toUpperCase();
    }
  };
  
  // Generate route code segments for each leg of the journey
  const generateRouteCodeSegments = (
    startLocation: string | undefined, 
    intermediateStops: Stop[] | undefined, 
    endLocation: string | undefined
  ) => {
    const allStops = [
      startLocation,
      ...(intermediateStops?.map(stop => stop.locationCode) || []),
      endLocation
    ].filter(Boolean) as string[];
    
    if (allStops.length < 2) return [];
    
    const segments: string[] = [];
    
    // Generate code for each route segment
    for (let i = 0; i < allStops.length - 1; i++) {
      const fromCode = extractShortCode(allStops[i]);
      const fromType = getLocationTypeDescription(allStops[i]);
      
      const toCode = extractShortCode(allStops[i + 1]);
      const toType = getLocationTypeDescription(allStops[i + 1]);
      
      segments.push(`${fromCode} ${fromType} – ${toCode} ${toType}`);
    }
    
    return segments;
  };
  
  // Generate the full route code with all stops
  const generateCompleteRouteCode = (
    startLocation: string | undefined, 
    intermediateStops: Stop[] | undefined, 
    endLocation: string | undefined
  ) => {
    const allStops = [
      startLocation,
      ...(intermediateStops?.map(stop => stop.locationCode) || []),
      endLocation
    ].filter(Boolean) as string[];
    
    if (allStops.length < 2) return '';
    
    const routeParts = allStops.map((locationCode, index) => {
      const shortCode = extractShortCode(locationCode);
      const locationType = getLocationTypeDescription(locationCode);
      return `${shortCode} ${locationType}${index < allStops.length - 1 ? ' - ' : ''}`;
    });
    
    return routeParts.join('');
  };
  
  // Auto-generate route code and name when locations change for new routes
  useEffect(() => {
    if (newRouteData.startLocation && newRouteData.endLocation) {
      const startLocation = locations.find(loc => loc.code === newRouteData.startLocation);
      const endLocation = locations.find(loc => loc.code === newRouteData.endLocation);
      
      if (startLocation && endLocation) {
        // Generate route name
        let generatedName: string;
        
        if (newRouteData.transferType === 'Multi-Stop' || newRouteData.transferType === 'en route') {
          const intermediateNames = newRouteData.intermediateStops?.map(stop => {
            const loc = locations.find(l => l.code === stop.locationCode);
            return loc ? loc.fullName : '';
          }).filter(Boolean);
          
          if (intermediateNames && intermediateNames.length > 0) {
            generatedName = `${startLocation.fullName} → ${intermediateNames.join(' → ')} → ${endLocation.fullName}`;
          } else {
            generatedName = `${startLocation.fullName} → ${endLocation.fullName}`;
          }
        } else {
          generatedName = `${startLocation.fullName} → ${endLocation.fullName}`;
        }
        
        // Generate route code
        const routeCode = generateCompleteRouteCode(
          newRouteData.startLocation, 
          newRouteData.intermediateStops, 
          newRouteData.endLocation
        );
        
        // Update the new route data
        setNewRouteData(prev => ({
          ...prev,
          code: routeCode,
          name: generatedName
        }));
      }
    }
  }, [newRouteData.startLocation, newRouteData.endLocation, newRouteData.intermediateStops, newRouteData.transferType, locations]);
  
  // Auto-generate route code and name when locations change for edited routes
  useEffect(() => {
    if (editRouteData?.startLocation && editRouteData?.endLocation) {
      const startLocation = locations.find(loc => loc.code === editRouteData.startLocation);
      const endLocation = locations.find(loc => loc.code === editRouteData.endLocation);
      
      if (startLocation && endLocation) {
        // Generate route name
        let generatedName: string;
        
        if (editRouteData.transferType === 'Multi-Stop' || editRouteData.transferType === 'en route') {
          const intermediateNames = editRouteData.intermediateStops?.map(stop => {
            const loc = locations.find(l => l.code === stop.locationCode);
            return loc ? loc.fullName : '';
          }).filter(Boolean);
          
          if (intermediateNames && intermediateNames.length > 0) {
            generatedName = `${startLocation.fullName} → ${intermediateNames.join(' → ')} → ${endLocation.fullName}`;
          } else {
            generatedName = `${startLocation.fullName} → ${endLocation.fullName}`;
          }
        } else {
          generatedName = `${startLocation.fullName} → ${endLocation.fullName}`;
        }
        
        // Generate route code
        const routeCode = generateCompleteRouteCode(
          editRouteData.startLocation, 
          editRouteData.intermediateStops, 
          editRouteData.endLocation
        );
        
        // Update the edit route data
        setEditRouteData(prev => {
          if (prev) {
            return {
              ...prev,
              code: routeCode,
              name: generatedName
            };
          }
          return prev;
        });
      }
    }
  }, [
    editRouteData?.startLocation, 
    editRouteData?.endLocation, 
    editRouteData?.intermediateStops, 
    editRouteData?.transferType, 
    locations
  ]);
  
  // Handlers for route actions
  const handleViewRoute = (route: TransportRoute) => {
    setSelectedRoute(route);
    setViewRouteDrawerOpen(true);
  };
  
  const handleEditRoute = (route: TransportRoute) => {
    setSelectedRoute(route);
    // Create a deep copy to ensure we don't mutate the original object
    const routeCopy = JSON.parse(JSON.stringify(route));
    
    // Ensure sightseeingOptions is an array if it exists
    if (routeCopy.sightseeingOptions && !Array.isArray(routeCopy.sightseeingOptions)) {
      routeCopy.sightseeingOptions = [{ ...routeCopy.sightseeingOptions, id: Date.now().toString() }];
    } else if (!routeCopy.sightseeingOptions) {
      routeCopy.sightseeingOptions = [];
    }
    
    setEditRouteData(routeCopy);
    setEditRouteDrawerOpen(true);
  };
  
  const handleDeleteRoute = (route: TransportRoute) => {
    setSelectedRoute(route);
    setDeleteRouteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (selectedRoute) {
      try {
        // Attempt remote delete only if the ID looks like a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedRoute.id);
        if (isUUID) {
          const result = await integratedTransportService.deleteTransportRoute(selectedRoute.id);
          if (!result.success) {
            throw new Error(result.error || 'Failed to delete route');
          }
        }

        const updatedRoutes = routes.filter(route => route.id !== selectedRoute.id);
        setRoutes(updatedRoutes);
        setDeleteRouteDialogOpen(false);
        toast({
          title: "Route Deleted",
          description: `${selectedRoute.name} has been deleted successfully.`,
        });
      } catch (error) {
        console.error('Failed to delete route remotely:', error);
        toast({ 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to delete route', 
          variant: 'destructive' 
        });
      }
    }
  };
  
  const handleAddRoute = () => {
    // Reset the form data to defaults before opening
    resetNewRouteForm();
    setAddRouteDrawerOpen(true);
  };
  
  const handleToggleStatus = (routeId: string) => {
    const updatedRoutes = routes.map(route => 
      route.id === routeId ? { 
        ...route, 
        status: route.status === 'active' ? ('inactive' as const) : ('active' as const)
      } : route
    );
    setRoutes(updatedRoutes);
    toast({
      title: "Status Updated",
      description: "Route status has been updated successfully.",
    });
  };
  
  // Handlers for form inputs
  const handleNewRouteInputChange = (field: string, value: any) => {
    setNewRouteData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleEditRouteInputChange = (field: string, value: any) => {
    if (editRouteData) {
      setEditRouteData({
        ...editRouteData,
        [field]: value
      });
    }
  };
  
  // Add stop to route
  const handleAddStop = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (editRouteDrawerOpen && editRouteData) {
      // Add stop to edit route data
      setEditRouteData(prev => ({
        ...prev,
        intermediateStops: [
          ...(prev?.intermediateStops || []),
          { id: Date.now().toString(), locationCode: '', fullName: '' }
        ]
      }));
    } else {
      // Add stop to new route data
      setNewRouteData(prev => ({
        ...prev,
        intermediateStops: [
          ...(prev.intermediateStops || []),
          { id: Date.now().toString(), locationCode: '', fullName: '' }
        ]
      }));
    }
  };
  
  // Remove stop from route
  const handleRemoveStop = async (stopId: string) => {
    if (editRouteDrawerOpen && editRouteData) {
      // Local-only change; persisted on save
      // Remove stop from edit route data
      setEditRouteData(prev => ({
        ...prev,
        intermediateStops: prev?.intermediateStops?.filter(stop => stop.id !== stopId) || []
      }));
    } else {
      // Remove stop from new route data
      setNewRouteData(prev => ({
        ...prev,
        intermediateStops: prev.intermediateStops?.filter(stop => stop.id !== stopId) || []
      }));
    }
  };
  
  // Update stop data
  const handleStopChange = async (stopId: string, locationCode: string) => {
    const location = locations.find(loc => loc.code === locationCode);
    
    if (location) {
      if (editRouteDrawerOpen && editRouteData) {
        // Local-only change; persisted on save
        // Update stop in edit route data
        setEditRouteData(prev => ({
          ...prev,
          intermediateStops: prev?.intermediateStops?.map(stop => 
            stop.id === stopId 
              ? { id: stop.id, locationCode: location.code, fullName: location.fullName }
              : stop
          ) || []
        }));
      } else {
        // Update stop in new route data
        setNewRouteData(prev => ({
          ...prev,
          intermediateStops: prev.intermediateStops?.map(stop => 
            stop.id === stopId 
              ? { id: stop.id, locationCode: location.code, fullName: location.fullName }
              : stop
          ) || []
        }));
      }
    }
  };

  // Reorder intermediate stops (local-only; persisted on save)
  const handleReorderStops = async (_routeId: string, stopIds: string[]) => {
    const reorder = (stops: Stop[] | undefined) => {
      if (!stops) return [] as Stop[];
      const stopMap = new Map(stops.map(s => [s.id, s] as const));
      return stopIds.map((id, idx) => {
        const s = stopMap.get(id);
        return s ? { ...s } : { id, locationCode: '', fullName: '' };
      });
    };

    if (editRouteDrawerOpen) {
      setEditRouteData(prev => ({
        ...prev!,
        intermediateStops: reorder(prev?.intermediateStops)
      }));
    } else {
      setNewRouteData(prev => ({
        ...prev,
        intermediateStops: reorder(prev.intermediateStops)
      }));
    }
    toast({ title: 'Stops Reordered', description: 'Order updated locally. Save to persist.' });
  };

  // Add sightseeing option
  const handleAddSightseeingOption = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const newOption = {
      id: Date.now().toString(),
      location: '',
      description: '',
      adultPrice: 0,
      childPrice: 0,
      additionalCharges: 0
    };
    
    if (editRouteDrawerOpen && editRouteData) {
      setEditRouteData(prev => ({
        ...prev,
        sightseeingOptions: [...(prev?.sightseeingOptions || []), newOption]
      }));
    } else {
      setNewRouteData(prev => ({
        ...prev,
        sightseeingOptions: [...(prev.sightseeingOptions || []), newOption]
      }));
    }
  };

  // Remove sightseeing option
  const handleRemoveSightseeingOption = async (optionId: string) => {
    if (editRouteDrawerOpen && editRouteData) {
      // Local-only change; persisted on save
      setEditRouteData(prev => ({
        ...prev,
        sightseeingOptions: prev?.sightseeingOptions?.filter(option => option.id !== optionId) || []
      }));
    } else {
      setNewRouteData(prev => ({
        ...prev,
        sightseeingOptions: prev.sightseeingOptions?.filter(option => option.id !== optionId) || []
      }));
    }
  };

  // Update sightseeing option
  const handleSightseeingOptionChange = async (optionId: string, field: string, value: any) => {
    if (editRouteDrawerOpen && editRouteData) {
      // Local-only change; persisted on save
      setEditRouteData(prev => ({
        ...prev,
        sightseeingOptions: prev?.sightseeingOptions?.map(option => 
          option.id === optionId 
            ? { ...option, [field]: field.includes('Price') || field === 'additionalCharges' ? Number(value) : value }
            : option
        ) || []
      }));
    } else {
      setNewRouteData(prev => ({
        ...prev,
        sightseeingOptions: prev.sightseeingOptions?.map(option => 
          option.id === optionId 
            ? { ...option, [field]: field.includes('Price') || field === 'additionalCharges' ? Number(value) : value }
            : option
        ) || []
      }));
    }
  };

  // Add transport type
  const handleAddTransportType = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (editRouteDrawerOpen && editRouteData) {
      // Add transport type to edit route data
      setEditRouteData(prev => ({
        ...prev,
        transportTypes: [
          ...(prev?.transportTypes || []),
          { id: Date.now().toString(), type: 'Sedan', seatingCapacity: 4, luggageCapacity: 3, duration: '1h', price: 500 }
        ]
      }));
    } else {
      // Add transport type to new route data
      setNewRouteData(prev => ({
        ...prev,
        transportTypes: [
          ...(prev.transportTypes || []),
          { id: Date.now().toString(), type: 'Sedan', seatingCapacity: 4, luggageCapacity: 3, duration: '1h', price: 500 }
        ]
      }));
    }
  };
  
  // Remove transport type
  const handleRemoveTransportType = (typeId: string) => {
    if (editRouteDrawerOpen && editRouteData) {
      // Remove transport type from edit route data
      setEditRouteData(prev => ({
        ...prev,
        transportTypes: prev?.transportTypes.filter(type => type.id !== typeId) || []
      }));
    } else {
      // Remove transport type from new route data
      setNewRouteData(prev => ({
        ...prev,
        transportTypes: prev.transportTypes?.filter(type => type.id !== typeId) || []
      }));
    }
  };
  
  // Update transport type data
  const handleTransportTypeChange = (typeId: string, field: string, value: any) => {
    if (editRouteDrawerOpen && editRouteData) {
      // Update transport type in edit route data
      setEditRouteData(prev => ({
        ...prev,
        transportTypes: prev?.transportTypes.map(type => 
          type.id === typeId 
            ? { ...type, [field]: field === 'price' || field === 'seatingCapacity' || field === 'luggageCapacity' ? Number(value) : value }
            : type
        ) || []
      }));
    } else {
      // Update transport type in new route data
      setNewRouteData(prev => ({
        ...prev,
        transportTypes: prev.transportTypes?.map(type => 
          type.id === typeId 
            ? { ...type, [field]: field === 'price' || field === 'seatingCapacity' || field === 'luggageCapacity' ? Number(value) : value }
            : type
        ) || []
      }));
    }
  };
  
  // Save new route - Using comprehensive transport service
  const handleSaveNewRoute = async (formData?: Partial<TransportRoute>) => {
    try {
      // Prefer incoming form data from AddRouteSheet if provided; otherwise use local state
      const data = formData ?? newRouteData;

      // Validate form data using Zod schema
      const validationResult = routeFormSchema.safeParse({
        country: data.country,
        name: data.name,
        transferType: data.transferType,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        intermediateStops: data.intermediateStops,
        transportTypes: data.transportTypes,
        enableSightseeing: data.enableSightseeing,
        sightseeingOptions: data.sightseeingOptions,
        description: data.description,
        status: data.status
      });

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('\n');
        
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive"
        });
        return;
      }

      // Check for duplicate route names
      const existingRoute = routes.find(route => 
        route.name.toLowerCase() === (data.name ?? '').toLowerCase() &&
        route.country === data.country
      );
      
      if (existingRoute) {
        toast({
          title: "Duplicate Route",
          description: "A route with this name already exists in the selected country.",
          variant: "destructive"
        });
        return;
      }

      // Get location full names
      const startLocation = locations.find(loc => loc.code === data.startLocation);
      const endLocation = locations.find(loc => loc.code === data.endLocation);
      
      if (!startLocation || !endLocation) {
        toast({
          title: "Error",
          description: "Start or end location not found.",
          variant: "destructive"
        });
        return;
      }

      // Validate that start and end locations are different
      if (data.startLocation === data.endLocation) {
        toast({
          title: "Invalid Route",
          description: "Start and end locations cannot be the same.",
          variant: "destructive"
        });
        return;
      }

      // Validate intermediate stops don't duplicate start/end locations
      const allLocations = [data.startLocation, data.endLocation];
      const duplicateStops = data.intermediateStops?.filter(stop => 
        allLocations.includes(stop.locationCode)
      );
      
      if (duplicateStops && duplicateStops.length > 0) {
        toast({
          title: "Invalid Intermediate Stops",
          description: "Intermediate stops cannot be the same as start or end locations.",
          variant: "destructive"
        });
        return;
      }
      
      // Generate route code with improved format
      const routeCode = generateCompleteRouteCode(
        data.startLocation, 
        data.intermediateStops, 
        data.endLocation
      );
      
      // Create route name if not provided
      const routeName = data.name || `${startLocation.fullName} → ${endLocation.fullName}`;
      
      // Helper function to create coordinates JSON
      const createCoordinates = (location: LocationCode | undefined) => {
        if (!location?.latitude || !location?.longitude) return null;
        return {
          latitude: parseFloat(location.latitude.replace(/[°NSEW\s]/g, '')),
          longitude: parseFloat(location.longitude.replace(/[°NSEW\s]/g, ''))
        };
      };
      
      // Prepare payload for integrated service
      const payload: CreateTransportRoutePayload = {
        route_code: routeCode,
        route_name: routeName,
        country: data.country as string,
        transfer_type: data.transferType as 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route',
        start_location_code: data.startLocation as string,
        end_location_code: data.endLocation as string,
        // Live schema uses `notes` instead of `description`
        notes: data.description || '',
        // Map UI transportTypes into vehicle_types JSONB
        vehicle_types: (data.transportTypes || []).map(tt => ({
          transport_type: tt.type,
          seating_capacity: Number(tt.seatingCapacity) || 0,
          duration: tt.duration,
          price: Number(tt.price) || 0,
        })),
        // Map UI transportTypes into luggage_capacity JSONB
        luggage_capacity: (data.transportTypes || []).map(tt => ({
          transport_type: tt.type,
          bags: Number(tt.luggageCapacity) || 0,
          // Optionally support kg later; default undefined
          kg: undefined,
        })),
        status: data.status === 'active' ? 'active' : 'inactive',
        enable_sightseeing: data.enableSightseeing || false,
        intermediate_stops: data.intermediateStops?.map((stop, index) => ({
          stop_order: index + 1,
          location_code: stop.locationCode,
          coordinates: (stop as any).coordinates || null,
          transfer_method_notes: (stop as any).transferMethod || (stop as any).transfer_method_notes || null,
        })) || [],
        transport_types: (data.transportTypes || []).map(tt => ({
          type: tt.type,
          seating_capacity: Number(tt.seatingCapacity) || 0,
          luggage_capacity: Number(tt.luggageCapacity) || 0,
          duration: tt.duration,
          price: Number(tt.price) || 0,
        })),
        sightseeing_options: data.sightseeingOptions?.map(option => ({
          location: option.location,
          description: option.description || undefined,
          adult_price: Number(option.adultPrice) || 0,
          child_price: Number(option.childPrice) || 0,
          additional_charges: Number(option.additionalCharges) || 0,
        })) || [],
      };

      // Create route using integrated service
      const result = await integratedTransportService.createTransportRoute(payload);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create route');
      }

      // Create route segments for UI compatibility
      const routeSegments = generateRouteCodeSegments(
        data.startLocation, 
        data.intermediateStops, 
        data.endLocation
      );
      
      // Generate route path
      const routePath = [
        data.startLocation as string,
        ...(data.intermediateStops?.map(stop => stop.locationCode) || []),
        data.endLocation as string
      ];

      // Create the new route for UI state
      const newRoute: TransportRoute = {
        id: result.data.id,
        code: routeCode,
        name: routeName,
        country: result.data.country,
        transferType: result.data.transfer_type as 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route',
        // Use live schema columns
        startLocation: (result.data as any).start_location,
        startLocationFullName: (result.data as any).start_location_full_name || result.data.start_location_details?.full_name || startLocation.fullName,
        endLocation: (result.data as any).end_location,
        endLocationFullName: (result.data as any).end_location_full_name || result.data.end_location_details?.full_name || endLocation.fullName,
        intermediateStops: (result.data.intermediate_stops_data || []).map(stop => ({
          id: stop.id,
          locationCode: stop.location_code,
          fullName: stop.full_name || stop.location_details?.full_name || stop.location_code,
          transferMethod: '',
          coordinates: stop.coordinates || undefined
        })),
        transportTypes: (result.data.transport_types_data || []).map(tt => ({
          id: tt.id,
          // Use available fields; some schemas expose `name` or `category` instead of `type`
          type: ((tt as any).type as string) || (tt.name as string) || (tt.category as string) || '',
          seatingCapacity: Number(tt.seating_capacity) || 0,
          luggageCapacity: Number(tt.luggage_capacity) || 0,
          // Guard for schemas without duration/price
          duration: (((tt as any).duration as string) || ''),
          price: Number(((tt as any).price ?? 0)) || 0,
        })),
        enableSightseeing: !!(result.data as any).enable_sightseeing,
        sightseeingOptions: (result.data.sightseeing_options_data || []).map(option => ({
          id: option.id,
          location: option.location as string,
          description: (option.description as string) || '',
          adultPrice: Number(option.adult_price) || 0,
          childPrice: Number(option.child_price) || 0,
          additionalCharges: Number(option.additional_charges) || 0
        })),
        status: (result.data.status as 'active' | 'inactive'),
        routePath,
        distance: Number((result.data as any).distance) || 0,
        duration: ((result.data as any).duration as string) || '',
        // Prefer `notes` from live schema when present for description
        description: ((result.data as any).notes as string) || ((result.data as any).description as string) || '',
        routeSegments: routeSegments.map((segment, index) => {
          const fromLoc = index === 0 ? data.startLocation : 
            data.intermediateStops?.[index-1]?.locationCode;
          const toLoc = index === routeSegments.length - 1 ? data.endLocation : 
            data.intermediateStops?.[index]?.locationCode;
          return { fromLocation: fromLoc || '', toLocation: toLoc || '' };
        }),
        createdAt: (result.data as any).created_at as string,
        updatedAt: (result.data as any).updated_at as string
      };

      // Add the new route to the routes array
      setRoutes(prevRoutes => [...prevRoutes, newRoute]);
      resetNewRouteForm();
      setAddRouteDrawerOpen(false);
      
      toast({
        title: "Route Added",
        description: `${newRoute.name} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding new route:', error);
      
      let errorMessage = "Failed to add new route.";
      let errorTitle = "Error";
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = "Network Error";
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorTitle = "Request Timeout";
          errorMessage = "The request took too long to complete. Please try again.";
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorTitle = "Duplicate Route";
          errorMessage = "A route with similar details already exists.";
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          errorTitle = "Validation Error";
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  // Save edited route - With improved route code generation
  const handleSaveEditRoute = async (override?: Partial<TransportRoute>) => {
    if (editRouteData) {
      const source = override ? { ...editRouteData, ...override } : editRouteData;
      try {
        // Validate form data using Zod schema
        const validationResult = routeFormSchema.safeParse({
          country: source.country,
          name: source.name,
          transferType: source.transferType,
          startLocation: source.startLocation,
          endLocation: source.endLocation,
          intermediateStops: source.intermediateStops,
          transportTypes: source.transportTypes,
          enableSightseeing: source.enableSightseeing,
          sightseeingOptions: source.sightseeingOptions,
          description: source.description,
          status: source.status
        });

        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          ).join('\n');
          
          toast({
            title: "Validation Error",
            description: errorMessages,
            variant: "destructive"
          });
          return;
        }

        // Check for duplicate route names (excluding current route)
        const existingRoute = routes.find(route => 
          route.id !== editRouteData.id &&
          route.name.toLowerCase() === editRouteData.name.toLowerCase() &&
          route.country === editRouteData.country
        );
        
        if (existingRoute) {
          toast({
            title: "Duplicate Route",
            description: "A route with this name already exists in the selected country.",
            variant: "destructive"
          });
          return;
        }

        // Validate that start and end locations are different
        if (editRouteData.startLocation === editRouteData.endLocation) {
          toast({
            title: "Invalid Route",
            description: "Start and end locations cannot be the same.",
            variant: "destructive"
          });
          return;
        }

        // Validate intermediate stops don't duplicate start/end locations
        const allLocations = [source.startLocation, source.endLocation];
        const duplicateStops = source.intermediateStops?.filter(stop => 
          allLocations.includes(stop.locationCode)
        );
        
        if (duplicateStops && duplicateStops.length > 0) {
          toast({
            title: "Invalid Intermediate Stops",
            description: "Intermediate stops cannot be the same as start or end locations.",
            variant: "destructive"
          });
          return;
        }

        // Ensure the status is the correct literal type, not just a string
        const typedStatus = source.status === 'active' ? ('active' as const) : ('inactive' as const);
        
        // Generate updated route code
        const routeCode = generateCompleteRouteCode(
          source.startLocation, 
          source.intermediateStops, 
          source.endLocation
        );
        
        // Create route segments
        const routeSegments = generateRouteCodeSegments(
          source.startLocation, 
          source.intermediateStops, 
          source.endLocation
        );
        
      // Create a properly typed version of the edited route with improved route code
      const typedEditRouteData: TransportRoute = {
        ...source,
        status: typedStatus,
        code: routeCode,
        // Add the route segments
        routeSegments: routeSegments.map((segment, index) => {
          const fromLoc = index === 0 ? source.startLocation : 
            source.intermediateStops?.[index-1]?.locationCode;
          const toLoc = index === routeSegments.length - 1 ? source.endLocation : 
            source.intermediateStops?.[index]?.locationCode;
            
            return {
              fromLocation: fromLoc || '',
              toLocation: toLoc || '',
            };
          })
        };
        
        // Update the routes array with the typed data
        const updatedRoutes = routes.map(route => 
          route.id === typedEditRouteData.id ? typedEditRouteData : route
        );
        
        // If the route has a remote UUID ID, persist using comprehensive service
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(typedEditRouteData.id);
        if (isUUID) {
          // Get location details for coordinates
          const startLocation = locations.find(loc => loc.code === typedEditRouteData.startLocation);
          const endLocation = locations.find(loc => loc.code === typedEditRouteData.endLocation);
          
          // Helper function to create coordinates JSON
          const createCoordinates = (location: LocationCode | undefined) => {
            if (!location?.latitude || !location?.longitude) return null;
            return {
              latitude: parseFloat(location.latitude.replace(/[°NSEW\s]/g, '')),
              longitude: parseFloat(location.longitude.replace(/[°NSEW\s]/g, ''))
            };
          };

          // Prepare update payload for integrated service
          const updateData: UpdateTransportRoutePayload = {
            id: typedEditRouteData.id,
            route_code: routeCode,
            route_name: typedEditRouteData.name,
            country: typedEditRouteData.country,
            transfer_type: typedEditRouteData.transferType as 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route',
            start_location_code: typedEditRouteData.startLocation,
            end_location_code: typedEditRouteData.endLocation,
            // Live schema uses `notes`; map description to notes
            notes: typedEditRouteData.description || '',
            // Map UI transportTypes into vehicle_types JSONB
            vehicle_types: (typedEditRouteData.transportTypes || []).map(tt => ({
              transport_type: tt.type,
              seating_capacity: Number(tt.seatingCapacity) || 0,
              duration: tt.duration,
              price: Number(tt.price) || 0,
            })),
            // Map UI transportTypes into luggage_capacity JSONB
            luggage_capacity: (typedEditRouteData.transportTypes || []).map(tt => ({
              transport_type: tt.type,
              bags: Number(tt.luggageCapacity) || 0,
              kg: undefined,
            })),
            status: typedStatus,
            enable_sightseeing: typedEditRouteData.enableSightseeing || false,
            intermediate_stops: typedEditRouteData.intermediateStops?.map((stop, index) => ({
              stop_order: index + 1,
              location_code: stop.locationCode,
              coordinates: (stop as any).coordinates || null,
              transfer_method_notes: (stop as any).transferMethod || (stop as any).transfer_method_notes || null,
            })) || [],
            transport_types: (typedEditRouteData.transportTypes || []).map(tt => ({
              type: tt.type,
              seating_capacity: Number(tt.seatingCapacity) || 0,
              luggage_capacity: Number(tt.luggageCapacity) || 0,
              duration: tt.duration,
              price: Number(tt.price) || 0,
            })),
            sightseeing_options: typedEditRouteData.sightseeingOptions?.map(option => ({
              location: option.location,
              description: option.description || undefined,
              adult_price: Number(option.adultPrice) || 0,
              child_price: Number(option.childPrice) || 0,
              additional_charges: Number(option.additionalCharges) || 0,
            })) || [],
          };

          const result = await integratedTransportService.updateTransportRoute(updateData);
          if (!result.success) {
            throw new Error(result.error || 'Failed to update route');
          }
        }

        setRoutes(updatedRoutes);
        setEditRouteDrawerOpen(false);
        
        toast({
          title: "Route Updated",
          description: `${typedEditRouteData.name} has been updated successfully.`,
        });
      } catch (error) {
        console.error('Error updating route:', error);
        
        // Enhanced error handling with specific messages
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('fetch')) {
            toast({
              title: "Network Error",
              description: "Unable to connect to the server. Please check your internet connection and try again.",
              variant: "destructive"
            });
          } else if (error.message.includes('timeout')) {
            toast({
              title: "Request Timeout",
              description: "The request took too long to complete. Please try again.",
              variant: "destructive"
            });
          } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
            toast({
              title: "Duplicate Route",
              description: "A route with this name or code already exists. Please choose a different name.",
              variant: "destructive"
            });
          } else if (error.message.includes('validation') || error.message.includes('invalid')) {
            toast({
              title: "Validation Error",
              description: error.message || "Please check your input and try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Update Failed",
              description: error.message || "Failed to update route. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Unexpected Error",
            description: "An unexpected error occurred while updating the route. Please try again.",
            variant: "destructive"
          });
        }
      }
    }
  };
  
  // Reset new route form
  const resetNewRouteForm = () => {
    setNewRouteData({
      country: 'Thailand',
      transferType: 'One-Way',
      transportTypes: defaultTransportTypes,
      enableSightseeing: false,
      status: 'active' as const, // Use a const assertion to ensure it's the correct type
      intermediateStops: [],
      sightseeingOptions: [],
      description: ''
    });
  };
  
  // Edit from view
  const handleEditFromView = () => {
    if (selectedRoute) {
      // Create a deep copy of the route to avoid mutations
      const routeCopy = JSON.parse(JSON.stringify(selectedRoute));
      
      // Ensure sightseeingOptions is an array if it exists
      if (routeCopy.sightseeingOptions && !Array.isArray(routeCopy.sightseeingOptions)) {
        routeCopy.sightseeingOptions = [{ ...routeCopy.sightseeingOptions, id: Date.now().toString() }];
      } else if (!routeCopy.sightseeingOptions) {
        routeCopy.sightseeingOptions = [];
      }
      
      setEditRouteData(routeCopy);
      setViewRouteDrawerOpen(false);
      setEditRouteDrawerOpen(true);
    }
  };
  
  return {
    // Route data
    newRouteData,
    editRouteData,
    
    // Action handlers
    handleViewRoute,
    handleEditRoute,
    handleDeleteRoute,
    handleConfirmDelete,
    handleAddRoute,
    handleToggleStatus,
    
    // Form handlers
    handleNewRouteInputChange,
    handleEditRouteInputChange,
    
    // Intermediate stops CRUD
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleReorderStops,
    
    // Sightseeing options CRUD
    handleAddSightseeingOption,
    handleRemoveSightseeingOption,
    handleSightseeingOptionChange,
    
    // Transport types
    handleAddTransportType,
    handleRemoveTransportType,
    handleTransportTypeChange,
    
    // Save operations
    handleSaveNewRoute,
    handleSaveEditRoute,
    resetNewRouteForm,
    handleEditFromView,
    
    // Helper functions for route code generation
    generateRouteCodeSegments,
    generateCompleteRouteCode,
    extractShortCode,
    getLocationTypeDescription,
    
    // States from props for use in components
    viewRouteDrawerOpen,
    editRouteDrawerOpen,
    deleteRouteDialogOpen,
    addRouteDrawerOpen,
    selectedRoute,
    
    // Setter functions for drawer states
    setViewRouteDrawerOpen,
    setEditRouteDrawerOpen,
    setDeleteRouteDialogOpen,
    setAddRouteDrawerOpen,
    setSelectedRoute
  };
};
