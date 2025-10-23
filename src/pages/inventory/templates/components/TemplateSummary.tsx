
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Calendar, Users, DollarSign, Clock, 
  Hotel, Car, Camera, UtensilsCrossed, TrendingUp,
  PieChart, BarChart3, Activity
} from 'lucide-react';
import { EnhancedProposalTemplate } from '@/services/proposalTemplateService';
import { ProposalDay } from '@/components/proposal/DayPlanningInterface';

interface TemplateSummaryProps {
  template: Partial<EnhancedProposalTemplate>;
  dayPlan: ProposalDay[];
}

const TemplateSummary: React.FC<TemplateSummaryProps> = ({ template, dayPlan }) => {
  const calculateTotalCost = () => {
    return dayPlan.reduce((sum, day) => sum + day.totalCost, 0);
  };

  const calculateActivityBreakdown = () => {
    const breakdown = {
      hotels: 0,
      transport: 0,
      sightseeing: 0,
      restaurants: 0,
      total: 0
    };

    dayPlan.forEach(day => {
      day.activities.forEach(activity => {
        breakdown.total += activity.price;
        // Categorize based on activity name/type
        const name = activity.name.toLowerCase();
        if (name.includes('hotel') || name.includes('accommodation')) {
          breakdown.hotels += activity.price;
        } else if (name.includes('transport') || name.includes('transfer') || name.includes('taxi')) {
          breakdown.transport += activity.price;
        } else if (name.includes('restaurant') || name.includes('meal') || name.includes('dining')) {
          breakdown.restaurants += activity.price;
        } else {
          breakdown.sightseeing += activity.price;
        }
      });
    });

    return breakdown;
  };

  const getMealStats = () => {
    const stats = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
    dayPlan.forEach(day => {
      if (day.meals.breakfast) stats.breakfast++;
      if (day.meals.lunch) stats.lunch++;
      if (day.meals.dinner) stats.dinner++;
      stats.total++;
    });
    return stats;
  };

  const getCityDistribution = () => {
    const distribution: { [key: string]: number } = {};
    dayPlan.forEach(day => {
      distribution[day.city] = (distribution[day.city] || 0) + 1;
    });
    return distribution;
  };

  const getEstimatedPaxPricing = () => {
    const baseTotal = calculateTotalCost();
    return [
      { pax: 1, total: baseTotal, perPerson: baseTotal },
      { pax: 2, total: baseTotal * 1.5, perPerson: (baseTotal * 1.5) / 2 },
      { pax: 4, total: baseTotal * 2.2, perPerson: (baseTotal * 2.2) / 4 },
      { pax: 6, total: baseTotal * 2.8, perPerson: (baseTotal * 2.8) / 6 }
    ];
  };

  const totalCost = calculateTotalCost();
  const activityBreakdown = calculateActivityBreakdown();
  const mealStats = getMealStats();
  const cityDistribution = getCityDistribution();
  const paxPricing = getEstimatedPaxPricing();

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Budget': return 'bg-green-100 text-green-800 border-green-200';
      case 'Standard': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Luxury': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Template Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{dayPlan.length}</div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">${totalCost.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Base Cost</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{Object.keys(cityDistribution).length}</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {dayPlan.reduce((sum, day) => sum + day.activities.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Activities</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Details */}
            <div>
              <h4 className="font-semibold mb-3">Template Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{template.name || 'Untitled Template'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category || 'Standard'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span className="font-medium">{template.destination?.country || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {template.duration?.days || dayPlan.length}D/{template.duration?.nights || Math.max(0, dayPlan.length - 1)}N
                  </span>
                </div>
              </div>
            </div>

            {/* City Distribution */}
            <div>
              <h4 className="font-semibold mb-3">City Distribution</h4>
              <div className="space-y-2">
                {Object.entries(cityDistribution).map(([city, days]) => (
                  <div key={city} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{city}:</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-blue-200 rounded-full w-16 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(days / dayPlan.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{days} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-green-600" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Categories */}
            <div>
              <h4 className="font-semibold mb-3">By Service Category</h4>
              <div className="space-y-3">
                {[
                  { name: 'Hotels', amount: activityBreakdown.hotels, icon: Hotel, color: 'blue' },
                  { name: 'Transport', amount: activityBreakdown.transport, icon: Car, color: 'green' },
                  { name: 'Sightseeing', amount: activityBreakdown.sightseeing, icon: Camera, color: 'purple' },
                  { name: 'Restaurants', amount: activityBreakdown.restaurants, icon: UtensilsCrossed, color: 'orange' }
                ].map(({ name, amount, icon: Icon, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 text-${color}-600`} />
                      <span>{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">${amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalCost > 0 ? ((amount / totalCost) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      <div className={`h-8 bg-${color}-200 rounded w-16 overflow-hidden`}>
                        <div 
                          className={`h-full bg-${color}-600 rounded`}
                          style={{ width: totalCost > 0 ? `${(amount / totalCost) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAX-based Pricing */}
            <div>
              <h4 className="font-semibold mb-3">Estimated Pricing by Group Size</h4>
              <div className="space-y-3">
                {paxPricing.map(({ pax, total, perPerson }) => (
                  <div key={pax} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span>{pax} {pax === 1 ? 'Person' : 'People'}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${total.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        ${perPerson.toLocaleString()}/person
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-orange-600" />
            Meal Plan Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Breakfast', count: mealStats.breakfast, total: mealStats.total },
              { name: 'Lunch', count: mealStats.lunch, total: mealStats.total },
              { name: 'Dinner', count: mealStats.dinner, total: mealStats.total }
            ].map(({ name, count, total }) => (
              <div key={name} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{count}</div>
                <div className="text-sm text-muted-foreground">{name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {total > 0 ? ((count / total) * 100).toFixed(0) : 0}% coverage
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day-by-Day Overview */}
      {dayPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Day-by-Day Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dayPlan.map((day) => (
                <div key={day.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Day {day.dayNumber}</Badge>
                        <h5 className="font-medium">{day.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {day.city}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{day.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{day.activities.length} activities</span>
                        <span>
                          Meals: {[day.meals.breakfast && 'B', day.meals.lunch && 'L', day.meals.dinner && 'D']
                            .filter(Boolean).join(', ') || 'None'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${day.totalCost.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Daily cost</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplateSummary;
