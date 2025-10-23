
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Calendar, Clock, Users, CheckCircle, Plus } from 'lucide-react';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

interface EntertainmentModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query: Query;
}

const EntertainmentModuleTab: React.FC<EntertainmentModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  onUpdatePricing,
  query
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);

  const entertainmentOptions = [
    {
      id: 'cultural-show',
      name: 'Traditional Cultural Show',
      type: 'cultural',
      venue: 'Cultural Center',
      duration: '2 hours',
      capacity: 'Up to 200 guests',
      price: 45,
      description: 'Authentic cultural performance with traditional music and dance'
    },
    {
      id: 'nightlife-tour',
      name: 'Nightlife & Entertainment Tour',
      type: 'nightlife',
      venue: 'Multiple venues',
      duration: '4 hours',
      capacity: 'Small groups',
      price: 85,
      description: 'Guided tour of the best nightlife spots and entertainment venues'
    }
  ];

  const handleAddEntertainment = (entertainment: any) => {
    const module = {
      id: `entertainment_${entertainment.id}_${Date.now()}`,
      type: 'entertainment',
      data: {
        ...entertainment,
        name: entertainment.name,
        venue: entertainment.venue,
        duration: entertainment.duration
      },
      pricing: {
        basePrice: entertainment.price,
        finalPrice: entertainment.price,
        currency: country
      }
    };

    onAddModule(module);
  };

  const handlePriceEdit = (entertainmentId: string, newPrice: number) => {
    const moduleId = selectedModules.find(m => 
      m.type === 'entertainment' && m.data?.id === entertainmentId
    )?.id;
    
    if (moduleId) {
      onUpdatePricing(moduleId, {
        basePrice: newPrice,
        finalPrice: newPrice
      });
    }
  };

  const isEntertainmentSelected = (entertainmentId: string) => {
    return selectedModules.some(module => 
      module.type === 'entertainment' && 
      module.data?.id === entertainmentId
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Music className="h-12 w-12 mx-auto mb-4 text-purple-500" />
        <h3 className="text-xl font-semibold mb-2">Entertainment & Shows</h3>
        <p className="text-muted-foreground">
          Cultural performances, nightlife, and entertainment experiences
        </p>
      </div>

      <div className="grid gap-4">
        {entertainmentOptions.map((entertainment) => {
          const isSelected = isEntertainmentSelected(entertainment.id);
          const selectedModule = selectedModules.find(m => 
            m.type === 'entertainment' && m.data?.id === entertainment.id
          );
          
          return (
            <Card key={entertainment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-purple-500" />
                  {entertainment.name}
                  <Badge variant="outline" className="ml-auto capitalize">
                    {entertainment.type}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{entertainment.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Venue:</span>
                    <span>{entertainment.venue}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{entertainment.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Capacity:</span>
                    <span>{entertainment.capacity}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{currencySymbol}</span>
                    {isSelected ? (
                      <Input
                        type="number"
                        value={selectedModule?.pricing?.finalPrice || entertainment.price}
                        onChange={(e) => handlePriceEdit(entertainment.id, Number(e.target.value))}
                        className="w-20 h-8 text-lg font-bold"
                      />
                    ) : (
                      <span className="text-lg font-bold">{entertainment.price}</span>
                    )}
                    <span className="text-sm text-muted-foreground">per person</span>
                  </div>
                  {isSelected ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAddEntertainment(entertainment)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Show
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

export default EntertainmentModuleTab;
