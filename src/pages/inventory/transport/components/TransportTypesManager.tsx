
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransportType } from '../types/transportTypes';
import { Eye, Edit, Trash2, Plus, Search } from 'lucide-react';
import TransportTypeAddSheet from './TransportTypeAddSheet';
import TransportTypeEditSheet from './TransportTypeEditSheet';
import TransportTypeDeleteDialog from './TransportTypeDeleteDialog';
import { useToast } from '@/hooks/use-toast';

interface TransportTypesManagerProps {
  transportTypes: TransportType[];
  setTransportTypes: (types: TransportType[]) => void;
}

const TransportTypesManager: React.FC<TransportTypesManagerProps> = ({
  transportTypes,
  setTransportTypes
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [deleteTypeOpen, setDeleteTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TransportType | null>(null);

  // Filter transport types based on search
  const filteredTypes = transportTypes.filter(type => 
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique categories for filter
  const transportCategories = Array.from(new Set(transportTypes.map(type => type.category)));

  // Handle adding a new transport type
  const handleAddType = (type: Omit<TransportType, 'id'>) => {
    const newType: TransportType = {
      id: `tt-${Date.now()}`,
      ...type
    };
    
    setTransportTypes([...transportTypes, newType]);
    setAddTypeOpen(false);
    toast({
      title: "Transport Type Added",
      description: `${type.name} has been added successfully.`
    });
  };

  // Handle editing a transport type
  const handleEditType = (type: TransportType) => {
    setTransportTypes(
      transportTypes.map(t => t.id === type.id ? type : t)
    );
    setEditTypeOpen(false);
    toast({
      title: "Transport Type Updated",
      description: `${type.name} has been updated successfully.`
    });
  };

  // Handle deleting a transport type
  const handleDeleteType = () => {
    if (selectedType) {
      setTransportTypes(
        transportTypes.filter(t => t.id !== selectedType.id)
      );
      setDeleteTypeOpen(false);
      toast({
        title: "Transport Type Deleted",
        description: `${selectedType.name} has been deleted successfully.`
      });
    }
  };

  // Handle toggling transport type status
  const handleToggleStatus = (type: TransportType) => {
    setTransportTypes(
      transportTypes.map(t => 
        t.id === type.id ? { ...t, active: !t.active } : t
      )
    );
    toast({
      title: "Status Updated",
      description: `${type.name} status has been updated.`
    });
  };

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setAddTypeOpen(true)}>
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
                {filteredTypes.length > 0 ? (
                  filteredTypes.map((type) => (
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
                            onClick={() => handleToggleStatus(type)}
                            title={type.active ? "Deactivate" : "Activate"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedType(type);
                              setEditTypeOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedType(type);
                              setDeleteTypeOpen(true);
                            }}
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
                      {searchQuery ? 'No transport types found matching your search.' : 'No transport types added yet.'}
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
        onSave={handleAddType}
        transportCategories={transportCategories}
      />

      <TransportTypeEditSheet
        isOpen={editTypeOpen}
        onClose={() => setEditTypeOpen(false)}
        onSave={handleEditType}
        transportType={selectedType}
        transportCategories={transportCategories}
      />

      <TransportTypeDeleteDialog
        isOpen={deleteTypeOpen}
        onClose={() => setDeleteTypeOpen(false)}
        onConfirmDelete={handleDeleteType}
        transportType={selectedType}
      />
    </>
  );
};

export default TransportTypesManager;
