
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getCurrencySymbolByCountry } from "@/pages/inventory/transport/utils/currencyUtils";
import { Query } from "@/types/query";
import { 
  Utensils, Star, MapPin, Clock, Users, Plus, CheckCircle, 
  Crown, Coffee, Sun, Moon, Sparkles 
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  city: string;
  cuisine: string;
  priceRange: 'Budget' | 'Mid-Range' | 'Fine Dining' | 'Luxury';
  rating: number;
  averagePrice: number;
  currency: string;
  openingHours: string;
  specialties: string[];
  atmosphere: string;
  location: string;
  features: string[];
}

interface MealOption {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'gala_dinner';
  label: string;
  icon: React.ComponentType<any>;
  basePrice: number;
}

interface RestaurantSelection {
  mealTypes: string[];
  customPrice: number;
  includeGalaDinner: boolean;
  galaDinnerPrice: number;
  totalPrice: number;
  paxCount: number;
}

interface RestaurantModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query?: Query;
}

const mealOptions: MealOption[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Coffee, basePrice: 200 },
  { type: 'lunch', label: 'Lunch', icon: Sun, basePrice: 400 },
  { type: 'dinner', label: 'Dinner', icon: Moon, basePrice: 600 },
  { type: 'snacks', label: 'Snacks/Tea', icon: Utensils, basePrice: 150 },
  { type: 'gala_dinner', label: 'Gala Dinner', icon: Crown, basePrice: 1500 },
];

