
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
// Enforce Supabase-only loading: remove local sample data imports
// import { departments, enhancedStaffMembers } from "@/data/departmentData";
import { Department, DepartmentFeature } from "@/types/staff";
import { departmentService } from "@/services/departmentService";
import { useApp } from "@/contexts/AppContext";

// Department form schema
const departmentFormSchema = z.object({
  name: z.string().min(2, { message: "Department name must be at least 2 characters." }),
  code: z.string().min(2, { message: "Department code must be at least 2 characters." }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

const Departments = () => {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'manager';
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [staffCounts, setStaffCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
const [isAddFeatureDialogOpen, setIsAddFeatureDialogOpen] = useState(false);
const [featureTargetDepartment, setFeatureTargetDepartment] = useState<Department | null>(null);
const [newFeature, setNewFeature] = useState<DepartmentFeature>({ id: '', name: '', description: '', enabled: true, config: {} });

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

  // Load departments from Supabase only
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data, source, error } = await departmentService.getDepartments();
        if (mounted) {
          if (source === 'db' && Array.isArray(data)) {
            setDepartmentList(data);
          } else {
            // Supabase-only: do not load local fallback
            setDepartmentList([]);
            if (error) toast.error('Failed to load departments from Supabase');
          }
        }
        const counts = await departmentService.getStaffCountsByDepartment();
        if (mounted) {
          setStaffCounts(counts || {});
        }
      } catch (err) {
        console.warn('Failed loading departments from Supabase', err);
        if (mounted) setDepartmentList([]);
        toast.error('Failed loading departments from Supabase');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Removed localStorage migration to keep data strictly from Supabase

  const onSubmit = async (values: DepartmentFormValues) => {
    if (!isAdmin) {
      toast.error("You don't have permission to add departments");
      return;
    }
    const payload = {
      id: values.code.toLowerCase().replace(/\s+/g, '-'),
      name: values.name,
      code: values.code,
      description: values.description || "",
    };
    const { data, error } = await departmentService.createDepartment(payload as any);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to create department');
      return;
    }
    if (data) {
      setDepartmentList(prev => [...prev, data]);
      toast.success("Department added successfully!");
      setIsAddDialogOpen(false);
      form.reset();
    }
  };

  const onEdit = async (values: DepartmentFormValues) => {
    if (!selectedDepartment) return;
    if (!isAdmin) {
      toast.error("You don't have permission to update departments");
      return;
    }
    const updates = {
      name: values.name,
      code: values.code,
      description: values.description || "",
    };
    const { error } = await departmentService.updateDepartment(selectedDepartment.id, updates);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update department');
      return;
    }
    setDepartmentList(prev => prev.map((d) => d.id === selectedDepartment.id ? { ...d, ...updates } : d));
    toast.success("Department updated successfully!");
    setIsEditDialogOpen(false);
  };

  const onDelete = async () => {
    if (!selectedDepartment) return;
    if (!isAdmin) {
      toast.error("You don't have permission to delete departments");
      return;
    }
    const { error } = await departmentService.deleteDepartment(selectedDepartment.id);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete department');
      return;
    }
    setDepartmentList(prev => prev.filter((dept) => dept.id !== selectedDepartment.id));
    toast.success("Department deleted successfully!");
    setIsDeleteDialogOpen(false);
  };

  const toggleFeature = async (departmentId: string, featureId: string, enabled: boolean) => {
    if (!isAdmin) {
      toast.error("You don't have permission to change features");
      return;
    }
    const target = departmentList.find(d => d.id === departmentId);
    if (!target) return;
    const updatedFeatures = (target.features || []).map(f => f.id === featureId ? { ...f, enabled } : f);
    const { error } = await departmentService.updateDepartment(departmentId, { features: updatedFeatures });
    if (error) {
      toast.error('Failed to update feature');
      return;
    }
    setDepartmentList(prev => prev.map(d => d.id === departmentId ? { ...d, features: updatedFeatures } : d));
  };

  const removeFeature = async (departmentId: string, featureId: string) => {
    if (!isAdmin) {
      toast.error("You don't have permission to remove features");
      return;
    }
    const target = departmentList.find(d => d.id === departmentId);
    if (!target) return;
    try {
      setLoading(true);
      const { error } = await departmentService.removeFeatureFromDepartment(departmentId, featureId);
      if (error) {
        toast.error(typeof error === 'string' ? error : 'Failed to remove feature');
        return;
      }
      setDepartmentList(prev => prev.map(d => d.id === departmentId ? { ...d, features: (d.features || []).filter(f => f.id !== featureId) } : d));
      toast.success('Feature removed');
    } catch (err) {
      console.warn('Remove feature failed', err);
      toast.error('Remove feature failed');
    } finally {
      setLoading(false);
    }
  };

  const initializeFeatures = async (departmentId: string) => {
    if (!isAdmin) {
      toast.error("You don't have permission to initialize features");
      return;
    }
    try {
      setLoading(true);
      const { error } = await departmentService.initializeDepartmentFeatures(departmentId);
      if (error) {
        toast.error(typeof error === 'string' ? error : 'Failed to initialize features');
        return;
      }
      const { data, source } = await departmentService.getDepartments();
      setDepartmentList(source === 'db' && Array.isArray(data) ? data : departmentList);
      toast.success('Features initialized from defaults');
    } catch (err) {
      console.warn('Initialize features failed', err);
      toast.error('Initialize features failed');
    } finally {
      setLoading(false);
    }
  };

  // Build a simple feature catalog from current Supabase-loaded departments
  const featureCatalog: DepartmentFeature[] = React.useMemo(() => {
    const map = new Map<string, DepartmentFeature>();
    for (const dept of departmentList) {
      for (const f of dept.features || []) {
        if (!map.has(String(f.id))) map.set(String(f.id), f);
      }
    }
    return Array.from(map.values());
  }, [departmentList]);

  const openAddFeatureDialog = (dept: Department) => {
    setFeatureTargetDepartment(dept);
    setNewFeature({ id: '', name: '', description: '', enabled: true, config: {} });
    setIsAddFeatureDialogOpen(true);
  };

  const pickCatalogFeature = (featureId: string) => {
    const f = featureCatalog.find((c) => c.id === featureId);
    if (f) setNewFeature({ ...f });
  };

  const submitAddFeature = async () => {
    if (!isAdmin) {
      toast.error("You don't have permission to add features");
      return;
    }
    if (!featureTargetDepartment) return;
    const name = (newFeature.name || '').trim();
    const description = (newFeature.description || '').trim();
    if (name.length < 2) {
      toast.error('Feature name must be at least 2 characters');
      return;
    }
    const id = (newFeature.id || name.toLowerCase().replace(/\s+/g, '-')).trim();
    let config: Record<string, any> | undefined = undefined;
    if (newFeature.config && typeof newFeature.config === 'object') {
      config = newFeature.config;
    }

    const featurePayload: DepartmentFeature = {
      id,
      name,
      description,
      enabled: Boolean(newFeature.enabled),
      ...(config ? { config } : {})
    } as DepartmentFeature;

    try {
      setLoading(true);
      const { error } = await departmentService.addFeatureToDepartment(featureTargetDepartment.id, featurePayload);
      if (error) {
        toast.error(typeof error === 'string' ? error : 'Failed to add feature');
        return;
      }
      setDepartmentList(prev => prev.map(d => d.id === featureTargetDepartment.id ? { ...d, features: [...(d.features || []), featurePayload] } : d));
      setIsAddFeatureDialogOpen(false);
      toast.success('Feature added');
    } catch (err) {
      console.warn('Add feature failed', err);
      toast.error('Add feature failed');
    } finally {
      setLoading(false);
    }
  };

  // Calculate department statistics (Supabase-only: basic counts)
  const getDepartmentStats = (deptId: string) => {
    const count = staffCounts[deptId];
    const totalStaff = typeof count === 'number' ? count : 0;
    const active = totalStaff; // Without status from DB, treat all as active for display
    return {
      totalStaff,
      activeStaff: active,
      avgPerformance: 0,
      totalRevenue: 0
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
          
          {isAdmin && (
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
          )}
        </div>

        {/* Selection Tracker */}
        <div className="rounded-md border p-4 bg-muted/20">
          <div className="text-sm font-medium">Selected Area</div>
          {selectedDepartment ? (
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="font-semibold">{selectedDepartment.name}</div>
                <div className="text-xs text-muted-foreground">{selectedDepartment.code}</div>
              </div>
              <div className="text-xs text-muted-foreground max-w-md truncate">{selectedDepartment.description}</div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">No department selected</div>
          )}
        </div>

        {/* Department Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentList.map((department) => {
            const stats = getDepartmentStats(department.id);
            return (
              <Card
                key={department.id}
                className={`hover:shadow-lg transition-shadow ${selectedDepartment?.id === department.id ? 'border-2 border-blue-500' : ''}`}
                onClick={() => setSelectedDepartment(department)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{department.code}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {isAdmin && (
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
                      )}
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
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={feature.enabled}
                              onCheckedChange={(checked) => toggleFeature(department.id, feature.id, checked)}
                              disabled={!isAdmin || loading}
                            />
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remove feature"
                                onClick={() => removeFeature(department.id, feature.id)}
                                disabled={loading}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {isAdmin && (
                        <div className="pt-2">
                          <Button size="sm" variant="outline" onClick={() => openAddFeatureDialog(department)} disabled={loading}>
                            Add Feature
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {department.features.length === 0 && isAdmin && (
                    <div className="pt-2 border-t">
                      <span className="text-sm font-medium">Feature Settings:</span>
                      <div className="pt-2">
                        <Button size="sm" variant="outline" onClick={() => initializeFeatures(department.id)} disabled={loading}>
                          Initialize Features
                        </Button>
                        <Button size="sm" className="ml-2" variant="secondary" onClick={() => openAddFeatureDialog(department)} disabled={loading}>
                          Add Feature
                        </Button>
                      </div>
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
                    <TableRow
                      key={department.id}
                      className={`${selectedDepartment?.id === department.id ? 'bg-muted/40' : ''}`}
                      onClick={() => setSelectedDepartment(department)}
                    >
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
                          {isAdmin && (
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
                          )}
                          {isAdmin && (
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
                          )}
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

      {/* Add Feature Dialog */}
      <Dialog open={isAddFeatureDialogOpen} onOpenChange={setIsAddFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feature</DialogTitle>
            <DialogDescription>
              Choose from catalog or define a custom feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Catalog</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {featureCatalog.slice(0, 10).map((f) => (
                  <Badge key={f.id} variant="outline" className="cursor-pointer" onClick={() => pickCatalogFeature(f.id)}>
                    {f.name}
                  </Badge>
                ))}
                {featureCatalog.length === 0 && (
                  <span className="text-xs text-muted-foreground">No catalog available</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm">Feature Name*</label>
                <Input value={newFeature.name} onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })} placeholder="e.g., Enquiry Tracking" />
              </div>
              <div>
                <label className="text-sm">Feature ID (optional)</label>
                <Input value={newFeature.id} onChange={(e) => setNewFeature({ ...newFeature, id: e.target.value })} placeholder="e.g., enquiry-tracking" />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <Textarea value={newFeature.description} onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} placeholder="Short description" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enabled</span>
                <Switch checked={newFeature.enabled} onCheckedChange={(v) => setNewFeature({ ...newFeature, enabled: v })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddFeatureDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitAddFeature}>Add Feature</Button>
            </div>
          </div>
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
