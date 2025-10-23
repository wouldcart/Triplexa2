
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Query } from '@/types/query';
import { 
  Car, Hotel, Landmark, Utensils, MapPin, Users, Calendar, ArrowRight 
} from 'lucide-react';

interface ServicesOverviewProps {
  query: Query;
  selectedModules: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  transportCount: number;
  hotelCount: number;
  sightseeingCount: number;
}

const ServicesOverview: React.FC<ServicesOverviewProps> = ({
  query,
  selectedModules,
  activeTab,
  onTabChange,
  transportCount,
  hotelCount,
  sightseeingCount
}) => {
  const services = [
    {
      id: 'transport',
      title: 'Transport Services',
      icon: Car,
      description: 'Airport transfers, inter-city routes, and local transport',
      available: transportCount,
      selected: selectedModules.filter(m => m.type === 'transport').length,
      color: 'bg-blue-100 text-blue-800',
      recommended: true
    },
    {
      id: 'hotel',
      title: 'Hotel Accommodation',
      icon: Hotel,
      description: 'Luxury hotels and budget accommodations',
      available: hotelCount,
      selected: selectedModules.filter(m => m.type === 'hotel').length,
      color: 'bg-green-100 text-green-800',
      recommended: false
    },
    {
      id: 'sightseeing',
      title: 'Sightseeing Tours',
      icon: Landmark,
      description: 'Cultural tours, attractions, and experiences',
      available: sightseeingCount,
      selected: selectedModules.filter(m => m.type === 'sightseeing').length,
      color: 'bg-purple-100 text-purple-800',
      recommended: true
    },
    {
      id: 'restaurant',
      title: 'Dining Options',
      icon: Utensils,
      description: 'Local cuisine and fine dining experiences',
      available: 0,
      selected: selectedModules.filter(m => m.type === 'restaurant').length,
      color: 'bg-orange-100 text-orange-800',
      recommended: false
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Services for {query.destination.country}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {query.paxDetails.adults + query.paxDetails.children} PAX
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {query.tripDuration.days} Days
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {query.destination.cities.join(', ')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            const isActive = activeTab === service.id;
            
            return (
              <Card 
                key={service.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onTabChange(service.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${service.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {service.recommended && (
                      <Badge variant="outline" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-sm mb-1">{service.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      <span className="font-medium">{service.selected}</span>
                      <span className="text-muted-foreground"> / {service.available} available</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServicesOverview;
