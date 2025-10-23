
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Clock, MapPin, Car, Plus, CheckCircle, Users, Star } from "lucide-react";
import { getCurrencySymbolByCountry } from "@/pages/inventory/transport/utils/currencyUtils";
import { Query } from "@/types/query";

interface Sightseeing {
  id: string;
  name: string;
  location: string | { id?: string; name?: string; city?: string; country?: string; };
  duration?: string;
  includes?: string[];
  basePrice: number;
  currency: string;
  cities: string[];
  description?: string;
  category?: string;
  rating?: number;
  minPax?: number;
  maxPax?: number;
  [key: string]: any;
}

interface SightseeingSelection {
  activityPrice: number;
  transportType: string;
  transportPrice: number;
  totalPrice: number;
  paxCount: number;
}

interface SightseeingModuleTabProps {
  country: string;
  sightseeing: Sightseeing[];
  selectedCities: string[];
  selectedModules: any[];
  transportAdded: boolean;
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query?: Query;
}

const transportOptions = [
  { label: "Private AC Car", value: "private_car", basePrice: 1500 },
  { label: "Private Van", value: "private_van", basePrice: 2000 },
  { label: "SIC Bus", value: "sic_bus", basePrice: 500 },
  { label: "Walking Tour", value: "walking", basePrice: 0 },
  { label: "No Transport", value: "none", basePrice: 0 },
];

