import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, Clock, MapPin, 
  Star, ThumbsUp, Fuel, DollarSign,
  Calendar, Award, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceData {
  vehicleType: string;
  utilizationRate: number;
  customerSatisfaction: number;
  onTimePerformance: number;
  fuelEfficiency: number;
  costPerKm: number;
  bookingCount: number;
  averageDistance: number;
}

interface SeasonalData {
  month: string;
  demand: number;
  utilization: number;
  avgPrice: number;
}

interface VehiclePerformanceAnalyticsProps {
  vehicleType?: string;
  route?: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
  className?: string;
}

export const VehiclePerformanceAnalytics: React.FC<VehiclePerformanceAnalyticsProps> = ({
  vehicleType = 'All',
  route = 'All Routes',
  timeframe = 'month',
  className
}) => {
  const [activeTab, setActiveTab] = useState('performance');

  // Mock performance data - in real app, this would come from analytics service
  const performanceData: PerformanceData[] = [
    {
      vehicleType: 'Sedan',
      utilizationRate: 78,
      customerSatisfaction: 4.2,
      onTimePerformance: 92,
      fuelEfficiency: 15.5,
      costPerKm: 2.50,
      bookingCount: 156,
      averageDistance: 45
    },
    {
      vehicleType: 'SUV',
      utilizationRate: 85,
      customerSatisfaction: 4.5,
      onTimePerformance: 89,
      fuelEfficiency: 12.8,
      costPerKm: 3.20,
      bookingCount: 203,
      averageDistance: 62
    },
    {
      vehicleType: 'Minivan',
      utilizationRate: 92,
      customerSatisfaction: 4.3,
      onTimePerformance: 87,
      fuelEfficiency: 11.2,
      costPerKm: 3.80,
      bookingCount: 178,
      averageDistance: 58
    },
    {
      vehicleType: 'Bus',
      utilizationRate: 68,
      customerSatisfaction: 3.9,
      onTimePerformance: 85,
      fuelEfficiency: 8.5,
      costPerKm: 1.80,
      bookingCount: 89,
      averageDistance: 125
    }
  ];

  const seasonalData: SeasonalData[] = [
    { month: 'Jan', demand: 85, utilization: 72, avgPrice: 180 },
    { month: 'Feb', demand: 75, utilization: 68, avgPrice: 165 },
    { month: 'Mar', demand: 90, utilization: 78, avgPrice: 190 },
    { month: 'Apr', demand: 95, utilization: 82, avgPrice: 200 },
    { month: 'May', demand: 88, utilization: 75, avgPrice: 185 },
    { month: 'Jun', demand: 92, utilization: 85, avgPrice: 195 },
    { month: 'Jul', demand: 100, utilization: 95, avgPrice: 220 },
    { month: 'Aug', demand: 98, utilization: 90, avgPrice: 210 },
    { month: 'Sep', demand: 82, utilization: 78, avgPrice: 175 },
    { month: 'Oct', demand: 88, utilization: 80, avgPrice: 185 },
    { month: 'Nov', demand: 85, utilization: 76, avgPrice: 180 },
    { month: 'Dec', demand: 95, utilization: 88, avgPrice: 205 }
  ];

  const utilizationColors = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const getPerformanceColor = (value: number, metric: string) => {
    const thresholds = {
      utilizationRate: { good: 80, fair: 60 },
      customerSatisfaction: { good: 4.0, fair: 3.5 },
      onTimePerformance: { good: 90, fair: 75 },
      fuelEfficiency: { good: 12, fair: 10 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'text-gray-600';

    if (metric === 'fuelEfficiency') {
      return value >= threshold.good ? 'text-green-600' : 
             value >= threshold.fair ? 'text-yellow-600' : 'text-red-600';
    }

    return value >= threshold.good ? 'text-green-600' : 
           value >= threshold.fair ? 'text-yellow-600' : 'text-red-600';
  };

  const getPerformanceBadge = (value: number, metric: string) => {
    const color = getPerformanceColor(value, metric);
    const variant = color.includes('green') ? 'default' : 
                   color.includes('yellow') ? 'secondary' : 'destructive';
    return variant;
  };

  const averageUtilization = performanceData.reduce((sum, d) => sum + d.utilizationRate, 0) / performanceData.length;
  const averageSatisfaction = performanceData.reduce((sum, d) => sum + d.customerSatisfaction, 0) / performanceData.length;
  const totalBookings = performanceData.reduce((sum, d) => sum + d.bookingCount, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {averageUtilization.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Utilization</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {averageSatisfaction.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Satisfaction</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {totalBookings}
            </div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              87.5%
            </div>
            <div className="text-sm text-muted-foreground">On-Time Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Vehicle Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vehicle Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((vehicle, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-lg">{vehicle.vehicleType}</h4>
                      <div className="flex gap-2">
                        <Badge variant={getPerformanceBadge(vehicle.utilizationRate, 'utilizationRate')}>
                          {vehicle.utilizationRate}% Utilization
                        </Badge>
                        <Badge variant={getPerformanceBadge(vehicle.customerSatisfaction, 'customerSatisfaction')}>
                          {vehicle.customerSatisfaction}/5 Rating
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          On-Time Performance
                        </div>
                        <div className="font-medium">{vehicle.onTimePerformance}%</div>
                        <Progress value={vehicle.onTimePerformance} className="h-1 mt-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Fuel className="h-3 w-3" />
                          Fuel Efficiency
                        </div>
                        <div className="font-medium">{vehicle.fuelEfficiency} km/L</div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <DollarSign className="h-3 w-3" />
                          Cost per KM
                        </div>
                        <div className="font-medium">${vehicle.costPerKm}</div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3" />
                          Avg Distance
                        </div>
                        <div className="font-medium">{vehicle.averageDistance} km</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Utilization Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Utilization Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vehicleType" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="utilizationRate" fill="#3b82f6" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Seasonal Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonal Demand & Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="demand" stroke="#10b981" name="Demand %" />
                  <Line type="monotone" dataKey="utilization" stroke="#3b82f6" name="Utilization %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pricing Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Average Pricing Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgPrice" stroke="#f59e0b" name="Avg Price ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Key Insights */}
          <div className="grid gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-800 dark:text-green-200">
                      Best Performing Vehicle
                    </h5>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Minivans show the highest utilization rate at 92% with good customer satisfaction. 
                      Ideal for group bookings and family trips.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-800 dark:text-blue-200">
                      Seasonal Pattern
                    </h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Peak demand occurs in July-August (summer season) with 95%+ utilization. 
                      Consider dynamic pricing during these periods.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Fuel className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-800 dark:text-amber-200">
                      Efficiency Opportunity
                    </h5>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Buses have low utilization (68%) but best cost per km. Consider promoting 
                      for larger groups and longer routes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h6 className="font-medium">Implement Dynamic Pricing</h6>
                    <p className="text-sm text-muted-foreground">
                      Increase rates by 15-20% during peak months (Jul-Aug) to maximize revenue
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <h6 className="font-medium">Promote Minivan Usage</h6>
                    <p className="text-sm text-muted-foreground">
                      Offer group discounts for 6+ passengers to leverage high utilization rates
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <h6 className="font-medium">Improve Bus Marketing</h6>
                    <p className="text-sm text-muted-foreground">
                      Target corporate bookings and airport transfers to increase bus utilization
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};