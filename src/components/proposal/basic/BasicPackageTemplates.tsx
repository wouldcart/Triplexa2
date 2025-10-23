
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { Package, Star, DollarSign, Clock } from 'lucide-react';

interface BasicProposalItem {
  id: string;
  type: 'hotel' | 'transport' | 'restaurant' | 'sightseeing' | 'custom';
  name: string;
  description?: string;
  basePrice: number;
  quantity: number;
  markup: number;
  finalPrice: number;
  currency: string;
  data?: any;
}

interface BasicPackageTemplatesProps {
  query: Query;
  onLoadTemplate: (items: BasicProposalItem[]) => void;
  currencySymbol: string;
}

const BasicPackageTemplates: React.FC<BasicPackageTemplatesProps> = ({
  query,
  onLoadTemplate,
  currencySymbol
}) => {
  const paxCount = query.paxDetails.adults + query.paxDetails.children;
  
  const templates = [
    {
      id: 'budget',
      name: 'Budget Package',
      description: 'Essential travel package with basic amenities',
      icon: DollarSign,
      basePrice: 150,
      markup: 10,
      badge: 'Budget',
      badgeColor: 'bg-green-100 text-green-800',
      items: [
        {
          id: 'budget_hotel',
          type: 'hotel' as const,
          name: '3-Star Hotel (Standard Room)',
          description: 'Budget-friendly accommodation',
          basePrice: 60,
          quantity: Math.ceil((new Date(query.travelDates.to).getTime() - new Date(query.travelDates.from).getTime()) / (1000 * 60 * 60 * 24)),
          markup: 10,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'budget_transport',
          type: 'transport' as const,
          name: 'Airport Transfer',
          description: 'Basic airport pickup and drop-off',
          basePrice: 30,
          quantity: 2,
          markup: 10,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'budget_sightseeing',
          type: 'sightseeing' as const,
          name: 'City Tour',
          description: 'Half-day city highlights tour',
          basePrice: 25,
          quantity: paxCount,
          markup: 10,
          finalPrice: 0,
          currency: currencySymbol
        }
      ]
    },
    {
      id: 'standard',
      name: 'Standard Package',
      description: 'Comfortable travel with good amenities',
      icon: Package,
      basePrice: 250,
      markup: 12,
      badge: 'Standard',
      badgeColor: 'bg-blue-100 text-blue-800',
      items: [
        {
          id: 'standard_hotel',
          type: 'hotel' as const,
          name: '4-Star Hotel (Deluxe Room)',
          description: 'Comfortable accommodation with amenities',
          basePrice: 100,
          quantity: Math.ceil((new Date(query.travelDates.to).getTime() - new Date(query.travelDates.from).getTime()) / (1000 * 60 * 60 * 24)),
          markup: 12,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'standard_transport',
          type: 'transport' as const,
          name: 'Private Car Transfer',
          description: 'Comfortable private transportation',
          basePrice: 50,
          quantity: 2,
          markup: 12,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'standard_restaurant',
          type: 'restaurant' as const,
          name: 'Welcome Dinner',
          description: 'Local restaurant dinner experience',
          basePrice: 40,
          quantity: paxCount,
          markup: 12,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'standard_sightseeing',
          type: 'sightseeing' as const,
          name: 'Full Day City Tour',
          description: 'Comprehensive city tour with guide',
          basePrice: 45,
          quantity: paxCount,
          markup: 12,
          finalPrice: 0,
          currency: currencySymbol
        }
      ]
    },
    {
      id: 'premium',
      name: 'Premium Package',
      description: 'Enhanced experience with premium services',
      icon: Star,
      basePrice: 400,
      markup: 15,
      badge: 'Premium',
      badgeColor: 'bg-purple-100 text-purple-800',
      items: [
        {
          id: 'premium_hotel',
          type: 'hotel' as const,
          name: '5-Star Hotel (Suite)',
          description: 'Luxury accommodation with premium amenities',
          basePrice: 180,
          quantity: Math.ceil((new Date(query.travelDates.to).getTime() - new Date(query.travelDates.from).getTime()) / (1000 * 60 * 60 * 24)),
          markup: 15,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'premium_transport',
          type: 'transport' as const,
          name: 'Luxury Car Transfer',
          description: 'Premium vehicle with professional driver',
          basePrice: 80,
          quantity: 2,
          markup: 15,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'premium_restaurant',
          type: 'restaurant' as const,
          name: 'Fine Dining Experience',
          description: 'Upscale restaurant with multi-course meal',
          basePrice: 75,
          quantity: paxCount,
          markup: 15,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'premium_sightseeing',
          type: 'sightseeing' as const,
          name: 'Private Cultural Tour',
          description: 'Exclusive private tour with expert guide',
          basePrice: 85,
          quantity: paxCount,
          markup: 15,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'premium_spa',
          type: 'custom' as const,
          name: 'Spa Treatment',
          description: 'Relaxing spa session',
          basePrice: 60,
          quantity: paxCount,
          markup: 15,
          finalPrice: 0,
          currency: currencySymbol
        }
      ]
    },
    {
      id: 'luxury',
      name: 'Luxury Package',
      description: 'Ultimate luxury experience with exclusive services',
      icon: Star,
      basePrice: 600,
      markup: 20,
      badge: 'Luxury',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      items: [
        {
          id: 'luxury_hotel',
          type: 'hotel' as const,
          name: 'Ultra-Luxury Resort (Presidential Suite)',
          description: 'Top-tier luxury accommodation',
          basePrice: 300,
          quantity: Math.ceil((new Date(query.travelDates.to).getTime() - new Date(query.travelDates.from).getTime()) / (1000 * 60 * 60 * 24)),
          markup: 20,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'luxury_transport',
          type: 'transport' as const,
          name: 'Chauffeur Service',
          description: 'Luxury vehicle with personal chauffeur',
          basePrice: 120,
          quantity: 2,
          markup: 20,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'luxury_restaurant',
          type: 'restaurant' as const,
          name: 'Michelin Star Dining',
          description: 'Exclusive dining at renowned restaurant',
          basePrice: 150,
          quantity: paxCount,
          markup: 20,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'luxury_sightseeing',
          type: 'sightseeing' as const,
          name: 'VIP Cultural Experience',
          description: 'Exclusive access with personal curator',
          basePrice: 120,
          quantity: paxCount,
          markup: 20,
          finalPrice: 0,
          currency: currencySymbol
        },
        {
          id: 'luxury_concierge',
          type: 'custom' as const,
          name: '24/7 Concierge Service',
          description: 'Personal concierge throughout stay',
          basePrice: 100,
          quantity: 1,
          markup: 20,
          finalPrice: 0,
          currency: currencySymbol
        }
      ]
    }
  ];

  const handleLoadTemplate = (template: typeof templates[0]) => {
    const itemsWithFinalPrice = template.items.map(item => ({
      ...item,
      finalPrice: item.basePrice * item.quantity * (1 + item.markup / 100)
    }));
    
    onLoadTemplate(itemsWithFinalPrice);
  };

  const calculateTemplateTotal = (template: typeof templates[0]) => {
    return template.items.reduce((total, item) => {
      return total + (item.basePrice * item.quantity * (1 + template.markup / 100));
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Choose a Package Template</h3>
        <p className="text-muted-foreground">
          Quick start with pre-configured packages tailored for {query.destination.country}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => {
          const Icon = template.icon;
          const total = calculateTemplateTotal(template);
          
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={template.badgeColor}>
                    {template.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Includes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {template.items.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-current rounded-full" />
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <div className="text-lg font-bold">
                      {currencySymbol}{total.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currencySymbol}{(total / paxCount).toFixed(2)} per person
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleLoadTemplate(template)}
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Use Template
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {template.items.length} items • {template.markup}% markup
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="text-center space-y-2">
            <h4 className="font-medium">Custom Package</h4>
            <p className="text-sm text-muted-foreground">
              Want to create a custom package? Use the "Add Items" tab to manually select inventory and build your own package.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicPackageTemplates;
