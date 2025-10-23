
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hotel, Car, Camera, Star, Clock, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';

interface HotelSuggestionCardProps {
  hotel: any;
  price: number;
  country: string;
  onAddToDay: (hotel: any, price: number) => void;
}

export const HotelSuggestionCard: React.FC<HotelSuggestionCardProps> = ({
  hotel,
  price,
  country,
  onAddToDay
}) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Hotel className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium text-sm">{hotel.name}</h4>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(hotel.starRating || 3)].map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">{hotel.city || hotel.location}</p>
      
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs">
          {hotel.roomTypes?.[0]?.name || 'Standard Room'}
        </Badge>
        <span className="font-semibold text-green-600">
          {formatCurrency(price, country)}/night
        </span>
      </div>
      
      <Button 
        size="sm" 
        className="w-full" 
        onClick={() => onAddToDay(hotel, price)}
      >
        Add to Day
      </Button>
    </CardContent>
  </Card>
);

interface TransportSuggestionCardProps {
  transport: any;
  price: number;
  country: string;
  onAddToDay: (transport: any, price: number) => void;
}

export const TransportSuggestionCard: React.FC<TransportSuggestionCardProps> = ({
  transport,
  price,
  country,
  onAddToDay
}) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Car className="h-4 w-4 text-orange-600" />
        <h4 className="font-medium text-sm">{transport.name}</h4>
      </div>
      
      <div className="text-xs text-muted-foreground mb-2">
        <span>{typeof transport.from === 'string' ? transport.from : (transport.from as any)?.city || (transport.from as any)?.name || 'Origin'}</span> → <span>{typeof transport.to === 'string' ? transport.to : (transport.to as any)?.city || (transport.to as any)?.name || 'Destination'}</span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {transport.transportType || transport.vehicleType}
          </Badge>
          {transport.capacity && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{transport.capacity}</span>
            </div>
          )}
        </div>
        <span className="font-semibold text-green-600">
          {formatCurrency(price, country)}
        </span>
      </div>
      
      <Button 
        size="sm" 
        className="w-full" 
        onClick={() => onAddToDay(transport, price)}
      >
        Add to Day
      </Button>
    </CardContent>
  </Card>
);

interface SightseeingSuggestionCardProps {
  activity: any;
  price: number;
  country: string;
  onAddToDay: (activity: any, price: number) => void;
}

export const SightseeingSuggestionCard: React.FC<SightseeingSuggestionCardProps> = ({
  activity,
  price,
  country,
  onAddToDay
}) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="h-4 w-4 text-purple-600" />
        <h4 className="font-medium text-sm">{activity.name}</h4>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">{activity.city}</p>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {activity.duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{activity.duration}</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {activity.category || 'Sightseeing'}
          </Badge>
        </div>
        <span className="font-semibold text-green-600">
          {formatCurrency(price, country)}
        </span>
      </div>
      
      <Button 
        size="sm" 
        className="w-full" 
        onClick={() => onAddToDay(activity, price)}
      >
        Add to Day
      </Button>
    </CardContent>
  </Card>
);