const SightseeingModuleTab: React.FC<SightseeingModuleTabProps> = ({
  country,
  sightseeing,
  selectedCities,
  selectedModules,
  transportAdded,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
  query,
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country) ?? "";
  const [selections, setSelections] = useState<Record<string, SightseeingSelection>>({});

  const filtered = sightseeing.filter((s) => {
    const locationStr = typeof s.location === 'string' ? s.location : (s.location as any)?.city || (s.location as any)?.name || '';
    return selectedCities.includes(locationStr) || (s.cities && s.cities.some((c) => selectedCities.includes(c)));
  });

  const paxCount = query ? query.paxDetails.adults + query.paxDetails.children : 2;

  const getSelection = (sightseeingId: string): SightseeingSelection => {
    const sight = sightseeing.find(s => s.id === sightseeingId);
    const basePrice = sight?.basePrice ?? 0;
    const defaultTransport = transportAdded ? transportOptions[0] : transportOptions[transportOptions.length - 1];
    
    return selections[sightseeingId] || {
      activityPrice: basePrice,
      transportType: defaultTransport.value,
      transportPrice: defaultTransport.basePrice,
      totalPrice: basePrice + defaultTransport.basePrice,
      paxCount: paxCount,
    };
  };

  const handleSelection = (id: string, field: keyof SightseeingSelection, value: any) => {
    setSelections((prev) => {
      const currentSel = getSelection(id);
      let newSel = { ...currentSel };

      if (field === "activityPrice") {
        newSel.activityPrice = Math.max(0, Number(value));
      } else if (field === "transportType") {
        const transport = transportOptions.find(t => t.value === value);
        newSel.transportType = value;
        newSel.transportPrice = transport?.basePrice ?? 0;
      } else if (field === "transportPrice") {
        newSel.transportPrice = Math.max(0, Number(value));
      } else if (field === "paxCount") {
        newSel.paxCount = Math.max(1, Number(value));
      }

      newSel.totalPrice = newSel.activityPrice + newSel.transportPrice;

      return {
        ...prev,
        [id]: newSel,
      };
    });
  };

  const handleAdd = (s: Sightseeing) => {
    const sel = getSelection(s.id);
    const transportOption = transportOptions.find(t => t.value === sel.transportType);
    
    const module = {
      id: `${s.id}:${sel.transportType}:${Date.now()}`,
      type: "sightseeing",
      data: {
        ...s,
        transportType: sel.transportType,
        transportLabel: transportOption?.label || "No Transport",
        paxCount: sel.paxCount,
        name: s.name,
        location: s.location,
        duration: s.duration,
      },
      pricing: {
        basePrice: sel.totalPrice,
        finalPrice: sel.totalPrice,
        currency: s.currency || country,
        breakdown: {
          activityPrice: sel.activityPrice,
          transportPrice: sel.transportPrice,
          transportType: transportOption?.label,
          paxCount: sel.paxCount,
        }
      },
      duration: s.duration,
      passengers: sel.paxCount,
    };
    onAddModule(module);
  };

  const isAdded = (s: Sightseeing) =>
    selectedModules.some((sm) => sm.type === "sightseeing" && sm.data.id === s.id);

  // Group sightseeing by category if available
  const groupedSightseeing = filtered.reduce((acc, sight) => {
    const category = sight.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(sight);
    return acc;
  }, {} as Record<string, Sightseeing[]>);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No sightseeing activities found for selected cities</p>
        <p className="text-sm">Add sightseeing activities in Sightseeing Management first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PAX Information */}
      {query && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">
                  Group Size: {paxCount} people
                </span>
              </div>
              <div className="text-purple-700">
                Pricing will be calculated per person or per group as applicable
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Sightseeing Activities */}
      {Object.entries(groupedSightseeing).map(([category, sights]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">{category}</h3>
            <Badge variant="secondary">{sights.length}</Badge>
          </div>
          
          <div className="grid gap-4">
            {sights.map((s) => {
              const sel = getSelection(s.id);
              const transportOption = transportOptions.find(t => t.value === sel.transportType);

              return (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" />
                        {s.name}
                        {s.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs">{s.rating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">{typeof s.location === 'string' ? s.location : (s.location as any)?.city || (s.location as any)?.name || 'Location'}</Badge>
                    </CardTitle>
                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{s.duration || 'Full Day'}</span>
                      <MapPin className="h-3 w-3 ml-2" />
                      <span>{typeof s.location === 'string' ? s.location : (s.location as any)?.city || (s.location as any)?.name || 'Location'}</span>
                    </div>
                    {s.description && (
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Included Services */}
                    {s.includes && s.includes.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Includes:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.includes.slice(0, 4).map((inc: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{inc}</Badge>
                          ))}
                          {s.includes.length > 4 && (
                            <Badge variant="outline" className="text-xs">+{s.includes.length - 4} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing and Transport Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Activity Price ({currencySymbol})</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sel.activityPrice}
                          onChange={(e) => handleSelection(s.id, "activityPrice", e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Base: {s.basePrice} {currencySymbol}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Transport Type</Label>
                        <Select
                          value={sel.transportType}
                          onValueChange={(val) => handleSelection(s.id, "transportType", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select transport" />
                          </SelectTrigger>
                          <SelectContent>
                            {transportOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{option.label}</span>
                                  {option.basePrice > 0 && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      +{option.basePrice} {currencySymbol}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Transport Price ({currencySymbol})</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sel.transportPrice}
                          onChange={(e) => handleSelection(s.id, "transportPrice", e.target.value)}
                          disabled={sel.transportType === 'none' || sel.transportType === 'walking'}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Total Price</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                          <span className="font-medium">{sel.totalPrice.toFixed(2)} {currencySymbol}</span>
                        </div>
                      </div>
                    </div>

                    {/* PAX and Capacity Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-md">
                      <div>
                        <div className="text-xs text-muted-foreground">Group Size</div>
                        <div className="text-sm font-medium">{sel.paxCount} people</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Per Person</div>
                        <div className="text-sm font-medium">
                          {sel.paxCount > 0 ? (sel.totalPrice / sel.paxCount).toFixed(2) : 0} {currencySymbol}
                        </div>
                      </div>
                      {s.minPax && (
                        <div>
                          <div className="text-xs text-muted-foreground">Min PAX</div>
                          <div className="text-sm font-medium">{s.minPax}</div>
                        </div>
                      )}
                      {s.maxPax && (
                        <div>
                          <div className="text-xs text-muted-foreground">Max PAX</div>
                          <div className="text-sm font-medium">{s.maxPax}</div>
                        </div>
                      )}
                    </div>

                    {/* Add Button */}
                    <div className="flex justify-end">
                      {isAdded(s) ? (
                        <Button variant="outline" disabled className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Added to Services
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleAdd(s)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Services
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SightseeingModuleTab;
