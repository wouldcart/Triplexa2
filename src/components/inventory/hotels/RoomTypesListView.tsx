
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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

interface RoomTypesListViewProps {
  roomTypes: RoomType[];
  hotelId: string;
  currency: string;
  currencySymbol?: string;
  onStatusUpdate: (roomId: string, newStatus: 'active' | 'inactive') => void;
  onDelete: (roomId: string) => void;
}

const RoomTypesListView: React.FC<RoomTypesListViewProps> = ({
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
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Meal Plan</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypes.map((room) => (
                  <TableRow key={room.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden">
                          <img 
                            src={room.images[0]?.url} 
                            alt={room.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{room.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {room.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{room.capacity.adults}A, {room.capacity.children}C</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{room.configuration}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{room.mealPlan}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatHotelCurrency(room.adultPrice)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Child: {formatHotelCurrency(room.childPrice)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <div className="text-xs">
                          <div>{new Date(room.validFrom).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(room.validTo).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(room.status)}>
                          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                        </Badge>
                        <Switch
                          checked={room.status === 'active'}
                          onCheckedChange={(checked) =>
                            onStatusUpdate(room.id, checked ? 'active' : 'inactive')
                          }
                          aria-label="Toggle room type active status"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewRoom(room)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/inventory/hotels/${hotelId}/edit-room-type/${room.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Room Type
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(room.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

export default RoomTypesListView;
