import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Eye, 
  MousePointer, 
  Pause, 
  Play, 
  BarChart3, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Users,
  Target,
  Zap,
  Coffee,
  FileText
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  activityTracker, 
  ActivityEvent, 
  ProductivityMetrics 
} from '@/services/activityTrackingService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { universalPDFService } from '@/services/universalPDFService';
import { toast } from '@/hooks/use-toast';
import PageLayout from '@/components/layout/PageLayout';

interface ActivityTrackingDashboardProps {
  staffId?: string;
  isAdmin?: boolean;
}

export const ActivityTrackingDashboard: React.FC<ActivityTrackingDashboardProps> = ({
  staffId,
  isAdmin = false
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState(staffId || '');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfDay(subDays(new Date(), 7)),
    endOfDay(new Date())
  ]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [productivityTrend, setProductivityTrend] = useState<Array<{ date: string; score: number }>>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Mock staff data - replace with actual staff service
  const staffMembers = [
    { id: 'staff1', name: 'John Doe', department: 'Development' },
    { id: 'staff2', name: 'Jane Smith', department: 'Design' },
    { id: 'staff3', name: 'Mike Johnson', department: 'Marketing' },
  ];

  useEffect(() => {
    setIsTracking(activityTracker.isCurrentlyTracking());
    setCurrentStaffId(activityTracker.getCurrentStaffId());
    
    if (selectedStaffId) {
      loadData();
    }

    // Set up auto-refresh for real-time updates
    const interval = setInterval(() => {
      if (selectedStaffId) {
        loadData();
      }
      setIsTracking(activityTracker.isCurrentlyTracking());
      setCurrentStaffId(activityTracker.getCurrentStaffId());
    }, 30000); // Refresh every 30 seconds

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedStaffId, dateRange]);

  const loadData = () => {
    if (!selectedStaffId) return;

    const staffMetrics = activityTracker.generateProductivityReport(selectedStaffId, dateRange);
    const staffActivities = activityTracker.getActivities(selectedStaffId, dateRange);
    const trend = activityTracker.getDailyProductivityTrend(selectedStaffId, 30);

    setMetrics(staffMetrics);
    setActivities(staffActivities);
    setProductivityTrend(trend);
  };

  const handleStartTracking = () => {
    if (selectedStaffId) {
      activityTracker.startTracking(selectedStaffId);
      setIsTracking(true);
      setCurrentStaffId(selectedStaffId);
    }
  };

  const handleStopTracking = () => {
    activityTracker.stopTracking();
    setIsTracking(false);
    setCurrentStaffId(null);
  };

  const handleExportData = () => {
    if (selectedStaffId) {
      const data = activityTracker.exportActivityData(selectedStaffId, dateRange);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-data-${selectedStaffId}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedStaffId || !metrics) {
      toast({
        title: "Export Error",
        description: "Please select a staff member and ensure data is loaded.",
        variant: "destructive"
      });
      return;
    }

    try {
      const staffMember = staffMembers.find(s => s.id === selectedStaffId);
      const reportData = {
        staffId: selectedStaffId,
        staffName: staffMember?.name || 'Unknown Staff',
        department: staffMember?.department || 'Unknown Department',
        dateRange: dateRange,
        metrics: metrics,
        activities: activities.slice(0, 20), // Limit to recent 20 activities for PDF
        productivityTrend: productivityTrend
      };

      const pdfBlob = await universalPDFService.generateActivityReport(selectedStaffId, metrics, activities);
      const filename = `activity-report-${selectedStaffId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      universalPDFService.downloadPDF(pdfBlob, filename);

      toast({
        title: "PDF Generated",
        description: "Activity report PDF has been generated and downloaded successfully."
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getProductivityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActivityTypeColor = (type: string): string => {
    switch (type) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'break': return 'bg-blue-100 text-blue-800';
      case 'page_view': return 'bg-purple-100 text-purple-800';
      case 'action': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pieChartData = metrics ? [
    { name: 'Active Time', value: metrics.totalActiveTime, color: '#10b981' },
    { name: 'Idle Time', value: metrics.totalIdleTime, color: '#6b7280' },
    { name: 'Break Time', value: metrics.breakTime, color: '#3b82f6' },
  ] : [];

  return (
    <PageLayout
      title="Activity Tracking Dashboard"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Activity Tracking", href: "/activity-tracking" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activity Tracking Dashboard</h1>
            <p className="text-gray-600">Monitor employee productivity and activity patterns</p>
          </div>
          <div className="flex items-center space-x-4">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm" disabled={!selectedStaffId}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={!selectedStaffId || !metrics}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Staff Member</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange[0], 'MMM dd')} - {format(dateRange[1], 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange[0], to: dateRange[1] }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange([startOfDay(range.from), endOfDay(range.to)]);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Tracking Control</label>
              <div className="flex items-center space-x-2">
                {isTracking && currentStaffId === selectedStaffId ? (
                  <Button onClick={handleStopTracking} variant="destructive" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStartTracking} 
                    disabled={!selectedStaffId}
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </Button>
                )}
                {isTracking && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productivity Score</p>
                  <p className={`text-2xl font-bold ${getProductivityColor(metrics.productivityScore)}`}>
                    {metrics.productivityScore}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <Progress value={metrics.productivityScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Time</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatDuration(metrics.totalActiveTime)}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Page Views</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.pageViews}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Break Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatDuration(metrics.breakTime)}
                  </p>
                </div>
                <Coffee className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatDuration(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.hourlyActivity ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="activity" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Most Visited Pages */}
          {metrics?.mostVisitedPages && metrics.mostVisitedPages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Most Visited Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.mostVisitedPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{page.page}</p>
                        <p className="text-sm text-gray-600">{page.count} visits</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDuration(page.duration)}</p>
                        <Progress 
                          value={(page.count / metrics.mostVisitedPages[0].count) * 100} 
                          className="w-20 mt-1" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Productivity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {productivityTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={productivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      formatter={(value) => [`${value}%`, 'Productivity Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activities.slice(-50).reverse().map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getActivityTypeColor(activity.type)}>
                        {activity.type}
                      </Badge>
                      <div>
                        <p className="font-medium">{activity.details.action || activity.type}</p>
                        <p className="text-sm text-gray-600">
                          {activity.details.page && `Page: ${activity.details.page}`}
                          {activity.details.element && ` | Element: ${activity.details.element}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {format(new Date(activity.timestamp), 'HH:mm:ss')}
                      </p>
                      {activity.details.duration && (
                        <p className="text-xs text-gray-500">
                          {formatDuration(activity.details.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No activities recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Focus Time Analysis</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {metrics.focusTime > metrics.totalActiveTime * 0.8 
                          ? "Excellent focus! You're maintaining high concentration levels."
                          : "Consider reducing interruptions to improve focus time."
                        }
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Activity Level</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {metrics.actionsPerformed > 100 
                          ? "High activity level detected. Great engagement!"
                          : "Consider increasing interaction with the application."
                        }
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900">Break Pattern</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {metrics.breakTime > 0 
                          ? "Good break management. Regular breaks help maintain productivity."
                          : "Consider taking regular breaks to maintain peak performance."
                        }
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Optimize Peak Hours</p>
                      <p className="text-sm text-gray-600">
                        Schedule important tasks during your most active hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Maintain Consistency</p>
                      <p className="text-sm text-gray-600">
                        Try to maintain consistent activity patterns daily
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Monitor Idle Time</p>
                      <p className="text-sm text-gray-600">
                        Reduce idle periods to improve overall productivity
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </PageLayout>
  );
};

export default ActivityTrackingDashboard;