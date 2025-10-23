
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, 
  MapPin, 
  Clock, 
  Eye, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { Restaurant } from '../types/restaurantTypes';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getPriceString = (priceCategory: string): string => {
  return priceCategory.repeat(priceCategory.length);
};

const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant, 
  onViewDetails,
  onEdit, 
  onDelete 
}) => {
  const { 
    name, 
    city, 
    location,
    cuisineTypes, 
    priceCategory, 
    priceRange,
    openingHours,
    openingTime, 
    closingTime, 
    imageUrl, 
    isPreferred,
    currencySymbol,
    averagePrice
  } = restaurant;

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {/* Restaurant Image with Preferred Badge */}
      <div className="relative h-48">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
        {isPreferred && (
          <Badge 
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
          >
            Preferred
          </Badge>
        )}
      </div>
      
      {/* Restaurant Details */}
      <CardContent className="pt-4 flex-1">
        <div className="space-y-3">
          {/* Name */}
          <div>
            <h3 className="font-bold text-lg">{name}</h3>
          </div>
          
          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span>{location || city}</span>
          </div>
          
          {/* Hours */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span>{openingHours || `${openingTime} - ${closingTime}`}</span>
          </div>
          
          {/* Cuisine Tags */}
          <div className="flex flex-wrap gap-1.5">
            {cuisineTypes.slice(0, 2).map((cuisine) => (
              <Badge key={cuisine} variant="outline" className="text-xs">
                {cuisine}
              </Badge>
            ))}
            {cuisineTypes.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{cuisineTypes.length - 2}
              </Badge>
            )}
          </div>
          
          {/* Price Category */}
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getPriceString(priceCategory)}{priceRange ? ` · ${priceRange}` : ''}{averagePrice != null ? ` · ${currencySymbol}${averagePrice}` : ` · ${currencySymbol}`}
            </span>
          </div>
        </div>
      </CardContent>
      
      {/* Action Buttons */}
      <CardFooter className="border-t pt-3 flex justify-between bg-gray-50 dark:bg-gray-800/50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewDetails}
          className="flex-1 flex items-center justify-center"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEdit}
          className="flex-1 flex items-center justify-center text-blue-600"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="flex-1 flex items-center justify-center text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RestaurantCard;
