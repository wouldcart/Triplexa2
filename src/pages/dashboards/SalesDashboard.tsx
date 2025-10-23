import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Target,
  DollarSign,
  Phone,
  Mail,
  ChartBar,
  ArrowRight,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';
import PageLayout from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';

const SalesDashboard: React.FC = () => {
  const { canAccessModule } = useAccessControl();
  const navigate = useNavigate();

  if (!canAccessModule('sales-dashboard')) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this dashboard.</p>
        </div>
      </PageLayout>
    );
  }

  const salesMetrics = {
    newEnquiries: 28,
    hotLeads: 15,
    converted: 8,
    responseTime: '2.5 hrs',
    conversionRate: 28.6,
    monthlyRevenue: '₹12.5L',
    leadsClosed: 45,
    targetAchievement: 85
  };

  const statCards = [
    { 
      title: 'New Enquiries', 
      value: salesMetrics.newEnquiries.toString(), 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      description: 'This week'
    },
    { 
      title: 'Hot Leads', 
      value: salesMetrics.hotLeads.toString(), 
      icon: TrendingUp, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+8%',
      description: 'Ready to convert'
    },
    { 
      title: 'Converted', 
      value: salesMetrics.converted.toString(), 
      icon: Target, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+15%',
      description: 'This month'
    },
    { 
      title: 'Avg Response', 
      value: salesMetrics.responseTime, 
      icon: MessageSquare, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '-5%',
      description: 'Response time'
    }
  ];

  const enquiries = [
    { id: 1, client: 'Dream Tours Pvt Ltd', status: 'New', value: '₹2,50,000', priority: 'High', type: 'query' },
    { id: 2, client: 'Vacation Paradise', status: 'Hot', value: '₹1,80,000', priority: 'Medium', type: 'booking' },
    { id: 3, client: 'Travel Express', status: 'Follow-up', value: '₹3,20,000', priority: 'High', type: 'query' }
  ];

  const quickActions = [
    {
      title: 'Create New Quote',
      description: 'Generate instant pricing for agents',
      path: '/sales/quotes',
      count: 5,
      priority: 'high'
    },
    {
      title: 'Follow-up Reminders',
      description: 'Pending follow-ups requiring attention',
      path: '/sales/bookings',
      count: 12
    },
    {
      title: 'Agent Communication',
      description: 'Unread messages from agents',
      path: '/sales/agents',
      count: 8
    }
  ];

  const recentActivities = [
    {
      id: 1,
      message: 'New enquiry from Dream Tours',
      user: 'Agent Network',
      type: 'query',
      priority: 'high',
      timestamp: '5 min ago'
    },
    {
      id: 2,
      message: 'Booking confirmed for Vacation Paradise',
      user: 'Sales Team',
      type: 'booking',
      priority: 'medium',
      timestamp: '15 min ago'
    },
    {
      id: 3,
      message: 'Quote generated for Travel Express',
      user: 'Sales Executive',
      type: 'query',
      priority: 'low',
      timestamp: '1 hour ago'
    }
  ];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'query': return FileText;
      case 'booking': return CheckCircle;
      case 'staff': return Users;
      default: return AlertTriangle;
    }
  };

  return (
    <PageLayout
      title="Sales Executive Dashboard - Tour Management System"
      description="Comprehensive sales dashboard for managing B2B agent queries, conversions, follow-ups, and revenue tracking. Monitor sales metrics, lead generation, and agent communications."
      keywords={['sales dashboard', 'B2B sales', 'agent queries', 'lead conversion', 'sales metrics', 'tour sales']}
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Sales Dashboard", href: "/dashboards/sales" },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sales Executive Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage B2B agent queries, conversions, and follow-ups
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Sales Access
            </Badge>
            <Badge variant="outline">
              {salesMetrics.newEnquiries} New Enquiries
            </Badge>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Quick Quote
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className={cn(
                        "h-4 w-4 mr-1",
                        stat.change.startsWith('+') ? "text-green-500" : "text-red-500"
                      )} />
                      <span className={cn(
                        "text-sm",
                        stat.change.startsWith('+') ? "text-green-600" : "text-red-600"
                      )}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-full", stat.bgColor)}>
                    <stat.icon className={cn("h-8 w-8", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Conversion Rate</span>
                  <span>{salesMetrics.conversionRate}%</span>
                </div>
                <Progress value={salesMetrics.conversionRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Target Achievement</span>
                  <span>{salesMetrics.targetAchievement}%</span>
                </div>
                <Progress value={salesMetrics.targetAchievement} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Agent Satisfaction</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Leads</span>
                <Badge variant="secondary">{salesMetrics.hotLeads}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Monthly Revenue</span>
                <Badge variant="default">{salesMetrics.monthlyRevenue}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Leads Closed</span>
                <Badge variant="outline">{salesMetrics.leadsClosed}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your most used sales functions with real-time counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <div 
                  key={action.title}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {action.title}
                        </h3>
                        {action.count !== undefined && (
                          <Badge 
                            className={cn(
                              "text-xs",
                              action.priority ? getPriorityColor(action.priority) : "bg-blue-100 text-blue-800"
                            )}
                          >
                            {action.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Live updates from your sales system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        activity.type === 'query' && "bg-blue-100",
                        activity.type === 'booking' && "bg-green-100",
                        activity.type === 'staff' && "bg-purple-100"
                      )}>
                        <IconComponent className={cn(
                          "h-4 w-4",
                          activity.type === 'query' && "text-blue-600",
                          activity.type === 'booking' && "text-green-600",
                          activity.type === 'staff' && "text-purple-600"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.message}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {activity.user}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPriorityColor(activity.priority))}
                      >
                        {activity.priority}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => navigate('/sales/enquiries')}>
                View All Activities
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry Pipeline */}
        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Sales Pipeline
            </TabsTrigger>
            <TabsTrigger value="quotes">
              <FileText className="mr-2 h-4 w-4" />
              Quote Generator
            </TabsTrigger>
            <TabsTrigger value="followups">
              <Calendar className="mr-2 h-4 w-4" />
              Follow-ups
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageSquare className="mr-2 h-4 w-4" />
              Communication
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enquiry Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enquiries.map((enquiry) => (
                    <div key={enquiry.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-8 bg-blue-500 rounded"></div>
                        <div>
                          <p className="font-medium">{enquiry.client}</p>
                          <p className="text-sm text-muted-foreground">{enquiry.value}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={enquiry.priority === 'High' ? 'destructive' : 'secondary'}>
                          {enquiry.priority}
                        </Badge>
                        <Badge variant="outline">
                          {enquiry.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/sales/enquiries')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/sales/enquiries')}
                  >
                    View All Enquiries
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Quote Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Dynamic pricing with markup and commission calculation</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/sales/quotes')}
                  >
                    Create New Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Follow-Up Calendar & Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Integrated reminder system with auto-scheduling</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/sales/bookings')}
                  >
                    View Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Communication Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Chat history, email templates, and call logs</p>
                  <Button className="mt-4">
                    View Communications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default SalesDashboard;