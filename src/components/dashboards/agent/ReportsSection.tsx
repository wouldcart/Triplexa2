import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, Download, Calendar, MapPin, 
  TrendingUp, Users, DollarSign, Target,
  FileBarChart, PieChart, Activity
} from 'lucide-react';

const ReportsSection: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState("this-month");
  const [reportType, setReportType] = useState("summary");

  const reportData = {
    summary: {
      totalBookings: 12,
      totalRevenue: 28450.75,
      totalCommission: 2845.08,
      conversionRate: 68.5,
      avgBookingValue: 2370.90,
      clientSatisfaction: 4.7
    },
    destinations: [
      { name: "Thailand", bookings: 4, revenue: 9800, commission: 980, percentage: 34.4 },
      { name: "Dubai, UAE", bookings: 3, revenue: 8100, commission: 810, percentage: 28.5 },
      { name: "Bali, Indonesia", bookings: 2, revenue: 4200, commission: 420, percentage: 14.8 },
      { name: "Singapore", bookings: 2, revenue: 3800, commission: 380, percentage: 13.4 },
      { name: "Malaysia", bookings: 1, revenue: 2550, commission: 255, percentage: 8.9 }
    ],
    monthlyTrend: [
      { month: "Jan 2024", bookings: 12, revenue: 28450, commission: 2845 },
      { month: "Dec 2023", bookings: 15, revenue: 32100, commission: 3210 },
      { month: "Nov 2023", bookings: 10, revenue: 24800, commission: 2480 },
      { month: "Oct 2023", bookings: 8, revenue: 19600, commission: 1960 },
      { month: "Sep 2023", bookings: 11, revenue: 26300, commission: 2630 },
      { month: "Aug 2023", bookings: 14, revenue: 31200, commission: 3120 }
    ],
    clientAnalysis: [
      { segment: "Honeymoon Couples", bookings: 5, avgValue: 2100, satisfaction: 4.9 },
      { segment: "Family Groups", bookings: 4, avgValue: 3200, satisfaction: 4.6 },
      { segment: "Corporate Travel", bookings: 2, avgValue: 1800, satisfaction: 4.4 },
      { segment: "Solo Travelers", bookings: 1, avgValue: 1200, satisfaction: 4.8 }
    ]
  };

  const availableReports = [
    {
      name: "Monthly Booking Summary",
      description: "Complete overview of bookings, revenue, and commission",
      format: "PDF/Excel",
      icon: BarChart3,
      color: "text-blue-500"
    },
    {
      name: "Destination-wise Revenue",
      description: "Performance analysis by destination and region",
      format: "PDF/Excel", 
      icon: MapPin,
      color: "text-green-500"
    },
    {
      name: "Lead-to-Booking Conversion",
      description: "Conversion funnel and performance metrics",
      format: "PDF/Excel",
      icon: Target,
      color: "text-purple-500"
    },
    {
      name: "Client Satisfaction Report",
      description: "Feedback analysis and satisfaction scores",
      format: "PDF",
      icon: Users,
      color: "text-orange-500"
    },
    {
      name: "Commission Statement",
      description: "Detailed commission breakdown and earnings",
      format: "PDF/Excel",
      icon: DollarSign,
      color: "text-emerald-500"
    },
    {
      name: "Performance Dashboard",
      description: "Visual dashboard with key performance indicators",
      format: "PDF",
      icon: Activity,
      color: "text-red-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Reports & Performance Analytics
          </CardTitle>
          <CardDescription>
            Track your performance and generate detailed reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <FileBarChart className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Analysis</SelectItem>
                <SelectItem value="comparison">Period Comparison</SelectItem>
                <SelectItem value="forecast">Forecast Report</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{reportData.summary.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/50">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">${reportData.summary.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{reportData.summary.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Destination Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Destination-wise Revenue
            </CardTitle>
            <CardDescription>
              Performance breakdown by destination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.destinations.map((destination, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{destination.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {destination.bookings} bookings • ${destination.commission} commission
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${destination.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{destination.percentage}%</div>
                    </div>
                  </div>
                  <Progress value={destination.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Performance Trend
            </CardTitle>
            <CardDescription>
              6-month booking and revenue trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">
                      {month.bookings} bookings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${month.revenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      ${month.commission} commission
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Download detailed reports and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableReports.map((report, index) => (
              <Card key={index} className="border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <report.icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {report.description}
                      </p>
                      <Badge variant="outline" className="text-xs mb-3">
                        {report.format}
                      </Badge>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;