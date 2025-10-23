import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, MapPin, Clock, Users, DollarSign, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComprehensiveTransportRoutes } from '@/hooks/useComprehensiveTransportRoutes';
import { TransportRouteForm } from './TransportRouteForm';
import { TransportRouteDetails } from './TransportRouteDetails';
import type { CompleteTransportRoute } from '@/services/comprehensiveTransportService';

interface TransportRoutesPageProps {
  className?: string;
}

export const TransportRoutesPage: React.FC<TransportRoutesPageProps> = ({ className }) => {
  // State management
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingRoute, setEditingRoute] = useState<CompleteTransportRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<CompleteTransportRoute | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    transfer_type: '',
    status: '',
    enable_sightseeing: undefined as boolean | undefined,
  });

  // Hook for transport routes
  const {
    routes,
    transportTypes,
    statistics,
    loading,
    error,
    createRoute,
    updateRoute,
    deleteRoute,
    refresh,
    clearError,
  } = useComprehensiveTransportRoutes({ filters });

  // Filter routes based on search term
  const filteredRoutes = routes.filter(route => {
    const searchLower = searchTerm.toLowerCase();
    return (
      route.route_code?.toLowerCase().includes(searchLower) ||
      route.origin_city?.toLowerCase().includes(searchLower) ||
      route.destination_city?.toLowerCase().includes(searchLower) ||
      route.country?.toLowerCase().includes(searchLower) ||
      route.transfer_type?.toLowerCase().includes(searchLower)
    );
  });

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    try {
      let result;
      
      if (editingRoute) {
        result = await updateRoute(editingRoute.id, formData);
      } else {
        result = await createRoute(formData);
      }

      if (result.success) {
        setShowForm(false);
        setEditingRoute(null);
        // Show success message (you can implement toast notifications)
        console.log('Route saved successfully');
      }
    } catch (err) {
      console.error('Failed to save route:', err);
    }
  };

  // Handle delete
  const handleDelete = async (routeId: string) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      const result = await deleteRoute(routeId);
      if (result.success) {
        console.log('Route deleted successfully');
      }
    }
  };

  // Handle edit
  const handleEdit = (route: CompleteTransportRoute) => {
    setEditingRoute(route);
    setShowForm(true);
  };

  // Handle view details
  const handleViewDetails = (route: CompleteTransportRoute) => {
    setSelectedRoute(route);
    setShowDetails(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      country: '',
      transfer_type: '',
      status: '',
      enable_sightseeing: undefined,
    });
    setSearchTerm('');
  };

  // Get unique countries for filter
  const uniqueCountries = Array.from(new Set(routes.map(route => route.country).filter(Boolean)));

  // Transfer type options
  const transferTypeOptions = ['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transport Routes</h1>
          <p className="text-muted-foreground">
            Manage transport routes, intermediate stops, and sightseeing options
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Route
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Routes</p>
                  <p className="text-2xl font-bold">{statistics.totalRoutes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">With Sightseeing</p>
                  <p className="text-2xl font-bold">{statistics.routesWithSightseeing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Multi-Stop</p>
                  <p className="text-2xl font-bold">{statistics.routesWithIntermediateStops}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Countries</p>
                  <p className="text-2xl font-bold">{Object.keys(statistics.routesByCountry).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Country Filter */}
            <Select value={filters.country} onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {uniqueCountries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Transfer Type Filter */}
            <Select value={filters.transfer_type} onValueChange={(value) => setFilters(prev => ({ ...prev, transfer_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {transferTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sightseeing Filter */}
            <Select 
              value={filters.enable_sightseeing === undefined ? '' : filters.enable_sightseeing.toString()} 
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                enable_sightseeing: value === '' ? undefined : value === 'true' 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sightseeing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">With Sightseeing</SelectItem>
                <SelectItem value="false">Without Sightseeing</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle>Routes ({filteredRoutes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No routes found</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Create your first route
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRoutes.map((route) => (
                <Card key={route.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{route.route_code}</h3>
                          <Badge variant={route.transfer_type === 'One-Way' ? 'default' : 'secondary'}>
                            {route.transfer_type}
                          </Badge>
                          {route.enable_sightseeing && (
                            <Badge variant="outline" className="text-green-600">
                              <Eye className="h-3 w-3 mr-1" />
                              Sightseeing
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Route</p>
                            <p className="font-medium">
                              {route.origin_city} → {route.destination_city}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Country</p>
                            <p className="font-medium">{route.country}</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium">{route.estimated_duration} min</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">${route.base_price}</p>
                          </div>
                        </div>

                        {/* Intermediate Stops */}
                        {route.intermediate_stops && route.intermediate_stops.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              Stops: {route.intermediate_stops.map(stop => stop.stop_name).join(' → ')}
                            </p>
                          </div>
                        )}

                        {/* Sightseeing Options */}
                        {route.sightseeing_options && route.sightseeing_options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              Sightseeing: {route.sightseeing_options.length} option(s) available
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(route)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(route)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <TransportRouteForm
          route={editingRoute}
          transportTypes={transportTypes}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRoute(null);
          }}
        />
      )}

      {/* Details Modal */}
      {showDetails && selectedRoute && (
        <TransportRouteDetails
          route={selectedRoute}
          onClose={() => {
            setShowDetails(false);
            setSelectedRoute(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            handleEdit(selectedRoute);
          }}
        />
      )}
    </div>
  );
};