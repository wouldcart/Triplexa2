import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Car, Camera, Utensils, Building2, 
  Activity, Navigation, Users, Clock
} from 'lucide-react';

interface ServiceBreakdownSectionProps {
  proposalData?: any;
  formatCurrency: (amount: number) => string;
}

interface ServiceCategory {
  category: string;
  icon: React.ReactNode;
  items: Array<{
    name: string;
    cost: number;
    description?: string;
    duration?: string;
    location?: string;
  }>;
  total: number;
}

export const ServiceBreakdownSection: React.FC<ServiceBreakdownSectionProps> = ({
  proposalData,
  formatCurrency
}) => {
  // Extract and categorize services from proposal data
  const extractServicesFromProposal = (): ServiceCategory[] => {
    if (!proposalData?.days || !Array.isArray(proposalData.days)) {
      return [];
    }

    const categories: ServiceCategory[] = [
      {
        category: 'Sightseeing & Activities',
        icon: <Camera className="h-4 w-4" />,
        items: [],
        total: 0
      },
      {
        category: 'Transport Services',
        icon: <Car className="h-4 w-4" />,
        items: [],
        total: 0
      },
      {
        category: 'Dining & Meals',
        icon: <Utensils className="h-4 w-4" />,
        items: [],
        total: 0
      },
      {
        category: 'Local Experiences',
        icon: <Activity className="h-4 w-4" />,
        items: [],
        total: 0
      }
    ];

    proposalData.days.forEach((day: any, dayIndex: number) => {
      // Extract sightseeing activities
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach((activity: any) => {
          if (activity.type === 'sightseeing' || activity.type === 'activity') {
            categories[0].items.push({
              name: activity.title || activity.name || 'Sightseeing Activity',
              cost: activity.cost || activity.price || 0,
              description: activity.description,
              duration: activity.time || activity.duration,
              location: day.city || day.location
            });
            categories[0].total += activity.cost || activity.price || 0;
          }
        });
      }

      // Extract transport
      if (day.transport && Array.isArray(day.transport)) {
        day.transport.forEach((transport: any) => {
          categories[1].items.push({
            name: `${transport.from || transport.startLocation || 'Origin'} to ${transport.to || transport.endLocation || 'Destination'}`,
            cost: transport.price || transport.cost || 0,
            description: transport.transportType || transport.type,
            duration: transport.duration || 'N/A',
            location: `Day ${dayIndex + 1}`
          });
          categories[1].total += transport.price || transport.cost || 0;
        });
      }

      // Extract meals
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal: any) => {
          categories[2].items.push({
            name: meal.name || `${meal.type || 'Meal'} at ${meal.restaurant || 'Restaurant'}`,
            cost: meal.price || meal.cost || 0,
            description: meal.cuisine || meal.type,
            location: day.city || day.location
          });
          categories[2].total += meal.price || meal.cost || 0;
        });
      }

      // Extract other experiences
      if (day.activities) {
        day.activities.forEach((activity: any) => {
          if (activity.type === 'experience' || activity.type === 'cultural' || activity.type === 'adventure') {
            categories[3].items.push({
              name: activity.title || activity.name || 'Local Experience',
              cost: activity.cost || activity.price || 0,
              description: activity.description,
              duration: activity.time || activity.duration,
              location: day.city || day.location
            });
            categories[3].total += activity.cost || activity.price || 0;
          }
        });
      }
    });

    return categories.filter(category => category.items.length > 0);
  };

  const serviceCategories = extractServicesFromProposal();
  const totalLandPackage = serviceCategories.reduce((sum, category) => sum + category.total, 0);

  if (serviceCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Land Package Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No land package services found in the itinerary.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Land Package Breakdown
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            {formatCurrency(totalLandPackage)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {serviceCategories.map((category, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {category.icon}
                <h4 className="font-medium text-sm">{category.category}</h4>
                <Badge variant="secondary" className="text-xs">
                  {category.items.length} items
                </Badge>
              </div>
              <span className="font-semibold text-sm">
                {formatCurrency(category.total)}
              </span>
            </div>

            <div className="space-y-2 ml-6">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between items-start p-2 bg-gray-50 rounded text-xs">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-gray-600 mt-1">{item.description}</div>
                    )}
                    <div className="flex gap-4 mt-1 text-gray-500">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                      {item.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-medium text-green-600 ml-2">
                    {formatCurrency(item.cost)}
                  </span>
                </div>
              ))}
            </div>
            
            {index < serviceCategories.length - 1 && <Separator />}
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-800">Total Land Package</span>
            <span className="text-lg font-bold text-blue-900">
              {formatCurrency(totalLandPackage)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};