
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Restaurant } from '../types/restaurantTypes';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Utensils, 
  DollarSign,
  Wifi,
  Car,
  Music,
  Users,
  CreditCard,
  Coffee,
  Salad
} from 'lucide-react';

interface RestaurantDetailsDialogProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const RestaurantDetailsDialog: React.FC<RestaurantDetailsDialogProps> = ({
  restaurant,
  isOpen,
  onClose,
  onEdit
}) => {
  const renderFeatures = () => {
    const features = [];
    
    if (restaurant.features.wifi) features.push({ icon: <Wifi className="w-4 h-4 mr-1" />, label: 'Wi-Fi' });
    if (restaurant.features.parking) features.push({ icon: <Car className="w-4 h-4 mr-1" />, label: 'Parking' });
    if (restaurant.features.liveMusic) features.push({ icon: <Music className="w-4 h-4 mr-1" />, label: 'Live Music' });
    if (restaurant.features.privateRooms) features.push({ icon: <Users className="w-4 h-4 mr-1" />, label: 'Private Rooms' });
    if (restaurant.features.outdoorSeating) features.push({ icon: <Utensils className="w-4 h-4 mr-1" />, label: 'Outdoor Seating' });
    if (restaurant.features.cardAccepted) features.push({ icon: <CreditCard className="w-4 h-4 mr-1" />, label: 'Card Accepted' });
    
    if (features.length === 0) return <p className="text-gray-500">No special features</p>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <Badge key={index} variant="outline" className="flex items-center">
            {feature.icon} {feature.label}
          </Badge>
        ))}
      </div>
    );
  };
  
  const renderMealTypes = () => {
    const meals = [];
    
    if (restaurant.mealTypes.breakfast) meals.push('Breakfast');
    if (restaurant.mealTypes.lunch) meals.push('Lunch');
    if (restaurant.mealTypes.dinner) meals.push('Dinner');
    if (restaurant.mealTypes.snacks) meals.push('Snacks');
    if (restaurant.mealTypes.beverages) meals.push('Beverages');
    
    if (meals.length === 0) return <p className="text-gray-500">No meal types specified</p>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {meals.map((meal, index) => (
          <Badge key={index} variant="outline">
            {meal}
          </Badge>
        ))}
      </div>
    );
  };
  
  const renderDietaryOptions = () => {
    const options = [];
    
    if (restaurant.dietaryOptions?.pureVeg) options.push({ icon: <Salad className="w-4 h-4 mr-1" />, label: 'Pure Vegetarian' });
    if (restaurant.dietaryOptions?.veganFriendly) options.push({ icon: <Salad className="w-4 h-4 mr-1" />, label: 'Vegan Friendly' });
    if (restaurant.dietaryOptions?.vegetarian) options.push({ icon: <Salad className="w-4 h-4 mr-1" />, label: 'Vegetarian Options' });
    if (restaurant.dietaryOptions?.seafood) options.push({ label: 'Seafood' });
    if (restaurant.dietaryOptions?.poultry) options.push({ label: 'Poultry' });
    if (restaurant.dietaryOptions?.redMeat) options.push({ label: 'Red Meat' });
    if (restaurant.dietaryOptions?.aLaCarte) options.push({ label: 'A La Carte' });
    
    if (options.length === 0) return <p className="text-gray-500">No dietary options specified</p>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <Badge key={index} variant="outline" className="flex items-center">
            {option.icon && option.icon} {option.label}
          </Badge>
        ))}
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{restaurant.name}</DialogTitle>
            {restaurant.isPreferred && (
              <Badge className="bg-red-500 hover:bg-red-600">Preferred</Badge>
            )}
          </div>
          <DialogDescription className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {restaurant.location || `${restaurant.city}, ${restaurant.country}${restaurant.area ? ` (${restaurant.area})` : ''}`}
          </DialogDescription>
        </DialogHeader>
        
        {/* Restaurant Image */}
        <div className="w-full h-64 overflow-hidden rounded-md">
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{restaurant.address}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {restaurant.openingHours || `${restaurant.openingTime} - ${restaurant.closingTime}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  <span>{restaurant.rating} ({restaurant.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {restaurant.priceCategory}{restaurant.priceRange ? ` · ${restaurant.priceRange}` : ''} · Average price: {restaurant.currencySymbol}{restaurant.averagePrice ?? restaurant.averageCost}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Cuisine Types */}
            <div>
              <h3 className="text-lg font-medium mb-2">Cuisine Types</h3>
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisineTypes.map((cuisine, index) => (
                  <Badge key={index} variant="secondary">
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Description */}
            {restaurant.description && (
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{restaurant.description}</p>
              </div>
            )}
          </div>
          
          {/* Right Column */}
          <div className="space-y-4">
            {/* Features */}
            <div>
              <h3 className="text-lg font-medium mb-2">Features</h3>
              {renderFeatures()}
            </div>
            
            {/* Meal Types */}
            <div>
              <h3 className="text-lg font-medium mb-2">Meal Types</h3>
              {renderMealTypes()}
            </div>
            
            {/* Dietary Options */}
            <div>
              <h3 className="text-lg font-medium mb-2">Dietary Options</h3>
              {renderDietaryOptions()}
            </div>
            
            {/* Status */}
            <div>
              <h3 className="text-lg font-medium mb-2">Status</h3>
              <Badge variant={restaurant.status === 'active' ? "success" : "destructive"}>
                {restaurant.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit} className="bg-brand-blue hover:bg-brand-blue/90">
            Edit Restaurant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantDetailsDialog;
