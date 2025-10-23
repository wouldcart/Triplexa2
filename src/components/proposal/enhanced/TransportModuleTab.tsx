
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, Clock, Users, Car, Plus, CheckCircle, ChevronDown, ChevronUp, Route, Luggage, Star, Info } from 'lucide-react';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

// Interfaces matching the actual data structure
interface TransportType {
  id: string;
  type: string; // Vehicle type (Sedan, SUV, Van, Coach, Ferry)
  seatingCapacity: number;
  luggageCapacity: number;
  duration: string;
  price: number;
  features?: string[];
  description?: string;
  rating?: number;
  notes?: string;
}

interface RouteSegment {
  fromLocation: string;
  toLocation: string;
  transferMethod: string; // PVT, SIC, etc.
  distance: string;
  duration: string;
}

interface IntermediateStop {
  id: string;
  locationCode: string;
  fullName: string;
  transferMethod: string;
  stopDuration?: string;
  description?: string;
  sightseeingOptions?: SightseeingOption[];
}

interface SightseeingOption {
  id: string;
  location: string;
  description: string;
  adult_price: number;
  child_price?: number;
  additional_charges?: string;
  duration?: string;
  includes?: string[];
}

interface TransportRoute {
  id: string;
  name: string;
  code: string;
  startLocation: string;
  endLocation: string;
  startLocationFullName: string;
  endLocationFullName: string;
  country: string;
  transferType: 'One-Way' | 'Round-Trip' | 'Multi-Stop' | 'en route' | 'Private' | 'SIC';
  status: string;
  distance: number;
  duration: string;
  description?: string;
  transportTypes: TransportType[];
  routeSegments?: RouteSegment[];
  intermediateStops?: IntermediateStop[];
  enableSightseeing?: boolean;
  sightseeingOptions?: SightseeingOption[];
  basePrice?: number;
  currency?: string;
}

interface TransportModuleTabProps {
  country: string;
  allRoutes: any[];
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  loading?: boolean;
}

