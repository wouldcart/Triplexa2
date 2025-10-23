
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  Gift,
  FileText,
  CheckCircle,
  XCircle,
  PlusCircle
} from "lucide-react";
import { HRAnalytics, LeaveApplication, PayrollRun, AttendanceRecord } from "@/types/staff";
import PayrollManagement from "./hr/PayrollManagement";
import LeaveManagement from "./hr/LeaveManagement";
import AttendanceManagement from "./hr/AttendanceManagement";
import SalaryStructureManager from "./hr/SalaryStructureManager";
import PageLayout from "@/components/layout/PageLayout";

const HRDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<HRAnalytics>({
    totalEmployees: 45,
    activeEmployees: 42,
    departmentWiseCount: {
      'Sales': 15,
      'Operations': 12,
      'Customer Support': 8,
      'Finance': 6,
      'Field Sales': 3,
      'HR': 1
    },
    averageSalary: 65000,
    totalPayrollCost: 2925000,
    leaveUtilization: 68,
    attendanceRate: 94,
    pendingLeaves: 7,
    pendingPayrollApprovals: 2,
    upcomingBirthdays: [
      { employeeId: '1', name: 'John Doe', department: 'Sales', date: '2025-06-01', daysUntil: 5 },
      { employeeId: '2', name: 'Jane Smith', department: 'Operations', date: '2025-06-03', daysUntil: 7 }
    ],
    complianceAlerts: [
      {
        id: '1',
        type: 'tax_filing',
        title: 'Monthly TDS Filing Due',
        description: 'Submit TDS returns for May 2025',
        dueDate: '2025-06-07',
        priority: 'high'
      },
      {
        id: '2',
        type: 'pf_return',
        title: 'PF Return Filing',
        description: 'Monthly PF contribution return',
        dueDate: '2025-06-15',
        priority: 'medium'
      }
    ]
  });

  const [recentLeaves, setRecentLeaves] = useState<LeaveApplication[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      leaveType: 'annual',
      startDate: '2025-06-10',
      endDate: '2025-06-12',
      days: 3,
      reason: 'Family vacation',
      status: 'pending',
      appliedDate: '2025-05-26'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Sarah Wilson',
      leaveType: 'sick',
      startDate: '2025-05-28',
      endDate: '2025-05-28',
      days: 1,
      reason: 'Medical checkup',
      status: 'approved',
      appliedDate: '2025-05-27',
      approvedBy: 'HR Manager',
      approvedDate: '2025-05-27'
    }
  ]);

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([
    {
      id: '1',
      period: '05-2025',
      status: 'approved',
      employeesCount: 45,
      totalAmount: 2925000,
      createdBy: 'HR Manager',
      createdDate: '2025-05-25',
      approvalWorkflow: [
        { level: 1, approverRole: 'HR Manager', status: 'approved', approvedDate: '2025-05-25' },
        { level: 2, approverRole: 'Finance Manager', status: 'approved', approvedDate: '2025-05-26' }
      ],
      currency: 'USD'
    }
  ]);

  return (
    <PageLayout
      title="HR Dashboard"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: "HR Dashboard", href: "/management/staff/hr-dashboard" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">HR Management System</h1>
            <p className="text-muted-foreground">Comprehensive human resources management</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Quick Actions
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{analytics.totalEmployees}</p>
                  <p className="text-xs text-green-600">+2 this month</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Payroll</p>
                  <p className="text-2xl font-bold">${(analytics.totalPayrollCost / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-blue-600">Average: ${analytics.averageSalary.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">{analytics.attendanceRate}%</p>
                  <Progress value={analytics.attendanceRate} className="h-2 mt-2" />
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                  <p className="text-2xl font-bold">{analytics.pendingLeaves + analytics.pendingPayrollApprovals}</p>
                  <p className="text-xs text-orange-600">{analytics.pendingLeaves} leaves, {analytics.pendingPayrollApprovals} payroll</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leave Applications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Recent Leave Applications</CardTitle>
                <Badge variant="outline">{analytics.pendingLeaves} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLeaves.slice(0, 3).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{leave.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.leaveType} • {leave.days} day(s)
                    </p>
                  </div>
                  <Badge 
                    variant={leave.status === 'approved' ? 'default' : leave.status === 'pending' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {leave.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {leave.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Birthdays */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Upcoming Birthdays</CardTitle>
                <Gift className="h-5 w-5 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.upcomingBirthdays.map((birthday) => (
                <div key={birthday.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{birthday.name}</p>
                    <p className="text-xs text-muted-foreground">{birthday.department}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {birthday.daysUntil} days
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Compliance Alerts</CardTitle>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.complianceAlerts.map((alert) => (
                <div key={alert.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <Badge 
                      variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                  <p className="text-xs font-medium">Due: {new Date(alert.dueDate).toLocaleDateString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department-wise Employee Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(analytics.departmentWiseCount).map(([dept, count]) => (
                <div key={dept} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-muted-foreground">{dept}</p>
                  <Progress 
                    value={(count / analytics.totalEmployees) * 100} 
                    className="h-2 mt-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main HR Modules */}
        <Tabs defaultValue="payroll" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payroll">Payroll Management</TabsTrigger>
            <TabsTrigger value="leaves">Leave Management</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary Structure</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payroll" className="space-y-4 mt-6">
            <PayrollManagement payrollRuns={payrollRuns} setPayrollRuns={setPayrollRuns} />
          </TabsContent>
          
          <TabsContent value="leaves" className="space-y-4 mt-6">
            <LeaveManagement leaves={recentLeaves} setLeaves={setRecentLeaves} />
          </TabsContent>
          
          <TabsContent value="attendance" className="space-y-4 mt-6">
            <AttendanceManagement />
          </TabsContent>
          
          <TabsContent value="salary" className="space-y-4 mt-6">
            <SalaryStructureManager />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default HRDashboard;
