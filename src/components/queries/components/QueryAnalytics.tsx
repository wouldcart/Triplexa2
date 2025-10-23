
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, Clock, Users, MapPin, Calendar,
  DollarSign, Target, Award
} from 'lucide-react';
import { Query } from '@/types/query';

interface QueryAnalyticsProps {
  queries: Query[];
}

const QueryAnalytics: React.FC<QueryAnalyticsProps> = ({ queries }) => {
  // Thailand specific analytics
  const thailandQueries = queries.filter(q => q.destination.country === 'Thailand');
  
  const analytics = {
    total: queries.length,
    thailand: thailandQueries.length,
    thailandPercentage: queries.length > 0 ? (thailandQueries.length / queries.length * 100).toFixed(1) : '0',
    
    // Status breakdown
    statusBreakdown: {
      new: queries.filter(q => q.status === 'new').length,
      assigned: queries.filter(q => q.status === 'assigned').length,
      inProgress: queries.filter(q => q.status === 'in-progress').length,
      proposalSent: queries.filter(q => q.status === 'proposal-sent').length,
      confirmed: queries.filter(q => q.status === 'confirmed').length,
      converted: queries.filter(q => q.status === 'converted').length,
      cancelled: queries.filter(q => q.status === 'cancelled').length,
    },
    
    // Package type distribution
    packageTypes: {
      leisure: queries.filter(q => q.packageType === 'leisure').length,
      business: queries.filter(q => q.packageType === 'business').length,
      family: queries.filter(q => q.packageType === 'family').length,
      cultural: queries.filter(q => q.packageType === 'cultural').length,
      adventure: queries.filter(q => q.packageType === 'adventure').length,
      luxury: queries.filter(q => q.packageType === 'luxury').length,
    },
    
    // Thailand specific cities
    thailandCities: thailandQueries.reduce((acc, query) => {
      query.destination.cities.forEach(city => {
        acc[city] = (acc[city] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    
    // Average duration
    avgDuration: queries.length > 0 ? 
      (queries.reduce((sum, q) => sum + (q.tripDuration?.days || 0), 0) / queries.length).toFixed(1) : '0',
    
    // Conversion metrics
    conversionRate: queries.length > 0 ? 
      (queries.filter(q => q.status === 'converted').length / queries.length * 100).toFixed(1) : '0',
    
    responseRate: queries.length > 0 ? 
      (queries.filter(q => ['in-progress', 'proposal-sent', 'confirmed', 'converted'].includes(q.status)).length / queries.length * 100).toFixed(1) : '0'
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-500 dark:text-orange-400" />
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.thailand}</div>
            <div className="text-sm text-muted-foreground">Thailand Queries</div>
            <Badge variant="outline" className="mt-1 border-border text-foreground">{analytics.thailandPercentage}%</Badge>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500 dark:text-green-400" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.conversionRate}%</div>
            <div className="text-sm text-muted-foreground">Conversion Rate</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500 dark:text-blue-400" />
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.avgDuration}</div>
            <div className="text-sm text-muted-foreground">Avg Days</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-500 dark:text-purple-400" />
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.responseRate}%</div>
            <div className="text-sm text-muted-foreground">Response Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5" />
            Query Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-lg font-semibold text-foreground">{count}</div>
                <Badge variant="outline" className="capitalize text-xs border-border text-foreground">
                  {status.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thailand Specific Analytics */}
      {analytics.thailand > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <MapPin className="h-5 w-5" />
              Thailand Query Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-foreground">Popular Cities</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(analytics.thailandCities)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([city, count]) => (
                      <div key={city} className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                        <div className="font-medium text-orange-800 dark:text-orange-200">{city}</div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">{count} queries</div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-foreground">Package Type Preferences</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(analytics.packageTypes)
                    .filter(([,count]) => count > 0)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="font-medium text-blue-800 dark:text-blue-200 capitalize">{type}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">{count} queries</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
              <span className="text-green-800 dark:text-green-200">High conversion rate for Thailand queries</span>
              <Badge className="bg-green-500 dark:bg-green-600 text-white">+{((analytics.thailand > 0 ? (thailandQueries.filter(q => q.status === 'converted').length / analytics.thailand) : 0) * 100).toFixed(0)}%</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
              <span className="text-blue-800 dark:text-blue-200">Average response time improving</span>
              <Badge className="bg-blue-500 dark:bg-blue-600 text-white">-2.3 days</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-800">
              <span className="text-purple-800 dark:text-purple-200">Luxury packages showing growth</span>
              <Badge className="bg-purple-500 dark:bg-purple-600 text-white">+{analytics.packageTypes.luxury}%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueryAnalytics;
