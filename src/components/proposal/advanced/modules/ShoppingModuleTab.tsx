
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, MapPin, Clock, CheckCircle, Plus, Edit } from 'lucide-react';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';

interface ShoppingModuleTabProps {
  country: string;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query: Query;
}

const ShoppingModuleTab: React.FC<ShoppingModuleTabProps> = ({
  country,
  selectedModules,
  onAddModule,
  onUpdatePricing,
  query
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country);

  const shoppingExperiences = [
    {
      id: 'shopping-tour-markets',
      name: 'Local Markets Shopping Tour',
      type: 'guided-tour',
      locations: ['Central Market', 'Weekend Market', 'Night Bazaar'],
      specialties: ['Local crafts', 'Textiles', 'Souvenirs', 'Local food'],
      price: 65,
      duration: '4 hours',
      description: 'Guided tour of authentic local markets with shopping assistance'
    },
    {
      id: 'shopping-personal-shopper',
      name: 'Personal Shopping Assistant',
      type: 'personal-shopper',
      locations: ['Shopping Malls', 'Designer Boutiques', 'Local Stores'],
      specialties: ['Fashion', 'Electronics', 'Luxury goods', 'Local brands'],
      price: 120,
      duration: 'Full day',
      description: 'Professional shopping assistant for personalized shopping experience'
    },
    {
      id: 'shopping-luxury-exclusive',
      name: 'Luxury Shopping Experience',
      type: 'exclusive-access',
      locations: ['Premium Malls', 'Designer Stores', 'VIP Lounges'],
      specialties: ['Designer fashion', 'Jewelry', 'Luxury accessories', 'VIP service'],
      price: 200,
      duration: '6 hours',
      description: 'Exclusive access to luxury stores with VIP treatment'
    }
  ];

  const handleAddShopping = (shopping: any) => {
    const module = {
      id: `shopping_${shopping.id}_${Date.now()}`,
      type: 'shopping',
      data: {
        ...shopping,
        name: shopping.name,
        locations: shopping.locations,
        specialties: shopping.specialties
      },
      pricing: {
        basePrice: shopping.price,
        finalPrice: shopping.price,
        currency: country
      }
    };

    onAddModule(module);
  };

  const handlePriceEdit = (shoppingId: string, newPrice: number) => {
    const moduleId = selectedModules.find(m => 
      m.type === 'shopping' && m.data?.id === shoppingId
    )?.id;
    
    if (moduleId) {
      onUpdatePricing(moduleId, {
        basePrice: newPrice,
        finalPrice: newPrice
      });
    }
  };

  const isShoppingSelected = (shoppingId: string) => {
    return selectedModules.some(module => 
      module.type === 'shopping' && 
      module.data?.id === shoppingId
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-pink-500" />
        <h3 className="text-xl font-semibold mb-2">Shopping Experiences</h3>
        <p className="text-muted-foreground">
          Curated shopping tours and exclusive retail experiences
        </p>
      </div>

      <div className="grid gap-4">
        {shoppingExperiences.map((shopping) => {
          const isSelected = isShoppingSelected(shopping.id);
          const selectedModule = selectedModules.find(m => 
            m.type === 'shopping' && m.data?.id === shopping.id
          );
          
          return (
            <Card key={shopping.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-pink-500" />
                  {shopping.name}
                  <Badge variant="outline" className="ml-auto capitalize">
                    {shopping.type.replace('-', ' ')}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{shopping.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" />
                      Locations
                    </div>
                    <div className="space-y-1">
                      {shopping.locations.map((location, index) => (
                        <Badge key={index} variant="secondary" className="text-xs mr-1">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      Duration: {shopping.duration}
                    </div>
                    <div className="space-y-1">
                      {shopping.specialties.slice(0, 2).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs mr-1">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{currencySymbol}</span>
                    {isSelected ? (
                      <Input
                        type="number"
                        value={selectedModule?.pricing?.finalPrice || shopping.price}
                        onChange={(e) => handlePriceEdit(shopping.id, Number(e.target.value))}
                        className="w-20 h-8 text-lg font-bold"
                      />
                    ) : (
                      <span className="text-lg font-bold">{shopping.price}</span>
                    )}
                  </div>
                  {isSelected ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAddShopping(shopping)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Experience
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

export default ShoppingModuleTab;
