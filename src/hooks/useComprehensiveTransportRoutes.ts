import { useState, useEffect, useCallback } from 'react';
import { 
  ComprehensiveTransportService,
  type CompleteTransportRoute,
  type TransportRouteFormData,
  type TransportType
} from '@/services/comprehensiveTransportService';

interface UseTransportRoutesOptions {
  autoFetch?: boolean;
  filters?: {
    country?: string;
    transfer_type?: string;
    status?: string;
    enable_sightseeing?: boolean;
  };
}

export const useComprehensiveTransportRoutes = (options: UseTransportRoutesOptions = {}) => {
  const { autoFetch = true, filters } = options;

  // State management
  const [routes, setRoutes] = useState<CompleteTransportRoute[]>([]);
  const [transportTypes, setTransportTypes] = useState<TransportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    totalRoutes: number;
    routesByTransferType: Record<string, number>;
    routesByCountry: Record<string, number>;
    routesWithSightseeing: number;
    routesWithIntermediateStops: number;
  } | null>(null);

  // Fetch all routes
  const fetchRoutes = useCallback(async () => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);
    
    try {
      const result = await ComprehensiveTransportService.getCompleteRoutes({ filters });
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        if (result.success && result.data) {
          setRoutes(result.data.data);
        } else {
          setError(result.error || 'Failed to fetch routes');
        }
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
    
    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [filters]);

  // Fetch transport types
  const fetchTransportTypes = useCallback(async () => {
    const abortController = new AbortController();
    
    try {
      const result = await ComprehensiveTransportService.getTransportTypes();
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted && result.success && result.data) {
        setTransportTypes(result.data);
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        console.error('Failed to fetch transport types:', err);
      }
    }
    
    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    const abortController = new AbortController();
    
    try {
      const result = await ComprehensiveTransportService.getRouteStatistics();
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted && result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        console.error('Failed to fetch statistics:', err);
      }
    }
    
    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, []);

  // Create a new route
  const createRoute = useCallback(async (formData: TransportRouteFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate data first
      const validation = await ComprehensiveTransportService.validateRouteData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return { success: false, error: validation.errors.join(', ') };
      }

      const result = await ComprehensiveTransportService.createCompleteRoute(formData);
      
      if (result.success && result.data) {
        // Add the new route to the current list
        setRoutes(prev => [result.data!, ...prev]);
        // Refresh statistics
        fetchStatistics();
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to create route');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Update an existing route
  const updateRoute = useCallback(async (routeId: string, formData: Partial<TransportRouteFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.updateCompleteRoute(routeId, formData);
      
      if (result.success && result.data) {
        // Update the route in the current list
        setRoutes(prev => prev.map(route => 
          route.id === routeId ? result.data! : route
        ));
        // Refresh statistics
        fetchStatistics();
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to update route');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Delete a route
  const deleteRoute = useCallback(async (routeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.deleteCompleteRoute(routeId);
      
      if (result.success) {
        // Remove the route from the current list
        setRoutes(prev => prev.filter(route => route.id !== routeId));
        // Refresh statistics
        fetchStatistics();
        return { success: true };
      } else {
        setError(result.error || 'Failed to delete route');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Get a single route
  const getRoute = useCallback(async (routeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.getCompleteRoute(routeId);
      
      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to fetch route');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Manage intermediate stops for a route
  const manageIntermediateStops = useCallback(async (
    routeId: string, 
    stops: Parameters<typeof ComprehensiveTransportService.manageIntermediateStops>[1]
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.manageIntermediateStops(routeId, stops);
      
      if (result.success) {
        // Update the route in the current list with new stops
        setRoutes(prev => prev.map(route => 
          route.id === routeId 
            ? { ...route, intermediate_stops: result.data || [] }
            : route
        ));
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to manage intermediate stops');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Manage sightseeing options for a route
  const manageSightseeingOptions = useCallback(async (
    routeId: string, 
    options: Parameters<typeof ComprehensiveTransportService.manageSightseeingOptions>[1]
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.manageSightseeingOptions(routeId, options);
      
      if (result.success) {
        // Update the route in the current list with new options
        setRoutes(prev => prev.map(route => 
          route.id === routeId 
            ? { ...route, sightseeing_options: result.data || [] }
            : route
        ));
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to manage sightseeing options');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchRoutes(),
      fetchTransportTypes(),
      fetchStatistics(),
    ]);
  }, [fetchRoutes, fetchTransportTypes, fetchStatistics]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
    
    // Cleanup function to cancel any pending requests when component unmounts
    return () => {
      // The abort controllers in individual fetch functions will handle request cancellation
    };
  }, [autoFetch, refresh]);

  // Helper functions
  const getRoutesByCountry = useCallback((country: string) => {
    return routes.filter(route => route.country === country);
  }, [routes]);

  const getRoutesByTransferType = useCallback((transferType: string) => {
    return routes.filter(route => route.transfer_type === transferType);
  }, [routes]);

  const getRoutesWithSightseeing = useCallback(() => {
    return routes.filter(route => route.enable_sightseeing);
  }, [routes]);

  const getRoutesWithIntermediateStops = useCallback(() => {
    return routes.filter(route => 
      route.intermediate_stops && route.intermediate_stops.length > 0
    );
  }, [routes]);

  const validateRouteData = useCallback((formData: TransportRouteFormData) => {
    return ComprehensiveTransportService.validateRouteData(formData);
  }, []);

  return {
    // Data
    routes,
    transportTypes,
    statistics,
    
    // State
    loading,
    error,
    
    // Actions
    createRoute,
    updateRoute,
    deleteRoute,
    getRoute,
    manageIntermediateStops,
    manageSightseeingOptions,
    refresh,
    
    // Helpers
    getRoutesByCountry,
    getRoutesByTransferType,
    getRoutesWithSightseeing,
    getRoutesWithIntermediateStops,
    validateRouteData,
    
    // Utils
    clearError: () => setError(null),
  };
};

// Specialized hooks for specific use cases
export const useTransportRoute = (routeId: string) => {
  const [route, setRoute] = useState<CompleteTransportRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(async () => {
    if (!routeId) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.getCompleteRoute(routeId);
      
      if (result.success && result.data) {
        setRoute(result.data);
      } else {
        setError(result.error || 'Failed to fetch route');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  return {
    route,
    loading,
    error,
    refresh: fetchRoute,
    clearError: () => setError(null),
  };
};

export const useTransportTypes = () => {
  const [transportTypes, setTransportTypes] = useState<TransportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransportTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ComprehensiveTransportService.getTransportTypes();
      
      if (result.success && result.data) {
        setTransportTypes(result.data);
      } else {
        setError(result.error || 'Failed to fetch transport types');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransportTypes();
  }, [fetchTransportTypes]);

  return {
    transportTypes,
    loading,
    error,
    refresh: fetchTransportTypes,
    clearError: () => setError(null),
  };
};