const TransportModuleTab: React.FC<TransportModuleTabProps> = ({
  country,
  allRoutes,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
  loading = false,
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);

  // State for managing expanded routes and selections
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  const [transportTypeSelections, setTransportTypeSelections] = useState<Record<string, boolean>>({});
  const [sightseeingSelections, setSightseeingSelections] = useState<Record<string, boolean>>({});
  const [transportTypePricing, setTransportTypePricing] = useState<Record<string, number>>({});

  console.log('TransportModuleTab rendering with:', {
    country,
    routesCount: allRoutes.length,
    selectedModulesCount: selectedModules.length,
    loading,
    routes: allRoutes.slice(0, 3) // Log first 3 routes for debugging
  });

  const toggleRouteExpansion = (routeId: string) => {
    setExpandedRoutes(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  };

  const handleTransportTypeSelection = (routeId: string, transportTypeId: string) => {
    setTransportTypeSelections(prev => ({
      ...prev,
      [`${routeId}_${transportTypeId}`]: !prev[`${routeId}_${transportTypeId}`]
    }));
  };

  const handlePricingUpdate = (routeId: string, transportTypeId: string, price: number) => {
    setTransportTypePricing(prev => ({
      ...prev,
      [`${routeId}_${transportTypeId}`]: price
    }));
  };

  const handleSightseeingSelection = (routeId: string, sightseeingId: string, selected: boolean) => {
    setSightseeingSelections(prev => ({
      ...prev,
      [`${routeId}_${sightseeingId}`]: selected
    }));
  };

  const getTransportTypePrice = (routeId: string, transportType: TransportType) => {
    return transportTypePricing[`${routeId}_${transportType.id}`] || transportType.price;
  };

  const calculateTotalPrice = (route: TransportRoute) => {
    let total = route.basePrice || 0;
    
    // Add selected transport types
    route.transportTypes?.forEach(transportType => {
      if (transportTypeSelections[`${route.id}_${transportType.id}`]) {
        total += getTransportTypePrice(route.id, transportType);
      }
    });
    
    // Add selected sightseeing options
    route.sightseeingOptions?.forEach(sightseeing => {
      if (sightseeingSelections[`${route.id}_${sightseeing.id}`]) {
        total += sightseeing.price;
      }
    });
    
    return total;
  };

  const handleAddRoute = (route: TransportRoute) => {
    const selectedTransportTypes = route.transportTypes?.filter(tt => 
      transportTypeSelections[`${route.id}_${tt.id}`]
    ) || [];
    
    const selectedSightseeing = route.sightseeingOptions?.filter(s => 
      sightseeingSelections[`${route.id}_${s.id}`]
    ) || [];
    
    const module = {
      id: `transport_${route.id}_${Date.now()}`,
      type: 'transport',
      data: {
        route,
        selectedTransportTypes,
        selectedSightseeing,
        name: route.name,
        shortCode: `${route.from || route.startLocation || 'Unknown'} - ${route.to || route.endLocation || 'Unknown'}`,
        transferType: route.transferType,
        routeSegments: route.routeSegments,
        intermediateStops: route.intermediateStops,
        enableSightseeing: route.enableSightseeing
      },
      pricing: {
        basePrice: calculateTotalPrice(route),
        finalPrice: calculateTotalPrice(route),
        currency: country,
        currencySymbol
      }
    };

    onAddModule(module);
    
    // Reset selections for this route
    route.transportTypes?.forEach(tt => {
      delete transportTypeSelections[`${route.id}_${tt.id}`];
    });
    route.sightseeingOptions?.forEach(s => {
      delete sightseeingSelections[`${route.id}_${s.id}`];
    });
    setTransportTypeSelections({...transportTypeSelections});
    setSightseeingSelections({...sightseeingSelections});
  };

  const isRouteAdded = (route: TransportRoute) => {
    return selectedModules.some(module => 
      module.type === 'transport' && module.data?.route?.id === route.id
    );
  };

  const handleAddTransport = (route: any, transportType?: any) => {
    console.log('Adding transport route:', route, 'with transport type:', transportType);
    
    const basePrice = transportType?.price || route.pricing?.pricePerPerson || route.price || 50;
    const routeName = route.name || `${route.startLocation || route.from} - ${route.endLocation || route.to}`;
    const vehicleType = transportType?.type || route.vehicleType || route.transferType || 'Private';
    
    const module = {
      id: `transport_${route.id}_${transportType?.id || 'default'}_${Date.now()}`,
      type: 'transport',
      data: {
        route,
        transportType,
        name: routeName,
        shortCode: `${route.startLocation || route.from || 'Unknown'} - ${route.endLocation || route.to || 'Unknown'}`,
        startLocation: route.startLocation || route.from || 'Unknown',
        endLocation: route.endLocation || route.to || 'Unknown',
        vehicleType,
        duration: transportType?.duration || route.duration,
        seatingCapacity: transportType?.seatingCapacity,
        distance: route.distance
      },
      pricing: {
        basePrice,
        finalPrice: basePrice,
        currency: country,
        currencySymbol
      }
    };

    onAddModule(module);
  };

  const handlePriceEdit = (routeId: string, transportTypeId: string, newPrice: number) => {
    const moduleId = selectedModules.find(m => 
      m.type === 'transport' && 
      m.data?.route?.id === routeId &&
      (m.data?.transportType?.id === transportTypeId || (!transportTypeId && !m.data?.transportType))
    )?.id;
    
    if (moduleId) {
      onUpdatePricing(moduleId, {
        basePrice: newPrice,
        finalPrice: newPrice
      });
    }
  };

  const isTransportSelected = (routeId: string, transportTypeId?: string) => {
    return selectedModules.some(module => 
      module.type === 'transport' && 
      module.data?.route?.id === routeId &&
      (transportTypeId ? module.data?.transportType?.id === transportTypeId : true)
    );
  };

  const getSelectedModule = (routeId: string, transportTypeId?: string) => {
    return selectedModules.find(module => 
      module.type === 'transport' && 
      module.data?.route?.id === routeId &&
      (transportTypeId ? module.data?.transportType?.id === transportTypeId : true)
    );
  };

  const renderTransportTypeDetails = (route: TransportRoute, transportType: TransportType) => {
    const isSelected = transportTypeSelections[`${route.id}_${transportType.id}`];
    const currentPrice = getTransportTypePrice(route.id, transportType);
    
    return (
      <Card key={transportType.id} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <span className="font-medium">{transportType.type}</span>
              {transportType.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{transportType.rating}</span>
                </div>
              )}
            </div>
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleTransportTypeSelection(route.id, transportType.id)}
            >
              {isSelected ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{transportType.seatingCapacity} seats</span>
            </div>
            <div className="flex items-center gap-2">
              <Luggage className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{transportType.luggageCapacity} bags</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{transportType.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currentPrice} {currencySymbol}</span>
            </div>
          </div>
          
          {transportType.features && transportType.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {transportType.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">{feature}</Badge>
              ))}
            </div>
          )}
          
          {(transportType.description || transportType.notes) && (
            <p className="text-xs text-muted-foreground">{transportType.description || transportType.notes}</p>
          )}
          
          {isSelected && (
            <div className="mt-3 pt-3 border-t">
              <Label htmlFor={`price-${route.id}-${transportType.id}`} className="text-xs">Custom Price</Label>
              <Input
                id={`price-${route.id}-${transportType.id}`}
                type="number"
                value={currentPrice}
                onChange={(e) => handlePricingUpdate(route.id, transportType.id, Number(e.target.value))}
                className="mt-1"
                placeholder="Enter price"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRouteSegments = (route: TransportRoute) => {
    if (!route.routeSegments || route.routeSegments.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" />
          <span className="font-medium">Route Segments</span>
        </div>
        {route.routeSegments.map((segment, index) => (
          <Card key={segment.id} className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Segment {index + 1}</Badge>
                  <span className="text-sm font-medium">{segment.fromLocation} → {segment.toLocation}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {segment.distance} • {segment.duration}
                </div>
              </div>
              {segment.transportTypes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {segment.transportTypes.map(transportType => (
                    <div key={transportType.id} className="flex items-center gap-2">
                      <Badge variant="secondary">{transportType.type}</Badge>
                      <div className="text-xs text-muted-foreground">
                        {transportType.seatingCapacity} seats • {transportType.price} {currencySymbol}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderIntermediateStops = (route: TransportRoute) => {
    if (!route.intermediateStops || route.intermediateStops.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">Intermediate Stops</span>
        </div>
        {route.intermediateStops.map((stop, index) => (
          <Card key={stop.id} className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Stop {index + 1}</Badge>
                  <span className="text-sm font-medium">{stop.fullName}</span>
                </div>
                {stop.stopDuration && (
                  <div className="text-xs text-muted-foreground">
                    Duration: {stop.stopDuration}
                  </div>
                )}
              </div>
              {stop.description && (
                <p className="text-xs text-muted-foreground mb-2">{stop.description}</p>
              )}
              {stop.sightseeingOptions && stop.sightseeingOptions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">Available Sightseeing:</div>
                  {stop.sightseeingOptions.map(sightseeing => (
                    <div key={sightseeing.id} className="text-xs p-2 bg-white rounded border">
                      <div className="font-medium">{sightseeing.location}</div>
                      <div className="text-muted-foreground">
                        {sightseeing.duration} • {sightseeing.adult_price} {currencySymbol}
                      </div>
                      {sightseeing.description && (
                        <div className="text-muted-foreground mt-1">{sightseeing.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderSightseeingOptions = (route: TransportRoute) => {
    if (!route.enableSightseeing || !route.sightseeingOptions || route.sightseeingOptions.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="font-medium">Sightseeing Options</span>
          <Badge variant="secondary">Available</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {route.sightseeingOptions.map(sightseeing => {
            const isSelected = sightseeingSelections[`${route.id}_${sightseeing.id}`];
            return (
              <Card 
                key={sightseeing.id} 
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => handleSightseeingSelection(route.id, sightseeing.id, !isSelected)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{sightseeing.location}</span>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSightseeingSelection(route.id, sightseeing.id, !isSelected);
                      }}
                    >
                      {isSelected ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{sightseeing.duration}</span>
                    <span className="font-medium">{sightseeing.adult_price} {currencySymbol}</span>
                  </div>
                  {sightseeing.description && (
                    <p className="text-xs text-muted-foreground mb-2">{sightseeing.description}</p>
                  )}
                  {sightseeing.includes && sightseeing.includes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sightseeing.includes.map((include, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{include}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Filter routes based on search or other criteria
  const filteredRoutes = allRoutes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transport routes...</p>
        </div>
      </div>
    );
  }

  if (!filteredRoutes || filteredRoutes.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Transport Routes Available</h3>
        <p className="text-sm text-muted-foreground">
          No transport routes found for the selected criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Transport Modules Summary */}
      {selectedModules.filter(m => m.type === 'transport').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Selected Transport ({selectedModules.filter(m => m.type === 'transport').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedModules.filter(m => m.type === 'transport').map((module) => (
                <div key={module.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{module.data?.shortCode}</div>
                    <div className="text-xs text-muted-foreground">{module.data?.vehicleType}</div>
                    <div className="text-xs font-medium text-green-600">
                      {module.pricing?.finalPrice} {module.pricing?.currencySymbol}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveModule(module.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Transport Routes */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => {
          const isExpanded = expandedRoutes[route.id];
          const hasSelections = route.transportTypes?.some((tt: TransportType) => 
            transportTypeSelections[`${route.id}_${tt.id}`]
          ) || route.sightseeingOptions?.some((s: SightseeingOption) => 
            sightseeingSelections[`${route.id}_${s.id}`]
          );
          const totalPrice = calculateTotalPrice(route);

          return (
            <Card key={route.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={route.transferType === 'Multi-Stop' || route.transferType === 'en route' ? 'default' : 'secondary'}>
                          {route.transferType}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{route.from || route.startLocation || 'Unknown'} → {route.to || route.endLocation || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSelections && (
                      <div className="text-right mr-3">
                        <div className="text-sm font-medium">Total: {totalPrice} {currencySymbol}</div>
                        <Button
                          onClick={() => handleAddRoute(route)}
                          size="sm"
                          className="mt-1"
                        >
                          Add Route
                        </Button>
                      </div>
                    )}
                    <Collapsible open={isExpanded} onOpenChange={() => toggleRouteExpansion(route.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{route.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Route className="h-4 w-4" />
                    <span>{route.distance} km</span>
                  </div>
                  {route.enableSightseeing && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>Sightseeing Available</span>
                    </div>
                  )}
                </div>
                
                {route.description && (
                  <p className="text-sm text-muted-foreground mt-2">{route.description}</p>
                )}
              </CardHeader>

              <Collapsible open={isExpanded} onOpenChange={() => toggleRouteExpansion(route.id)}>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Transport Types */}
                      {route.transportTypes && route.transportTypes.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-primary" />
                            <span className="font-medium">Available Transport Types</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {route.transportTypes.map((transportType: TransportType) => 
                              renderTransportTypeDetails(route, transportType)
                            )}
                          </div>
                        </div>
                      )}

                      {/* Route Segments for Multi-Stop */}
                      {renderRouteSegments(route)}

                      {/* Intermediate Stops for en route */}
                      {renderIntermediateStops(route)}

                      {/* Sightseeing Options */}
                      {renderSightseeingOptions(route)}

                      {/* Legacy transport handling for backward compatibility */}
                      {(!route.transportTypes || route.transportTypes.length === 0) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-primary" />
                              <span className="font-medium">Transport Options</span>
                            </div>
                            <Button
                              onClick={() => handleAddTransport(route)}
                              size="sm"
                              disabled={isTransportSelected(route.id)}
                            >
                              {isTransportSelected(route.id) ? (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              {isTransportSelected(route.id) ? 'Added' : 'Add Transport'}
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>Route: {route.startLocation} → {route.endLocation}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Duration: {route.duration}</span>
                            </div>
                          </div>
                          
                          {isTransportSelected(route.id) && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <Label htmlFor={`price-${route.id}`} className="text-sm font-medium">
                                Price per person
                              </Label>
                              <Input
                                id={`price-${route.id}`}
                                type="number"
                                value={getSelectedModule(route.id)?.pricing?.basePrice || 0}
                                onChange={(e) => handlePriceEdit(route.id, '', Number(e.target.value))}
                                className="mt-1"
                                placeholder="Enter price"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TransportModuleTab;
