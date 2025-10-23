
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabaseHotelsData } from '../hooks/useSupabaseHotelsData';
import { Hotel } from '../types/hotel';
import { useNavigate } from 'react-router-dom';

interface HotelDeleteDialogProps {
  hotel: Hotel;
  open: boolean;
  onClose: () => void;
}

const HotelDeleteDialog: React.FC<HotelDeleteDialogProps> = ({
  hotel,
  open,
  onClose,
}) => {
  const { deleteHotel } = useSupabaseHotelsData();
  const navigate = useNavigate();

  const handleDelete = () => {
    console.log('Deleting hotel:', hotel.id, hotel.name);
    deleteHotel(hotel.id);
    onClose();
    // Navigate back to hotels list after deletion
    navigate('/inventory/hotels');
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{hotel.name}</span>? 
            This action cannot be undone and will also remove all associated room types.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Delete Hotel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default HotelDeleteDialog;
