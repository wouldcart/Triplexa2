import { useState, useEffect, useCallback } from 'react';
import { 
  integratedTransportService,
  type IntegratedTransportRoute,
  type CreateTransportRoutePayload,
  type UpdateTransportRoutePayload
} from '@/services/integratedTransportService';
import { toast } from 'sonner';

interface UseIntegratedTransportRoutesOptions {
  autoLoad?: boolean;
  filters?: {
    country?: string;
    status?: string;
    transfer_type?: string;
    include_related?: boolean;
  };
}

interface UseIntegratedTransportRoutesReturn {
  // Data
  routes: IntegratedTransportRoute[];
  currentRoute: IntegratedTransportRoute | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  loadRoutes: () => Promise<void>;
  loadRoute: (id: string) => Promise<void>;
  createRoute: (payload: CreateTransportRoutePayload) => Promise<boolean>;
  updateRoute: (payload: UpdateTransportRoutePayload) => Promise<boolean>;
  deleteRoute: (id: string) => Promise<boolean>;
  validateConsistency: () => Promise<void>;
  clearError: () => void;
  clearCurrentRoute: () => void;
  
  // Utilities
  refresh: () => Promise<void>;
}

/**
 * React hook for managing integrated transport routes
 * Provides CRUD operations and state management for transport routes with proper table relationships
 */
export function useIntegratedTransportRoutes(
  options: UseIntegratedTransportRoutesOptions = {}
): UseIntegratedTransportRoutesReturn {
  const { autoLoad = true, filters } = options;

  // State
  const [routes, setRoutes] = useState<IntegratedTransportRoute[]>([]);
  const [currentRoute, setCurrentRoute] = useState<IntegratedTransportRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current route
  const clearCurrentRoute = useCallback(() => {
    setCurrentRoute(null);
  }, []);

  // Load routes
  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await integratedTransportService.listTransportRoutes(filters);
      
      if (result.success && result.data) {
        setRoutes(result.data);
      } else {
        setError(result.error || 'Failed to load transport routes');
        toast.error('Failed to load transport routes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to load transport routes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load single route
  const loadRoute = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await integratedTransportService.getTransportRoute(id);
      
      if (result.success && result.data) {
        setCurrentRoute(result.data);
      } else {
        setError(result.error || 'Failed to load transport route');
        toast.error('Failed to load transport route');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to load transport route');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create route
  const createRoute = useCallback(async (payload: CreateTransportRoutePayload): Promise<boolean> => {
    setCreating(true);
    setError(null);
    
    try {
      const result = await integratedTransportService.createTransportRoute(payload);
      
      if (result.success && result.data) {
        setRoutes(prev => [...prev, result.data!]);
        setCurrentRoute(result.data);
        toast.success('Transport route created successfully');
        return true;
      } else {
        setError(result.error || 'Failed to create transport route');
        toast.error(result.error || 'Failed to create transport route');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to create transport route');
      return false;
    } finally {
      setCreating(false);
    }
  }, []);

  // Update route
  const updateRoute = useCallback(async (payload: UpdateTransportRoutePayload): Promise<boolean> => {
    setUpdating(true);
    setError(null);
    
    try {
      const result = await integratedTransportService.updateTransportRoute(payload);
      
      if (result.success && result.data) {
        setRoutes(prev => 
          prev.map(route => 
            route.id === payload.id ? result.data! : route
          )
        );
        
        if (currentRoute?.id === payload.id) {
          setCurrentRoute(result.data);
        }
        
        toast.success('Transport route updated successfully');
        return true;
      } else {
        setError(result.error || 'Failed to update transport route');
        toast.error(result.error || 'Failed to update transport route');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to update transport route');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [currentRoute]);

  // Delete route
  const deleteRoute = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true);
    setError(null);
    
    try {
      const result = await integratedTransportService.deleteTransportRoute(id);
      
      if (result.success) {
        setRoutes(prev => prev.filter(route => route.id !== id));
        
        if (currentRoute?.id === id) {
          setCurrentRoute(null);
        }
        
        toast.success('Transport route deleted successfully');
        return true;
      } else {
        setError(result.error || 'Failed to delete transport route');
        toast.error(result.error || 'Failed to delete transport route');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to delete transport route');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [currentRoute]);

  // Validate data consistency
  const validateConsistency = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await integratedTransportService.validateDataConsistency();
      
      if (result.success) {
        if (result.issues && result.issues.length > 0) {
          const issueCount = result.issues.length;
          toast.warning(`Found ${issueCount} data consistency issue${issueCount > 1 ? 's' : ''}`);
          console.warn('Data consistency issues:', result.issues);
        } else {
          toast.success('No data consistency issues found');
        }
      } else {
        setError(result.error || 'Failed to validate data consistency');
        toast.error('Failed to validate data consistency');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to validate data consistency');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadRoutes();
  }, [loadRoutes]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadRoutes();
    }
  }, [autoLoad, loadRoutes]);

  return {
    // Data
    routes,
    currentRoute,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    
    // Actions
    loadRoutes,
    loadRoute,
    createRoute,
    updateRoute,
    deleteRoute,
    validateConsistency,
    clearError,
    clearCurrentRoute,
    
    // Utilities
    refresh
  };
}

/**
 * Hook for managing a single transport route
 */
export function useIntegratedTransportRoute(id?: string) {
  const {
    currentRoute,
    loading,
    updating,
    deleting,
    error,
    loadRoute,
    updateRoute,
    deleteRoute,
    clearError,
    clearCurrentRoute
  } = useIntegratedTransportRoutes({ autoLoad: false });

  // Load route when ID changes
  useEffect(() => {
    if (id) {
      loadRoute(id);
    } else {
      clearCurrentRoute();
    }
  }, [id, loadRoute, clearCurrentRoute]);

  return {
    route: currentRoute,
    loading,
    updating,
    deleting,
    error,
    updateRoute,
    deleteRoute,
    clearError,
    reload: () => id ? loadRoute(id) : Promise.resolve()
  };
}

/**
 * Hook for creating transport routes
 */
export function useCreateIntegratedTransportRoute() {
  const { createRoute, creating, error, clearError } = useIntegratedTransportRoutes({ autoLoad: false });

  return {
    createRoute,
    creating,
    error,
    clearError
  };
}

export default useIntegratedTransportRoutes;