
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useComprehensiveTransportRoutes } from '@/hooks/useComprehensiveTransportRoutes';
import { useRouteActions } from '../../hooks/useRouteActions';
import { useTransportData } from '../../hooks/useTransportData';
import RouteFilters from '../RouteFilters';
import TransportRoutesTable from '../TransportRoutesTable';
import AddRouteSheet from '../AddRouteSheet';
import ViewRouteSheet from '../ViewRouteSheet';
import EditRouteSheet from '../EditRouteSheet';
import DeleteRouteDialog from '../DeleteRouteDialog';
import ImportRoutesModal from '../ImportRoutesModal';
import ExportRoutesModal from '../ExportRoutesModal';
import { useToast } from '@/hooks/use-toast';
import type { TransportRoute } from '../../types/transportTypes';
import type { CompleteTransportRoute } from '@/services/comprehensiveTransportService';
import type { TransportRouteType } from '../../types/transportTypes';
import { supabase } from '@/lib/supabaseClient';

// Safely parse potential JSON arrays (stringified or already arrays)
function parseJsonArraySafely(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Helper function to map CompleteTransportRoute to TransportRoute, including vehicle types
const mapCompleteRouteToTransportRoute = (completeRoute: CompleteTransportRoute): TransportRoute => {
  // Prefer vehicle_types, then transport_types, then transport_entries
  const rawVehicleTypes = parseJsonArraySafely(
    (completeRoute as any).vehicle_types ?? (completeRoute as any).transport_types ?? (completeRoute as any).transport_entries
  );

  const transportTypes: TransportRouteType[] = rawVehicleTypes.map((vt: any, index: number) => ({
    id: String(index + 1),
    type: vt.transport_type ?? vt.type ?? 'N/A',
    vehicleName: vt.vehicle_name ?? vt.vehicleName ?? undefined,
    seatingCapacity: Number(vt.seating_capacity ?? vt.seatingCapacity ?? 0),
    luggageCapacity: Number(vt.luggage_capacity ?? vt.luggageCapacity ?? 0),
    duration: vt.duration ?? '',
    price: Number(vt.price ?? 0),
  }));

  const normalizedIsActive = typeof (completeRoute as any).is_active === 'boolean'
    ? Boolean((completeRoute as any).is_active)
    : String(completeRoute.status || '').toLowerCase() === 'active';

  const normalizedStatus: 'active' | 'inactive' = normalizedIsActive ? 'active' : 'inactive';

  return {
    id: completeRoute.id,
    code: completeRoute.route_code || '',
    name: completeRoute.route_name || '',
    country: completeRoute.country || '',
    transferType: completeRoute.transfer_type as any,
    startLocation: completeRoute.start_location || '',
    startLocationFullName: completeRoute.start_location_full_name || '',
    endLocation: completeRoute.end_location || '',
    endLocationFullName: completeRoute.end_location_full_name || '',
    status: normalizedStatus,
    isActive: normalizedIsActive,
    distance: completeRoute.distance || 0,
    duration: completeRoute.duration || '',
    description: completeRoute.notes || '',
    enableSightseeing: completeRoute.enable_sightseeing || false,
    transportTypes,
    intermediateStops: completeRoute.intermediate_stops?.map(stop => ({
      id: stop.id,
      locationCode: stop.location_code || '',
      fullName: stop.full_name || '',
      // Cast to any to tolerate type variance across generated Supabase types
      transferMethod: (stop as any).transfer_method_notes || ''
    })) || [],
    sightseeingOptions: completeRoute.sightseeing_options?.map(option => ({
      id: option.id,
      location: option.location || '',
      description: option.description || '',
      adultPrice: option.adult_price || 0,
      childPrice: option.child_price || 0,
      additionalCharges: option.additional_charges || 0
    })) || [],
    createdAt: completeRoute.created_at,
    updatedAt: completeRoute.updated_at
  };
};

export default function TransportRoutesTab() {
  const { toast } = useToast();
  
  // Local state for UI
  // Use string type to align with filters prop signature
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  
  // Route action state variables
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [viewRouteDrawerOpen, setViewRouteDrawerOpen] = useState(false);
  const [editRouteDrawerOpen, setEditRouteDrawerOpen] = useState(false);
  const [deleteRouteDialogOpen, setDeleteRouteDialogOpen] = useState(false);
  const [addRouteDrawerOpen, setAddRouteDrawerOpen] = useState(false);
  
  // Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [typeFilter, setTypeFilter] = useState('All Types');
  
  // Filters for the comprehensive service
  const [filters, setFilters] = useState<{
    country?: string;
    transfer_type?: string;
    status?: string;
    enable_sightseeing?: boolean;
  }>({});

  // Use the comprehensive transport routes hook
  const {
    routes,
    loading,
    error,
    createRoute,
    updateRoute,
    deleteRoute,
    refresh,
    transportTypes,
    statistics
  } = useComprehensiveTransportRoutes({ filters });

  // Get locations from useTransportData
  const { locations, countries, transport } = useTransportData();

  // Convert complete routes to transport routes for UI compatibility
  const transportRoutes = useMemo(() => {
    if (!routes || !Array.isArray(routes)) {
      return [];
    }
    return routes.map(mapCompleteRouteToTransportRoute);
  }, [routes]);

  // Derive the comprehensive route for edit sheet from selected UI route
  const selectedIntegratedRoute = useMemo<CompleteTransportRoute | null>(() => {
    if (!selectedRoute || !routes) return null;
    return routes.find(r => r.id === selectedRoute.id) || null;
  }, [selectedRoute, routes]);

  // Use route actions for form management
  const routeActions = useRouteActions({
    routes: transportRoutes,
    setRoutes: () => {},
    locations: locations || [],
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
  });

  // Update filters based on tab, search, country, and type
  useEffect(() => {
    const newFilters: typeof filters = {};

    // Status by tab
    switch (currentTab) {
      case 'active':
        newFilters.status = 'active';
        break;
      case 'disabled':
        newFilters.status = 'inactive';
        break;
      case 'all':
      default:
        // No status filter for 'all'
        break;
    }

    // Country filter (skip "All Countries")
    if (countryFilter && countryFilter !== 'All Countries') {
      newFilters.country = countryFilter;
    }

    // Type filter (skip "All Types")
    if (typeFilter && typeFilter !== 'All Types') {
      newFilters.transfer_type = typeFilter;
    }

    // Search query
    if (searchQuery && searchQuery.trim().length > 0) {
      // The service supports a generic search key
      (newFilters as any).search = searchQuery.trim();
    }

    setFilters(newFilters);
  }, [currentTab, countryFilter, typeFilter, searchQuery]);

  // Handle toggle status: update via Supabase and refresh
  const handleToggleStatus = async (routeId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('transport_routes')
        .update({
          status: newStatus ? 'active' : 'inactive'
        })
        .eq('id', routeId);

      if (error) {
        console.error('Failed to update status:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Route status updated to ${newStatus ? 'active' : 'inactive'}`,
      });
      
      await refresh();
    } catch (error) {
      console.error('Error updating route status:', error);
      toast({
        title: "Error",
        description: "Failed to update route status",
        variant: "destructive",
      });
    }
  };

  // Handle import routes
  const handleImportRoutes = async (importedRoutes: any[]) => {
    try {
      for (const routeData of importedRoutes) {
        // Format the route data for the comprehensive service
        const formattedRoute = {
          route_name: routeData.name || `${routeData.startLocation} to ${routeData.endLocation}`,
          country: routeData.country || '',
          transfer_type: routeData.transferType || 'One-Way',
          start_location: routeData.startLocation || '',
          end_location: routeData.endLocation || '',
          start_location_full_name: routeData.startLocationFullName || '',
          end_location_full_name: routeData.endLocationFullName || '',
          distance: routeData.distance || 0,
          duration: routeData.duration || '',
          notes: routeData.description || '',
          status: routeData.status || 'active',
          enable_sightseeing: routeData.enableSightseeing || false
        };
        
        await createRoute(formattedRoute);
      }
      
      toast({
        title: "Success",
        description: `Successfully imported ${importedRoutes.length} routes`,
      });
      
      await refresh();
    } catch (error) {
      console.error('Error importing routes:', error);
      toast({
        title: "Error",
        description: "Failed to import routes",
        variant: "destructive",
      });
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Helper to check if a route involves a given city
  const routeInvolvesCity = useCallback((route: TransportRoute, city: string) => {
    if (!city || city === 'All Cities') return true;
    const startLoc = (locations || []).find(l => l.code === route.startLocation);
    const endLoc = (locations || []).find(l => l.code === route.endLocation);
    return (
      (startLoc?.city && startLoc.city === city) ||
      (endLoc?.city && endLoc.city === city) ||
      (route.startLocationFullName && route.startLocationFullName.toLowerCase().includes(city.toLowerCase())) ||
      (route.endLocationFullName && route.endLocationFullName.toLowerCase().includes(city.toLowerCase()))
    );
  }, [locations]);

  // Filter routes for display: status tab, country, city, type, search
  const displayRoutes = useMemo(() => {
    let result = transportRoutes;

    // Special tab
    if (currentTab === 'special') {
      result = result.filter(route => route.transferType === 'Multi-Stop' || route.transferType === 'en route');
    }

    // Country
    if (countryFilter && countryFilter !== 'All Countries') {
      result = result.filter(route => (route.country || '').toLowerCase() === countryFilter.toLowerCase());
    }

    // City
    if (cityFilter && cityFilter !== 'All Cities') {
      result = result.filter(route => routeInvolvesCity(route, cityFilter));
    }

    // Type
    if (typeFilter && typeFilter !== 'All Types') {
      result = result.filter(route => (route.transferType || '').toLowerCase() === typeFilter.toLowerCase());
    }

    // Search
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(route => {
        return (
          (route.name && route.name.toLowerCase().includes(q)) ||
          (route.code && route.code.toLowerCase().includes(q)) ||
          (route.description && route.description.toLowerCase().includes(q)) ||
          (route.startLocation && route.startLocation.toLowerCase().includes(q)) ||
          (route.endLocation && route.endLocation.toLowerCase().includes(q)) ||
          (route.startLocationFullName && route.startLocationFullName.toLowerCase().includes(q)) ||
          (route.endLocationFullName && route.endLocationFullName.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [transportRoutes, currentTab, countryFilter, cityFilter, typeFilter, searchQuery, routeInvolvesCity]);

  // Calculate total pages based on filtered routes
  const totalDisplayPages = Math.max(1, Math.ceil(displayRoutes.length / itemsPerPage));
  
  // Get paginated routes
  const currentPageRoutes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayRoutes.slice(startIndex, startIndex + itemsPerPage);
  }, [displayRoutes, currentPage, itemsPerPage]);
  
  // Pagination functions
  const nextPage = useCallback(() => {
    if (currentPage < totalDisplayPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalDisplayPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalDisplayPages) {
      setCurrentPage(page);
    }
  }, [totalDisplayPages]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Routes</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouteFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        availableCountries={['All Countries', ...Array.from(new Set(locations?.map(loc => loc.country) || []))]}
        availableCities={['All Cities', ...Array.from(new Set(locations?.map(loc => loc.city) || []))]}
        transferTypes={['All Types', 'One-Way', 'Round-Trip', 'Multi-Stop', 'en route']}
        currentTab={currentTab}
        setCurrentTab={(tab: string) => setCurrentTab(tab)}
        onAddRoute={routeActions.handleAddRoute}
        onImport={() => setImportDrawerOpen(true)}
        onExport={() => setExportDrawerOpen(true)}
      />

      <TransportRoutesTable 
        routes={currentPageRoutes}
        currentPage={currentPage}
        totalPages={totalDisplayPages}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onPageSelect={goToPage}
        onView={routeActions.handleViewRoute}
        onEdit={routeActions.handleEditRoute}
        onDelete={routeActions.handleDeleteRoute}
        onToggleStatus={handleToggleStatus}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <AddRouteSheet 
        isOpen={routeActions.addRouteDrawerOpen}
        onClose={() => routeActions.setAddRouteDrawerOpen(false)}
        onSave={routeActions.handleSaveNewRoute}
        countries={countries || []}
        locations={locations || []}
        transportTypes={transport || []}
      />

      <ViewRouteSheet 
        isOpen={routeActions.viewRouteDrawerOpen}
        onClose={() => routeActions.setViewRouteDrawerOpen(false)}
        route={routeActions.selectedRoute}
        onEdit={routeActions.handleEditFromView}
      />

      <EditRouteSheet 
        isOpen={routeActions.editRouteDrawerOpen}
        onClose={() => routeActions.setEditRouteDrawerOpen(false)}
        onSave={routeActions.handleSaveEditRoute}
        route={selectedIntegratedRoute}
        countries={countries || []}
        locations={locations || []}
        transportTypes={transport || []}
      />

      <DeleteRouteDialog 
        isOpen={routeActions.deleteRouteDialogOpen}
        onClose={() => routeActions.setDeleteRouteDialogOpen(false)}
        onConfirm={routeActions.handleConfirmDelete}
        route={routeActions.selectedRoute}
      />

      <ImportRoutesModal
        isOpen={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
      />
      <ExportRoutesModal
        isOpen={exportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
      />
    </>
  );
}
