
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Wifi, Camera, Navigation, CheckCircle, Plus } from 'lucide-react';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

interface TechnologyModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query: Query;
}

const TechnologyModuleTab: React.FC<TechnologyModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  query
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);
  const tripDays = query.tripDuration?.days || 1;

  const technologyOptions = [
    {
      id: 'pocket-wifi',
      name: 'Pocket WiFi Device',
      type: 'wifi',
      icon: Wifi,
      specification: {
        speed: '4G LTE',
        devices: 'Up to 5 devices',
        battery: '12+ hours',
        coverage: 'Nationwide'
      },
      price: 8,
      rental: true,
      duration: tripDays
    },
    {
      id: 'translation-device',
      name: 'AI Translation Device',
      type: 'translation',
      icon: Smartphone,
      specification: {
        languages: '74 languages',
        accuracy: '95%+',
        offline: 'Yes',
        camera: 'Photo translation'
      },
      price: 12,
      rental: true,
      duration: tripDays
    },
    {
      id: 'action-camera',
      name: 'Action Camera Rental',
      type: 'photography',
      icon: Camera,
      specification: {
        resolution: '4K 60fps',
        waterproof: '10m depth',
        accessories: 'Full kit included',
        memory: '128GB card'
      },
      price: 15,
      rental: true,
      duration: tripDays
    },
    {
      id: 'gps-navigator',
      name: 'GPS Navigation Device',
      type: 'navigation',
      icon: Navigation,
      specification: {
        maps: 'Offline maps included',
        battery: '10+ hours',
        screen: '7-inch touchscreen',
        voice: 'Multi-language'
      },
      price: 6,
      rental: true,
      duration: tripDays
    }
  ];

  const handleAddTechnology = (tech: any) => {
    const totalPrice = tech.price * tech.duration;
    
    const module = {
      id: `technology_${tech.id}_${Date.now()}`,
      type: 'technology',
      data: {
        ...tech,
        name: tech.name,
        specification: tech.specification,
        totalDays: tech.duration
      },
      pricing: {
        basePrice: totalPrice,
        finalPrice: totalPrice,
        currency: country
      }
    };

    onAddModule(module);
  };

  const isTechnologySelected = (techId: string) => {
    return selectedModules.some(module => 
      module.type === 'technology' && 
      module.data?.id === techId
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Smartphone className="h-12 w-12 mx-auto mb-4 text-purple-500" />
        <h3 className="text-xl font-semibold mb-2">Technology Services</h3>
        <p className="text-muted-foreground">
          Enhance your travel experience with cutting-edge technology
        </p>
        <Badge variant="secondary" className="mt-2">
          {tripDays} days rental period
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {technologyOptions.map((tech) => {
          const IconComponent = tech.icon;
          return (
            <Card key={tech.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-purple-500" />
                  {tech.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {Object.entries(tech.specification).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">Per day</div>
                    <div className="text-lg font-bold">{currencySymbol}{tech.price}</div>
                    <div className="text-sm text-muted-foreground">
                      Total: {currencySymbol}{tech.price * tech.duration}
                    </div>
                  </div>
                  {isTechnologySelected(tech.id) ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAddTechnology(tech)}
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

export default TechnologyModuleTab;
