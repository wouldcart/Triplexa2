
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TransportType } from '../types/transportTypes';

interface TransportTypeEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transportType: TransportType) => void;
  transportType: TransportType | null;
  transportCategories: string[];
}

const TransportTypeEditSheet: React.FC<TransportTypeEditSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  transportType,
  transportCategories
}) => {
  const [editedType, setEditedType] = useState<TransportType | null>(null);
  const [notApplicableSeating, setNotApplicableSeating] = useState(false);
  const [notApplicableLuggage, setNotApplicableLuggage] = useState(false);

  useEffect(() => {
    if (transportType) {
      setEditedType(transportType);
      setNotApplicableSeating(transportType.seatingCapacity === 0);
      setNotApplicableLuggage(transportType.luggageCapacity === 0);
    }
  }, [transportType]);

  const handleChange = (field: keyof TransportType, value: any) => {
    if (editedType) {
      setEditedType({
        ...editedType,
        [field]: value
      });
    }
  };

  const handleSeatingCapacityChange = (value: string) => {
    if (notApplicableSeating || !editedType) return;
    const numValue = value === '' ? 0 : parseInt(value);
    handleChange('seatingCapacity', numValue);
  };

  const handleLuggageCapacityChange = (value: string) => {
    if (notApplicableLuggage || !editedType) return;
    const numValue = value === '' ? 0 : parseInt(value);
    handleChange('luggageCapacity', numValue);
  };

  const toggleNotApplicableSeating = () => {
    setNotApplicableSeating(!notApplicableSeating);
    if (editedType) {
      if (!notApplicableSeating) {
        handleChange('seatingCapacity', 0);
      }
    }
  };

  const toggleNotApplicableLuggage = () => {
    setNotApplicableLuggage(!notApplicableLuggage);
    if (editedType) {
      if (!notApplicableLuggage) {
        handleChange('luggageCapacity', 0);
      }
    }
  };

  const handleSubmit = () => {
    if (editedType) {
      onSave(editedType);
    }
  };

  const isFormValid = () => {
    return editedType && 
      editedType.name.trim() !== '' &&
      editedType.category.trim() !== '';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Transport Type</SheetTitle>
          <SheetDescription>
            Update transport type specifications
          </SheetDescription>
        </SheetHeader>
        
        {editedType && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Transport Type Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={editedType.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select 
                value={editedType.category} 
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
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
                  onClick={() => handleSeatingCapacityChange(Math.max(0, editedType.seatingCapacity - 1).toString())}
                  disabled={notApplicableSeating}
                >
                  -
                </Button>
                <Input 
                  id="seating"
                  type="number"
                  min="0"
                  value={notApplicableSeating ? "N/A" : editedType.seatingCapacity}
                  onChange={(e) => handleSeatingCapacityChange(e.target.value)}
                  disabled={notApplicableSeating}
                  className="text-center"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-10 w-10 p-0"
                  onClick={() => handleSeatingCapacityChange((editedType.seatingCapacity + 1).toString())}
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
                  onClick={() => handleLuggageCapacityChange(Math.max(0, editedType.luggageCapacity - 1).toString())}
                  disabled={notApplicableLuggage}
                >
                  -
                </Button>
                <Input 
                  id="luggage"
                  type="number"
                  min="0"
                  value={notApplicableLuggage ? "N/A" : editedType.luggageCapacity}
                  onChange={(e) => handleLuggageCapacityChange(e.target.value)}
                  disabled={notApplicableLuggage}
                  className="text-center"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-10 w-10 p-0"
                  onClick={() => handleLuggageCapacityChange((editedType.luggageCapacity + 1).toString())}
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
                  checked={editedType.active}
                  onCheckedChange={(checked) => handleChange('active', checked)}
                />
              </div>
            </div>
          </div>
        )}
        
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TransportTypeEditSheet;
