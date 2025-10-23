
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { 
  MapPin, Calendar, Car, Hotel, Landmark, 
  Utensils, DollarSign, Clock 
} from 'lucide-react';

interface ItineraryOverviewSummaryProps {
  days: ItineraryDay[];
  totalCost: number;
  currency?: string;
}

const ItineraryOverviewSummary: React.FC<ItineraryOverviewSummaryProps> = ({
  days,
  totalCost,
  currency = 'USD'
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalsByCategory = () => {
    const totals = {
      transport: 0,
      accommodation: 0,
      activities: 0,
      meals: 0
    };

    days.forEach(day => {
      // Transport costs
      if (day.transport) {
        totals.transport += day.transport.reduce((sum, t) => sum + (t.price || 0), 0);
      }
      
      // Accommodation costs
      if (day.accommodation) {
        totals.accommodation += day.accommodation.price || 0;
      }
      if (day.accommodations) {
        totals.accommodation += day.accommodations.reduce((sum, acc) => sum + (acc.price || 0), 0);
      }
      
      // Activities costs
      totals.activities += day.activities.reduce((sum, act) => sum + (act.cost || 0), 0);
      
      // Meals costs (estimated)
      const mealCount = Object.values(day.meals).filter(Boolean).length;
      totals.meals += mealCount * 25; // Estimated $25 per meal
    });

    return totals;
  };

  const categoryTotals = getTotalsByCategory();
  const citiesVisited = [...new Set(days.map(day => day.city).filter(Boolean))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Itinerary Overview Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="font-bold text-lg">{days.length}</div>
            <div className="text-sm text-muted-foreground">Days</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <MapPin className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="font-bold text-lg">{citiesVisited.length}</div>
            <div className="text-sm text-muted-foreground">Cities</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Landmark className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="font-bold text-lg">
              {days.reduce((sum, day) => sum + day.activities.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Activities</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="font-bold text-lg">{formatCurrency(totalCost)}</div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
          </div>
        </div>

        <Separator />

        {/* Cost Breakdown by Category */}
        <div>
          <h4 className="font-medium mb-3">Cost Breakdown by Category</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" />
                <span>Transportation</span>
              </div>
              <div className="font-medium">{formatCurrency(categoryTotals.transport)}</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Hotel className="h-4 w-4 text-green-600" />
                <span>Accommodation</span>
              </div>
              <div className="font-medium">{formatCurrency(categoryTotals.accommodation)}</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-purple-600" />
                <span>Activities & Sightseeing</span>
              </div>
              <div className="font-medium">{formatCurrency(categoryTotals.activities)}</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-orange-600" />
                <span>Meals</span>
              </div>
              <div className="font-medium">{formatCurrency(categoryTotals.meals)}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Cities & Timeline */}
        <div>
          <h4 className="font-medium mb-3">Cities & Timeline</h4>
          <div className="space-y-2">
            {citiesVisited.map((city, index) => {
              const cityDays = days.filter(day => day.city === city);
              return (
                <div key={city} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {cityDays.length} day{cityDays.length !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Day-by-Day Summary */}
        <div>
          <h4 className="font-medium mb-3">Day-by-Day Summary</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {days.map((day, index) => (
              <div key={day.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Day {day.dayNumber}</Badge>
                    <span className="font-medium">{day.title}</span>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(day.totalCost)}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {day.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Landmark className="h-3 w-3" />
                    {day.activities.length} activities
                  </span>
                  <span className="flex items-center gap-1">
                    <Utensils className="h-3 w-3" />
                    {Object.values(day.meals).filter(Boolean).length} meals
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItineraryOverviewSummary;
