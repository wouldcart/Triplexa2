
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Edit,
  Calendar,
  Users,
  DollarSign,
  Bed,
  UtensilsCrossed,
  Star,
  Wifi,
  Tv,
  Coffee,
  Bath,
  Car,
  Dumbbell,
  Waves,
  MapPin
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface RoomType {
  id: string;
  name: string;
  capacity: {
    adults: number;
    children: number;
  };
  configuration: string;
  mealPlan: string;
  validFrom: string;
  validTo: string;
  adultPrice: number;
  childPrice: number;
  extraBedPrice: number;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  images: Array<{
    id: string;
    url: string;
    isPrimary?: boolean;
  }>;
  amenities?: string[];
  inventory?: number;
}

interface ViewRoomTypeDialogProps {
  roomType: RoomType | null;
  hotelId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ViewRoomTypeDialog: React.FC<ViewRoomTypeDialogProps> = ({
  roomType,
  hotelId,
  currency,
  open,
  onOpenChange
}) => {
  if (!roomType) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatHotelCurrency = (amount: number) => {
    return formatCurrency(amount, currency || 'THB');
  };

  // Mock amenities icons mapping
  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    tv: Tv,
    coffee: Coffee,
    bath: Bath,
    parking: Car,
    gym: Dumbbell,
    pool: Waves,
    location: MapPin,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{roomType.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(roomType.status)}>
                {roomType.status.charAt(0).toUpperCase() + roomType.status.slice(1)}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link to={`/inventory/hotels/${hotelId}/edit-room-type/${roomType.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Image Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Room Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roomType.images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={`${roomType.name} - Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default" className="text-xs">
                          Primary
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Configuration</p>
                  <p className="text-sm">{roomType.configuration}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {roomType.capacity.adults} Adults, {roomType.capacity.children} Children
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{roomType.mealPlan}</span>
                </div>
                {roomType.inventory && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available Rooms</p>
                    <p className="text-sm">{roomType.inventory} rooms</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adult Price (per night)</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatHotelCurrency(roomType.adultPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Child Price (per night)</p>
                  <p className="text-sm">{formatHotelCurrency(roomType.childPrice)}</p>
                </div>
                {roomType.extraBedPrice > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Extra Bed Charge</p>
                    <p className="text-sm">{formatHotelCurrency(roomType.extraBedPrice)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid From</p>
                  <p className="text-sm">{new Date(roomType.validFrom).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid To</p>
                  <p className="text-sm">{new Date(roomType.validTo).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Room Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{roomType.description}</p>
            </CardContent>
          </Card>

          {/* Amenities */}
          {roomType.amenities && roomType.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roomType.amenities.map((amenity, index) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase()] || Star;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewRoomTypeDialog;
