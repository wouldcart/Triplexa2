
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { 
  CheckSquare, Clock, Target, TrendingUp, 
  Calendar, Star, Award
} from 'lucide-react';

interface StaffProfileProps {
  isEditing: boolean;
  editData: any;
  setEditData: (data: any) => void;
}

const StaffProfile: React.FC<StaffProfileProps> = ({
  isEditing,
  editData,
  setEditData
}) => {
  const { currentUser } = useApp();

  const staffMetrics = {
    tasksCompleted: 47,
    tasksInProgress: 8,
    thisMonthTarget: 60,
    performanceScore: 85,
    customerRating: 4.8,
    responseTime: 2.3
  };

  return (
    <Tabs defaultValue="dashboard" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="tasks">My Tasks</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="development">Development</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{staffMetrics.tasksCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{staffMetrics.tasksInProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{staffMetrics.customerRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress</CardTitle>
            <CardDescription>
              Progress towards your monthly targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Tasks Completed</span>
                  <span>{staffMetrics.tasksCompleted} / {staffMetrics.thisMonthTarget}</span>
                </div>
                <Progress value={(staffMetrics.tasksCompleted / staffMetrics.thisMonthTarget) * 100} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Performance Score</span>
                  <span>{staffMetrics.performanceScore}%</span>
                </div>
                <Progress value={staffMetrics.performanceScore} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Tasks</CardTitle>
            <CardDescription>
              Your assigned tasks and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Update customer database", priority: "High", deadline: "Today", status: "In Progress" },
                { title: "Prepare monthly report", priority: "Medium", deadline: "Tomorrow", status: "Not Started" },
                { title: "Client follow-up calls", priority: "High", deadline: "This Week", status: "In Progress" }
              ].map((task, index) => (
                <div key={index} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">Due: {task.deadline}</p>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <Badge variant={task.priority === 'High' ? 'destructive' : 'default'}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">This Month</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Tasks Completed</span>
                    <span className="font-medium">{staffMetrics.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-medium">{staffMetrics.responseTime}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Rating</span>
                    <span className="font-medium">{staffMetrics.customerRating}/5</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Recent Achievements</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Employee of the Month</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Quick Response Award</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="development" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Professional Development</CardTitle>
            <CardDescription>
              Training and skill development opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Recommended Training</Label>
                <div className="space-y-2 mt-2">
                  {[
                    "Advanced Customer Service",
                    "Time Management Techniques",
                    "Department-Specific Skills"
                  ].map((training, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{training}</span>
                      <Button size="sm" variant="outline">Enroll</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default StaffProfile;
