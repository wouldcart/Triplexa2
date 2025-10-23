
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wand2, Clock, DollarSign, MapPin, Users, RefreshCw } from "lucide-react";
import { SmartSuggestion, useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';

interface AutoCompleteDayBuilderProps {
  query: Query;
  dayNumber: number;
  onAutoComplete: (activities: SmartSuggestion[]) => void;
  currentActivities: SmartSuggestion[];
}

export const AutoCompleteDayBuilder: React.FC<AutoCompleteDayBuilderProps> = ({
  query,
  dayNumber,
  onAutoComplete,
  currentActivities
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<SmartSuggestion[] | null>(null);
  const { activitySuggestions, travelerProfile } = useSmartSuggestions(query, dayNumber);

  const generateOptimalDay = async () => {
    setIsGenerating(true);
    
    // Simulate AI planning process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Smart selection algorithm
    const selectedActivities: SmartSuggestion[] = [];
    const availableTime = 8 * 60; // 8 hours in minutes
    let usedTime = 0;
    let usedBudget = 0;
    const maxBudget = travelerProfile.budgetPerPax * travelerProfile.paxCount;

    // Priority scoring for activities
    const scoredActivities = activitySuggestions.map(activity => ({
      ...activity,
      totalScore: (
        activity.popularity * 0.3 +
        activity.seasonalScore * 0.2 +
        activity.budgetFit * 0.2 +
        activity.travelerTypeScore * 0.3
      )
    })).sort((a, b) => b.totalScore - a.totalScore);

    // Select activities optimally
    for (const activity of scoredActivities) {
      const activityMinutes = parseDuration(activity.duration);
      
      if (usedTime + activityMinutes <= availableTime && 
          usedBudget + activity.price <= maxBudget &&
          selectedActivities.length < 4) {
        
        selectedActivities.push(activity);
        usedTime += activityMinutes;
        usedBudget += activity.price;
      }
    }

    // Ensure we have a good mix of time slots
    const timeSlotBalance = balanceTimeSlots(selectedActivities);
    
    setGeneratedPlan(timeSlotBalance);
    setIsGenerating(false);
  };

  const balanceTimeSlots = (activities: SmartSuggestion[]): SmartSuggestion[] => {
    const morning = activities.filter(a => a.category === 'morning').slice(0, 1);
    const afternoon = activities.filter(a => a.category === 'afternoon').slice(0, 2);
    const evening = activities.filter(a => a.category === 'evening').slice(0, 1);
    const fullDay = activities.filter(a => a.category === 'full-day').slice(0, 1);

    if (fullDay.length > 0) {
      return fullDay;
    }

    return [...morning, ...afternoon, ...evening];
  };

  const parseDuration = (duration: string): number => {
    const hours = duration.match(/(\d+)\s*(?:hours?|hrs?)/i);
    if (hours) return parseInt(hours[1]) * 60;
    
    const minutes = duration.match(/(\d+)\s*(?:minutes?|mins?)/i);
    if (minutes) return parseInt(minutes[1]);
    
    return 120; // Default 2 hours
  };

  const totalCost = generatedPlan?.reduce((sum, activity) => sum + activity.price, 0) || 0;
  const totalDuration = generatedPlan?.reduce((sum, activity) => sum + parseDuration(activity.duration), 0) || 0;

  if (!generatedPlan && !isGenerating) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Wand2 className="h-5 w-5" />
            AI Day Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-purple-700">
            Let our AI create the perfect day itinerary based on your preferences, 
            budget, and travel style.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-purple-600">
              <Users className="h-4 w-4" />
              <span>{travelerProfile.type} • {travelerProfile.paxCount} PAX</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <DollarSign className="h-4 w-4" />
              <span>Budget: {formatCurrency(travelerProfile.budgetPerPax * travelerProfile.paxCount, query.destination.country)}</span>
            </div>
          </div>

          <Button 
            onClick={generateOptimalDay}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Perfect Day
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-6 w-6 text-purple-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-medium text-purple-800">Creating Your Perfect Day</h3>
              <p className="text-sm text-purple-600 mt-1">
                Analyzing {activitySuggestions.length} activities for optimal planning...
              </p>
            </div>
            <Progress value={65} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Wand2 className="h-5 w-5" />
            Your Perfect Day Plan
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={generateOptimalDay}
            className="text-green-700"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-green-700">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(totalCost, query.destination.country)}</span>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <MapPin className="h-4 w-4" />
            <span>{generatedPlan?.length} activities</span>
          </div>
        </div>

        <div className="space-y-3">
          {generatedPlan?.map((activity, index) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                {index + 1}
              </Badge>
              <div className="flex-1">
                <h5 className="font-medium text-sm">{activity.name}</h5>
                <p className="text-xs text-muted-foreground">{activity.timeSlot}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">
                  {formatCurrency(activity.price, query.destination.country)}
                </p>
                <p className="text-xs text-muted-foreground">{activity.duration}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => onAutoComplete(generatedPlan || [])}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Apply This Plan
          </Button>
          <Button 
            variant="outline" 
            onClick={generateOptimalDay}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            Try Different Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
