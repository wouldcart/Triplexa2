
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  Clock,
  Users,
  TrendingUp
} from "lucide-react";
import { LeaveApplication, LeaveBalance } from "@/types/staff";
import { toast } from "@/components/ui/sonner";

interface LeaveManagementProps {
  leaves: LeaveApplication[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveApplication[]>>;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ leaves, setLeaves }) => {
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Mock leave balances
  const [leaveBalances] = useState<LeaveBalance[]>([
    {
      employeeId: 'EMP001',
      annualLeave: 18,
      sickLeave: 8,
      casualLeave: 5,
      maternityPaternityLeave: 84,
      compensatoryOff: 2,
      year: 2025,
      lastUpdated: '2025-05-26'
    }
  ]);

  const handleLeaveAction = (leaveId: string, action: 'approve' | 'reject', reason?: string) => {
    setLeaves(prevLeaves => 
      prevLeaves.map(leave => {
        if (leave.id === leaveId) {
          return {
            ...leave,
            status: action === 'approve' ? 'approved' : 'rejected',
            approvedBy: action === 'approve' ? 'HR Manager' : undefined,
            approvedDate: action === 'approve' ? new Date().toISOString() : undefined,
            rejectionReason: reason
          };
        }
        return leave;
      })
    );
    toast.success(`Leave application ${action}d successfully!`);
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'casual': return 'bg-green-100 text-green-800';
      case 'maternity':
      case 'paternity': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      case 'comp-off': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = searchTerm === "" || 
      leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || leave.status === filterStatus;
    const matchesType = filterType === "all" || leave.leaveType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate leave statistics
  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Leave Management</h2>
          <p className="text-muted-foreground">Manage employee leave applications and balances</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{totalLeaves}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingLeaves}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedLeaves}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedLeaves}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by employee name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:w-64"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="annual">Annual Leave</SelectItem>
            <SelectItem value="sick">Sick Leave</SelectItem>
            <SelectItem value="casual">Casual Leave</SelectItem>
            <SelectItem value="maternity">Maternity Leave</SelectItem>
            <SelectItem value="paternity">Paternity Leave</SelectItem>
            <SelectItem value="emergency">Emergency Leave</SelectItem>
            <SelectItem value="comp-off">Comp Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.employeeName}</TableCell>
                  <TableCell>
                    <Badge className={getLeaveTypeColor(leave.leaveType)}>
                      {leave.leaveType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{leave.days}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(leave.status)}
                      <Badge 
                        variant={
                          leave.status === 'approved' ? 'default' : 
                          leave.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(leave.appliedDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedLeave(leave)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Leave Application Details</DialogTitle>
                            <DialogDescription>
                              Review and manage leave application
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLeave && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Employee</label>
                                  <p className="text-lg">{selectedLeave.employeeName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Leave Type</label>
                                  <Badge className={getLeaveTypeColor(selectedLeave.leaveType)}>
                                    {selectedLeave.leaveType}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Date Range</label>
                                  <p>{new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Total Days</label>
                                  <p>{selectedLeave.days} day(s)</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Reason</label>
                                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLeave.reason}</p>
                              </div>

                              {selectedLeave.status === 'pending' && (
                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={() => handleLeaveAction(selectedLeave.id, 'approve')}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="destructive" className="flex-1">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Leave Application</DialogTitle>
                                        <DialogDescription>
                                          Please provide a reason for rejection
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Enter rejection reason..."
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                          <Button 
                                            variant="destructive"
                                            onClick={() => {
                                              handleLeaveAction(selectedLeave.id, 'reject', rejectionReason);
                                              setRejectionReason("");
                                            }}
                                            disabled={!rejectionReason.trim()}
                                          >
                                            Confirm Rejection
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}

                              {selectedLeave.status === 'rejected' && selectedLeave.rejectionReason && (
                                <div>
                                  <label className="text-sm font-medium text-red-600">Rejection Reason</label>
                                  <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                                    {selectedLeave.rejectionReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {leave.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleLeaveAction(leave.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleLeaveAction(leave.id, 'reject', 'Rejected by HR')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveManagement;
