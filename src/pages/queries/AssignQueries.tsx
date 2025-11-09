
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, ArrowRightLeft, CheckCircle, UserRound, User, MapPin, Clock, Star, TrendingUp, Award, ArrowLeft } from 'lucide-react';
import { useEnquiries, getEnquiryById } from '@/services/enquiriesService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQueryAssignment } from '@/hooks/useQueryAssignment';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import QueryList from './components/QueryList';
import AssignmentRules from './components/AssignmentRules';
import AssignmentRulesEditor from './components/AssignmentRulesEditor';
import StaffSequence from './components/StaffSequence';
import { Label } from '@/components/ui/label';
import { Query } from '@/types/query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
import { Separator } from '@/components/ui/separator';
import { seedAssignmentTestData } from '@/services/testSeedService';
import { supabase } from '@/lib/supabaseClient';

const AssignQueries: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('unassigned');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editRulesDialogOpen, setEditRulesDialogOpen] = useState(false);
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [seedLogs, setSeedLogs] = useState<string[]>([]);
  const [debugAssignments, setDebugAssignments] = useState<{ id: string; assignedTo?: string | null; assignedName?: string | null }[]>([]);
  const searchParams = new URLSearchParams(location.search);
  const isDebug = searchParams.get('debug') === '1' || searchParams.get('seedTest') === '1';
  const autoSeed = searchParams.get('autoSeed') === '1';
  
  // Use active staff data from management module
  const { activeStaff } = useActiveStaffData();
  
  const {
    assigningQuery,
    isAssigning,
    selectedStaffId,
    autoAssignEnabled,
    autoAssignHydrated,
    setAssigningQuery,
    setSelectedStaffId,
    setAutoAssignEnabled,
    assignQueryToStaff,
    autoAssignQueries,
    findBestStaffMatch
  } = useQueryAssignment();

  // Fetch queries from Supabase-backed service
  const { data: queries = [], isLoading, error, refetch } = useEnquiries({
    page: 1,
    pageSize: 50,
    sort: { field: 'created_at', direction: 'desc' }
  });

  // Process queries data
  const unassignedQueries = (queries || []).filter(q => q.status === 'new');
  const assignedQueries = (queries || []).filter(q => q.status === 'assigned' || q.status === 'in-progress');
  const allQueries = queries || [];

  // Handle back navigation
  const handleBackClick = () => {
    navigate('/queries');
  };

  // Handle query assignment initiation
  const handleAssignQuery = (query: Query) => {
    setAssigningQuery(query);
    setSelectedStaffId(null);
    setAssignDialogOpen(true);
  };

  // Complete the assignment
  const completeAssignment = () => {
    if (selectedStaffId && assigningQuery) {
      assignQueryToStaff(assigningQuery, selectedStaffId);
      setAssignDialogOpen(false);
    }
  };

  // Auto assign queries based on rules
  const handleAutoAssign = () => {
    if (!autoAssignEnabled) {
      toast({
        title: "Auto-assignment is disabled",
        description: "Please enable auto-assignment feature first",
        variant: "destructive",
      });
      return;
    }
    
    const availableStaff = activeStaff.filter(s => s.active);
    if (availableStaff.length === 0) {
      toast({
        title: "Auto-assignment failed",
        description: "No active staff members available",
        variant: "destructive",
      });
      return;
    }

    autoAssignQueries(unassignedQueries);
  };

  // Map potential country IDs to readable names for display
  const { getCountryById } = useRealTimeCountriesData();
  const toCountryName = (value: string) => getCountryById(value)?.name || value;

  // Get recommended staff for current query
  const getRecommendedStaff = (query: Query | null) => {
    if (!query) return null;
    return findBestStaffMatch(query);
  };

  // Get the currently selected staff for dialog
  const selectedStaff = activeStaff.find(s => s.id === selectedStaffId);
  
  // Get recommended staff for the query being assigned
  const recommendedStaff = getRecommendedStaff(assigningQuery);

  // Get expertise match percentage
  const getExpertiseMatch = (staff: any, query: Query | null) => {
    if (!staff || !query) return 0;
    const destinations = [query.destination.country, ...query.destination.cities];
    const matches = staff.expertise.filter((exp: string) => 
      destinations.some(dest => exp.toLowerCase().includes(dest.toLowerCase()))
    );
    return Math.round((matches.length / destinations.length) * 100);
  };

  // Get workload status
  const getWorkloadStatus = (staff: any) => {
    const percentage = (staff.assigned / staff.workloadCapacity) * 100;
    if (percentage >= 90) return { status: 'overloaded', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (percentage >= 70) return { status: 'busy', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'available', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  // Auto-run seeding when autoSeed param is set
  useEffect(() => {
    if (isDebug && autoSeed && !seeding) {
      (async () => {
        try {
          setSeeding(true);
          const { logs } = await seedAssignmentTestData();
          setSeedLogs(logs);
          toast({ title: 'Seed complete', description: 'Test data created and auto-assigned.' });
          // Fetch seeded enquiry assignments and resolve names
          const ids = ['ENQ_REL_UAE', 'ENQ_BALANCE_TH', 'ENQ_RR_TH_1', 'ENQ_RR_TH_2'];
          const entries = await Promise.all(ids.map(async (id) => {
            const { data } = await getEnquiryById(id);
            return data;
          }));
          const assignedIds = entries
            .map(e => (e?.assignedTo ? String(e.assignedTo) : null))
            .filter(Boolean) as string[];
          let nameMap = new Map<string, string>();
          if (assignedIds.length > 0) {
            const { data: staffRows } = await (supabase as any)
              .from('staff')
              .select('id,name')
              .in('id', assignedIds);
            (staffRows || []).forEach((r: any) => {
              if (r?.id) nameMap.set(String(r.id), String(r.name || 'Staff'));
            });
            // Fallback to profiles
            const missing = assignedIds.filter(id => !nameMap.has(id));
            if (missing.length > 0) {
              const { data: profRows } = await (supabase as any)
                .from('profiles')
                .select('id,name,full_name,username')
                .in('id', missing);
              (profRows || []).forEach((r: any) => {
                if (r?.id) nameMap.set(String(r.id), String(r.full_name || r.name || r.username || 'User'));
              });
            }
          }
          const snapshots = ids.map((id, idx) => {
            const e = entries[idx];
            const assignedTo = e?.assignedTo ? String(e.assignedTo) : null;
            const assignedName = assignedTo ? (nameMap.get(assignedTo) || null) : null;
            return { id, assignedTo, assignedName };
          });
          setDebugAssignments(snapshots);
          refetch();
        } finally {
          setSeeding(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebug, autoSeed]);

  return (
    <PageLayout>
      <div className="space-y-4 md:space-y-6 p-2 md:p-4 lg:p-6">
        {/* Header Section with Back Button - Mobile Optimized */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Queries</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Assign Queries</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage and assign queries to staff members
              </p>
            </div>
          </div>
          
          {/* Controls Section - Mobile Stacked */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-assign"
                checked={!!autoAssignEnabled}
                disabled={!autoAssignHydrated}
                onCheckedChange={setAutoAssignEnabled}
              />
              <Label htmlFor="auto-assign" className="cursor-pointer text-sm">
                Auto Assignment <span className="hidden sm:inline">{!autoAssignHydrated ? 'Loading…' : (autoAssignEnabled ? 'Enabled' : 'Disabled')}</span>
              </Label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setActiveTab('unassigned')} size="sm">
                <UserRound className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Manual Assign</span>
                <span className="sm:hidden">Manual</span>
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleAutoAssign}
                disabled={!autoAssignHydrated || autoAssignEnabled !== true || unassignedQueries.length === 0}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Auto Assign</span>
                <span className="sm:hidden">Auto</span>
                {unassignedQueries.length > 0 && (
                  <span className="ml-1">({unassignedQueries.length})</span>
                )}
              </Button>
              {isDebug && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    setSeedLogs([]);
                    const { logs } = await seedAssignmentTestData();
                    setSeedLogs(logs);
                    setSeeding(false);
                    toast({ title: 'Seed complete', description: 'Test data created and auto-assigned.' });
                    // Fetch and show assignments
                    const ids = ['ENQ_REL_UAE', 'ENQ_BALANCE_TH', 'ENQ_RR_TH_1', 'ENQ_RR_TH_2'];
                    const entries = await Promise.all(ids.map(async (id) => {
                      const { data } = await getEnquiryById(id);
                      return data;
                    }));
                    const assignedIds = entries
                      .map(e => (e?.assignedTo ? String(e.assignedTo) : null))
                      .filter(Boolean) as string[];
                    let nameMap = new Map<string, string>();
                    if (assignedIds.length > 0) {
                      const { data: staffRows } = await (supabase as any)
                        .from('staff')
                        .select('id,name')
                        .in('id', assignedIds);
                      (staffRows || []).forEach((r: any) => {
                        if (r?.id) nameMap.set(String(r.id), String(r.name || 'Staff'));
                      });
                      const missing = assignedIds.filter(id => !nameMap.has(id));
                      if (missing.length > 0) {
                        const { data: profRows } = await (supabase as any)
                          .from('profiles')
                          .select('id,name,full_name,username')
                          .in('id', missing);
                        (profRows || []).forEach((r: any) => {
                          if (r?.id) nameMap.set(String(r.id), String(r.full_name || r.name || r.username || 'User'));
                        });
                      }
                    }
                    const snapshots = ids.map((id, idx) => {
                      const e = entries[idx];
                      const assignedTo = e?.assignedTo ? String(e.assignedTo) : null;
                      const assignedName = assignedTo ? (nameMap.get(assignedTo) || null) : null;
                      return { id, assignedTo, assignedName };
                    });
                    setDebugAssignments(snapshots);
                    refetch();
                  }}
                >
                  {seeding ? 'Seeding…' : 'Seed Assignment Test'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-lg md:text-2xl font-bold">{allQueries.length}</p>
                </div>
                <MapPin className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Unassigned</p>
                  <p className="text-lg md:text-2xl font-bold text-orange-600">{unassignedQueries.length}</p>
                </div>
                <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Assigned</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">{assignedQueries.length}</p>
                </div>
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Active Staff</p>
                  <p className="text-lg md:text-2xl font-bold">{activeStaff.filter(s => s.active).length}</p>
                </div>
                <User className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Responsive */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {/* Main Content - Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Query Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDebug && seedLogs.length > 0 && (
                <div className="mb-4 p-3 rounded-md border text-sm bg-muted/30">
                  <div className="font-semibold mb-2">Seed Logs</div>
                  <ul className="list-disc list-inside space-y-1">
                    {seedLogs.map((l, idx) => (
                      <li key={`seed-log-${idx}`}>{l}</li>
                    ))}
                  </ul>
                  {debugAssignments.length > 0 && (
                    <div className="mt-3">
                      <div className="font-semibold mb-1">Assignments</div>
                      <ul className="list-disc list-inside space-y-1">
                        {debugAssignments.map((a) => (
                          <li key={`seed-assignment-${a.id}`}>
                            {a.id}: {a.assignedName || a.assignedTo || 'unassigned'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-3">
                  <TabsTrigger value="unassigned" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Unassigned</span>
                    <span className="sm:hidden">New</span>
                    {unassignedQueries.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{unassignedQueries.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="assigned" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Assigned</span>
                    <span className="sm:hidden">Done</span>
                    {assignedQueries.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{assignedQueries.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                    <span>All</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unassigned">
                  <QueryList
                    queries={unassignedQueries}
                    mode="unassigned"
                    onAssignQuery={handleAssignQuery}
                  />
                </TabsContent>

                <TabsContent value="assigned">
                  <QueryList
                    queries={assignedQueries}
                    mode="assigned"
                    onAssignQuery={handleAssignQuery}
                  />
                </TabsContent>

                <TabsContent value="all">
                  <QueryList
                    queries={allQueries}
                    mode="all"
                    onAssignQuery={handleAssignQuery}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Sidebar - Staff List removed as requested */}
        </div>

        {/* Assignment Rules and Staff Sequence - Mobile Stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <AssignmentRules onEditRules={() => setEditRulesDialogOpen(true)} />
          <StaffSequence staff={activeStaff} />
        </div>
      </div>

      {/* Enhanced Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {assigningQuery?.status === 'new' ? 'Assign Query' : 'Reassign Query'} {assigningQuery?.id}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Query Information */}
            {assigningQuery && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Query Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Destination</p>
                      <p className="font-semibold">{assigningQuery.destination.country}</p>
                      <p className="text-sm text-muted-foreground">{assigningQuery.destination.cities.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">PAX</p>
                      <p className="font-semibold">{assigningQuery.paxDetails.adults + assigningQuery.paxDetails.children}</p>
                      <p className="text-sm text-muted-foreground">{assigningQuery.paxDetails.adults}A, {assigningQuery.paxDetails.children}C</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="font-semibold">{assigningQuery.tripDuration.days} Days</p>
                      <p className="text-sm text-muted-foreground">{assigningQuery.tripDuration.nights} Nights</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Agent</p>
                      <p className="font-semibold">{assigningQuery.agentName}</p>
                      <p className="text-sm text-muted-foreground">ID: {assigningQuery.agentId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Staff Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Staff Member</h3>
                {recommendedStaff && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Star className="h-3 w-3 mr-1" />
                    AI Recommendation Available
                  </Badge>
                )}
              </div>
              
              <Select value={selectedStaffId?.toString()} onValueChange={(value) => setSelectedStaffId(parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff.filter(s => s.active).map((member) => {
                    const workloadStatus = getWorkloadStatus(member);
                    const expertiseMatch = getExpertiseMatch(member, assigningQuery);
                    
                    return (
                      <SelectItem key={`staff-${member.id}`} value={member.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{member.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {member.assigned}/{member.workloadCapacity} assigned
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {expertiseMatch > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {expertiseMatch}% match
                              </Badge>
                            )}
                            <div className={`w-2 h-2 rounded-full ${
                              workloadStatus.status === 'available' ? 'bg-green-500' :
                              workloadStatus.status === 'busy' ? 'bg-orange-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* AI Recommendation */}
            {recommendedStaff && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Award className="h-4 w-4" />
                    AI Recommended Staff
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-500 text-white">
                          {recommendedStaff.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">{recommendedStaff.name}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">{recommendedStaff.role}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
                      onClick={() => setSelectedStaffId(recommendedStaff.id)}
                    >
                      Select Recommended
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {getExpertiseMatch(recommendedStaff, assigningQuery)}% Expertise Match
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {recommendedStaff.assigned}/{recommendedStaff.workloadCapacity} Workload
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Keep existing selected staff details section */}
            {selectedStaff && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Selected Staff Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {selectedStaff.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold">{selectedStaff.name}</h4>
                      <p className="text-muted-foreground">{selectedStaff.role}</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedStaff.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={selectedStaff.active ? "default" : "secondary"} className="mb-2">
                        {selectedStaff.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Workload Analysis */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Workload Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Load</span>
                            <span className="font-semibold">{selectedStaff.assigned}/{selectedStaff.workloadCapacity}</span>
                          </div>
                          <Progress 
                            value={(selectedStaff.assigned / selectedStaff.workloadCapacity) * 100} 
                            className="h-2"
                          />
                          <div className={`text-xs p-2 rounded-md ${getWorkloadStatus(selectedStaff).bgColor}`}>
                            <span className={`font-medium ${getWorkloadStatus(selectedStaff).color}`}>
                              {getWorkloadStatus(selectedStaff).status === 'available' ? 'Available for new assignments' :
                               getWorkloadStatus(selectedStaff).status === 'busy' ? 'Approaching capacity' :
                               'At maximum capacity'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expertise Match */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Expertise Match
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Destination Match</span>
                            <span className="font-semibold">{getExpertiseMatch(selectedStaff, assigningQuery)}%</span>
                          </div>
                          <Progress 
                            value={getExpertiseMatch(selectedStaff, assigningQuery)} 
                            className="h-2"
                          />
                          <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStaff.expertise.slice(0, 3).map((exp, i) => (
                        <Badge key={`expertise-${i}-${exp}`} variant="outline" className="text-xs">
                          {toCountryName(exp)}
                        </Badge>
                      ))}
                            {selectedStaff.expertise.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{selectedStaff.expertise.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assignment Info */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Assignment Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Auto-assign</span>
                            <span className={selectedStaff.autoAssignEnabled ? 'text-green-600' : 'text-red-600'}>
                              {selectedStaff.autoAssignEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {selectedStaff.sequenceOrder && (
                            <div className="flex justify-between">
                              <span>Priority Order</span>
                              <Badge variant="secondary" className="text-xs">
                                #{selectedStaff.sequenceOrder}
                              </Badge>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Department</span>
                            <span className="text-muted-foreground">{selectedStaff.department || 'General'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Assignment Impact */}
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-blue-800 dark:text-blue-200">Assignment Impact</h5>
                          <ul className="text-sm text-blue-600 dark:text-blue-400 mt-1 space-y-1">
                            <li>• Workload will increase to {selectedStaff.assigned + 1}/{selectedStaff.workloadCapacity}</li>
                            {getExpertiseMatch(selectedStaff, assigningQuery) > 50 && (
                              <li>• High expertise match - likely faster processing</li>
                            )}
                            {selectedStaff.assigned < selectedStaff.workloadCapacity * 0.7 && (
                              <li>• Staff member has good availability</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warning for overloaded staff */}
                  {getWorkloadStatus(selectedStaff).status === 'overloaded' && (
                    <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-red-800 dark:text-red-200">Workload Warning</h5>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              This staff member is at maximum capacity. Consider assigning to someone else or adjusting workload.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                disabled={!selectedStaffId || isAssigning} 
                onClick={completeAssignment}
                className="min-w-32"
              >
                {isAssigning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {assigningQuery?.status === 'new' ? 'Assign Query' : 'Reassign Query'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rules Dialog - Full CRUD editor connected to Supabase */}
      <Dialog open={editRulesDialogOpen} onOpenChange={setEditRulesDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment Rules</DialogTitle>
          </DialogHeader>
          <AssignmentRulesEditor onClose={() => setEditRulesDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default AssignQueries;
