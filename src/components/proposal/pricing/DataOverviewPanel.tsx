import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Hotel, MapPin, Activity, Car, UtensilsCrossed, 
  Users, Calendar, DollarSign, TrendingUp,
  CheckCircle, Clock, Building
} from 'lucide-react';
import { EnhancedMarkupData, AccommodationPricingOption } from '@/types/enhancedMarkup';

interface DataOverviewPanelProps {
  itineraryData: any[];
  markupData: EnhancedMarkupData;
  onOptionSelect: (option: 'standard' | 'optional' | 'alternative') => void;
  formatCurrency: (amount: number) => string;
}

export const DataOverviewPanel: React.FC<DataOverviewPanelProps> = ({
  itineraryData,
  markupData,
  onOptionSelect,
  formatCurrency
}) => {
  const calculateTotalCost = () => {
    return itineraryData.reduce((total, day) => total + (day.totalCost || 0), 0);
  };

  const getItinerarySummary = () => {
    const cities = [...new Set(itineraryData.map(day => day.city || day.title).filter(Boolean))];
    const totalActivities = itineraryData.reduce((total, day) => 
      total + (day.activities?.length || 0), 0
    );
    const totalMeals = itineraryData.reduce((total, day) => {
      const dayMeals = day.meals || {};
      return total + (
        (dayMeals.breakfast ? 1 : 0) + 
        (dayMeals.lunch ? 1 : 0) + 
        (dayMeals.dinner ? 1 : 0)
      );
    }, 0);
    
    return { cities, totalActivities, totalMeals };
  };

  const getOptionDisplayConfig = (type: 'standard' | 'optional' | 'alternative') => {
    const configs = {
      standard: {
        title: 'Standard Package',
        icon: Hotel,
        colorClass: 'border-primary/60 bg-primary/5',
        badgeClass: 'bg-primary/10 text-primary',
        description: 'Base accommodation package'
      },
      optional: {
        title: 'Optional Package',
        icon: Building,
        colorClass: 'border-amber-600/60 bg-amber-50/50',
        badgeClass: 'bg-amber-100 text-amber-700',
        description: 'Enhanced accommodation options'
      },
      alternative: {
        title: 'Alternative Package',
        icon: Hotel,
        colorClass: 'border-violet-600/60 bg-violet-50/50',
        badgeClass: 'bg-violet-100 text-violet-700',
        description: 'Alternative accommodation choices'
      }
    };
    
    return configs[type];
  };

  const summary = getItinerarySummary();
  const totalCost = calculateTotalCost();

  return (
    <div className="space-y-6">
      {/* Itinerary Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Itinerary Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Duration */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">{itineraryData.length} Days</p>
              </div>
            </div>

            {/* Destinations */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <MapPin className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cities</p>
                <p className="text-lg font-semibold">{summary.cities.length}</p>
              </div>
            </div>

            {/* Activities */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Activities</p>
                <p className="text-lg font-semibold">{summary.totalActivities}</p>
              </div>
            </div>

            {/* Meals */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Meals</p>
                <p className="text-lg font-semibold">{summary.totalMeals}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
            {/* Travelers */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Travelers</p>
                <p className="text-lg font-semibold">
                  {markupData.adults}A{markupData.children > 0 ? ` + ${markupData.children}C` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Cities List */}
          {summary.cities.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Destinations:</p>
              <div className="flex flex-wrap gap-2">
                {summary.cities.map((city, index) => (
                  <Badge key={index} variant="outline">{city}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Base Cost Summary */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total Base Cost:</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {itineraryData.map((day, index) => (
              <div key={day.id || index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{day.day || index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{day.title || day.city || `Day ${day.day || index + 1}`}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {day.activities?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {day.activities.length} activities
                        </span>
                      )}
                      {(day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner) && (
                        <span className="flex items-center gap-1">
                          <UtensilsCrossed className="h-3 w-3" />
                          {(day.meals.breakfast ? 1 : 0) + (day.meals.lunch ? 1 : 0) + (day.meals.dinner ? 1 : 0)} meals
                        </span>
                      )}
                      {day.transport && (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          Transport
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(day.totalCost || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accommodation Options */}
      {markupData.options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Accommodation Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {markupData.options.map((option) => {
                const config = getOptionDisplayConfig(option.type);
                const IconComponent = config.icon;
                const isSelected = markupData.selectedOption === option.type;

                return (
                  <div
                    key={option.type}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => onOptionSelect(option.type)}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{config.title}</h3>
                        </div>
                        <Badge className={config.badgeClass}>
                          {option.accommodations.length} hotels
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground">{config.description}</p>

                      {/* Pricing Summary */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base Cost:</span>
                          <span>{formatCurrency(option.baseTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Markup:</span>
                          <span className="text-green-600">+{formatCurrency(option.markup)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(option.finalTotal)}</span>
                        </div>
                      </div>

                      {/* Select Button */}
                      <Button 
                        variant={isSelected ? "default" : "outline"} 
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOptionSelect(option.type);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          'Select Package'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown by Category */}
      {markupData.options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cost Breakdown by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {markupData.options.map((option) => (
              option.type === markupData.selectedOption && (
                <div key={option.type} className="space-y-4">
                  {/* Accommodations */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Accommodations</span>
                      <Badge variant="outline">{option.accommodations.length} hotels</Badge>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(option.accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0))}
                    </span>
                  </div>

                  {/* Sightseeing */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Sightseeing</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(option.serviceCosts.sightseeing.total)}</span>
                  </div>

                  {/* Transport */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Transport</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(option.serviceCosts.transport.totalCost)}</span>
                  </div>

                  {/* Dining */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Dining</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(option.serviceCosts.dining.total)}</span>
                  </div>

                  <Separator />

                  {/* Total and Markup */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(option.baseTotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="font-medium">Markup:</span>
                      <span className="font-semibold">+{formatCurrency(option.markup)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Final Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(option.finalTotal)}</span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};