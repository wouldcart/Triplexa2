
import React, { useState } from 'react';
import { useTransportData } from '../../hooks/useTransportData';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { TransportType } from '../../types/transportTypes';
import TransportTypeAddSheet from '../TransportTypeAddSheet';
import TransportTypeEditSheet from '../TransportTypeEditSheet';
import TransportTypeDeleteDialog from '../TransportTypeDeleteDialog';
import TransportTypeViewSheet from '../TransportTypeViewSheet';
import { 
  createTransportType, 
  updateTransportType, 
  deleteTransportType, 
  toggleTransportTypeActive,
  mapUIToTransportTypeRow,
  mapTransportTypeRowToUI
} from '@/services/transportTypesService';
import { useToast } from '@/hooks/use-toast';

const TransportTypesTab: React.FC = () => {
  const transportData = useTransportData();
  const { toast } = useToast();
  
  // States for transport types management
  const [searchTransportTypes, setSearchTransportTypes] = useState('');
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [deleteTypeOpen, setDeleteTypeOpen] = useState(false);
  const [viewTypeOpen, setViewTypeOpen] = useState(false);
  const [selectedTransportType, setSelectedTransportType] = useState<TransportType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle viewing a transport type details
  const handleViewTransportType = (transportType: TransportType) => {
    setSelectedTransportType(transportType);
    setViewTypeOpen(true);
  };

  // Handle adding a new transport type
  const handleAddTransportType = async (transportType: Omit<TransportType, 'id'>) => {
    setIsLoading(true);
    try {
      const dbRow = mapUIToTransportTypeRow(transportType);
      const newRow = await createTransportType(dbRow);
      const newType = mapTransportTypeRowToUI(newRow);
      
      // Update local state
      transportData.setTransport([...transportData.transport, newType]);
      setAddTypeOpen(false);
      
      toast({
        title: "Transport Type Added",
        description: `${transportType.name} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding transport type:', error);
      toast({
        title: "Error",
        description: "Failed to add transport type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing a transport type
  const handleEditTransportType = async (transportType: TransportType) => {
    setIsLoading(true);
    try {
      const dbRow = mapUIToTransportTypeRow(transportType);
      const updatedRow = await updateTransportType(transportType.id, dbRow);
      const updatedType = mapTransportTypeRowToUI(updatedRow);
      
      // Update local state
      transportData.setTransport(
        transportData.transport.map(type => 
          type.id === transportType.id ? updatedType : type
        )
      );
      setEditTypeOpen(false);
      
      toast({
        title: "Transport Type Updated",
        description: `${transportType.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating transport type:', error);
      toast({
        title: "Error",
        description: "Failed to update transport type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a transport type
  const handleDeleteTransportType = async () => {
    if (!selectedTransportType) return;
    
    setIsLoading(true);
    try {
      await deleteTransportType(selectedTransportType.id);
      
      // Update local state
      transportData.setTransport(
        transportData.transport.filter(type => type.id !== selectedTransportType.id)
      );
      setDeleteTypeOpen(false);
      
      toast({
        title: "Transport Type Deleted",
        description: `${selectedTransportType.name} has been deleted successfully.`,
      });
      setSelectedTransportType(null);
    } catch (error) {
      console.error('Error deleting transport type:', error);
      toast({
        title: "Error",
        description: "Failed to delete transport type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling transport type status
  const handleToggleTypeStatus = async (transportType: TransportType) => {
    setIsLoading(true);
    try {
      const newActiveStatus = !transportType.active;
      const updatedRow = await toggleTransportTypeActive(transportType.id, newActiveStatus);
      const updatedType = mapTransportTypeRowToUI(updatedRow);
      
      // Update local state
      transportData.setTransport(
        transportData.transport.map(type => 
          type.id === transportType.id ? updatedType : type
        )
      );
      
      toast({
        title: "Status Updated",
        description: `${transportType.name} status has been updated.`,
      });
    } catch (error) {
      console.error('Error toggling transport type status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transport types based on search
  const filteredTransportTypes = transportData.transport.filter(type => 
    type.name.toLowerCase().includes(searchTransportTypes.toLowerCase()) ||
    type.category.toLowerCase().includes(searchTransportTypes.toLowerCase())
  );

  // Get unique categories for filter
  const transportCategories = Array.from(new Set(transportData.transport.map(type => type.category)));

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Transport Types</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transport types..."
                  className="pl-8 w-full"
                  value={searchTransportTypes}
                  onChange={(e) => setSearchTransportTypes(e.target.value)}
                />
              </div>
              <Button onClick={() => setAddTypeOpen(true)} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" /> Add Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Seating</TableHead>
                  <TableHead>Luggage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransportTypes.length > 0 ? (
                  filteredTransportTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.category}</TableCell>
                      <TableCell>{type.seatingCapacity || 'N/A'}</TableCell>
                      <TableCell>{type.luggageCapacity || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={type.active ? "default" : "outline"}>
                          {type.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewTransportType(type)}
                            title="View Details"
                            disabled={isLoading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleTypeStatus(type)}
                            title={type.active ? "Deactivate" : "Activate"}
                            disabled={isLoading}
                          >
                            {type.active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTransportType(type);
                              setEditTypeOpen(true);
                            }}
                            disabled={isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTransportType(type);
                              setDeleteTypeOpen(true);
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTransportTypes ? 'No transport types found matching your search.' : 'No transport types added yet.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        
      {/* Transport Type Sheets and Dialogs */}
      <TransportTypeAddSheet
        isOpen={addTypeOpen}
        onClose={() => setAddTypeOpen(false)}
        onSave={handleAddTransportType}
        transportCategories={transportCategories}
      />

      <TransportTypeEditSheet
        isOpen={editTypeOpen}
        onClose={() => setEditTypeOpen(false)}
        onSave={handleEditTransportType}
        transportType={selectedTransportType}
        transportCategories={transportCategories}
      />

      <TransportTypeDeleteDialog
        isOpen={deleteTypeOpen}
        onClose={() => setDeleteTypeOpen(false)}
        onConfirmDelete={handleDeleteTransportType}
        transportType={selectedTransportType}
      />

      <TransportTypeViewSheet
        isOpen={viewTypeOpen}
        onClose={() => setViewTypeOpen(false)}
        transportType={selectedTransportType}
      />
    </>
  );
};

export default TransportTypesTab;
