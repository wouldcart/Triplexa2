
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useManagerDashboardData } from '@/hooks/useManagerDashboardData';
import { useEnhancedStaffData } from '@/hooks/useEnhancedStaffData';
import { mockQueries } from '@/data/queryData';
import { 
  Users, TrendingUp, Target, Calendar, 
  Award, BarChart3, CheckCircle, Clock, FileText, DollarSign
} from 'lucide-react';

interface ManagerProfileProps {
  isEditing: boolean;
  editData: any;
  setEditData: (data: any) => void;
}

const ManagerProfile: React.FC<ManagerProfileProps> = ({
  isEditing,
  editData,
  setEditData
}) => {
  const { currentUser } = useApp();
  const { stats } = useManagerDashboardData();
  const { enhancedStaffMembers } = useEnhancedStaffData();
  
  // Calculate real team metrics
  const teamMetrics = {
    totalTeamMembers: enhancedStaffMembers.length,
    activeProjects: mockQueries.filter(q => q.status === 'in-progress').length,
    completedTasks: mockQueries.filter(q => q.status === 'confirmed' || q.status === 'converted').length,
    teamPerformance: 87,
    departmentRevenue: 125000,
    monthlyTarget: 150000
  };

  // Get top performers from real staff data
  const topPerformers = enhancedStaffMembers
    .filter(staff => staff.active)
    .slice(0, 3)
    .map((staff, index) => ({
      name: staff.name,
      performance: 95 - (index * 7) // Mock performance calculation
    }));

  // Get real pending approvals
  const pendingApprovals = [
    ...mockQueries.filter(q => q.status === 'proposal-sent').map(query => ({
      type: "Proposal Approval",
      user: query.agentName,
      details: `${query.destination.country} ${query.packageType} package`,
      priority: "High" as const,
      id: query.id
    })),
    // Add other approval types
    { type: "Leave Request", user: enhancedStaffMembers[0]?.name || "Staff Member", details: "Annual leave: Dec 25-30", priority: "Medium" as const, id: "leave-1" },
    { type: "Budget Request", user: "Finance Team", details: "Q1 Marketing budget: $15,000", priority: "High" as const, id: "budget-1" }
  ].slice(0, 5);

  return (
    <Tabs defaultValue="team-overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="projects">Active Projects</TabsTrigger>
        <TabsTrigger value="approvals">Approvals</TabsTrigger>
      </TabsList>

      <TabsContent value="team-overview" className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="text-2xl font-bold">{teamMetrics.totalTeamMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Queries</p>
                  <p className="text-2xl font-bold">{stats.activeQueries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{teamMetrics.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{stats.revenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>
              Current month progress towards targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Revenue Target</span>
                  <span>${(teamMetrics.departmentRevenue / 1000).toFixed(0)}K / ${(teamMetrics.monthlyTarget / 1000).toFixed(0)}K</span>
                </div>
                <Progress value={(teamMetrics.departmentRevenue / teamMetrics.monthlyTarget) * 100} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate</span>
                  <span>{stats.conversionRate}%</span>
                </div>
                <Progress value={stats.conversionRate} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Team Performance</span>
                  <span>{teamMetrics.teamPerformance}%</span>
                </div>
                <Progress value={teamMetrics.teamPerformance} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Team Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Top Performers</Label>
                <div className="space-y-2 mt-2">
                  {topPerformers.map((performer, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{performer.name}</span>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {performer.performance}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Recent Achievements</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Q4 Sales Target Met</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Best Customer Service</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Innovation Award</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="projects" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Travel Projects</CardTitle>
            <CardDescription>
              Current queries and bookings under management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockQueries.filter(q => q.status === 'in-progress').slice(0, 3).map((query, index) => (
                <div key={query.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{query.destination.country} {query.packageType} Package</h4>
                    <Badge variant="outline">{query.status}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Agent: {query.agentName}</span>
                    <span>PAX: {query.paxDetails.adults + query.paxDetails.children}</span>
                    <span>{query.tripDuration.nights} nights</span>
                  </div>
                  <Progress value={60 + (index * 15)} className="h-2 mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">{60 + (index * 15)}% Complete</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="approvals" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
            <CardDescription>
              Items requiring your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{item.type}</h4>
                    <p className="text-sm text-muted-foreground">{item.user}: {item.details}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}>
                      {item.priority}
                    </Badge>
                    <Button size="sm">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ManagerProfile;