const RestaurantModuleTab: React.FC<RestaurantModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
  query,
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country) ?? "";
  const [selections, setSelections] = useState<Record<string, RestaurantSelection>>({});

  // Mock restaurant data - in production, this would come from props
  const restaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Royal Thai Cuisine',
      city: query?.destination.cities[0] || 'Bangkok',
      cuisine: 'Thai',
      priceRange: 'Fine Dining',
      rating: 4.8,
      averagePrice: 1200,
      currency: currencySymbol,
      openingHours: '11:00 AM - 11:00 PM',
      specialties: ['Pad Thai', 'Tom Yum Goong', 'Green Curry'],
      atmosphere: 'Elegant traditional Thai setting',
      location: 'Sukhumvit Road',
      features: ['Live Music', 'Private Dining', 'Vegetarian Options']
    },
    {
      id: '2',
      name: 'Fusion Rooftop',
      city: query?.destination.cities[0] || 'Bangkok',
      cuisine: 'Asian Fusion',
      priceRange: 'Luxury',
      rating: 4.9,
      averagePrice: 2500,
      currency: currencySymbol,
      openingHours: '6:00 PM - 1:00 AM',
      specialties: ['Wagyu Beef', 'Signature Cocktails', 'Tasting Menu'],
      atmosphere: 'Sophisticated rooftop with city views',
      location: '35th Floor, Sky Tower',
      features: ['City Views', 'Cocktail Bar', 'Dress Code Required']
    },
    {
      id: '3',
      name: 'Family Garden Restaurant',
      city: query?.destination.cities[0] || 'Bangkok',
      cuisine: 'International',
      priceRange: 'Mid-Range',
      rating: 4.3,
      averagePrice: 800,
      currency: currencySymbol,
      openingHours: '10:00 AM - 10:00 PM',
      specialties: ['Pizza', 'Pasta', 'Kids Menu'],
      atmosphere: 'Family-friendly with garden setting',
      location: 'Central Shopping District',
      features: ['Kid-Friendly', 'Garden Seating', 'WiFi']
    },
  ];

  const paxCount = query ? query.paxDetails.adults + query.paxDetails.children : 2;

  const getSelection = (restaurantId: string): RestaurantSelection => {
    return selections[restaurantId] || {
      mealTypes: [],
      customPrice: 0,
      includeGalaDinner: false,
      galaDinnerPrice: 1500,
      totalPrice: 0,
      paxCount: paxCount,
    };
  };

  const calculateTotalPrice = (sel: RestaurantSelection): number => {
    let total = 0;
    
    // Add meal type prices
    sel.mealTypes.forEach(mealType => {
      const meal = mealOptions.find(m => m.type === mealType);
      if (meal) {
        total += meal.basePrice * sel.paxCount;
      }
    });

    // Add custom price
    total += sel.customPrice;

    // Add gala dinner if included
    if (sel.includeGalaDinner) {
      total += sel.galaDinnerPrice * sel.paxCount;
    }

    return total;
  };

  const handleSelection = (restaurantId: string, field: keyof RestaurantSelection, value: any) => {
    setSelections((prev) => {
      const currentSel = getSelection(restaurantId);
      let newSel = { ...currentSel };

      if (field === "mealTypes") {
        newSel.mealTypes = value;
      } else if (field === "customPrice") {
        newSel.customPrice = Math.max(0, Number(value));
      } else if (field === "includeGalaDinner") {
        newSel.includeGalaDinner = value;
      } else if (field === "galaDinnerPrice") {
        newSel.galaDinnerPrice = Math.max(0, Number(value));
      } else if (field === "paxCount") {
        newSel.paxCount = Math.max(1, Number(value));
      }

      newSel.totalPrice = calculateTotalPrice(newSel);

      return {
        ...prev,
        [restaurantId]: newSel,
      };
    });
  };

  const handleMealTypeToggle = (restaurantId: string, mealType: string, checked: boolean) => {
    const currentSel = getSelection(restaurantId);
    let newMealTypes = [...currentSel.mealTypes];
    
    if (checked) {
      if (!newMealTypes.includes(mealType)) {
        newMealTypes.push(mealType);
      }
    } else {
      newMealTypes = newMealTypes.filter(type => type !== mealType);
    }
    
    handleSelection(restaurantId, "mealTypes", newMealTypes);
  };

  const handleAdd = (restaurant: Restaurant) => {
    const sel = getSelection(restaurant.id);
    
    const module = {
      id: `${restaurant.id}:${Date.now()}`,
      type: "restaurant",
      data: {
        restaurant,
        mealTypes: sel.mealTypes,
        includeGalaDinner: sel.includeGalaDinner,
        paxCount: sel.paxCount,
        name: `${restaurant.name} - Dining Package`,
        location: restaurant.location,
        meals: sel.mealTypes.map(type => {
          const meal = mealOptions.find(m => m.type === type);
          return meal?.label;
        }).filter(Boolean),
        galaDinner: sel.includeGalaDinner,
      },
      pricing: {
        basePrice: sel.totalPrice,
        finalPrice: sel.totalPrice,
        currency: restaurant.currency || country,
        breakdown: {
          mealTypes: sel.mealTypes,
          customPrice: sel.customPrice,
          galaDinnerPrice: sel.includeGalaDinner ? sel.galaDinnerPrice : 0,
          paxCount: sel.paxCount,
          perPerson: sel.paxCount > 0 ? sel.totalPrice / sel.paxCount : 0,
        }
      },
      passengers: sel.paxCount,
    };
    onAddModule(module);
  };

  const isAdded = (restaurant: Restaurant) =>
    selectedModules.some((sm) => sm.type === "restaurant" && sm.data.restaurant.id === restaurant.id);

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'Budget': return 'bg-green-100 text-green-800';
      case 'Mid-Range': return 'bg-blue-100 text-blue-800';
      case 'Fine Dining': return 'bg-purple-100 text-purple-800';
      case 'Luxury': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* PAX Information */}
      {query && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800">
                  Dining for: {paxCount} people
                </span>
              </div>
              <div className="text-orange-700">
                Meal pricing calculated per person
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Options Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Available Meal Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {mealOptions.map((meal) => {
              const Icon = meal.icon;
              return (
                <div key={meal.type} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <Icon className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">{meal.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {meal.basePrice} {currencySymbol}/person
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Restaurants */}
      <div className="grid gap-6">
        {restaurants.map((restaurant) => {
          const sel = getSelection(restaurant.id);

          return (
            <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    {restaurant.name}
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-sm">{restaurant.rating}</span>
                    </div>
                  </div>
                  <Badge className={getPriceRangeColor(restaurant.priceRange)}>
                    {restaurant.priceRange}
                  </Badge>
                </CardTitle>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {restaurant.openingHours}
                  </span>
                  <Badge variant="outline">{restaurant.cuisine}</Badge>
                </div>

                <p className="text-sm text-muted-foreground italic">{restaurant.atmosphere}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Specialties */}
                <div>
                  <Label className="text-sm font-medium">Specialties:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {restaurant.specialties.map(specialty => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Meal Type Selection */}
                <div>
                  <Label className="text-sm font-medium">Select Meal Types:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {mealOptions.filter(meal => meal.type !== 'gala_dinner').map((meal) => {
                      const Icon = meal.icon;
                      return (
                        <div key={meal.type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${restaurant.id}-${meal.type}`}
                            checked={sel.mealTypes.includes(meal.type)}
                            onCheckedChange={(checked) => 
                              handleMealTypeToggle(restaurant.id, meal.type, checked as boolean)
                            }
                          />
                          <label 
                            htmlFor={`${restaurant.id}-${meal.type}`}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Icon className="h-3 w-3" />
                            {meal.label}
                            <span className="text-xs text-muted-foreground">
                              ({meal.basePrice} {currencySymbol})
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gala Dinner Option */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${restaurant.id}-gala`}
                        checked={sel.includeGalaDinner}
                        onCheckedChange={(checked) => 
                          handleSelection(restaurant.id, "includeGalaDinner", checked)
                        }
                      />
                      <label htmlFor={`${restaurant.id}-gala`} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Crown className="h-4 w-4 text-amber-600" />
                        Special Gala Dinner
                      </label>
                    </div>
                    {sel.includeGalaDinner && (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sel.galaDinnerPrice}
                        onChange={(e) => handleSelection(restaurant.id, "galaDinnerPrice", e.target.value)}
                        className="w-24"
                        placeholder="Price"
                      />
                    )}
                  </div>
                  <p className="text-xs text-amber-700">
                    Premium dining experience with special menu, live entertainment, and exclusive service
                  </p>
                </div>

                {/* Custom Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Additional Custom Price ({currencySymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sel.customPrice}
                      onChange={(e) => handleSelection(restaurant.id, "customPrice", e.target.value)}
                      placeholder="Optional additional cost"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Group Size</Label>
                    <Input
                      type="number"
                      min="1"
                      value={sel.paxCount}
                      onChange={(e) => handleSelection(restaurant.id, "paxCount", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Total Cost</Label>
                    <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                      <span className="font-medium">{sel.totalPrice.toFixed(2)} {currencySymbol}</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                {sel.totalPrice > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <Label className="text-sm font-medium">Price Breakdown:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {sel.mealTypes.map(mealType => {
                        const meal = mealOptions.find(m => m.type === mealType);
                        return meal ? (
                          <div key={mealType} className="flex justify-between">
                            <span>{meal.label}:</span>
                            <span>{(meal.basePrice * sel.paxCount).toFixed(2)} {currencySymbol}</span>
                          </div>
                        ) : null;
                      })}
                      {sel.includeGalaDinner && (
                        <div className="flex justify-between">
                          <span>Gala Dinner:</span>
                          <span>{(sel.galaDinnerPrice * sel.paxCount).toFixed(2)} {currencySymbol}</span>
                        </div>
                      )}
                      {sel.customPrice > 0 && (
                        <div className="flex justify-between">
                          <span>Additional:</span>
                          <span>{sel.customPrice.toFixed(2)} {currencySymbol}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Per Person:</span>
                        <span>{sel.paxCount > 0 ? (sel.totalPrice / sel.paxCount).toFixed(2) : 0} {currencySymbol}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Button */}
                <div className="flex justify-end">
                  {isAdded(restaurant) ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added to Services
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAdd(restaurant)}
                      disabled={sel.mealTypes.length === 0 && !sel.includeGalaDinner && sel.customPrice === 0}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Dining Package
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Information Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Utensils className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Restaurant Dining Packages</h4>
              <p className="text-sm text-green-700 mt-1">
                Select meal types, add special dining experiences like Gala Dinner, and customize pricing. 
                All prices are calculated per person and will be included in your proposal total.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantModuleTab;
