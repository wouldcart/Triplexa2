
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Plane, Car, User, Star, CheckCircle, Plus } from 'lucide-react';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

interface LuxuryModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query: Query;
}

const LuxuryModuleTab: React.FC<LuxuryModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  query
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);

  const luxuryServices = [
    {
      id: 'vip-airport',
      name: 'VIP Airport Service',
      type: 'vip-airport',
      icon: Plane,
      description: 'Premium airport assistance with fast-track immigration and lounge access',
      inclusions: [
        'Meet & greet at airport',
        'Fast-track immigration',
        'VIP lounge access',
        'Baggage assistance',
        'Private check-in'
      ],
      price: 150,
      availability: 'Available at major airports'
    },
    {
      id: 'butler-service',
      name: 'Personal Butler Service',
      type: 'butler',
      icon: User,
      description: '24/7 personal concierge service for ultimate convenience',
      inclusions: [
        '24/7 personal assistant',
        'Restaurant reservations',
        'Activity bookings',
        'Shopping assistance',
        'Local expertise'
      ],
      price: 200,
      availability: 'Daily service'
    },
    {
      id: 'luxury-transport',
      name: 'Luxury Vehicle Fleet',
      type: 'luxury-transport',
      icon: Car,
      description: 'Premium vehicle collection with professional chauffeur',
      inclusions: [
        'Mercedes S-Class or equivalent',
        'Professional chauffeur',
        'WiFi and refreshments',
        'Child seats available',
        'Airport transfers included'
      ],
      price: 300,
      availability: 'Per day'
    },
    {
      id: 'exclusive-access',
      name: 'Exclusive Experiences',
      type: 'exclusive-access',
      icon: Star,
      description: 'Private access to exclusive venues and experiences',
      inclusions: [
        'Private museum tours',
        'After-hours venue access',
        'Celebrity chef experiences',
        'VIP event tickets',
        'Exclusive photography spots'
      ],
      price: 500,
      availability: 'Subject to availability'
    },
    {
      id: 'concierge-service',
      name: 'Luxury Concierge',
      type: 'concierge',
      icon: Crown,
      description: 'Comprehensive concierge service for discerning travelers',
      inclusions: [
        'Pre-trip planning',
        'Dining reservations',
        'Entertainment bookings',
        'Shopping appointments',
        'Emergency assistance'
      ],
      price: 100,
      availability: 'Full trip duration'
    }
  ];

  const handleAddLuxuryService = (service: any) => {
    const module = {
      id: `luxury_${service.id}_${Date.now()}`,
      type: 'luxury',
      data: {
        ...service,
        name: service.name,
        description: service.description,
        inclusions: service.inclusions
      },
      pricing: {
        basePrice: service.price,
        finalPrice: service.price,
        currency: country
      }
    };

    onAddModule(module);
  };

  const isLuxuryServiceSelected = (serviceId: string) => {
    return selectedModules.some(module => 
      module.type === 'luxury' && 
      module.data?.id === serviceId
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-xl font-semibold mb-2">Luxury Services</h3>
        <p className="text-muted-foreground">
          Elevate your travel experience with premium luxury services
        </p>
        <Badge variant="secondary" className="mt-2">
          Exclusive • Premium • Personalized
        </Badge>
      </div>

      <div className="grid gap-6">
        {luxuryServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <Card key={service.id} className="hover:shadow-lg transition-shadow border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-yellow-500" />
                  {service.name}
                  <Badge variant="outline" className="ml-auto text-yellow-600 border-yellow-300">
                    Premium
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Inclusions:</h4>
                  <ul className="text-sm space-y-1">
                    {service.inclusions.map((inclusion, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {inclusion}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {currencySymbol}{service.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {service.availability}
                    </div>
                  </div>
                  {isLuxuryServiceSelected(service.id) ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added to Services
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAddLuxuryService(service)}
                      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
                    >
                      <Plus className="h-4 w-4" />
                      Add Luxury Service
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

export default LuxuryModuleTab;
