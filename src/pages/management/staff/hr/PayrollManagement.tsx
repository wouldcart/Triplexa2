
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
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Play, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Users,
  TrendingUp,
  Clock
} from "lucide-react";
import { PayrollRun, PayrollEntry } from "@/types/staff";
import { toast } from "@/components/ui/sonner";

interface PayrollManagementProps {
  payrollRuns: PayrollRun[];
  setPayrollRuns: React.Dispatch<React.SetStateAction<PayrollRun[]>>;
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({ payrollRuns, setPayrollRuns }) => {
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock payroll entries
  const [payrollEntries] = useState<PayrollEntry[]>([
    {
      id: '1',
      payrollRunId: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'Sales',
      basicSalary: 5000,
      totalAllowances: 1200,
      totalDeductions: 800,
      totalVariablePay: 500,
      grossSalary: 6700,
      netSalary: 5900,
      overtimePay: 200,
      taxDeductions: 600,
      pfDeduction: 150,
      esiDeduction: 50,
      loanDeductions: 0,
      advanceDeductions: 0,
      componentBreakdown: []
    }
  ]);

  const handleRunPayroll = (runId: string) => {
    setPayrollRuns(prev => 
      prev.map(run => 
        run.id === runId 
          ? { ...run, status: 'processing' }
          : run
      )
    );
    toast.success("Payroll run started successfully!");
  };

  const handleApproveRun = (runId: string) => {
    setPayrollRuns(prev => 
      prev.map(run => 
        run.id === runId 
          ? { ...run, status: 'approved' }
          : run
      )
    );
    toast.success("Payroll run approved!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredRuns = payrollRuns.filter(run => {
    const matchesStatus = filterStatus === "all" || run.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      run.period.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate payroll statistics
  const totalRuns = payrollRuns.length;
  const pendingRuns = payrollRuns.filter(r => r.status === 'draft' || r.status === 'processing').length;
  const approvedRuns = payrollRuns.filter(r => r.status === 'approved').length;
  const totalPayrollAmount = payrollRuns.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payroll Management</h2>
          <p className="text-muted-foreground">Manage employee payroll and salary processing</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run New Payroll
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payroll Runs</p>
                <p className="text-2xl font-bold">{totalRuns}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Processing</p>
                <p className="text-2xl font-bold">{pendingRuns}</p>
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
                <p className="text-2xl font-bold">{approvedRuns}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${(totalPayrollAmount / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by period..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.period}</TableCell>
                  <TableCell>{run.employeesCount}</TableCell>
                  <TableCell>${run.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <Badge 
                        variant={
                          run.status === 'approved' || run.status === 'paid' ? 'default' : 
                          run.status === 'processing' ? 'secondary' : 'outline'
                        }
                      >
                        {run.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(run.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedRun(run)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Payroll Run Details - {run.period}</DialogTitle>
                            <DialogDescription>
                              Review payroll run details and employee entries
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRun && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Period</label>
                                  <p className="text-lg">{selectedRun.period}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Badge variant="outline">{selectedRun.status}</Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Employees</label>
                                  <p>{selectedRun.employeesCount}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Total Amount</label>
                                  <p>${selectedRun.totalAmount.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Employee Entries</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Employee</TableHead>
                                      <TableHead>Department</TableHead>
                                      <TableHead>Gross Salary</TableHead>
                                      <TableHead>Net Salary</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {payrollEntries.map((entry) => (
                                      <TableRow key={entry.id}>
                                        <TableCell>{entry.employeeName}</TableCell>
                                        <TableCell>{entry.department}</TableCell>
                                        <TableCell>${entry.grossSalary.toLocaleString()}</TableCell>
                                        <TableCell>${entry.netSalary.toLocaleString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {selectedRun.status === 'draft' && (
                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={() => handleRunPayroll(selectedRun.id)}
                                    className="flex-1"
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Process Payroll
                                  </Button>
                                </div>
                              )}

                              {selectedRun.status === 'processing' && (
                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={() => handleApproveRun(selectedRun.id)}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve Payroll
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {run.status === 'draft' && (
                        <Button 
                          size="sm"
                          onClick={() => handleRunPayroll(run.id)}
                        >
                          Process
                        </Button>
                      )}
                      
                      {run.status === 'processing' && (
                        <Button 
                          size="sm"
                          onClick={() => handleApproveRun(run.id)}
                        >
                          Approve
                        </Button>
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

export default PayrollManagement;
