
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Users, DollarSign, Car, Hotel, Camera, Utensils } from 'lucide-react';
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';

interface ProposalDay {
  id: string;
  dayNumber: number;
  date: string;
  city: string;
  title: string;
  description: string;
  activities: {
    id: string;
    name: string;
    price: number;
    duration: string;
  }[];
  accommodation?: {
    id: string;
    name: string;
    type: string;
    price: number;
    hotel?: string;
    roomType?: string;
  };
  transport?: {
    id: string;
    name: string;
    from: string;
    to: string;
    price: number;
    type?: string;
  };
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  totalCost: number;
}

interface ProposalSummaryViewProps {
  query: Query;
  days: ProposalDay[];
  totalCost: number;
}

export const ProposalSummaryView: React.FC<ProposalSummaryViewProps> = ({
  query,
  days,
  totalCost
}) => {
  const getMealsText = (meals: any) => {
    const includedMeals = [];
    if (meals.breakfast) includedMeals.push('Breakfast');
    if (meals.lunch) includedMeals.push('Lunch');
    if (meals.dinner) includedMeals.push('Dinner');
    return includedMeals.length > 0 ? includedMeals.join(', ') : 'No meals included';
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="card-gradient shadow-elegant border-border/40 transition-smooth">
        <CardHeader>
          <CardTitle className="text-responsive-lg text-foreground">Proposal Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-responsive font-medium text-foreground">Destination</p>
                <p className="text-responsive text-muted-foreground">{query.destination.country}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{query.destination.cities.join(', ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-responsive font-medium text-foreground">Duration</p>
                <p className="text-responsive text-muted-foreground">{days.length} Days</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-responsive font-medium text-foreground">Travelers</p>
                <p className="text-responsive text-muted-foreground">
                  {query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants} PAX
                </p>
                <p className="text-xs text-muted-foreground">
                  {query.paxDetails.adults} Adults, {query.paxDetails.children} Children
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-responsive font-medium text-foreground">Total Cost</p>
                <p className="text-responsive-lg font-bold text-primary">
                  {formatCurrency(totalCost, query.destination.country)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalCost / (query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants), query.destination.country)} per person
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day by Day Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Day-by-Day Itinerary</h3>
        
        {days.map((day) => (
          <Card key={day.id} className="glass-effect shadow-soft transition-smooth hover:shadow-medium">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-responsive px-3 py-1 shrink-0">
                    Day {day.dayNumber}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-responsive-lg line-clamp-1">{day.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-responsive text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{day.city}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-nowrap">{day.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-responsive-lg font-semibold text-primary">
                    {formatCurrency(day.totalCost, query.destination.country)}
                  </div>
                  <div className="text-responsive text-muted-foreground">Day Total</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {day.description && (
                <p className="text-responsive text-muted-foreground leading-relaxed">{day.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Transport */}
                {day.transport && (
                  <div className="space-y-2">
                    <h4 className="text-responsive font-medium flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary shrink-0" />
                      Transport
                    </h4>
                    <div className="p-3 glass-effect rounded-lg">
                      <p className="font-medium text-responsive">{day.transport.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof day.transport.from === 'string' ? day.transport.from : (day.transport.from as any)?.city || (day.transport.from as any)?.name || 'Origin'} → {typeof day.transport.to === 'string' ? day.transport.to : (day.transport.to as any)?.city || (day.transport.to as any)?.name || 'Destination'}
                      </p>
                      <p className="text-responsive font-medium text-primary">
                        {formatCurrency(day.transport.price, query.destination.country)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="space-y-2">
                    <h4 className="text-responsive font-medium flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-primary shrink-0" />
                      Accommodation
                    </h4>
                    <div className="p-3 glass-effect rounded-lg">
                      <p className="font-medium text-responsive line-clamp-1">{day.accommodation.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.accommodation.roomType || day.accommodation.type}
                      </p>
                      <p className="text-responsive font-medium text-primary">
                        {formatCurrency(day.accommodation.price, query.destination.country)}/night
                      </p>
                    </div>
                  </div>
                )}

                {/* Meals */}
                <div className="space-y-2">
                  <h4 className="text-responsive font-medium flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-primary shrink-0" />
                    Meals
                  </h4>
                  <div className="p-3 glass-effect rounded-lg">
                    <p className="text-responsive">{getMealsText(day.meals)}</p>
                  </div>
                </div>
              </div>

              {/* Activities */}
              {day.activities.length > 0 && (
                <div className="col-span-full">
                  <h4 className="text-responsive font-medium flex items-center gap-2 mb-3">
                    <Camera className="h-4 w-4 text-primary shrink-0" />
                    Activities & Sightseeing
                  </h4>
                  <div className="space-y-3">
                    {day.activities.map((activity, index) => (
                      <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 glass-effect rounded-lg transition-smooth hover:shadow-soft">
                        <div className="flex-1">
                          <p className="font-medium text-responsive line-clamp-1">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">{activity.duration}</p>
                        </div>
                        <div className="text-responsive font-medium text-primary text-right sm:text-left">
                          {formatCurrency(activity.price, query.destination.country)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost Breakdown */}
      <Card className="glass-effect shadow-soft">
        <CardHeader>
          <CardTitle className="text-responsive-lg">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/30">
                <div className="flex-1">
                  <p className="font-medium text-responsive line-clamp-1">Day {day.dayNumber} - {day.title}</p>
                  <p className="text-responsive text-muted-foreground">{day.city}</p>
                </div>
                <div className="text-right sm:text-left">
                  <p className="font-medium text-responsive">{formatCurrency(day.totalCost, query.destination.country)}</p>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 text-responsive-lg font-bold">
              <span>Total Cost</span>
              <span className="text-primary">{formatCurrency(totalCost, query.destination.country)}</span>
            </div>
            
            <div className="text-responsive text-muted-foreground text-center">
              {formatCurrency(totalCost / (query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants), query.destination.country)} per person
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
