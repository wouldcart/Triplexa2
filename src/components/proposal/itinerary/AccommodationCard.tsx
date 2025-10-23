
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Hotel, Building, Home, Star, Wifi, Car, 
  Coffee, Clock, MapPin 
} from 'lucide-react';

interface AccommodationCardProps {
  accommodation: any;
  formatCurrency: (amount: number) => string;
}

const AccommodationCard: React.FC<AccommodationCardProps> = ({ accommodation, formatCurrency }) => {
  const getAccommodationIcon = (type: string) => {
    const iconMap = {
      'hotel': Hotel,
      'resort': Building,
      'guesthouse': Home,
      'apartment': Building,
      'villa': Home
    };
    
    return iconMap[type?.toLowerCase() as keyof typeof iconMap] || Hotel;
  };

  const getAccommodationImage = (type: string) => {
    // Use appropriate placeholder image based on accommodation type
    const imageMap = {
      'resort': 'photo-1501854140801-50d01698950b', // mountain resort view
      'hotel': 'photo-1493397212122-2b85dda8106b', // modern building
      'guesthouse': 'photo-1472396961693-142e6e269027', // cozy mountain setting
      'default': 'photo-1473177104440-ffee2f376098' // elegant interior
    };
    
    const imageKey = type?.toLowerCase() in imageMap ? type.toLowerCase() : 'default';
    return `https://images.unsplash.com/${imageMap[imageKey as keyof typeof imageMap]}?w=400&h=200&fit=crop`;
  };

  const IconComponent = getAccommodationIcon(accommodation.type);
  const accommodationImage = getAccommodationImage(accommodation.type);

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* Accommodation Image */}
      <div className="relative h-32 overflow-hidden">
        <img 
          src={accommodationImage}
          alt={accommodation.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20" />
        
        {/* Star Rating */}
        {accommodation.starRating && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              {accommodation.starRating}
            </Badge>
          </div>
        )}
      </div>

      {/* Accommodation Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-purple-600" />
              {accommodation.name}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {accommodation.roomType || accommodation.type}
            </p>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {formatCurrency(accommodation.price || 0)}
            </div>
            {accommodation.nights && (
              <div className="text-xs text-gray-500">
                {accommodation.nights} night{accommodation.nights > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Check-in/Check-out */}
        {(accommodation.checkIn || accommodation.checkOut) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Check-in: {accommodation.checkIn || 'TBD'}</span>
            </div>
            {accommodation.checkOut && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Check-out: {accommodation.checkOut}</span>
              </div>
            )}
          </div>
        )}

        {/* Amenities */}
        {accommodation.amenities && accommodation.amenities.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {accommodation.amenities.slice(0, 3).map((amenity: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity.includes('wifi') || amenity.includes('WiFi') ? <Wifi className="h-3 w-3 mr-1" /> : 
                 amenity.includes('parking') ? <Car className="h-3 w-3 mr-1" /> :
                 amenity.includes('breakfast') ? <Coffee className="h-3 w-3 mr-1" /> : null}
                {amenity}
              </Badge>
            ))}
            {accommodation.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{accommodation.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationCard;
