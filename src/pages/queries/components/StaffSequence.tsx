import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StaffMember } from '@/types/assignment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveStaffData, EnhancedStaffWithWorkload } from '@/hooks/useActiveStaffData';

interface StaffSequenceProps {
  staff: EnhancedStaffWithWorkload[];
}

const StaffSequence: React.FC<StaffSequenceProps> = ({ staff }) => {
  const { toast } = useToast();
  const { activeStaff } = useActiveStaffData();
  
  const [sequenceStaff, setSequenceStaff] = useState(() => 
    [...staff]
      .filter(s => s.active && s.autoAssignEnabled)
      .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // Get staff members who are active but not in the sequence
  const availableStaff = activeStaff.filter(s => 
    s.active && 
    !sequenceStaff.some(sequenceMember => sequenceMember.id === s.id)
  );

  const moveStaff = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sequenceStaff.length - 1)
    ) {
      return;
    }

    const newList = [...sequenceStaff];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    
    // Update sequence orders
    newList.forEach((staff, idx) => {
      staff.sequenceOrder = idx + 1;
    });
    
    setSequenceStaff(newList);
  };

  const handleAddStaff = () => {
    if (!selectedStaffId) {
      toast({
        title: "No staff selected",
        description: "Please select a staff member to add.",
        variant: "destructive",
      });
      return;
    }

    const staffId = parseInt(selectedStaffId);
    const staffToAdd = activeStaff.find(s => s.id === staffId);
    
    if (staffToAdd) {
      // Add to sequence staff list
      const updatedStaff: EnhancedStaffWithWorkload[] = [...sequenceStaff, {
        ...staffToAdd,
        autoAssignEnabled: true,
        sequenceOrder: sequenceStaff.length + 1
      }];
      
      setSequenceStaff(updatedStaff);
      setAddStaffDialogOpen(false);
      setSelectedStaffId('');
      
      toast({
        title: "Staff added",
        description: `${staffToAdd.name} has been added to the assignment sequence`,
      });
    }
  };

  const handleRemoveStaff = (staffId: number) => {
    const staffToRemove = sequenceStaff.find(s => s.id === staffId);
    const updatedStaff = sequenceStaff.filter(s => s.id !== staffId);
    
    // Reorder sequence numbers
    updatedStaff.forEach((staff, index) => {
      staff.sequenceOrder = index + 1;
    });
    
    setSequenceStaff(updatedStaff);
    
    toast({
      title: "Staff removed",
      description: `${staffToRemove?.name || 'Staff member'} has been removed from the assignment sequence`,
    });
  };

  const saveSequence = () => {
    // In a real app, this would save to the backend
    setIsEditing(false);
    
    toast({
      title: "Staff sequence updated",
      description: "The auto-assignment staff sequence has been updated successfully",
    });
  };

  const cancelEdit = () => {
    // Reset to original staff data
    setSequenceStaff(
      [...staff]
        .filter(s => s.active && s.autoAssignEnabled)
        .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999))
    );
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Staff Sequence</CardTitle>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveSequence}>
                Save Sequence
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddStaffDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Staff
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Sequence
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sequenceStaff.length > 0 ? (
            sequenceStaff.map((staff, index) => (
              <div
                key={staff.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isEditing ? 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700' : 'border-border'
                }`}
              >
                <div className="flex items-center">
                  {isEditing && (
                    <GripVertical className="h-4 w-4 mr-2 text-muted-foreground cursor-move" />
                  )}
                  <span className="font-medium mr-3 text-sm bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Workload: {staff.assigned}/{staff.workloadCapacity}
                      </span>
                      {staff.expertise.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {staff.expertise.slice(0, 2).join(', ')}
                            {staff.expertise.length > 2 && ` +${staff.expertise.length - 2}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  {isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={index === 0}
                        onClick={() => moveStaff(index, 'up')}
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={index === sequenceStaff.length - 1}
                        onClick={() => moveStaff(index, 'down')}
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleRemoveStaff(staff.id)}
                        title="Remove from sequence"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-2">No staff in the auto-assignment sequence</div>
              <Button variant="outline" size="sm" onClick={() => setAddStaffDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Staff to Sequence
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff to Sequence</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {availableStaff.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a staff member to add to the auto-assignment sequence:
                </p>
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{staff.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{staff.name}</span>
                            <span className="ml-2 text-muted-foreground text-xs">({staff.role})</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedStaffId && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    {(() => {
                      const selectedStaff = availableStaff.find(s => s.id === parseInt(selectedStaffId));
                      return selectedStaff ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{selectedStaff.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{selectedStaff.name}</div>
                            <div className="text-sm text-muted-foreground">{selectedStaff.role}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Current workload: {selectedStaff.assigned}/{selectedStaff.workloadCapacity}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-2">All active staff members are already in the sequence.</p>
                <p className="text-sm text-muted-foreground">
                  Add more staff members in the Staff Management section to expand the sequence.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddStaffDialogOpen(false);
              setSelectedStaffId('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddStaff}
              disabled={availableStaff.length === 0 || !selectedStaffId}
            >
              Add to Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StaffSequence;
