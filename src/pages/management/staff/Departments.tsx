
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Plus, Trash, Settings, Users, TrendingUp, Target } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { departments, enhancedStaffMembers } from "@/data/departmentData";
import { Department } from "@/types/staff";

// Department form schema
const departmentFormSchema = z.object({
  name: z.string().min(2, { message: "Department name must be at least 2 characters." }),
  code: z.string().min(2, { message: "Department code must be at least 2 characters." }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

const Departments = () => {
  const [departmentList, setDepartmentList] = useState<Department[]>(departments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: selectedDepartment?.name || "",
      code: selectedDepartment?.code || "",
      description: selectedDepartment?.description || "",
    },
  });

  React.useEffect(() => {
    if (selectedDepartment) {
      editForm.reset({
        name: selectedDepartment.name,
        code: selectedDepartment.code,
        description: selectedDepartment.description,
      });
    }
  }, [selectedDepartment, editForm]);

  const onSubmit = (values: DepartmentFormValues) => {
    const newDepartment: Department = {
      id: values.code.toLowerCase().replace(/\s+/g, '-'),
      name: values.name,
      code: values.code,
      description: values.description || "",
      staffCount: 0,
      features: [],
      workflow: {
        stages: [],
        autoAssignment: false,
        escalationRules: []
      },
      permissions: []
    };

    setDepartmentList([...departmentList, newDepartment]);
    toast.success("Department added successfully!");
    setIsAddDialogOpen(false);
    form.reset();
  };

  const onEdit = (values: DepartmentFormValues) => {
    if (!selectedDepartment) return;
    
    setDepartmentList(
      departmentList.map((dept) =>
        dept.id === selectedDepartment.id
          ? {
              ...dept,
              name: values.name,
              code: values.code,
              description: values.description || "",
            }
          : dept
      )
    );
    
    toast.success("Department updated successfully!");
    setIsEditDialogOpen(false);
  };

  const onDelete = () => {
    if (!selectedDepartment) return;
    
    setDepartmentList(departmentList.filter((dept) => dept.id !== selectedDepartment.id));
    toast.success("Department deleted successfully!");
    setIsDeleteDialogOpen(false);
  };

  const toggleFeature = (departmentId: string, featureId: string) => {
    setDepartmentList(departmentList.map(dept => 
      dept.id === departmentId 
        ? {
            ...dept,
            features: dept.features.map(feature =>
              feature.id === featureId
                ? { ...feature, enabled: !feature.enabled }
                : feature
            )
          }
        : dept
    ));
  };

  // Calculate department statistics
  const getDepartmentStats = (deptId: string) => {
    const deptStaff = enhancedStaffMembers.filter(s => s.department === deptId);
    const activeStaff = deptStaff.filter(s => s.status === 'active');
    const avgPerformance = activeStaff.length > 0 
      ? activeStaff.reduce((sum, s) => sum + s.performance.overall.performanceScore, 0) / activeStaff.length 
      : 0;
    const totalRevenue = deptStaff.reduce((sum, s) => sum + (s.performance.monthly.totalRevenue || 0), 0);
    
    return {
      totalStaff: deptStaff.length,
      activeStaff: activeStaff.length,
      avgPerformance: Math.round(avgPerformance),
      totalRevenue
    };
  };

  return (
    <PageLayout
      title="Enhanced Departments"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: "Departments", href: "/management/staff/departments" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link to="/management/staff">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff List
            </Link>
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new department with advanced features and workflows.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Advanced Sales, Field Operations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Code*</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., ASLS, FOPS" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique code to identify this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed description of department functions and responsibilities"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Department</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Department Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentList.map((department) => {
            const stats = getDepartmentStats(department.id);
            return (
              <Card key={department.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{department.code}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{department.description}</p>
                  
                  {/* Department Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">{stats.activeStaff}/{stats.totalStaff}</div>
                        <div className="text-xs text-muted-foreground">Active Staff</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium">{stats.avgPerformance}/100</div>
                        <div className="text-xs text-muted-foreground">Avg Performance</div>
                      </div>
                    </div>
                  </div>

                  {stats.totalRevenue > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <div className="font-medium">${(stats.totalRevenue / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                      </div>
                    </div>
                  )}

                  {/* Performance Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Department Performance</span>
                      <span>{stats.avgPerformance}%</span>
                    </div>
                    <Progress value={stats.avgPerformance} className="h-2" />
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Active Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {department.features.filter(f => f.enabled).map((feature) => (
                        <Badge key={feature.id} variant="secondary" className="text-xs">
                          {feature.name}
                        </Badge>
                      ))}
                      {department.features.filter(f => f.enabled).length === 0 && (
                        <span className="text-xs text-muted-foreground">No active features</span>
                      )}
                    </div>
                  </div>

                  {/* Feature Toggles for existing departments */}
                  {department.features.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <span className="text-sm font-medium">Feature Settings:</span>
                      {department.features.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between">
                          <span className="text-xs">{feature.name}</span>
                          <Switch
                            checked={feature.enabled}
                            onCheckedChange={() => toggleFeature(department.id, feature.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Department Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentList.map((department) => {
                  const stats = getDepartmentStats(department.id);
                  return (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{department.code}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {department.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{stats.activeStaff}/{stats.totalStaff}</span>
                          <Progress value={(stats.activeStaff / Math.max(stats.totalStaff, 1)) * 100} className="h-1 w-12" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{stats.avgPerformance}/100</span>
                          <Progress value={stats.avgPerformance} className="h-1 w-12" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDepartment(department);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDepartment(department);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={stats.totalStaff > 0}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {departmentList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No departments found. Create your first department.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information and settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Code*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Department</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Department Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department 
              "{selectedDepartment?.name}". 
              {selectedDepartment && getDepartmentStats(selectedDepartment.id).totalStaff > 0 && (
                <span className="text-destructive font-semibold">
                  {" "}This department has {getDepartmentStats(selectedDepartment.id).totalStaff} staff members assigned to it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Department
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default Departments;
