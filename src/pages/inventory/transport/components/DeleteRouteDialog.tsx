
import React from 'react';
import { TransportRoute } from '../types/transportTypes';
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

interface DeleteRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;  // Changed from onConfirmDelete to onConfirm for compatibility
  route: TransportRoute | null;
}

const DeleteRouteDialog: React.FC<DeleteRouteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  route,
}) => {
  if (!route) return null;

  // Get display name for the route
  const getRouteName = () => {
    if (route.name) return route.name;
    if (route.code) return route.code;
    return `Route from ${route.startLocationFullName || route.startLocation} to ${route.endLocationFullName || route.endLocation}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this route?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Route: {getRouteName()}<br/>
            ID: {route.id}<br/>
            <span className="font-semibold text-destructive">
              This action cannot be undone. The route will be permanently deleted from the system.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete Route
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRouteDialog;
