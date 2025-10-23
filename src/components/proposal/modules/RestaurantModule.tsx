
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { Utensils, Star, MapPin, Clock, Users, Info } from 'lucide-react';

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
  images: string[];
  features: string[];
}

interface RestaurantModuleProps {
  query: Query;
  onAddModule: (module: any) => void;
  selectedModules: any[];
}

const RestaurantModule: React.FC<RestaurantModuleProps> = ({ query, onAddModule, selectedModules }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [filterCuisine, setFilterCuisine] = useState<string>('');
  const [filterPriceRange, setFilterPriceRange] = useState<string>('');

  useEffect(() => {
    if (query.destination.cities.length > 0) {
      setSelectedCity(query.destination.cities[0]);
    }
  }, [query.destination.cities]);

  useEffect(() => {
    if (selectedCity) {
      loadRestaurantsForCity(selectedCity);
    }
  }, [selectedCity]);

  const loadRestaurantsForCity = (city: string) => {
    // Mock restaurant data based on city
    const mockRestaurants: Restaurant[] = [
      {
        id: '1',
        name: 'Royal Thai Cuisine',
        city: city,
        cuisine: 'Thai',
        priceRange: 'Fine Dining',
        rating: 4.8,
        averagePrice: 1200,
        currency: 'THB',
        openingHours: '11:00 AM - 11:00 PM',
        specialties: ['Pad Thai', 'Tom Yum Goong', 'Green Curry', 'Mango Sticky Rice'],
        atmosphere: 'Elegant traditional Thai setting with live music',
        location: 'Sukhumvit Road, Downtown',
        images: ['/placeholder.svg'],
        features: ['Live Music', 'Private Dining', 'Vegetarian Options', 'Wine Selection']
      },
      {
        id: '2',
        name: 'Street Food Paradise',
        city: city,
        cuisine: 'Thai Street Food',
        priceRange: 'Budget',
        rating: 4.5,
        averagePrice: 300,
        currency: 'THB',
        openingHours: '6:00 PM - 2:00 AM',
        specialties: ['Som Tam', 'Grilled Seafood', 'Thai BBQ', 'Fresh Coconut'],
        atmosphere: 'Authentic street food experience',
        location: 'Chatuchak Night Market',
        images: ['/placeholder.svg'],
        features: ['Outdoor Seating', 'Late Night', 'Cash Only', 'Local Experience']
      },
      {
        id: '3',
        name: 'Fusion Rooftop',
        city: city,
        cuisine: 'Asian Fusion',
        priceRange: 'Luxury',
        rating: 4.9,
        averagePrice: 2500,
        currency: 'THB',
        openingHours: '6:00 PM - 1:00 AM',
        specialties: ['Wagyu Beef', 'Lobster Thermidor', 'Signature Cocktails', 'Tasting Menu'],
        atmosphere: 'Sophisticated rooftop with city skyline views',
        location: '35th Floor, Sky Tower',
        images: ['/placeholder.svg'],
        features: ['City Views', 'Cocktail Bar', 'Dress Code', 'Reservation Required']
      },
      {
        id: '4',
        name: 'Family Garden Restaurant',
        city: city,
        cuisine: 'International',
        priceRange: 'Mid-Range',
        rating: 4.3,
        averagePrice: 800,
        currency: 'THB',
        openingHours: '10:00 AM - 10:00 PM',
        specialties: ['Pizza', 'Pasta', 'Thai Dishes', 'Kids Menu'],
        atmosphere: 'Family-friendly with garden setting',
        location: 'Central Shopping District',
        images: ['/placeholder.svg'],
        features: ['Kid-Friendly', 'Garden Seating', 'WiFi', 'Parking Available']
      },
      {
        id: '5',
        name: 'Seafood Harbor',
        city: city,
        cuisine: 'Seafood',
        priceRange: 'Mid-Range',
        rating: 4.6,
        averagePrice: 1000,
        currency: 'THB',
        openingHours: '11:00 AM - 11:00 PM',
        specialties: ['Grilled Fish', 'Crab Curry', 'Seafood Platter', 'Fish Market Fresh'],
        atmosphere: 'Waterfront dining with fresh catch daily',
        location: 'Marina Bay',
        images: ['/placeholder.svg'],
        features: ['Waterfront View', 'Fresh Daily Catch', 'Outdoor Terrace', 'Group Bookings']
      }
    ];

    setRestaurants(mockRestaurants);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (filterCuisine && restaurant.cuisine !== filterCuisine) return false;
    if (filterPriceRange && restaurant.priceRange !== filterPriceRange) return false;
    return true;
  });

  const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine))];
  const priceRanges = [...new Set(restaurants.map(r => r.priceRange))];

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Restaurant Suggestions
            <Badge variant="outline" className="ml-2">
              <Info className="h-3 w-3 mr-1" />
              Suggestions Only
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Restaurant suggestions for your itinerary. Pricing not included in proposal calculations.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City and Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">City:</span>
              {query.destination.cities.map(city => (
                <Badge
                  key={city}
                  variant={selectedCity === city ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Filters:</span>
            <div className="flex gap-2">
              <select
                value={filterCuisine}
                onChange={(e) => setFilterCuisine(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">All Cuisines</option>
                {cuisineTypes.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
              <select
                value={filterPriceRange}
                onChange={(e) => setFilterPriceRange(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">All Price Ranges</option>
                {priceRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Restaurants List */}
          <div className="grid gap-4">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{restaurant.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {restaurant.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {restaurant.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {restaurant.openingHours}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getPriceRangeColor(restaurant.priceRange)}>
                      {restaurant.priceRange}
                    </Badge>
                    <div className="text-sm font-medium mt-1">
                      ~{formatCurrency(restaurant.averagePrice)} {restaurant.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">avg per person</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Cuisine:</span>
                    <Badge variant="outline" className="ml-2">{restaurant.cuisine}</Badge>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Specialties:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {restaurant.specialties.map(specialty => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {restaurant.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted p-2 rounded">
                    <p className="text-sm italic">{restaurant.atmosphere}</p>
                  </div>

                  {/* Estimated Cost for Group */}
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="text-sm font-medium text-blue-800 mb-1">Estimated Cost for Your Group</div>
                    <div className="text-sm text-blue-700">
                      {query.paxDetails.adults + query.paxDetails.children} people × {formatCurrency(restaurant.averagePrice)} = 
                      <span className="font-semibold ml-1">
                        {formatCurrency(restaurant.averagePrice * (query.paxDetails.adults + query.paxDetails.children))} {restaurant.currency}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      * This is an estimate and not included in proposal pricing
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No restaurants found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Restaurant Suggestions</h4>
              <p className="text-sm text-yellow-700 mt-1">
                These restaurant recommendations are provided as suggestions to enhance your travel experience. 
                Restaurant costs are not automatically included in the proposal pricing. You can manually add 
                meal costs to additional services if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantModule;
