
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
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  Coffee
} from "lucide-react";
import { AttendanceRecord, BreakRecord } from "@/types/staff";

const AttendanceManagement: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock attendance data
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      date: '2025-05-26',
      clockIn: '09:00',
      clockOut: '18:00',
      totalHours: 8,
      overtime: 0,
      status: 'present',
      breaks: [
        { startTime: '13:00', endTime: '14:00', duration: 60, type: 'lunch' },
        { startTime: '15:30', endTime: '15:45', duration: 15, type: 'tea' }
      ],
      location: 'Office',
      notes: ''
    },
    {
      id: '2',
      employeeId: 'EMP002',
      date: '2025-05-26',
      clockIn: '09:15',
      clockOut: '18:30',
      totalHours: 8.25,
      overtime: 0.25,
      status: 'late',
      breaks: [
        { startTime: '13:00', endTime: '14:00', duration: 60, type: 'lunch' }
      ],
      location: 'Office',
      notes: 'Late due to traffic'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      date: '2025-05-26',
      clockIn: '09:00',
      clockOut: '13:00',
      totalHours: 4,
      overtime: 0,
      status: 'half-day',
      breaks: [],
      location: 'Office',
      notes: 'Medical appointment in afternoon'
    }
  ]);

  // Mock employee data for attendance
  const employees = [
    { id: 'EMP001', name: 'John Doe', department: 'Sales' },
    { id: 'EMP002', name: 'Jane Smith', department: 'Operations' },
    { id: 'EMP003', name: 'Mike Johnson', department: 'Customer Support' },
    { id: 'EMP004', name: 'Sarah Wilson', department: 'Finance' },
    { id: 'EMP005', name: 'David Brown', department: 'HR' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'half-day': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'on-leave': return <CalendarIcon className="h-4 w-4 text-purple-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      case 'half-day': return 'outline';
      case 'on-leave': return 'secondary';
      default: return 'outline';
    }
  };

  // Calculate attendance statistics
  const totalEmployees = employees.length;
  const presentToday = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const lateToday = attendanceRecords.filter(r => r.status === 'late').length;
  const absentToday = totalEmployees - attendanceRecords.length;
  const attendanceRate = Math.round((presentToday / totalEmployees) * 100);

  const filteredRecords = attendanceRecords.filter(record => {
    const employee = employees.find(emp => emp.id === record.employeeId);
    if (!employee) return false;

    const matchesSearch = searchTerm === "" || 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">Monitor and manage employee attendance</p>
        </div>
        <div className="flex gap-2">
          <Button>Export Report</Button>
          <Button variant="outline">Bulk Actions</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold">{presentToday}/{totalEmployees}</p>
                <Progress value={attendanceRate} className="h-2 mt-2" />
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
                <p className="text-2xl font-bold">{lateToday}</p>
                <p className="text-xs text-orange-600">
                  {totalEmployees > 0 ? Math.round((lateToday / totalEmployees) * 100) : 0}% of total
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                <p className="text-2xl font-bold">{absentToday}</p>
                <p className="text-xs text-red-600">
                  {totalEmployees > 0 ? Math.round((absentToday / totalEmployees) * 100) : 0}% of total
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <p className="text-xs text-green-600">+2% from yesterday</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by employee name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:w-64"
        />
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Customer Support">Customer Support</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Field Sales">Field Sales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Today's Attendance - {selectedDate?.toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Breaks</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{employee?.name}</TableCell>
                      <TableCell>{employee?.department}</TableCell>
                      <TableCell>{record.clockIn || '-'}</TableCell>
                      <TableCell>{record.clockOut || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{record.totalHours}h</span>
                          {record.overtime > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{record.overtime}h OT
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <Badge variant={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coffee className="h-3 w-3" />
                          <span className="text-sm">{record.breaks.length}</span>
                          {record.breaks.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({record.breaks.reduce((sum, b) => sum + b.duration, 0)}m)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {record.notes || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Show absent employees */}
                {employees
                  .filter(emp => !attendanceRecords.some(record => record.employeeId === emp.id))
                  .filter(emp => {
                    const matchesSearch = searchTerm === "" || 
                      emp.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesDepartment = filterDepartment === "all" || emp.department === filterDepartment;
                    return matchesSearch && matchesDepartment;
                  })
                  .map((employee) => (
                    <TableRow key={employee.id} className="bg-red-50">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>0h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <Badge variant="destructive">absent</Badge>
                        </div>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <span className="text-sm text-red-600">No attendance record</span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceManagement;
