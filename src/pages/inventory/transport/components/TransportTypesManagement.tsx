
import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash, Trash2, Check, X, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { transportCategories } from '../data/transportData';
import { TransportType } from '../types/transportTypes';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface TransportTypesManagementProps {
  transportTypes: TransportType[];
  setTransportTypes: (transportTypes: TransportType[]) => void;
}

const TransportTypesManagement: React.FC<TransportTypesManagementProps> = ({ 
  transportTypes, 
  setTransportTypes 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newTransportType, setNewTransportType] = useState<Partial<TransportType>>({
    name: '',
    category: '',
    seatingCapacity: 0,
    luggageCapacity: 0,
    active: true
  });
  const [supabaseTypes, setSupabaseTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load transport types from Supabase on component mount
  useEffect(() => {
    loadTransportTypesFromSupabase();
  }, []);

  const loadTransportTypesFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transport_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transport types from Supabase:', error);
        toast.error('Failed to load transport types from database');
      } else {
        setSupabaseTypes(data || []);
        toast.success(`Loaded ${data?.length || 0} transport types from database`);
      }
    } catch (error) {
        toast.error('Unexpected error loading transport types');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddType = async () => {
    if (!newTransportType.name || !newTransportType.category) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Save to Supabase first
      const { data, error } = await supabase
        .from('transport_types')
        .insert([{
          name: newTransportType.name,
          category: newTransportType.category,
          seating_capacity: newTransportType.seatingCapacity || 0,
          luggage_capacity: newTransportType.luggageCapacity || 0,
          active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving transport type to Supabase:', error);
        toast.error('Failed to save transport type to database');
        return;
      }

      // Update local state
      const typeToAdd: TransportType = {
        id: data.id,
        name: data.name,
        category: data.category,
        seatingCapacity: data.seating_capacity,
        luggageCapacity: data.luggage_capacity,
        active: data.active
      };
      
      setTransportTypes([...transportTypes, typeToAdd]);
      setSupabaseTypes([data, ...supabaseTypes]);
      
      setNewTransportType({
        name: '',
        category: '',
        seatingCapacity: 0,
        luggageCapacity: 0,
        active: true
      });
      
      toast.success('Transport type saved successfully');
    } catch (error) {
      console.error('Unexpected error saving transport type:', error);
      toast.error('Unexpected error saving transport type');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditType = (id: string) => {
    setEditMode(id);
    const transportType = transportTypes.find(t => t.id === id);
    if (transportType) {
      setNewTransportType({ ...transportType });
    }
  };
  
  const handleSaveEdit = () => {
    if (!editMode) return;
    
    setTransportTypes(
      transportTypes.map(type => 
        type.id === editMode
          ? {
              id: type.id,
              name: newTransportType.name || type.name,
              category: newTransportType.category || type.category,
              seatingCapacity: newTransportType.seatingCapacity || type.seatingCapacity,
              luggageCapacity: newTransportType.luggageCapacity || type.luggageCapacity,
              active: typeof newTransportType.active === 'boolean' ? newTransportType.active : type.active
            }
          : type
      )
    );
    
    setEditMode(null);
    setNewTransportType({
      name: '',
      category: '',
      seatingCapacity: 0,
      luggageCapacity: 0,
      active: true
    });
  };
  
  const handleCancelEdit = () => {
    setEditMode(null);
    setNewTransportType({
      name: '',
      category: '',
      seatingCapacity: 0,
      luggageCapacity: 0,
      active: true
    });
  };
  
  const handleDeleteType = async (id: string) => {
    try {
      setLoading(true);
      
      // Delete from Supabase first
      const { error } = await supabase
        .from('transport_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transport type from Supabase:', error);
        toast.error('Failed to delete transport type from database');
        return;
      }

      // Update local state
      setTransportTypes(transportTypes.filter(type => type.id !== id));
      setSupabaseTypes(supabaseTypes.filter(type => type.id !== id));
      
      toast.success('Transport type deleted successfully');
    } catch (error) {
      console.error('Unexpected error deleting transport type:', error);
      toast.error('Unexpected error deleting transport type');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      setLoading(true);
      
      // Update in Supabase first
      const { error } = await supabase
        .from('transport_types')
        .update({ active: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating transport type status in Supabase:', error);
        toast.error('Failed to update status in database');
        return;
      }

      // Update local state
      setTransportTypes(transportTypes.map(type => 
        type.id === id ? { ...type, active: newStatus } : type
      ));
      
      setSupabaseTypes(supabaseTypes.map(type => 
        type.id === id ? { ...type, active: newStatus } : type
      ));
      
      toast.success(`Transport type ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Unexpected error updating transport type status:', error);
      toast.error('Unexpected error updating status');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          Manage Transport Types
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Manage Transport Types</SheetTitle>
        </SheetHeader>
        
        <div className="py-4">
          {/* Enhanced Supabase Transport Types */}
          {supabaseTypes.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Live Database Transport Types ({supabaseTypes.length})
                </CardTitle>
                <CardDescription>
                  Real-time transport types from Supabase database with enhanced status management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supabaseTypes.slice(0, 8).map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{type.name}</h4>
                          <Badge variant="outline">{type.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {type.seating_capacity} seats, {type.luggage_capacity} luggage
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={type.active ? "active" : "inactive"}
                          onValueChange={(value) => handleToggleStatus(type.id, value === "active")}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Inactive
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteType(type.id)}
                          disabled={loading}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Add New Transport Type</CardTitle>
              <CardDescription>
                Define new transport vehicle types for routes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="typeName" className="text-sm font-medium mb-1 block">
                  Type Name
                </label>
                <Input
                  id="typeName"
                  placeholder="e.g., Luxury Van"
                  value={newTransportType.name}
                  onChange={(e) => setNewTransportType({ ...newTransportType, name: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="typeCategory" className="text-sm font-medium mb-1 block">
                  Category
                </label>
                <Select
                  value={newTransportType.category}
                  onValueChange={(value) => setNewTransportType({ ...newTransportType, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="seatingCapacity" className="text-sm font-medium mb-1 block">
                    Seating Capacity
                  </label>
                  <Input
                    id="seatingCapacity"
                    type="number"
                    placeholder="e.g., 8"
                    value={newTransportType.seatingCapacity || ''}
                    onChange={(e) => setNewTransportType({ 
                      ...newTransportType, 
                      seatingCapacity: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
                
                <div>
                  <label htmlFor="luggageCapacity" className="text-sm font-medium mb-1 block">
                    Luggage Capacity
                  </label>
                  <Input
                    id="luggageCapacity"
                    type="number"
                    placeholder="e.g., 4"
                    value={newTransportType.luggageCapacity || ''}
                    onChange={(e) => setNewTransportType({ 
                      ...newTransportType, 
                      luggageCapacity: parseInt(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {editMode ? (
                <div className="flex space-x-2 w-full">
                  <Button onClick={handleSaveEdit} className="flex-1" disabled={loading}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={handleAddType} className="w-full" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transport Type
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Transport Types</h3>
            <ScrollArea className="h-[320px]">
              <div className="space-y-2 pr-4">
                {transportTypes.map((type) => (
                  <Card key={type.id} className="relative">
                    <CardContent className="pt-6 px-4 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{type.name}</h4>
                            <Badge variant={type.active ? "default" : "outline"}>
                              {type.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{type.category}</p>
                          <div className="text-sm mt-2">
                            <span className="inline-block mr-4">
                              <strong>Seats:</strong> {type.seatingCapacity}
                            </span>
                            <span className="inline-block">
                              <strong>Luggage:</strong> {type.luggageCapacity}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => handleToggleStatus(type.id, !type.active)} disabled={loading}>
                            {type.active ? (
                              <X className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditType(type.id)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteType(type.id)} disabled={loading}>
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {transportTypes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground mb-2">No transport types added yet</p>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('typeName')?.focus()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Transport Type
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TransportTypesManagement;
