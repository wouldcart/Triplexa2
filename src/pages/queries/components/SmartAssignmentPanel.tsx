
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Zap, Target, BarChart3, AlertTriangle, 
  CheckCircle, Clock, Brain, TrendingUp
} from 'lucide-react';
import { Query } from '@/types/query';
import { useQueryAssignment } from '@/hooks/useQueryAssignment';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import { useToast } from '@/hooks/use-toast';

interface SmartAssignmentPanelProps {
  queries: Query[];
}

const SmartAssignmentPanel: React.FC<SmartAssignmentPanelProps> = ({ queries }) => {
  const { toast } = useToast();
  const { autoAssignQueries, autoAssignEnabled, autoAssignHydrated, setAutoAssignEnabled, isAssigning } = useQueryAssignment();
  const { activeStaff } = useActiveStaffData();
  const [smartRulesEnabled, setSmartRulesEnabled] = useState(true);
  const [workloadBalancing, setWorkloadBalancing] = useState(true);

  const unassignedQueries = queries.filter(q => q.status === 'new');

  // Calculate assignment metrics
  const assignmentMetrics = {
    totalUnassigned: unassignedQueries.length,
    availableStaff: activeStaff.length,
    avgWorkload: activeStaff.length > 0 ? 
      Math.round(activeStaff.reduce((sum, staff) => sum + (staff.assigned / staff.workloadCapacity * 100), 0) / activeStaff.length) : 0,
    highPriorityUnassigned: unassignedQueries.filter(q => {
      const totalPax = q.paxDetails.adults + q.paxDetails.children;
      return totalPax >= 6 || q.packageType === 'luxury';
    }).length
  };

  const handleBulkAssignment = () => {
    if (unassignedQueries.length === 0) {
      toast({
        title: "No enquiries to assign",
        description: "All enquiries are already assigned",
        variant: "destructive",
      });
      return;
    }

    autoAssignQueries(unassignedQueries);
  };

  // Staff workload visualization
  const getWorkloadColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 75) return 'bg-orange-500';
    if (utilization >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Assignment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-orange-600">{assignmentMetrics.totalUnassigned}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Staff</p>
                <p className="text-2xl font-bold text-blue-600">{assignmentMetrics.availableStaff}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Workload</p>
                <p className="text-2xl font-bold text-purple-600">{assignmentMetrics.avgWorkload}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{assignmentMetrics.highPriorityUnassigned}</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Assignment Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Assignment Engine
          </CardTitle>
          <CardDescription>
            AI-powered intelligent assignment with workload balancing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-assign">Auto Assignment</Label>
                <p className="text-sm text-gray-600">Automatically assign new enquiries</p>
              </div>
              <Switch
                id="auto-assign"
                checked={!!autoAssignEnabled}
                disabled={!autoAssignHydrated}
                onCheckedChange={setAutoAssignEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smart-rules">Smart Rules Engine</Label>
                <p className="text-sm text-gray-600">Use AI-powered assignment rules</p>
              </div>
              <Switch
                id="smart-rules"
                checked={smartRulesEnabled}
                onCheckedChange={setSmartRulesEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="workload-balance">Workload Balancing</Label>
                <p className="text-sm text-gray-600">Distribute enquiries evenly</p>
              </div>
              <Switch
                id="workload-balance"
                checked={workloadBalancing}
                onCheckedChange={setWorkloadBalancing}
              />
            </div>
          </div>

          {/* Bulk Assignment */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Bulk Assignment</h4>
                <p className="text-sm text-gray-600">
                  Assign all unassigned enquiries using smart algorithms
                </p>
              </div>
              <Button 
                onClick={handleBulkAssignment}
                disabled={isAssigning || !autoAssignHydrated || autoAssignEnabled !== true || unassignedQueries.length === 0}
                className="flex items-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Assign All ({unassignedQueries.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Workload Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Staff Workload Distribution
          </CardTitle>
          <CardDescription>Current workload and capacity utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeStaff.map((staff) => {
              const utilization = Math.round((staff.assigned / staff.workloadCapacity) * 100);
              return (
                <div key={staff.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-gray-600">
                        {staff.department} • {staff.expertise.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={utilization >= 90 ? 'bg-red-100 text-red-800' :
                                  utilization >= 75 ? 'bg-orange-100 text-orange-800' :
                                  utilization >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'}
                      >
                        {utilization}% utilized
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {staff.assigned}/{staff.workloadCapacity} enquiries
                      </p>
                    </div>
                  </div>
                  <Progress value={utilization} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Rules Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignment Rules</CardTitle>
          <CardDescription>Current rules governing automatic assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Agent-Staff Relationship</p>
                <p className="text-sm text-gray-600">Priority weight: 40%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Destination Expertise</p>
                <p className="text-sm text-gray-600">Priority weight: 30%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Workload Balance</p>
                <p className="text-sm text-gray-600">Priority weight: 20%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Performance History</p>
                <p className="text-sm text-gray-600">Priority weight: 10%</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartAssignmentPanel;
