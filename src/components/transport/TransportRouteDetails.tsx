import React from 'react';
import { X, Edit, MapPin, Clock, DollarSign, Users, Eye, Navigation, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CompleteTransportRoute } from '@/services/comprehensiveTransportService';

interface TransportRouteDetailsProps {
  route: CompleteTransportRoute;
  onClose: () => void;
  onEdit: () => void;
}

export const TransportRouteDetails: React.FC<TransportRouteDetailsProps> = ({
  route,
  onClose,
  onEdit,
}) => {
  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get transfer type color
  const getTransferTypeColor = (type: string) => {
    switch (type) {
      case 'One-Way':
        return 'bg-blue-100 text-blue-800';
      case 'Round-Trip':
        return 'bg-green-100 text-green-800';
      case 'Multi-Stop':
        return 'bg-purple-100 text-purple-800';
      case 'en route':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{route.route_code}</h2>
            <p className="text-muted-foreground">
              {route.start_location} → {route.end_location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Route Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Route Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transfer Type</p>
                  <Badge className={getTransferTypeColor(route.transfer_type || '')}>
                    {route.transfer_type}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{route.country}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                    {route.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Sightseeing</p>
                  <Badge variant={route.enable_sightseeing ? 'default' : 'outline'}>
                    {route.enable_sightseeing ? 'Enabled' : 'Disabled'}
                  </Badge>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(route.base_price || 0, route.currency)}
                  </div>
                  <p className="text-sm text-muted-foreground">Base Price</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {route.duration || 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Estimated Duration</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {route.distance ? `${route.distance} km` : 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity and Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origin</p>
                  <p className="font-medium">{route.start_location}</p>
                  <p className="text-sm text-muted-foreground">{route.start_location_full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{route.end_location}</p>
                  <p className="text-sm text-muted-foreground">{route.end_location_full_name}</p>
                </div>
              </div>
              
              {route.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{route.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intermediate Stops */}
          {route.intermediate_stops && route.intermediate_stops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Intermediate Stops ({route.intermediate_stops.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {route.intermediate_stops
                    .sort((a, b) => a.stop_order - b.stop_order)
                    .map((stop, index) => (
                      <div key={stop.id || index} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {stop.stop_order}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{stop.full_name}</h4>
                          <p className="text-sm text-muted-foreground">Code: {stop.location_code}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sightseeing Options */}
          {route.enable_sightseeing && route.sightseeing_options && route.sightseeing_options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Sightseeing Options ({route.sightseeing_options.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {route.sightseeing_options.map((option, index) => (
                    <div key={option.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{option.name}</h4>
                        <div className="flex items-center gap-2">
                          {option.additional_cost && (
                            <Badge variant="outline">
                              +${option.additional_cost}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {option.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Duration: {option.duration_minutes} min
                          </span>
                        )}
                      </div>
                      
                      {option.description && (
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          {route.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-blue-50 p-4 rounded-md border border-blue-200">
                  {route.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Route ID</p>
                  <p className="font-mono">{route.id}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p>{route.country}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Sightseeing Enabled</p>
                  <p>{route.enable_sightseeing ? 'Yes' : 'No'}</p>
                </div>
                
                {route.created_at && (
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(route.created_at).toLocaleString()}</p>
                  </div>
                )}
                
                {route.updated_at && (
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{new Date(route.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Route
          </Button>
        </div>
      </div>
    </div>
  );
};