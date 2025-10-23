
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, Users, MapPin, Calendar, 
  Clock, Target, Award, AlertTriangle
} from 'lucide-react';
import { Query } from '@/types/query';

interface QueryAnalyticsProps {
  queries: Query[];
  calculatePriority: (query: Query) => number;
  categorizeQuery: (query: Query) => string;
}

const QueryAnalytics: React.FC<QueryAnalyticsProps> = ({
  queries,
  calculatePriority,
  categorizeQuery
}) => {
  const analytics = useMemo(() => {
    const totalQueries = queries.length;
    
    // Status distribution
    const statusDistribution = queries.reduce((acc, query) => {
      acc[query.status] = (acc[query.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category distribution
    const categoryDistribution = queries.reduce((acc, query) => {
      const category = categorizeQuery(query);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Destination analysis
    const destinationStats = queries.reduce((acc, query) => {
      const country = query.destination.country;
      if (!acc[country]) {
        acc[country] = { count: 0, conversion: 0, avgPriority: 0 };
      }
      acc[country].count++;
      acc[country].avgPriority += calculatePriority(query);
      if (query.status === 'confirmed' || query.status === 'converted') {
        acc[country].conversion++;
      }
      return acc;
    }, {} as Record<string, { count: number; conversion: number; avgPriority: number }>);

    // Calculate averages
    Object.keys(destinationStats).forEach(country => {
      const stats = destinationStats[country];
      stats.avgPriority = Math.round(stats.avgPriority / stats.count);
      stats.conversion = Math.round((stats.conversion / stats.count) * 100);
    });

    // Agent performance
    const agentStats = queries.reduce((acc, query) => {
      const agent = query.agentName;
      if (!acc[agent]) {
        acc[agent] = { queries: 0, conversions: 0, avgPriority: 0 };
      }
      acc[agent].queries++;
      acc[agent].avgPriority += calculatePriority(query);
      if (query.status === 'confirmed' || query.status === 'converted') {
        acc[agent].conversions++;
      }
      return acc;
    }, {} as Record<string, { queries: number; conversions: number; avgPriority: number }>);

    // Calculate agent averages
    Object.keys(agentStats).forEach(agent => {
      const stats = agentStats[agent];
      stats.avgPriority = Math.round(stats.avgPriority / stats.queries);
    });

    // Priority distribution
    const priorityDistribution = { high: 0, medium: 0, low: 0 };
    queries.forEach(query => {
      const priority = calculatePriority(query);
      if (priority >= 8) priorityDistribution.high++;
      else if (priority >= 5) priorityDistribution.medium++;
      else priorityDistribution.low++;
    });

    // Conversion metrics
    const confirmedQueries = queries.filter(q => q.status === 'confirmed' || q.status === 'converted').length;
    const conversionRate = totalQueries > 0 ? Math.round((confirmedQueries / totalQueries) * 100) : 0;

    // Response time analysis (mock data based on creation dates)
    const avgResponseTime = '2.4 hours'; // Mock calculation
    const slaCompliance = 87; // Mock percentage

    return {
      totalQueries,
      statusDistribution,
      categoryDistribution,
      destinationStats,
      agentStats,
      priorityDistribution,
      conversionRate,
      avgResponseTime,
      slaCompliance
    };
  }, [queries, calculatePriority, categorizeQuery]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SLA Compliance</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.slaCompliance}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enquiries</p>
                <p className="text-2xl font-bold">{analytics.totalQueries}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current enquiry status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => {
              const percentage = Math.round((count / analytics.totalQueries) * 100);
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium capitalize">
                      {status.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Enquiry priority levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">High Priority</span>
                <span className="text-sm text-gray-600">{analytics.priorityDistribution.high}</span>
              </div>
              <Progress 
                value={(analytics.priorityDistribution.high / analytics.totalQueries) * 100} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Medium Priority</span>
                <span className="text-sm text-gray-600">{analytics.priorityDistribution.medium}</span>
              </div>
              <Progress 
                value={(analytics.priorityDistribution.medium / analytics.totalQueries) * 100} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Low Priority</span>
                <span className="text-sm text-gray-600">{analytics.priorityDistribution.low}</span>
              </div>
              <Progress 
                value={(analytics.priorityDistribution.low / analytics.totalQueries) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destination Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Destination Performance
          </CardTitle>
          <CardDescription>Analysis by destination with conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.destinationStats)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([destination, stats]) => (
                <div key={destination} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{destination}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{stats.count} enquiries</Badge>
                      <Badge 
                        className={stats.conversion >= 30 ? 'bg-green-100 text-green-800' : 
                                  stats.conversion >= 15 ? 'bg-orange-100 text-orange-800' : 
                                  'bg-red-100 text-red-800'}
                      >
                        {stats.conversion}% conversion
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Avg Priority: </span>
                      <span className="font-medium">{stats.avgPriority}/10</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Conversions: </span>
                      <span className="font-medium">{Math.round(stats.count * stats.conversion / 100)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Performance
          </CardTitle>
          <CardDescription>Top performing agents by conversion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.agentStats)
              .sort(([,a], [,b]) => (b.conversions / b.queries) - (a.conversions / a.queries))
              .slice(0, 10)
              .map(([agent, stats]) => {
                const conversionRate = Math.round((stats.conversions / stats.queries) * 100);
                return (
                  <div key={agent} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{agent}</p>
                      <p className="text-sm text-gray-600">
                        {stats.queries} enquiries • Avg Priority: {stats.avgPriority}/10
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={conversionRate >= 30 ? 'bg-green-100 text-green-800' : 
                                  conversionRate >= 15 ? 'bg-orange-100 text-orange-800' : 
                                  'bg-red-100 text-red-800'}
                      >
                        {conversionRate}%
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{stats.conversions} conversions</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryAnalytics;
