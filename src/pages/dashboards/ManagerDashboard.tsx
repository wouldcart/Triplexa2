
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, FileText, Building, TrendingUp, Calendar, DollarSign, 
  AlertTriangle, CheckCircle, Clock, ArrowRight, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import PageLayout from '@/components/layout/PageLayout';
import { useManagerDashboardData } from '@/hooks/useManagerDashboardData';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, quickActions, recentActivities, isLoading } = useManagerDashboardData();

  const statCards = [
    { 
      title: 'Total Staff', 
      value: stats.totalStaff.toString(), 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+5%'
    },
    { 
      title: 'Active Queries', 
      value: stats.activeQueries.toString(), 
      icon: FileText, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12%'
    },
    { 
      title: 'Hotels', 
      value: stats.totalHotels.toString(), 
      icon: Building, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+3%'
    },
    { 
      title: 'Revenue', 
      value: stats.revenue, 
      icon: DollarSign, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+8%'
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

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manager Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete overview of your travel management system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Full Access
            </Badge>
            <Badge variant="outline">
              {stats.pendingApprovals} Pending Approvals
            </Badge>
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
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stat.change}</span>
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
                  <span>{stats.conversionRate}%</span>
                </div>
                <Progress value={stats.conversionRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Staff Utilization</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Customer Satisfaction</span>
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
                <span className="text-sm">Active Agents</span>
                <Badge variant="secondary">{stats.activeAgents}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed Bookings</span>
                <Badge variant="default">{stats.completedBookings}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Approvals</span>
                <Badge 
                  variant="destructive" 
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  {stats.pendingApprovals}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your most used management functions with real-time counts
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
              Live updates from your system
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
              <Button variant="outline" className="w-full" onClick={() => navigate('/queries')}>
                View All Activities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ManagerDashboard;
