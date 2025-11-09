import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StaffMember } from '@/types/assignment';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveStaffData, EnhancedStaffWithWorkload } from '@/hooks/useActiveStaffData';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
import StaffSequenceService, { StaffSequenceRow } from '@/services/staffSequenceService';

interface StaffSequenceProps {
  staff: EnhancedStaffWithWorkload[];
}

const StaffSequence: React.FC<StaffSequenceProps> = ({ staff }) => {
  const { toast } = useToast();
  const { activeStaff } = useActiveStaffData();
  const { getCountryById } = useRealTimeCountriesData();
  const toCountryName = (value: string) => getCountryById(value)?.name || value;
  
  const [sequenceStaff, setSequenceStaff] = useState<EnhancedStaffWithWorkload[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Hydrate sequence from Supabase
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await StaffSequenceService.fetchSequence();
        const mapped: EnhancedStaffWithWorkload[] = (data || [])
          .map((row: StaffSequenceRow) => {
            const found = activeStaff.find(s => (s as any).uuid && String((s as any).uuid) === String(row.staff_id));
            if (found) {
              return { ...found, sequenceOrder: row.sequence_order, autoAssignEnabled: row.auto_assign_enabled ?? true } as EnhancedStaffWithWorkload;
            }
            // Fallback placeholder if profile not in activeStaff
            return {
              ...(found || ({} as any)),
              id: found?.id ?? -1,
              name: found?.name ?? 'Unknown',
              role: found?.role ?? 'staff',
              email: found?.email ?? '',
              department: found?.department ?? 'General',
              status: found?.status ?? 'active',
              assigned: found?.assigned ?? 0,
              workloadCapacity: found?.workloadCapacity ?? 10,
              expertise: found?.expertise ?? [],
              active: found?.active ?? true,
              avatar: found?.avatar ?? '',
              availability: found?.availability ?? [],
              autoAssignEnabled: row.auto_assign_enabled ?? true,
              sequenceOrder: row.sequence_order,
            } as EnhancedStaffWithWorkload;
          })
          .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999));
        if (!ignore) setSequenceStaff(mapped);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [activeStaff]);

  // Get staff members who are active but not in the sequence
  const availableStaff = useMemo(() => {
    return activeStaff.filter(s => 
      s.active && 
      !sequenceStaff.some(sequenceMember => {
        const seqUuid = (sequenceMember as any).uuid ? String((sequenceMember as any).uuid) : String(sequenceMember.id);
        const sUuid = (s as any).uuid ? String((s as any).uuid) : String(s.id);
        return seqUuid === sUuid;
      })
    );
  }, [activeStaff, sequenceStaff]);

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

    const staffToAdd = activeStaff.find(s => {
      const sUuid = (s as any).uuid ? String((s as any).uuid) : String(s.id);
      return sUuid === selectedStaffId;
    });
    
    if (staffToAdd) {
      // Persist to Supabase using UUID if available
      const uuid = (staffToAdd as any).uuid ? String((staffToAdd as any).uuid) : String(staffToAdd.id);
      StaffSequenceService.addStaff(uuid, sequenceStaff.length + 1)
        .then(() => {
          setAddStaffDialogOpen(false);
          setSelectedStaffId('');
          toast({
            title: "Staff added",
            description: `${staffToAdd.name} has been added to the assignment sequence`,
          });
          // Reload sequence from DB
          return StaffSequenceService.fetchSequence();
        })
        .then(({ data }) => {
          const mapped: EnhancedStaffWithWorkload[] = (data || [])
            .map((row: StaffSequenceRow) => {
              const found = activeStaff.find(s => (s as any).uuid && String((s as any).uuid) === String(row.staff_id));
              if (found) {
                return { ...found, sequenceOrder: row.sequence_order, autoAssignEnabled: row.auto_assign_enabled ?? true } as EnhancedStaffWithWorkload;
              }
              return {
                id: -1,
                name: 'Unknown',
                role: 'staff',
                email: '',
                department: 'General',
                status: 'active',
                assigned: 0,
                workloadCapacity: 10,
                expertise: [],
                active: true,
                avatar: '',
                availability: [],
                autoAssignEnabled: row.auto_assign_enabled ?? true,
                sequenceOrder: row.sequence_order,
              } as EnhancedStaffWithWorkload;
            })
            .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999));
          setSequenceStaff(mapped);
        })
        .catch(() => {
          toast({
            title: "Failed to add staff",
            description: "Unable to persist sequence in Supabase",
            variant: "destructive",
          });
        });
    }
  };

  const handleRemoveStaff = (staffId: number) => {
    const staffToRemove = sequenceStaff.find(s => s.id === staffId);
    const uuid = staffToRemove && (staffToRemove as any).uuid ? String((staffToRemove as any).uuid) : undefined;
    const name = staffToRemove?.name || 'Staff member';
    if (!uuid) {
      toast({ title: 'Cannot remove', description: 'Missing staff UUID', variant: 'destructive' });
      return;
    }
    StaffSequenceService.removeStaff(uuid)
      .then(() => {
        toast({ title: 'Staff removed', description: `${name} has been removed from the assignment sequence` });
        // Reload from DB
        return StaffSequenceService.fetchSequence();
      })
      .then(({ data }) => {
        const mapped: EnhancedStaffWithWorkload[] = (data || [])
          .map((row: StaffSequenceRow) => {
            const found = activeStaff.find(s => (s as any).uuid && String((s as any).uuid) === String(row.staff_id));
            if (found) {
              return { ...found, sequenceOrder: row.sequence_order, autoAssignEnabled: row.auto_assign_enabled ?? true } as EnhancedStaffWithWorkload;
            }
            return {
              id: -1,
              name: 'Unknown',
              role: 'staff',
              email: '',
              department: 'General',
              status: 'active',
              assigned: 0,
              workloadCapacity: 10,
              expertise: [],
              active: true,
              avatar: '',
              availability: [],
              autoAssignEnabled: row.auto_assign_enabled ?? true,
              sequenceOrder: row.sequence_order,
            } as EnhancedStaffWithWorkload;
          })
          .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999));
        setSequenceStaff(mapped);
      })
      .catch(() => {
        toast({ title: 'Failed to remove staff', description: 'Unable to update Supabase', variant: 'destructive' });
      });
  };

  const handleToggleStaffAutoAssign = (s: EnhancedStaffWithWorkload, index: number, enabled: boolean) => {
    const uuid = (s as any).uuid ? String((s as any).uuid) : undefined;
    if (!uuid) {
      toast({ title: 'Cannot update auto-assign', description: 'Missing staff UUID', variant: 'destructive' });
      return;
    }
    // Optimistic UI update
    setSequenceStaff(prev => prev.map((item, i) => i === index ? { ...item, autoAssignEnabled: enabled } : item));
    StaffSequenceService.updateAutoAssign(uuid, enabled)
      .then(({ error }) => {
        if (error) throw error;
        toast({ title: 'Auto-assign updated', description: `${s.name}: ${enabled ? 'Enabled' : 'Disabled'}` });
      })
      .catch(() => {
        // Revert on failure
        setSequenceStaff(prev => prev.map((item, i) => i === index ? { ...item, autoAssignEnabled: !enabled } : item));
        toast({ title: 'Failed to update', description: 'Could not persist auto-assign in Supabase', variant: 'destructive' });
      });
  };

  const saveSequence = () => {
    const payload: StaffSequenceRow[] = sequenceStaff.map((s, idx) => ({
      staff_id: ((s as any).uuid ? String((s as any).uuid) : String(s.id)),
      sequence_order: s.sequenceOrder || idx + 1,
      auto_assign_enabled: s.autoAssignEnabled ?? true,
    }));
    StaffSequenceService.upsertSequence(payload)
      .then(() => {
        setIsEditing(false);
        toast({
          title: 'Staff sequence updated',
          description: 'The auto-assignment staff sequence has been updated successfully',
        });
      })
      .catch(() => {
        toast({ title: 'Failed to save sequence', description: 'Unable to persist to Supabase', variant: 'destructive' });
      });
  };

  const cancelEdit = () => {
    // Reload from DB instead of local reset
    StaffSequenceService.fetchSequence().then(({ data }) => {
      const mapped: EnhancedStaffWithWorkload[] = (data || [])
        .map((row: StaffSequenceRow) => {
          const found = activeStaff.find(s => (s as any).uuid && String((s as any).uuid) === String(row.staff_id));
          if (found) {
            return { ...found, sequenceOrder: row.sequence_order, autoAssignEnabled: row.auto_assign_enabled ?? true } as EnhancedStaffWithWorkload;
          }
          return {
            id: -1,
            name: 'Unknown',
            role: 'staff',
            email: '',
            department: 'General',
            status: 'active',
            assigned: 0,
            workloadCapacity: 10,
            expertise: [],
            active: true,
            avatar: '',
            availability: [],
            autoAssignEnabled: row.auto_assign_enabled ?? true,
            sequenceOrder: row.sequence_order,
          } as EnhancedStaffWithWorkload;
        })
        .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999));
      setSequenceStaff(mapped);
      setIsEditing(false);
    });
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
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Loading sequence…</div>
          ) : sequenceStaff.length > 0 ? (
            sequenceStaff.map((staff, index) => {
              const rowKey = (staff as any).uuid
                ? String((staff as any).uuid)
                : (staff as any).sequenceUuid
                ? String((staff as any).sequenceUuid)
                : `row-${index}`;
              const selectId = (staff as any).uuid
                ? String((staff as any).uuid)
                : (staff as any).sequenceUuid
                ? String((staff as any).sequenceUuid)
                : String(staff.id);
              return (
              <div
                key={rowKey}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                  isEditing ? 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700' : 'border-border'
                } ${selectedStaffId === selectId ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedStaffId(selectId)}
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
                            {staff.expertise.slice(0, 2).map(toCountryName).join(', ')}
                            {staff.expertise.length > 2 && ` +${staff.expertise.length - 2}`}
                          </span>
                        </>
                      )}
                      {staff.autoAssignEnabled === false && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">Auto-assign disabled</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 items-center">
                  <div className="flex items-center gap-2 mr-1">
                    <Switch
                      id={`auto-assign-${rowKey}`}
                      checked={!!staff.autoAssignEnabled}
                      onCheckedChange={(checked) => handleToggleStaffAutoAssign(staff, index, checked)}
                    />
                  </div>
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
              );
            })
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
            <DialogDescription>
              Select a staff member to add to the auto-assignment sequence.
            </DialogDescription>
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
                      <SelectItem
                        key={(staff as any).uuid ? String((staff as any).uuid) : staff.id.toString()}
                        value={(staff as any).uuid ? String((staff as any).uuid) : staff.id.toString()}
                      >
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
                      const selectedStaff = availableStaff.find(s => {
                        const sUuid = (s as any).uuid ? String((s as any).uuid) : String(s.id);
                        return sUuid === selectedStaffId;
                      });
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
