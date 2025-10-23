
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransportType } from '../types/transportTypes';

interface TransportTypeDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  transportType: TransportType | null;
}

const TransportTypeDeleteDialog: React.FC<TransportTypeDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  transportType
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transport Type</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transport type? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {transportType && (
          <div className="py-4">
            <p><strong>Name:</strong> {transportType.name}</p>
            <p><strong>Category:</strong> {transportType.category}</p>
            <p><strong>Seating Capacity:</strong> {transportType.seatingCapacity || 'Not Applicable'}</p>
            <p><strong>Luggage Capacity:</strong> {transportType.luggageCapacity || 'Not Applicable'}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirmDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransportTypeDeleteDialog;
