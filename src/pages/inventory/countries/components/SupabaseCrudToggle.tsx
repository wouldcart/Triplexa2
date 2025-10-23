import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { CountriesService } from '@/services/countriesService';
import { supabase } from '@/lib/supabaseClient';
import { Country } from '../types/country';
import { useToast } from '@/hooks/use-toast';

interface SupabaseCrudToggleProps {
  onDataUpdate?: (countries: Country[]) => void;
  countries: Country[];
}

interface CrudOperation {
  id: string;
  type: 'create' | 'read' | 'update' | 'delete';
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
}

const SupabaseCrudToggle: React.FC<SupabaseCrudToggleProps> = ({ 
  onDataUpdate, 
  countries 
}) => {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [operations, setOperations] = useState<CrudOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Real-time subscription
  useEffect(() => {
    let subscription: any = null;

    if (isRealTimeEnabled) {
      setConnectionStatus('connecting');
      
      subscription = supabase
        .channel('countries-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'countries'
          },
          (payload) => {
            console.log('Real-time change detected:', payload);
            
            const operation: CrudOperation = {
              id: Date.now().toString(),
              type: payload.eventType === 'INSERT' ? 'create' : 
                    payload.eventType === 'UPDATE' ? 'update' : 
                    payload.eventType === 'DELETE' ? 'delete' : 'read',
              status: 'success',
              message: `Real-time ${payload.eventType} detected for country: ${
                payload.new?.name || payload.old?.name || 'Unknown'
              }`,
              timestamp: new Date()
            };
            
            setOperations(prev => [operation, ...prev.slice(0, 9)]);
            
            // Refresh data when changes are detected
            if (onDataUpdate) {
              refreshCountries();
            }
            
            toast({
              title: "Real-time Update",
              description: operation.message,
              duration: 3000,
            });
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            toast({
              title: "Real-time Connected",
              description: "Live database updates are now active",
              duration: 3000,
            });
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
            toast({
              title: "Connection Error",
              description: "Failed to establish real-time connection",
              variant: "destructive",
              duration: 3000,
            });
          }
        });
    } else {
      setConnectionStatus('disconnected');
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isRealTimeEnabled, onDataUpdate, toast]);

  const addOperation = (operation: Omit<CrudOperation, 'id' | 'timestamp'>) => {
    const newOperation: CrudOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setOperations(prev => [newOperation, ...prev.slice(0, 9)]);
  };

  const refreshCountries = async () => {
    const start = Date.now();
    setIsLoading(true);
    
    try {
      const response = await CountriesService.getAllCountries();
      const duration = Date.now() - start;
      
      if (response.success && response.data) {
        onDataUpdate?.(response.data);
        addOperation({
          type: 'read',
          status: 'success',
          message: `Refreshed ${response.data.length} countries`,
          duration
        });
      } else {
        addOperation({
          type: 'read',
          status: 'error',
          message: `Refresh failed: ${response.error}`,
          duration
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      addOperation({
        type: 'read',
        status: 'error',
        message: `Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateOperation = async () => {
    const start = Date.now();
    const testCountry = {
      name: `Test Country ${Date.now()}`,
      code: `T${Date.now().toString().slice(-2)}`,
      region: 'Test Region',
      continent: 'Test Continent',
      currency: 'USD',
      currency_symbol: '$',
      status: 'active' as const,
      flag_url: 'https://flagcdn.com/us.svg',
      is_popular: false,
      visa_required: false,
      languages: ['English'],
      pricing_currency_override: false,
      pricing_currency: null,
      pricing_currency_symbol: null,
    };

    try {
      const response = await CountriesService.createCountry(testCountry);
      const duration = Date.now() - start;
      
      if (response.success && response.data) {
        addOperation({
          type: 'create',
          status: 'success',
          message: `Created country: ${response.data.name}`,
          duration
        });
        await refreshCountries();
      } else {
        addOperation({
          type: 'create',
          status: 'error',
          message: `Create failed: ${response.error}`,
          duration
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      addOperation({
        type: 'create',
        status: 'error',
        message: `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
    }
  };

  const testUpdateOperation = async () => {
    if (countries.length === 0) {
      addOperation({
        type: 'update',
        status: 'error',
        message: 'No countries available to update'
      });
      return;
    }

    const start = Date.now();
    const countryToUpdate = countries[0];
    const updateData = {
      name: `${countryToUpdate.name} (Updated ${Date.now()})`,
      status: countryToUpdate.status === 'active' ? 'inactive' as const : 'active' as const
    };

    try {
      const response = await CountriesService.updateCountry(countryToUpdate.id, updateData);
      const duration = Date.now() - start;
      
      if (response.success && response.data) {
        addOperation({
          type: 'update',
          status: 'success',
          message: `Updated country: ${response.data.name}`,
          duration
        });
        await refreshCountries();
      } else {
        addOperation({
          type: 'update',
          status: 'error',
          message: `Update failed: ${response.error}`,
          duration
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      addOperation({
        type: 'update',
        status: 'error',
        message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
    }
  };

  const testDeleteOperation = async () => {
    // Find a test country to delete (one that starts with "Test Country")
    const testCountry = countries.find(c => c.name.startsWith('Test Country'));
    
    if (!testCountry) {
      addOperation({
        type: 'delete',
        status: 'error',
        message: 'No test countries available to delete. Create one first.'
      });
      return;
    }

    const start = Date.now();

    try {
      const response = await CountriesService.deleteCountry(testCountry.id);
      const duration = Date.now() - start;
      
      if (response.success) {
        addOperation({
          type: 'delete',
          status: 'success',
          message: `Deleted country: ${testCountry.name}`,
          duration
        });
        await refreshCountries();
        toast({
          title: "Delete Successful",
          description: `Country "${testCountry.name}" has been deleted from the database`,
          duration: 3000,
        });
      } else {
        addOperation({
          type: 'delete',
          status: 'error',
          message: `Delete failed: ${response.error}`,
          duration
        });
        toast({
          title: "Delete Failed",
          description: response.error || "Failed to delete country",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      addOperation({
        type: 'delete',
        status: 'error',
        message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const enhancedStatusToggle = async (countryId: string, newStatus: 'active' | 'inactive') => {
    const country = countries.find(c => c.id === countryId);
    if (!country) {
      addOperation({
        type: 'update',
        status: 'error',
        message: 'Country not found for status update'
      });
      return;
    }

    const start = Date.now();

    try {
      const response = await CountriesService.updateCountry(countryId, { status: newStatus });
      const duration = Date.now() - start;
      
      if (response.success && response.data) {
        addOperation({
          type: 'update',
          status: 'success',
          message: `Status updated: ${country.name} is now ${newStatus}`,
          duration
        });
        await refreshCountries();
        toast({
          title: "Status Updated",
          description: `${country.name} status changed to ${newStatus}`,
          duration: 3000,
        });
      } else {
        addOperation({
          type: 'update',
          status: 'error',
          message: `Status update failed: ${response.error}`,
          duration
        });
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update status",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      addOperation({
        type: 'update',
        status: 'error',
        message: `Status update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const deleteCountryById = async (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    if (!country) {
      addOperation({
        type: 'delete',
        status: 'error',
        message: 'Country not found for deletion'
      });
      return;
    }

    const start = Date.now();

    try {
      const response = await CountriesService.deleteCountry(countryId);
      const duration = Date.now() - start;
      
      if (response.success) {
        addOperation({
          type: 'delete',
          status: 'success',
          message: `Deleted country: ${country.name}`,
          duration
        });
        await refreshCountries();
        toast({
          title: "Delete Successful",
          description: `Country "${country.name}" has been deleted from the database`,
          duration: 3000,
        });
      } else {
        addOperation({
          type: 'delete',
          status: 'error',
          message: `Delete failed: ${response.error}`,
          duration
        });
        toast({
          title: "Delete Failed",
          description: response.error || "Failed to delete country",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      const duration = Date.now() - start;
      addOperation({
        type: 'delete',
        status: 'error',
        message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration
      });
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getOperationIcon = (type: CrudOperation['type']) => {
    switch (type) {
      case 'create': return <Plus className="h-3 w-3" />;
      case 'read': return <Eye className="h-3 w-3" />;
      case 'update': return <Edit className="h-3 w-3" />;
      case 'delete': return <Trash2 className="h-3 w-3" />;
    }
  };

  const getStatusIcon = (status: CrudOperation['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />;
      case 'pending': return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Supabase CRUD Operations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
              className={
                connectionStatus === 'connected' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            >
              {connectionStatus === 'connected' ? (
                <><Wifi className="h-3 w-3 mr-1" /> Connected</>
              ) : connectionStatus === 'connecting' ? (
                <><Activity className="h-3 w-3 mr-1 animate-pulse" /> Connecting</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
              )}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Real-time database operations with live updates
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Real-time Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">Real-time Updates</span>
          </div>
          <Switch
            checked={isRealTimeEnabled}
            onCheckedChange={setIsRealTimeEnabled}
            className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
          />
        </div>

        {/* CRUD Operation Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCountries}
            disabled={isLoading}
            className="flex items-center gap-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Read
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testCreateOperation}
            className="flex items-center gap-1 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400"
          >
            <Plus className="h-3 w-3" />
            Create
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testUpdateOperation}
            disabled={countries.length === 0}
            className="flex items-center gap-1 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
          >
            <Edit className="h-3 w-3" />
            Update
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testDeleteOperation}
            disabled={!countries.some(c => c.name.startsWith('Test Country'))}
            className="flex items-center gap-1 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOperations([])}
            className="flex items-center gap-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Clear Log
          </Button>
        </div>

        {/* Enhanced Country Management */}
        {countries.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ToggleLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Live Country Management
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {countries.slice(0, 5).map((country) => (
                <div
                  key={country.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {country.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {country.code} • {country.region}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={country.status}
                      onValueChange={(value: 'active' | 'inactive') => enhancedStatusToggle(country.id, value)}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive" className="text-xs">
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-gray-500" />
                            Inactive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCountryById(country.id)}
                      className="h-8 w-8 p-0 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {countries.length > 5 && (
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                  Showing first 5 countries. Total: {countries.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operations Log */}
        {operations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Recent Operations</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-1">
                    {getOperationIcon(operation.type)}
                    {getStatusIcon(operation.status)}
                  </div>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{operation.message}</span>
                  {operation.duration && (
                    <span className="text-gray-500 dark:text-gray-400">{operation.duration}ms</span>
                  )}
                  <span className="text-gray-500 dark:text-gray-400">
                    {operation.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseCrudToggle;