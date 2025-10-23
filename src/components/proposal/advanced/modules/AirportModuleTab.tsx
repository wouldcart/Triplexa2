
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, Clock, Users, Star, CheckCircle, Plus } from 'lucide-react';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

interface AirportModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query: Query;
}

const AirportModuleTab: React.FC<AirportModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  onUpdatePricing,
  query
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);

  const airportServices = [
    {
      id: 'airport-transfer-standard',
      name: 'Standard Airport Transfer',
      type: 'transfer',
      service: 'Private car pickup/dropoff',
      duration: '1 hour each way',
      capacity: 'Up to 4 passengers',
      price: 45,
      description: 'Reliable airport transfer service with professional driver'
    },
    {
      id: 'airport-meet-greet',
      name: 'Meet & Greet Service',
      type: 'assistance',
      service: 'Personal assistance at airport',
      duration: 'Arrival/departure assistance',
      capacity: 'Any group size',
      price: 35,
      description: 'Personal assistant to help with immigration, baggage, and directions'
    },
    {
      id: 'airport-lounge-access',
      name: 'Premium Lounge Access',
      type: 'lounge',
      service: 'VIP lounge access',
      duration: 'Up to 3 hours',
      capacity: 'Individual access',
      price: 65,
      description: 'Access to premium airport lounge with food, drinks, and WiFi'
    },
    {
      id: 'airport-fast-track',
      name: 'Fast Track Service',
      type: 'fast-track',
      service: 'Priority immigration and security',
      duration: 'Departure processing',
      capacity: 'Per person',
      price: 25,
      description: 'Skip the queues with priority immigration and security processing'
    }
  ];

  const handleAddAirportService = (service: any) => {
    const module = {
      id: `airport_${service.id}_${Date.now()}`,
      type: 'airport-services',
      data: {
        ...service,
        name: service.name,
        service: service.service,
        duration: service.duration
      },
      pricing: {
        basePrice: service.price,
        finalPrice: service.price,
        currency: country
      }
    };

    onAddModule(module);
  };

  const handlePriceEdit = (serviceId: string, newPrice: number) => {
    const moduleId = selectedModules.find(m => 
      m.type === 'airport-services' && m.data?.id === serviceId
    )?.id;
    
    if (moduleId) {
      onUpdatePricing(moduleId, {
        basePrice: newPrice,
        finalPrice: newPrice
      });
    }
  };

  const isAirportServiceSelected = (serviceId: string) => {
    return selectedModules.some(module => 
      module.type === 'airport-services' && 
      module.data?.id === serviceId
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Plane className="h-12 w-12 mx-auto mb-4 text-blue-500" />
        <h3 className="text-xl font-semibold mb-2">Airport Services</h3>
        <p className="text-muted-foreground">
          Professional airport assistance and transfer services
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {airportServices.map((service) => {
          const isSelected = isAirportServiceSelected(service.id);
          const selectedModule = selectedModules.find(m => 
            m.type === 'airport-services' && m.data?.id === service.id
          );
          
          return (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-blue-500" />
                  {service.name}
                  <Badge variant="outline" className="ml-auto capitalize">
                    {service.type}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Service:</span>
                    <span>{service.service}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Capacity:</span>
                    <span>{service.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{currencySymbol}</span>
                    {isSelected ? (
                      <Input
                        type="number"
                        value={selectedModule?.pricing?.finalPrice || service.price}
                        onChange={(e) => handlePriceEdit(service.id, Number(e.target.value))}
                        className="w-20 h-8 text-lg font-bold"
                      />
                    ) : (
                      <span className="text-lg font-bold">{service.price}</span>
                    )}
                  </div>
                  {isSelected ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAddAirportService(service)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AirportModuleTab;
