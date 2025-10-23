
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TransportType } from '../types/transportTypes';

interface TransportTypeAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transportType: Omit<TransportType, 'id'>) => void;
  transportCategories: string[];
}

const TransportTypeAddSheet: React.FC<TransportTypeAddSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  transportCategories
}) => {
  const [newType, setNewType] = useState<Omit<TransportType, 'id'>>({
    name: '',
    category: '',
    seatingCapacity: 0,
    luggageCapacity: 0,
    active: true
  });

  const [notApplicableSeating, setNotApplicableSeating] = useState(false);
  const [notApplicableLuggage, setNotApplicableLuggage] = useState(false);

  const handleChange = (field: keyof Omit<TransportType, 'id'>, value: any) => {
    setNewType({
      ...newType,
      [field]: value
    });
  };

  const handleSeatingCapacityChange = (value: string) => {
    if (notApplicableSeating) return;
    const numValue = value === '' ? 0 : parseInt(value);
    handleChange('seatingCapacity', numValue);
  };

  const handleLuggageCapacityChange = (value: string) => {
    if (notApplicableLuggage) return;
    const numValue = value === '' ? 0 : parseInt(value);
    handleChange('luggageCapacity', numValue);
  };

  const toggleNotApplicableSeating = () => {
    setNotApplicableSeating(!notApplicableSeating);
    if (!notApplicableSeating) {
      handleChange('seatingCapacity', 0);
    }
  };

  const toggleNotApplicableLuggage = () => {
    setNotApplicableLuggage(!notApplicableLuggage);
    if (!notApplicableLuggage) {
      handleChange('luggageCapacity', 0);
    }
  };

  const handleSubmit = () => {
    onSave(newType);
    // Reset form
    setNewType({
      name: '',
      category: '',
      seatingCapacity: 0,
      luggageCapacity: 0,
      active: true
    });
    setNotApplicableSeating(false);
    setNotApplicableLuggage(false);
  };

  const isFormValid = () => {
    return (
      newType.name.trim() !== '' &&
      newType.category.trim() !== ''
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Transport Type</SheetTitle>
          <SheetDescription>
            Create a new transport type and define its specifications
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Transport Type Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={newType.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter transport type name (e.g., SUV)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <Select 
              value={newType.category} 
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {transportCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="seating">Seating Capacity (Adults) <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Not Applicable</span>
                <Switch 
                  checked={notApplicableSeating}
                  onCheckedChange={toggleNotApplicableSeating}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="h-10 w-10 p-0"
                onClick={() => handleSeatingCapacityChange(Math.max(0, newType.seatingCapacity - 1).toString())}
                disabled={notApplicableSeating}
              >
                -
              </Button>
              <Input 
                id="seating"
                type="number"
                min="0"
                value={notApplicableSeating ? "N/A" : newType.seatingCapacity}
                onChange={(e) => handleSeatingCapacityChange(e.target.value)}
                disabled={notApplicableSeating}
                className="text-center"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="h-10 w-10 p-0"
                onClick={() => handleSeatingCapacityChange((newType.seatingCapacity + 1).toString())}
                disabled={notApplicableSeating}
              >
                +
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="luggage">Luggage Capacity <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Not Applicable</span>
                <Switch 
                  checked={notApplicableLuggage}
                  onCheckedChange={toggleNotApplicableLuggage}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="h-10 w-10 p-0"
                onClick={() => handleLuggageCapacityChange(Math.max(0, newType.luggageCapacity - 1).toString())}
                disabled={notApplicableLuggage}
              >
                -
              </Button>
              <Input 
                id="luggage"
                type="number"
                min="0"
                value={notApplicableLuggage ? "N/A" : newType.luggageCapacity}
                onChange={(e) => handleLuggageCapacityChange(e.target.value)}
                disabled={notApplicableLuggage}
                className="text-center"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="h-10 w-10 p-0"
                onClick={() => handleLuggageCapacityChange((newType.luggageCapacity + 1).toString())}
                disabled={notApplicableLuggage}
              >
                +
              </Button>
            </div>
            <Select disabled={notApplicableLuggage}>
              <SelectTrigger>
                <SelectValue placeholder="bags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bags">bags</SelectItem>
                <SelectItem value="suitcases">suitcases</SelectItem>
                <SelectItem value="pieces">pieces</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <Label htmlFor="active">Active Status</Label>
              <Switch 
                id="active"
                checked={newType.active}
                onCheckedChange={(checked) => handleChange('active', checked)}
              />
            </div>
          </div>
        </div>
        
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>Save Transport Type</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TransportTypeAddSheet;
