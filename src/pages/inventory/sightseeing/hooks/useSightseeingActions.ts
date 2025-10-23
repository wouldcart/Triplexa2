
import { useState } from 'react';
import { Sightseeing } from '@/types/sightseeing';
import { useToast } from '@/hooks/use-toast';
import { updateSightseeing as updateSightseeingDb, deleteSightseeing as deleteSightseeingDb } from '../services/sightseeingService';

interface UseSightseeingActionsProps {
  sightseeings: Sightseeing[];
  setSightseeings: React.Dispatch<React.SetStateAction<Sightseeing[]>>;
  setSelectedSightseeing: React.Dispatch<React.SetStateAction<Sightseeing | null>>;
  setViewDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSightseeingActions = ({
  sightseeings,
  setSightseeings,
  setSelectedSightseeing,
  setViewDrawerOpen,
  setDeleteDialogOpen
}: UseSightseeingActionsProps) => {
  const { toast } = useToast();
  
  // Find a sightseeing by ID
  const findSightseeingById = (id: number): Sightseeing | undefined => {
    return sightseeings.find(item => item.id === id);
  };
  
  // Handle viewing a sightseeing
  const handleViewSightseeing = (id: number) => {
    const sightseeing = findSightseeingById(id);
    if (sightseeing) {
      setSelectedSightseeing(sightseeing);
      setViewDrawerOpen(true);
    }
  };
  
  // Handle editing a sightseeing
  const handleEditSightseeing = (id: number) => {
    window.location.href = `/inventory/sightseeing/edit/${id}`;
  };
  
  // Handle deleting a sightseeing
  const handleDeleteSightseeing = (id: number) => {
    const sightseeing = findSightseeingById(id);
    if (sightseeing) {
      setSelectedSightseeing(sightseeing);
      setDeleteDialogOpen(true);
    }
  };
  
  // Handle confirming delete
  const handleConfirmDelete = async (id: number) => {
    try {
      await deleteSightseeingDb(id);
      // Update local state
      setSightseeings(current => current.filter(item => item.id !== id));
      setDeleteDialogOpen(false);
      // Emit update event for other components
      window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
      toast({
        title: "Sightseeing deleted",
        description: "The sightseeing has been successfully deleted.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting sightseeing:', error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting the sightseeing.",
        variant: "destructive"
      });
    }
  };
  
  // Handle duplicating a sightseeing
  const handleDuplicateSightseeing = (id: number) => {
    const sightseeing = findSightseeingById(id);
    if (sightseeing) {
      const newSightseeing = {
        ...sightseeing,
        id: Math.max(...sightseeings.map(s => s.id)) + 1,
        name: `${sightseeing.name} (Copy)`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      setSightseeings(current => [...current, newSightseeing]);
      
      toast({
        title: "Sightseeing duplicated",
        description: `"${sightseeing.name}" has been duplicated successfully.`,
        variant: "default"
      });
    }
  };
  
  // Handle toggling sightseeing status
  const handleToggleStatus = async (id: number) => {
    try {
      const sightseeing = findSightseeingById(id);
      if (!sightseeing) return;
      const newStatus: 'active' | 'inactive' = sightseeing.status === 'active' ? 'inactive' : 'active';
      const updatedSightseeing: Sightseeing = {
        ...sightseeing,
        status: newStatus,
        lastUpdated: new Date().toISOString()
      };
      // Update in Supabase
      const updated = await updateSightseeingDb(updatedSightseeing);
      // Update local state
      setSightseeings(current => current.map(item => (item.id === id ? updated : item)));
      // Emit update event
      window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
      toast({
        title: `Status updated to ${newStatus}`,
        description: `"${sightseeing.name}" is now ${newStatus}.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating sightseeing status:', error);
      toast({
        title: "Status update failed",
        description: "An error occurred while updating the status.",
        variant: "destructive"
      });
    }
  };
  
  return {
    handleViewSightseeing,
    handleEditSightseeing,
    handleDeleteSightseeing,
    handleDuplicateSightseeing,
    handleToggleStatus,
    handleConfirmDelete
  };
};
