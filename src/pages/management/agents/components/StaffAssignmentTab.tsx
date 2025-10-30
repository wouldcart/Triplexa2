
import React, { useState } from "react";
import { format } from "date-fns";
import {
  BadgeCheck,
  Calendar,
  Edit,
  Info,
  MapPin,
  Plus,
  Trash,
  User,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Agent, AgentSource } from "@/types/agent";
import { AgentManagementService } from "@/services/agentManagementService";

interface StaffAssignmentTabProps {
  agent: Agent;
  agentId?: string;
  onAssignmentChange?: () => void;
}

// Local UI assignment type uses string-based staffId consistent with Supabase profile IDs
type UiAssignment = {
  staffId: string;
  staffName: string;
  role: string;
  email?: string;
  isPrimary: boolean;
  assignedAt: string;
  assignedBy?: string;
  assignedByName?: string;
  assignedByRole?: string;
  notes?: string;
};

const StaffAssignmentTab: React.FC<StaffAssignmentTabProps> = ({ agent, agentId, onAssignmentChange }) => {
  const [assignments, setAssignments] = useState<UiAssignment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [currentAssignment, setCurrentAssignment] = useState<UiAssignment | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState<boolean>(false);
  const [availableStaff, setAvailableStaff] = useState<{ id: string; name: string; role: string }[]>([]);

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const effectiveAgentId = agentId ? String(agentId) : String(agent.id);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
    } catch (e) {
      return dateStr;
    }
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        const staffRes = await AgentManagementService.getStaffMembers();
        setAvailableStaff(staffRes.data || []);
      } catch {}
      try {
        const res = await AgentManagementService.getAgentStaffAssignments(effectiveAgentId);
        setAssignments((res.data || []) as UiAssignment[]);
      } catch {}
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, agent.id]);

  const handleAddAssignment = async () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    const staffMember: any = availableStaff.find((s) => String(s.id) === String(selectedStaffId));
    if (!staffMember) {
      toast.error("Selected staff member not found");
      return;
    }

    const { error } = await AgentManagementService.addStaffAssignmentToAgent(
      effectiveAgentId,
      String(selectedStaffId),
      { isPrimary, notes, role: staffMember.role }
    );

    if (!error) {
      toast.success(`Staff member ${staffMember.name} assigned successfully`);
      const res = await AgentManagementService.getAgentStaffAssignments(effectiveAgentId);
      setAssignments((res.data || []) as UiAssignment[]);
      setIsAddDialogOpen(false);
      resetForm();
      if (onAssignmentChange) onAssignmentChange();
    } else {
      toast.error("Failed to assign staff member");
    }
  };

  const handleUpdateAssignment = async () => {
    if (!currentAssignment) {
      toast.error("No assignment selected for update");
      return;
    }

    const { error } = await AgentManagementService.updateStaffAssignmentForAgent(
      effectiveAgentId,
      String(currentAssignment.staffId),
      {
        isPrimary,
        notes,
      }
    );

    if (!error) {
      toast.success(`Assignment updated successfully`);
      const res = await AgentManagementService.getAgentStaffAssignments(effectiveAgentId);
      setAssignments((res.data || []) as UiAssignment[]);
      setIsEditDialogOpen(false);
      resetForm();
      if (onAssignmentChange) onAssignmentChange();
    } else {
      toast.error("Failed to update assignment");
    }
  };

  const handleRemoveAssignment = async () => {
    if (!currentAssignment) {
      toast.error("No assignment selected for removal");
      return;
    }

    const { error } = await AgentManagementService.removeStaffAssignmentFromAgent(
      effectiveAgentId,
      String(currentAssignment.staffId)
    );

    if (!error) {
      toast.success(`Assignment removed successfully`);
      const res = await AgentManagementService.getAgentStaffAssignments(effectiveAgentId);
      setAssignments((res.data || []) as UiAssignment[]);
      setIsRemoveDialogOpen(false);
      if (onAssignmentChange) onAssignmentChange();
    } else {
      toast.error("Failed to remove assignment");
    }
  };

  const resetForm = () => {
    setSelectedStaffId(null);
    setIsPrimary(false);
    setNotes("");
    setCurrentAssignment(null);
  };

  const openEditDialog = (assignment: UiAssignment) => {
    setCurrentAssignment(assignment);
    setIsPrimary(assignment.isPrimary);
    setNotes(assignment.notes || "");
    setIsEditDialogOpen(true);
  };

  const openRemoveDialog = (assignment: UiAssignment) => {
    setCurrentAssignment(assignment);
    setIsRemoveDialogOpen(true);
  };

  const renderSourceBadge = (source?: AgentSource) => {
    if (!source) return null;

    const colorMap = {
      event: "bg-purple-100 text-purple-800",
      lead: "bg-blue-100 text-blue-800",
      referral: "bg-green-100 text-green-800",
      website: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colorMap[source.type]}`}>
        {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Agent Creation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agent.createdBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Created by: </span>
                <span className="font-medium">{agent.createdBy.staffName}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Created on: </span>
              <span className="font-medium">{formatDate(agent.createdAt)}</span>
            </div>

            {agent.source && (
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Source: </span>
                <div>
                  {renderSourceBadge(agent.source)}
                  <span className="ml-2 text-sm">{agent.source.details}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Staff Assignments</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto">
                <Plus className="mr-2 h-4 w-4" />
                Assign Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Staff to Agent</DialogTitle>
                <DialogDescription>
                  Select a staff member to assign to this agent.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="staff">Select Staff Member</Label>
                  <Select
                    value={selectedStaffId || ""}
                    onValueChange={(value) => setSelectedStaffId(value)}
                  >
                    <SelectTrigger id="staff">
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaff.map((staff) => (
                        <SelectItem key={staff.id} value={String(staff.id)}>
                          {staff.name} - {staff.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="primary"
                    checked={isPrimary}
                    onCheckedChange={setIsPrimary}
                  />
                  <Label htmlFor="primary">Set as Primary Contact</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this assignment"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddAssignment} disabled={!selectedStaffId}>
                    Assign
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={`${assignment.staffId}-${assignment.assignedAt}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{assignment.staffName}</span>
                        {assignment.isPrimary && (
                          <Badge variant="success">Primary</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Role: {assignment.role}
                      </div>
                      {assignment?.email && (
                        <div className="text-sm text-muted-foreground">
                          Email: {assignment.email}
                        </div>
                      )}
                      {assignment.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Notes: {assignment.notes}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Assigned on {formatDate(assignment.assignedAt)}
                      </div>
                      {assignment.assignedByName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Assigned by {assignment.assignedByName}{assignment.assignedByRole ? ` (${assignment.assignedByRole})` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(assignment)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openRemoveDialog(assignment)}
                    >
                      <Trash className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No staff assigned to this agent yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update primary contact status or add notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-primary"
                checked={isPrimary}
                onCheckedChange={setIsPrimary}
              />
              <Label htmlFor="edit-primary">Primary Contact</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this assignment"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Assignment Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {currentAssignment?.staffName} from this agent?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveAssignment}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffAssignmentTab;
