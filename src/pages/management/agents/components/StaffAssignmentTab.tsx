
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

import { Agent, AgentSource, StaffAssignment } from "@/types/agent";
import { getStaffAssignmentsForAgent, addStaffAssignment, removeStaffAssignment, updateStaffAssignment } from "@/data/agentData";
import { staffMembers } from "@/data/staffData";

interface StaffAssignmentTabProps {
  agent: Agent;
  onAssignmentChange?: () => void;
}

const StaffAssignmentTab: React.FC<StaffAssignmentTabProps> = ({ agent, onAssignmentChange }) => {
  const [assignments, setAssignments] = useState<StaffAssignment[]>(
    agent.staffAssignments || []
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [currentAssignment, setCurrentAssignment] = useState<StaffAssignment | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState<boolean>(false);

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
    } catch (e) {
      return dateStr;
    }
  };

  const handleAddAssignment = () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    const staffMember = staffMembers.find(s => parseInt(s.id) === selectedStaffId);
    if (!staffMember) {
      toast.error("Selected staff member not found");
      return;
    }

    const success = addStaffAssignment(
      agent.id,
      selectedStaffId,
      staffMember.name,
      staffMember.role,
      isPrimary,
      "Current User", // In a real app, this would be the logged-in user
      notes || undefined
    );

    if (success) {
      toast.success(`Staff member ${staffMember.name} assigned successfully`);
      setAssignments(getStaffAssignmentsForAgent(agent.id));
      setIsAddDialogOpen(false);
      resetForm();
      if (onAssignmentChange) onAssignmentChange();
    } else {
      toast.error("Failed to assign staff member");
    }
  };

  const handleUpdateAssignment = () => {
    if (!currentAssignment) {
      toast.error("No assignment selected for update");
      return;
    }

    const success = updateStaffAssignment(agent.id, currentAssignment.staffId, {
      isPrimary,
      notes
    });

    if (success) {
      toast.success(`Assignment updated successfully`);
      setAssignments(getStaffAssignmentsForAgent(agent.id));
      setIsEditDialogOpen(false);
      resetForm();
      if (onAssignmentChange) onAssignmentChange();
    } else {
      toast.error("Failed to update assignment");
    }
  };

  const handleRemoveAssignment = () => {
    if (!currentAssignment) {
      toast.error("No assignment selected for removal");
      return;
    }

    const success = removeStaffAssignment(agent.id, currentAssignment.staffId);

    if (success) {
      toast.success(`Assignment removed successfully`);
      setAssignments(getStaffAssignmentsForAgent(agent.id));
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

  const openEditDialog = (assignment: StaffAssignment) => {
    setCurrentAssignment(assignment);
    setIsPrimary(assignment.isPrimary);
    setNotes(assignment.notes || "");
    setIsEditDialogOpen(true);
  };

  const openRemoveDialog = (assignment: StaffAssignment) => {
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
      other: "bg-gray-100 text-gray-800"
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
                    value={selectedStaffId?.toString() || ""}
                    onValueChange={(value) => setSelectedStaffId(parseInt(value))}
                  >
                    <SelectTrigger id="staff">
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
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
                  <Label htmlFor="primary">Primary Contact</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this assignment"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAssignment}>Assign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.staffId}
                  className="flex justify-between items-start border rounded-lg p-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{assignment.staffName}</span>
                      {assignment.isPrimary && (
                        <Badge variant="outline" className="text-xs">
                          <BadgeCheck className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.role}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned: {formatDate(assignment.assignedAt)}
                      {assignment.assignedBy && ` by ${assignment.assignedBy}`}
                    </div>
                    {assignment.notes && (
                      <div className="text-xs mt-2 bg-muted p-2 rounded">
                        {assignment.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openRemoveDialog(assignment)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                No staff assignments
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign staff members to manage this agent.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Assignment</DialogTitle>
            <DialogDescription>
              Update the assignment details for {currentAssignment?.staffName}.
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
