
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Eye, 
  Trash2, 
  MoreHorizontal, 
  Calendar,
  Users,
  DollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ViewRoomTypeDialog from './ViewRoomTypeDialog';

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
}

interface RoomTypesGridViewProps {
  roomTypes: RoomType[];
  hotelId: string;
  currency: string;
  currencySymbol?: string;
  onStatusUpdate: (roomId: string, newStatus: 'active' | 'inactive') => void;
  onDelete: (roomId: string) => void;
}

const RoomTypesGridView: React.FC<RoomTypesGridViewProps> = ({
  roomTypes,
  hotelId,
  currency,
  currencySymbol,
  onStatusUpdate,
  onDelete
}) => {
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleStatusToggle = (roomId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    onStatusUpdate(roomId, newStatus);
  };

  const formatHotelCurrency = (amount: number) => {
    if (currencySymbol) {
      return `${currencySymbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return formatCurrency(amount, currency || 'THB');
  };

  const handleViewRoom = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomTypes.map((roomType) => (
          <Card key={roomType.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 relative">
              <img 
                src={roomType.images[0]?.url} 
                alt={roomType.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-3">
                <Badge className={getStatusColor(roomType.status)}>
                  {roomType.status.charAt(0).toUpperCase() + roomType.status.slice(1)}
                </Badge>
                <Switch
                  checked={roomType.status === 'active'}
                  onCheckedChange={(checked) =>
                    onStatusUpdate(roomType.id, checked ? 'active' : 'inactive')
                  }
                  aria-label="Toggle room type active status"
                />
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{roomType.name}</CardTitle>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatHotelCurrency(roomType.adultPrice)}
                  <span className="text-xs text-gray-500 dark:text-gray-400"> / night</span>
                </span>
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-300">
                <Users className="h-4 w-4 mr-1" />
                <span>Capacity: {roomType.capacity.adults} Adults, {roomType.capacity.children} Children</span>
              </div>
            </CardHeader>
            
            <CardContent className="py-2">
              <div className="mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Configuration:</p>
                <p className="text-sm">{roomType.configuration}</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Meal Plan:</p>
                <p className="text-sm">{roomType.mealPlan}</p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pricing:</p>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>Adult: {formatHotelCurrency(roomType.adultPrice)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>Child: {formatHotelCurrency(roomType.childPrice)}</span>
                  </div>
                  {roomType.extraBedPrice > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>Extra Bed: {formatHotelCurrency(roomType.extraBedPrice)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Valid: {new Date(roomType.validFrom).toLocaleDateString()} 
                  {' - '}
                  {new Date(roomType.validTo).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewRoom(roomType)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/inventory/hotels/${hotelId}/edit-room-type/${roomType.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onDelete(roomType.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ViewRoomTypeDialog
        roomType={selectedRoomType}
        hotelId={hotelId}
        currency={currency}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default RoomTypesGridView;
