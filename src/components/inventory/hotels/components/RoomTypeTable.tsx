
import React, { useState } from 'react';
import { RoomType } from '../types/hotel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface RoomTypeTableProps {
  roomTypes: RoomType[];
  onEdit: (roomType: RoomType) => void;
  onDelete: (roomTypeId: string) => void;
  currency?: string;
  currencySymbol?: string;
}

const RoomTypeTable: React.FC<RoomTypeTableProps> = ({
  roomTypes,
  onEdit,
  onDelete,
  currency = 'USD',
  currencySymbol = '$'
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<string | null>(null);
  const [roomTypeNameToDelete, setRoomTypeNameToDelete] = useState<string>('');

  if (roomTypes.length === 0) {
    return null;
  }

  const handleEdit = (roomType: RoomType) => {
    console.log('Editing room type:', roomType.id);
    onEdit(roomType);
  };

  const handleDeleteRequest = (roomTypeId: string, roomTypeName: string) => {
    console.log('Request to delete room type:', roomTypeId);
    setRoomTypeToDelete(roomTypeId);
    setRoomTypeNameToDelete(roomTypeName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (roomTypeToDelete) {
      console.log('Confirming deletion of room type:', roomTypeToDelete);
      onDelete(roomTypeToDelete);
      toast.success(`Room type "${roomTypeNameToDelete}" has been deleted successfully`);
      setDeleteDialogOpen(false);
      setRoomTypeToDelete(null);
      setRoomTypeNameToDelete('');
    }
  };

  const handleDeleteCancel = () => {
    console.log('Delete operation cancelled');
    setDeleteDialogOpen(false);
    setRoomTypeToDelete(null);
    setRoomTypeNameToDelete('');
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Type</TableHead>
              <TableHead className="hidden md:table-cell">Configuration</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="hidden md:table-cell">Valid Period</TableHead>
              <TableHead>Price ({currencySymbol})</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomTypes.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell className="hidden md:table-cell">{room.configuration}</TableCell>
                <TableCell>
                  {room.capacity.adults} Adults, {room.capacity.children} Children
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(room.validFrom), 'dd MMM')} - {format(new Date(room.validTo), 'dd MMM yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>Adult: {currencySymbol}{room.adultPrice}</span>
                    <span className="text-xs text-muted-foreground">Child: {currencySymbol}{room.childPrice}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge 
                    variant={room.status === 'active' ? 'success' : 
                            room.status === 'inactive' ? 'secondary' : 'outline'}
                  >
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRequest(room.id, room.name)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this room type?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete "{roomTypeNameToDelete}". This action cannot be undone.
              Any existing bookings or references to this room type may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoomTypeTable;
