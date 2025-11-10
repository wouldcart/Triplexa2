
import { useState, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { locationCodes, transportTypes, transportRoutes as localTransportRoutes } from '../data/transportData';
import { TransportRoute, LocationCode, TransportType } from '../types/transportTypes';
import { CitiesService } from '@/services/citiesService';
import { CountriesService } from '@/services/countriesService';
import { City } from '../types/city';
import { listTransportTypes, mapTransportTypeRowToUI } from '@/services/transportTypesService';
import { listTransportRoutes } from '@/services/transportRoutesService';
import { listLocationCodes } from '@/services/locationCodesService';
import { supabase } from '@/lib/supabaseClient';

interface UseTransportDataProps {
  itemsPerPage?: number;
}

export const useTransportData = ({ itemsPerPage = 10 }: UseTransportDataProps = {}) => {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [locations, setLocations] = useState<LocationCode[]>([]);
  const [transport, setTransport] = useState<TransportType[]>([]);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  
  // Get active countries and cities from services
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      // Load countries and cities from services
      try {
        const countriesResponse = await CitiesService.getActiveCountries();
        if (countriesResponse.success && countriesResponse.data) {
          setCountries(countriesResponse.data);
        }
        
        const citiesResponse = await CitiesService.getActiveCities();
        if (citiesResponse.success && citiesResponse.data) {
          setCities(citiesResponse.data.map(city => ({
            id: parseInt(city.id, 10),
            name: city.name,
            country: city.country,
            status: city.status,
            region: city.region,
            hasAirport: city.has_airport,
            isPopular: city.is_popular,
          })));
        }
        // Load transport types from Supabase (admin client)
        try {
          const rows = await listTransportTypes();
          const mapped: TransportType[] = rows.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            seatingCapacity: r.seating_capacity,
            luggageCapacity: r.luggage_capacity,
            active: r.active,
          }));
          setTransport(mapped);
        } catch (err) {
          console.warn('Failed to load transport types from Supabase, falling back to local data:', err);
          // Fallback to local transport types
          setTransport(
            transportTypes.map(type => ({
              id: type.id,
              name: type.name,
              category: type.category,
              seatingCapacity: type.seatingCapacity,
              luggageCapacity: type.luggageCapacity,
              active: type.active
            }))
          );
        }
      } catch (error) {
        console.error('Error loading countries and cities:', error);
      }
    };

    const loadLocationCodesFromSupabase = async () => {
      try {
        const rows = await listLocationCodes();
        const mappedLocations: LocationCode[] = rows.map((row: any) => ({
          id: row.id,
          code: row.code,
          fullName: row.full_name,
          category: row.category,
          country: row.country,
          city: row.city,
          status: row.status,
          notes: row.notes,
          latitude: row.latitude ? String(row.latitude) : undefined,
          longitude: row.longitude ? String(row.longitude) : undefined,
        }));
        setLocations(mappedLocations);
        console.log(`Loaded ${mappedLocations.length} location codes from database`);
      } catch (err) {
        console.warn('Failed to load location codes from Supabase, falling back to local data:', err);
        // Fallback to local location codes
        setLocations(
          locationCodes.map(loc => ({
            id: loc.id,
            code: loc.code,
            fullName: loc.fullName,
            category: loc.category,
            country: loc.country,
            city: loc.city,
            status: loc.status
          }))
        );
      }
    };

    const loadRoutesFromSupabase = async () => {
      try {
        const rows = await listTransportRoutes();
        const mappedRoutes: TransportRoute[] = rows.map((row: any, idx: number) => {
          const startCode = row.start_location_code || row.start_location || '';
          const endCode = row.end_location_code || row.end_location || '';
          const code = row.route_code || [startCode, endCode].filter(Boolean).join('-');
          const vehicleTypesRaw = Array.isArray(row.vehicle_types)
            ? row.vehicle_types
            : Array.isArray(row.transport_types)
              ? row.transport_types
              : Array.isArray(row.transport_entries)
                ? row.transport_entries
                : [];
          const normalizedTypes = vehicleTypesRaw.map((t: any, i: number) => ({
            id: String(i + 1),
            type: t.type || t.name || t.vehicle_type || 'Standard',
            seatingCapacity: t.seatingCapacity ?? t.seating_capacity ?? t.capacity ?? 0,
            luggageCapacity: t.luggageCapacity ?? t.luggage_capacity ?? 0,
            duration: t.duration ?? '',
            price: typeof t.price === 'number' ? t.price : Number(t.price) || 0,
          }));
          return {
            id: row.id,
            code,
            name: row.name || row.route_name || '',
            country: row.country || '',
            transferType: (row.transfer_type as any) || 'One-Way',
            startLocation: startCode,
            startLocationFullName: row.start_location || startCode || '',
            endLocation: endCode,
            endLocationFullName: row.end_location || endCode || '',
            transportTypes: normalizedTypes,
            enableSightseeing: false,
            status: row.status || 'active',
            price: 0,
            distance: 0,
            duration: '',
            intermediateStops: [],
            description: '',
            routeSegments: []
          } as TransportRoute;
        });
        setRoutes(mappedRoutes);
      } catch (err) {
        console.error('Failed to load transport routes from Supabase:', err);
        // Fallback to local data to keep the inventory page functional
        const fallbackRoutes: TransportRoute[] = localTransportRoutes.map(r => ({
          id: r.id,
          code: r.code || `${r.startLocation || ''}-${r.endLocation || ''}`,
          name: r.name || `${r.startLocationFullName || r.startLocation || ''} to ${r.endLocationFullName || r.endLocation || ''}`,
          country: r.country || '',
          transferType: r.transferType || 'One-Way',
          startLocation: r.startLocation || '',
          startLocationFullName: r.startLocationFullName || r.startLocation || '',
          endLocation: r.endLocation || '',
          endLocationFullName: r.endLocationFullName || r.endLocation || '',
          transportTypes: Array.isArray(r.transportTypes) ? r.transportTypes : [],
          enableSightseeing: !!r.enableSightseeing,
          status: r.status || 'active',
          price: r.price || 0,
          distance: r.distance || 0,
          duration: r.duration || '',
          intermediateStops: r.intermediateStops || [],
          description: r.description || '',
          routeSegments: r.routeSegments || []
        }));
        setRoutes(fallbackRoutes);
      }
    };

    const init = async () => {
      await loadData();
      // Load location codes and routes in parallel to reduce initial latency
      await Promise.all([
        loadLocationCodesFromSupabase(),
        loadRoutesFromSupabase()
      ]);
    };

    init();

    // Realtime: subscribe to transport_routes changes
    const routesChannel = supabase
      .channel('public:transport_routes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transport_routes' },
        () => {
          // Refresh routes on any change
          loadRoutesFromSupabase();
        }
      )
      .subscribe();

    // Realtime: subscribe to location_codes changes
    const locationCodesChannel = supabase
      .channel('public:location_codes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_codes' },
        () => {
          // Refresh location codes on any change
          loadLocationCodesFromSupabase();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(routesChannel);
        supabase.removeChannel(locationCodesChannel);
      } catch (e) {
        console.error('Error removing channels:', e);
      }
    };
  }, []);
  
  // Removed: initial dummy routes setup. Routes now load from Supabase.
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [typeFilter, setTypeFilter] = useState('All Types');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Drawers and modals
  const [viewRouteDrawerOpen, setViewRouteDrawerOpen] = useState(false);
  const [editRouteDrawerOpen, setEditRouteDrawerOpen] = useState(false);
  const [deleteRouteDialogOpen, setDeleteRouteDialogOpen] = useState(false);
  const [addRouteDrawerOpen, setAddRouteDrawerOpen] = useState(false);
  const [transportTypesDrawerOpen, setTransportTypesDrawerOpen] = useState(false);
  const [locationCodesDrawerOpen, setLocationCodesDrawerOpen] = useState(false);
  
  // Selected item for view/edit/delete
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  
  // Import/Export
  const importFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Helper function to get cities for selected country
  const getCitiesForSelectedCountry = (): string[] => {
    if (countryFilter === 'All Countries') {
      return ['All Cities'];
    }
    
    const countryCities = cities
      .filter(city => city.country === countryFilter && city.status === 'active')
      .map(city => city.name);
    
    return ['All Cities', ...countryCities];
  };
  
  // Helper function to check if route involves a specific city
  const routeInvolvesCity = (route: TransportRoute, cityName: string): boolean => {
    if (cityName === 'All Cities') return true;
    
    // Check if start or end location corresponds to the city
    const startLocationCity = locations.find(loc => loc.code === route.startLocation)?.city;
    const endLocationCity = locations.find(loc => loc.code === route.endLocation)?.city;
    
    // Also check the location full names for direct city matches
    const startLocationName = route.startLocationFullName?.toLowerCase() || '';
    const endLocationName = route.endLocationFullName?.toLowerCase() || '';
    const cityNameLower = cityName.toLowerCase();
    
    return startLocationCity === cityName || 
           endLocationCity === cityName ||
           startLocationName.includes(cityNameLower) ||
           endLocationName.includes(cityNameLower);
  };
  
  // Filtered data (memoized)
  const filteredRoutes = useMemo(() => routes.filter(route => {
    const matchesSearch = 
      (route.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.startLocationFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.endLocationFullName?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false;
    
    const matchesCountry = countryFilter === 'All Countries' || route.country === countryFilter;
    const matchesCity = routeInvolvesCity(route, cityFilter);
    const matchesType = typeFilter === 'All Types' || route.transferType === typeFilter;
    
    return matchesSearch && matchesCountry && matchesCity && matchesType;
  }), [routes, searchQuery, countryFilter, cityFilter, typeFilter]);
  
  // Reset city filter when country changes
  useEffect(() => {
    setCityFilter('All Cities');
  }, [countryFilter]);
  
  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / itemsPerPage));
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter, cityFilter, typeFilter, itemsPerPage]);
  
  // Current page items (memoized)
  const currentRoutes = useMemo(() => filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ), [filteredRoutes, currentPage, itemsPerPage]);
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Get available countries from active countries list
  const availableCountries = ['All Countries', ...countries.map(country => country.name)];
  const availableCities = getCitiesForSelectedCountry();
  const transferTypes = ['All Types', 'One-Way', 'Round-Trip', 'Multi-Stop', 'en route', 'Private', 'SIC'];
  
  return {
    // Data
    routes,
    setRoutes,
    countries,
    cities,
    locations,
    setLocations,
    transport,
    setTransport,
    
    // Filtered and paginated data
    filteredRoutes,
    currentRoutes,
    
    // Filters
    searchQuery,
    setSearchQuery,
    countryFilter,
    setCountryFilter,
    cityFilter,
    setCityFilter,
    typeFilter,
    setTypeFilter,
    availableCountries,
    availableCities,
    transferTypes,
    
    // Pagination
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    
    // Drawers and dialogs
    viewRouteDrawerOpen,
    setViewRouteDrawerOpen,
    editRouteDrawerOpen,
    setEditRouteDrawerOpen,
    deleteRouteDialogOpen,
    setDeleteRouteDialogOpen,
    addRouteDrawerOpen,
    setAddRouteDrawerOpen,
    transportTypesDrawerOpen,
    setTransportTypesDrawerOpen,
    locationCodesDrawerOpen,
    setLocationCodesDrawerOpen,
    importDrawerOpen,
    setImportDrawerOpen,
    
    // Selected item
    selectedRoute,
    setSelectedRoute,
    
    // Import/Export
    importFileRef,
    toast,
  };
};

export default useTransportData;
