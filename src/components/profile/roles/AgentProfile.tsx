
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { 
  DollarSign, Users, TrendingUp, Calendar,
  Building, Award, Target, BarChart3
} from 'lucide-react';

interface AgentProfileProps {
  isEditing: boolean;
  editData: any;
  setEditData: (data: any) => void;
}

const AgentProfile: React.FC<AgentProfileProps> = ({
  isEditing,
  editData,
  setEditData
}) => {
  const { currentUser } = useApp();

  const agentMetrics = {
    monthlyCommission: 5200,
    totalClients: 45,
    activeBookings: 12,
    completedBookings: 78,
    conversionRate: 68,
    customerSatisfaction: 4.7
  };

  return (
    <Tabs defaultValue="dashboard" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="commission">Commission</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">${agentMetrics.monthlyCommission}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{agentMetrics.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-2xl font-bold">{agentMetrics.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Your business performance and targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Commission Target</span>
                  <span>${agentMetrics.monthlyCommission} / $8,000</span>
                </div>
                <Progress value={(agentMetrics.monthlyCommission / 8000) * 100} className="h-2 mt-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate</span>
                  <span>{agentMetrics.conversionRate}%</span>
                </div>
                <Progress value={agentMetrics.conversionRate} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clients" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Client Management
            </CardTitle>
            <CardDescription>
              Manage your client relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Smith Family", status: "Active", lastContact: "2 days ago", value: "$5,200" },
                { name: "Johnson Corp", status: "Prospect", lastContact: "1 week ago", value: "$12,000" },
                { name: "Brown Travel Group", status: "Active", lastContact: "Yesterday", value: "$8,500" }
              ].map((client, index) => (
                <div key={index} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{client.name}</h4>
                    <p className="text-sm text-muted-foreground">Last contact: {client.lastContact}</p>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                    <span className="font-medium">{client.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bookings" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>
              Track your bookings and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{agentMetrics.completedBookings}</div>
                <Label className="text-sm">Completed</Label>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{agentMetrics.activeBookings}</div>
                <Label className="text-sm">Active</Label>
              </div>
            </div>
            <Button className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              View All Bookings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="commission" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Commission Tracking
            </CardTitle>
            <CardDescription>
              Track your earnings and commission structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${agentMetrics.monthlyCommission}</div>
                  <Label className="text-sm">This Month</Label>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$18,750</div>
                  <Label className="text-sm">Last 3 Months</Label>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">$62,400</div>
                  <Label className="text-sm">This Year</Label>
                </div>
              </div>
              
              {currentUser?.companyInfo?.commissionStructure && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Commission Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentUser.companyInfo.commissionStructure.tiers?.map((tier, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">
                            ${tier.min.toLocaleString()} - ${tier.max.toLocaleString()}
                          </span>
                          <Badge variant="outline">{tier.rate}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AgentProfile;
