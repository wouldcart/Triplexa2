
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  CheckCircle,
  XCircle,
  Calculator
} from "lucide-react";
import { SalaryStructure, SalaryComponent } from "@/types/staff";
import { toast } from "@/components/ui/sonner";

const SalaryStructureManager: React.FC = () => {
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock salary structures
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      basicSalary: 5000,
      allowances: [
        { id: '1', name: 'House Rent Allowance', type: 'allowance', amount: 2000, isPercentage: false, isFixed: true, taxable: true },
        { id: '2', name: 'Medical Allowance', type: 'allowance', amount: 500, isPercentage: false, isFixed: true, taxable: false },
        { id: '3', name: 'Transport Allowance', type: 'allowance', amount: 300, isPercentage: false, isFixed: true, taxable: false }
      ],
      deductions: [
        { id: '4', name: 'Provident Fund', type: 'deduction', amount: 12, isPercentage: true, isFixed: false, taxable: false },
        { id: '5', name: 'ESI', type: 'deduction', amount: 1.75, isPercentage: true, isFixed: false, taxable: false }
      ],
      variablePay: [
        { id: '6', name: 'Performance Bonus', type: 'variable', amount: 1000, isPercentage: false, isFixed: false, taxable: true }
      ],
      currency: 'USD',
      effectiveDate: '2025-01-01',
      lastUpdated: '2025-05-26',
      approvalStatus: 'approved',
      approvedBy: 'HR Manager'
    }
  ]);

  // Mock employee data
  const employees = [
    { id: 'EMP001', name: 'John Doe', department: 'Sales' },
    { id: 'EMP002', name: 'Jane Smith', department: 'Operations' },
    { id: 'EMP003', name: 'Mike Johnson', department: 'Customer Support' }
  ];

  const handleCreateStructure = () => {
    // Logic to create new salary structure
    toast.success("New salary structure created!");
    setIsCreateDialogOpen(false);
  };

  const handleApproveStructure = (structureId: string) => {
    setSalaryStructures(prev => 
      prev.map(structure => 
        structure.id === structureId 
          ? { ...structure, approvalStatus: 'approved', approvedBy: 'HR Manager' }
          : structure
      )
    );
    toast.success("Salary structure approved!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Calculator className="h-4 w-4 text-orange-600" />;
      default: return <Calculator className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateGrossSalary = (structure: SalaryStructure) => {
    const allowancesTotal = structure.allowances.reduce((sum, allowance) => {
      return sum + (allowance.isPercentage ? (structure.basicSalary * allowance.amount / 100) : allowance.amount);
    }, 0);
    
    const variableTotal = structure.variablePay.reduce((sum, variable) => {
      return sum + (variable.isPercentage ? (structure.basicSalary * variable.amount / 100) : variable.amount);
    }, 0);
    
    return structure.basicSalary + allowancesTotal + variableTotal;
  };

  const calculateDeductions = (structure: SalaryStructure) => {
    const grossSalary = calculateGrossSalary(structure);
    return structure.deductions.reduce((sum, deduction) => {
      return sum + (deduction.isPercentage ? (grossSalary * deduction.amount / 100) : deduction.amount);
    }, 0);
  };

  const filteredStructures = salaryStructures.filter(structure => {
    const employee = employees.find(emp => emp.id === structure.employeeId);
    const matchesStatus = filterStatus === "all" || structure.approvalStatus === filterStatus;
    const matchesSearch = searchTerm === "" || 
      (employee && employee.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Salary Structure Management</h2>
          <p className="text-muted-foreground">Configure and manage employee salary structures</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Salary Structure</DialogTitle>
                <DialogDescription>
                  Configure salary components for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="basicSalary">Basic Salary</Label>
                    <Input id="basicSalary" placeholder="Enter basic salary" />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateStructure} className="flex-1">
                    Create Structure
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Structures</p>
                <p className="text-2xl font-bold">{salaryStructures.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">
                  {salaryStructures.filter(s => s.approvalStatus === 'pending').length}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {salaryStructures.filter(s => s.approvalStatus === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Gross Salary</p>
                <p className="text-2xl font-bold">
                  ${Math.round(salaryStructures.reduce((sum, s) => sum + calculateGrossSalary(s), 0) / salaryStructures.length).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Salary Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStructures.map((structure) => {
                const employee = employees.find(emp => emp.id === structure.employeeId);
                const grossSalary = calculateGrossSalary(structure);
                const totalDeductions = calculateDeductions(structure);
                const netSalary = grossSalary - totalDeductions;
                
                return (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{employee?.name}</p>
                        <p className="text-sm text-muted-foreground">{employee?.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>${structure.basicSalary.toLocaleString()}</TableCell>
                    <TableCell>${Math.round(grossSalary).toLocaleString()}</TableCell>
                    <TableCell>${Math.round(totalDeductions).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${Math.round(netSalary).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(structure.approvalStatus)}
                        <Badge 
                          variant={
                            structure.approvalStatus === 'approved' ? 'default' : 
                            structure.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {structure.approvalStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(structure.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedStructure(structure)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Salary Structure Details - {employee?.name}</DialogTitle>
                              <DialogDescription>
                                View and manage salary structure components
                              </DialogDescription>
                            </DialogHeader>
                            {selectedStructure && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Employee</label>
                                    <p className="text-lg">{employee?.name}</p>
                                    <p className="text-sm text-muted-foreground">{employee?.department}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Basic Salary</label>
                                    <p className="text-lg">${selectedStructure.basicSalary.toLocaleString()}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="font-medium mb-3 text-green-700">Allowances</h4>
                                    <div className="space-y-2">
                                      {selectedStructure.allowances.map((allowance) => (
                                        <div key={allowance.id} className="flex justify-between text-sm">
                                          <span>{allowance.name}</span>
                                          <span>${allowance.amount.toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-3 text-red-700">Deductions</h4>
                                    <div className="space-y-2">
                                      {selectedStructure.deductions.map((deduction) => (
                                        <div key={deduction.id} className="flex justify-between text-sm">
                                          <span>{deduction.name}</span>
                                          <span>
                                            {deduction.isPercentage ? `${deduction.amount}%` : `$${deduction.amount.toLocaleString()}`}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-3 text-blue-700">Variable Pay</h4>
                                    <div className="space-y-2">
                                      {selectedStructure.variablePay.map((variable) => (
                                        <div key={variable.id} className="flex justify-between text-sm">
                                          <span>{variable.name}</span>
                                          <span>${variable.amount.toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="border-t pt-4">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Gross Salary</p>
                                      <p className="text-xl font-bold">${Math.round(calculateGrossSalary(selectedStructure)).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Total Deductions</p>
                                      <p className="text-xl font-bold text-red-600">-${Math.round(calculateDeductions(selectedStructure)).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Net Salary</p>
                                      <p className="text-xl font-bold text-green-600">${Math.round(calculateGrossSalary(selectedStructure) - calculateDeductions(selectedStructure)).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {selectedStructure.approvalStatus === 'pending' && (
                                  <div className="flex gap-2 pt-4">
                                    <Button 
                                      onClick={() => handleApproveStructure(selectedStructure.id)}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve Structure
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {structure.approvalStatus === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => handleApproveStructure(structure.id)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryStructureManager;
