import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  Target,
  FileText
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';

const SalesReports: React.FC = () => {
  const { canAccessModule } = useAccessControl();

  if (!canAccessModule('reports')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have access to reports.</p>
      </div>
    );
  }

  const reportData = {
    thisMonth: {
      enquiries: 42,
      conversions: 18,
      revenue: '₹8,75,000',
      commission: '₹87,500'
    },
    lastMonth: {
      enquiries: 38,
      conversions: 15,
      revenue: '₹7,25,000',
      commission: '₹72,500'
    }
  };

  const topPerformingAgents = [
    { name: 'Dream Tours Pvt Ltd', bookings: 8, revenue: '₹3,20,000', commission: '₹32,000' },
    { name: 'Vacation Paradise', bookings: 6, revenue: '₹2,80,000', commission: '₹28,000' },
    { name: 'Travel Express', bookings: 4, revenue: '₹2,75,000', commission: '₹27,500' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">Analyze your sales performance and trends</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Reports
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month Enquiries</p>
                <p className="text-2xl font-bold">{reportData.thisMonth.enquiries}</p>
                <p className="text-xs text-green-600">+{reportData.thisMonth.enquiries - reportData.lastMonth.enquiries} from last month</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{reportData.thisMonth.conversions}</p>
                <p className="text-xs text-green-600">+{reportData.thisMonth.conversions - reportData.lastMonth.conversions} from last month</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{reportData.thisMonth.revenue}</p>
                <p className="text-xs text-green-600">+₹1,50,000 from last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission</p>
                <p className="text-2xl font-bold">{reportData.thisMonth.commission}</p>
                <p className="text-xs text-green-600">+₹15,000 from last month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">
            <BarChart3 className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Users className="mr-2 h-4 w-4" />
            Agent Analysis
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <FileText className="mr-2 h-4 w-4" />
            Detailed Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">January</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="w-20 bg-green-500 h-2 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">42.8%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">December</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="w-16 bg-blue-500 h-2 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">39.5%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">November</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="w-14 bg-orange-500 h-2 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">35.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">January</span>
                    <span className="text-sm font-medium">₹8,75,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">December</span>
                    <span className="text-sm font-medium">₹7,25,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">November</span>
                    <span className="text-sm font-medium">₹6,80,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">October</span>
                    <span className="text-sm font-medium">₹7,10,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformingAgents.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{agent.revenue}</p>
                      <p className="text-sm text-muted-foreground">Commission: {agent.commission}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Popular Destinations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Thailand</span>
                      <Badge variant="secondary">28 bookings</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Dubai</span>
                      <Badge variant="secondary">22 bookings</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Singapore</span>
                      <Badge variant="secondary">18 bookings</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Seasonal Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    Winter season shows 35% increase in international bookings compared to summer.
                    Corporate travel peaks during Q4 with group bookings averaging 15+ travelers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Detailed Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Monthly Sales Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Agent Performance Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Commission Statement
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Analytics Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesReports;