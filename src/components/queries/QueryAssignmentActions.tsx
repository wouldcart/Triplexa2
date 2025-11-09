import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import { Query } from "@/types/query";
import { useQueryAssignment } from "@/hooks/useQueryAssignment";
import { useEnhancedStaffData } from "@/hooks/useEnhancedStaffData";
import { useApp } from "@/contexts/AppContext";
import { useStaffNotifications } from "@/contexts/StaffNotificationContext";
import { staffNotificationService } from "@/services/staffNotificationService";
import { toast } from "sonner";

interface QueryAssignmentActionsProps {
  query: Query;
}

export const QueryAssignmentActions: React.FC<QueryAssignmentActionsProps> = ({
  query,
}) => {
  const { currentUser } = useApp();
  const { activeStaff } = useEnhancedStaffData();
  const { addNotification } = useStaffNotifications();
  const {
    assignQueryToStaff,
    findBestStaffMatch,
    getApplicableRule,
    isAssigning,
  } = useQueryAssignment();

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Check if current user can self-assign
  const canSelfAssign = currentUser?.role === "staff" && 
    (query.status === "new" || query.status === "unassigned");

  // Get staff member data for current user
  const currentStaffMember = activeStaff.find(
    staff => staff.email === currentUser?.email
  );

  // Get best staff match for recommendations
  const bestMatch = findBestStaffMatch(query);
  const applicableRule = getApplicableRule(query);

  const handleSelfAssign = () => {
    if (!currentStaffMember || !currentUser) {
      toast.error("Unable to find your staff profile");
      return;
    }

    assignQueryToStaff(query, currentStaffMember.id);
    
    // Create assignment notification
    const notification = staffNotificationService.createAssignmentNotification(
      query, 
      currentUser.id, 
      'Self-assigned'
    );
    addNotification(notification);
    
    toast.success("Query assigned to you successfully!");
  };

  const handleStaffAssign = () => {
    if (!selectedStaffId || !currentUser) {
      toast.error("Please select a staff member");
      return;
    }

    const selectedStaff = activeStaff.find(s => s.id.toString() === selectedStaffId);
    if (!selectedStaff) {
      toast.error("Selected staff member not found");
      return;
    }

    assignQueryToStaff(query, parseInt(selectedStaffId));
    
    // Create assignment notification for the assigned staff member
    const notification = staffNotificationService.createAssignmentNotification(
      query, 
      selectedStaff.id.toString(), 
      currentUser.name
    );
    addNotification(notification);
    
    setShowAssignDialog(false);
    setSelectedStaffId("");
    
    toast.success(`Query assigned to ${selectedStaff.name} successfully!`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "assigned":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAssignmentRecommendation = () => {
    if (!bestMatch) return null;

    return (
      <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Recommended Assignment</span>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>{bestMatch.name}</strong> - Best match based on {applicableRule?.replace('-', ' ')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {bestMatch.expertise.slice(0, 2).join(", ")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Current load: {bestMatch.assigned}/{bestMatch.workloadCapacity}
          </span>
        </div>
      </div>
    );
  };

  if (query.status === "assigned" || query.status === "in-progress") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon(query.status)}
            Assignment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="secondary" className="capitalize">
                {query.status.replace('-', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assigned to:</span>
              <span className="text-sm font-medium">Staff Member</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-4 w-4" />
          Query Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          {getStatusIcon(query.status)}
          <span className="text-sm text-muted-foreground">
            This query is available for assignment
          </span>
        </div>

        {/* Self Assignment */}
        {canSelfAssign && currentStaffMember && (
          <div className="space-y-2">
            <Button
              onClick={handleSelfAssign}
              disabled={isAssigning}
              className="w-full"
              variant="default"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isAssigning ? "Assigning..." : "Assign to Me"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Take ownership of this query
            </p>
          </div>
        )}

        {/* Staff Assignment */}
        <div className="space-y-2">
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Assign to Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Query to Staff</DialogTitle>
                <DialogDescription>
                  Select a staff member to assign this query to.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {getAssignmentRecommendation()}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Staff Member</label>
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose staff member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeStaff
                        .filter(staff => staff.active && staff.assigned < staff.workloadCapacity)
                        .map(staff => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium">{staff.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({staff.role})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {staff.assigned}/{staff.workloadCapacity}
                                </Badge>
                                {staff.id === bestMatch?.id && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStaffId && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm">
                      <strong>Staff Details:</strong>
                      {(() => {
                        const selectedStaff = activeStaff.find(s => s.id.toString() === selectedStaffId);
                        return selectedStaff ? (
                          <div className="mt-1 space-y-1">
                            <p>Expertise: {selectedStaff.expertise.slice(0, 3).join(", ")}</p>
                            <p>Current Load: {selectedStaff.assigned}/{selectedStaff.workloadCapacity}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStaffAssign}
                  disabled={!selectedStaffId || isAssigning}
                >
                  {isAssigning ? "Assigning..." : "Assign Query"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {bestMatch && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>{bestMatch.name}</strong> is recommended based on expertise match
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
