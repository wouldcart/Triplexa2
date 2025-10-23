
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { Landmark, Clock, Users, Star, Plus, Edit, MapPin } from 'lucide-react';

interface SightseeingActivity {
  id: string;
  name: string;
  city: string;
  type: 'cultural' | 'adventure' | 'nature' | 'religious' | 'entertainment';
  duration: string;
  description: string;
  inclusions: string[];
  adultPrice: number;
  childPrice: number;
  currency: string;
  rating: number;
  images: string[];
  transferIncluded: boolean;
  transferPrice?: number;
  minimumPax: number;
  maximumPax: number;
}

interface SightseeingModuleProps {
  query: Query;
  onAddModule: (module: any) => void;
  selectedModules: any[];
  onUpdatePricing: (moduleId: string, pricing: any) => void;
}

const SightseeingModule: React.FC<SightseeingModuleProps> = ({ 
  query, 
  onAddModule, 
  selectedModules, 
  onUpdatePricing 
}) => {
  const [activities, setActivities] = useState<SightseeingActivity[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [editingPrices, setEditingPrices] = useState<{ [key: string]: { adult: number; child: number } }>({});
  const [includeTransfer, setIncludeTransfer] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (query.destination.cities.length > 0) {
      setSelectedCity(query.destination.cities[0]);
    }
  }, [query.destination.cities]);

  useEffect(() => {
    if (selectedCity) {
      loadActivitiesForCity(selectedCity);
    }
  }, [selectedCity]);

  const loadActivitiesForCity = (city: string) => {
    // Mock sightseeing activities based on city and country
    const mockActivities: SightseeingActivity[] = [
      {
        id: '1',
        name: 'Grand Palace & Wat Phra Kaew',
        city: city,
        type: 'cultural',
        duration: '3 hours',
        description: 'Visit the magnificent Grand Palace complex and the Temple of the Emerald Buddha',
        inclusions: ['English Speaking Guide', 'Entrance Fees', 'Bottled Water'],
        adultPrice: 1200,
        childPrice: 800,
        currency: 'THB',
        rating: 4.8,
        images: ['/placeholder.svg'],
        transferIncluded: false,
        transferPrice: 300,
        minimumPax: 2,
        maximumPax: 30
      },
      {
        id: '2',
        name: 'Floating Market Tour',
        city: city,
        type: 'cultural',
        duration: '4 hours',
        description: 'Experience the vibrant floating market with boat ride and local shopping',
        inclusions: ['Boat Ride', 'Local Guide', 'Traditional Snacks', 'Hotel Transfer'],
        adultPrice: 1500,
        childPrice: 1000,
        currency: 'THB',
        rating: 4.6,
        images: ['/placeholder.svg'],
        transferIncluded: true,
        minimumPax: 2,
        maximumPax: 15
      },
      {
        id: '3',
        name: 'Elephant Sanctuary Visit',
        city: city,
        type: 'nature',
        duration: '6 hours',
        description: 'Ethical elephant interaction experience with feeding and bathing',
        inclusions: ['Transportation', 'Lunch', 'Guide', 'Elephant Activities', 'Photos'],
        adultPrice: 2500,
        childPrice: 1800,
        currency: 'THB',
        rating: 4.9,
        images: ['/placeholder.svg'],
        transferIncluded: true,
        minimumPax: 2,
        maximumPax: 20
      },
      {
        id: '4',
        name: 'Traditional Thai Cooking Class',
        city: city,
        type: 'cultural',
        duration: '3 hours',
        description: 'Learn to cook authentic Thai dishes with market visit',
        inclusions: ['Market Tour', 'Cooking Class', 'Recipe Book', 'Full Meal'],
        adultPrice: 1800,
        childPrice: 1200,
        currency: 'THB',
        rating: 4.7,
        images: ['/placeholder.svg'],
        transferIncluded: false,
        transferPrice: 250,
        minimumPax: 2,
        maximumPax: 12
      }
    ];

    setActivities(mockActivities);
  };

  const calculateActivityPrice = (activity: SightseeingActivity, includeTransfers: boolean = false) => {
    const adults = query.paxDetails.adults;
    const children = query.paxDetails.children;
    
    const editedPrices = editingPrices[activity.id];
    const adultPrice = editedPrices?.adult || activity.adultPrice;
    const childPrice = editedPrices?.child || activity.childPrice;
    
    let total = (adultPrice * adults) + (childPrice * children);
    
    if (includeTransfers && !activity.transferIncluded && activity.transferPrice) {
      total += activity.transferPrice;
    }
    
    return total;
  };

  const handleActivitySelect = (activityId: string, checked: boolean | string) => {
    const isChecked = checked === true || checked === 'true';
    
    if (isChecked) {
      setSelectedActivities(prev => [...prev.filter(id => id !== activityId), activityId]);
    } else {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    }
  };

  const handlePriceEdit = (activityId: string, type: 'adult' | 'child', value: number) => {
    setEditingPrices(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [type]: value
      }
    }));
  };

  const handleTransferToggle = (activityId: string, checked: boolean | string) => {
    const isChecked = checked === true || checked === 'true';
    setIncludeTransfer(prev => ({
      ...prev,
      [activityId]: isChecked
    }));
  };

  const handleAddActivities = () => {
    selectedActivities.forEach(activityId => {
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        const includeTransfers = includeTransfer[activityId] || false;
        const totalPrice = calculateActivityPrice(activity, includeTransfers);
        
        onAddModule({
          id: `sightseeing_${activityId}_${Date.now()}`,
          type: 'sightseeing',
          data: {
            activity,
            includeTransfer: includeTransfers,
            customPricing: editingPrices[activityId] || null,
            adults: query.paxDetails.adults,
            children: query.paxDetails.children
          },
          pricing: {
            basePrice: totalPrice,
            finalPrice: totalPrice,
            currency: activity.currency
          }
        });
      }
    });

    // Reset selections
    setSelectedActivities([]);
    setEditingPrices({});
    setIncludeTransfer({});
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Sightseeing Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">City:</label>
            <div className="flex gap-2">
              {query.destination.cities.map(city => (
                <Button
                  key={city}
                  variant={selectedCity === city ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-3">
            {activities.map(activity => {
              const isSelected = selectedActivities.includes(activity.id);
              const includeTransfers = includeTransfer[activity.id] || false;
              const totalPrice = calculateActivityPrice(activity, includeTransfers);
              const editedPrices = editingPrices[activity.id];

              return (
                <div
                  key={activity.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleActivitySelect(activity.id, checked)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{activity.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {activity.minimumPax}-{activity.maximumPax} PAX
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {activity.rating}
                            </span>
                            <Badge variant="outline" className="capitalize">
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(totalPrice)} {activity.currency}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            total for {query.paxDetails.adults + query.paxDetails.children} PAX
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {activity.inclusions.map(inclusion => (
                          <Badge key={inclusion} variant="secondary" className="text-xs">
                            {inclusion}
                          </Badge>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="space-y-3 pt-3 border-t">
                          {/* Pricing Edit */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium">Adult Price ({activity.currency})</label>
                              <Input
                                type="number"
                                placeholder={activity.adultPrice.toString()}
                                value={editedPrices?.adult || ''}
                                onChange={(e) => handlePriceEdit(activity.id, 'adult', Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Child Price ({activity.currency})</label>
                              <Input
                                type="number"
                                placeholder={activity.childPrice.toString()}
                                value={editedPrices?.child || ''}
                                onChange={(e) => handlePriceEdit(activity.id, 'child', Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Transfer Option */}
                          {!activity.transferIncluded && activity.transferPrice && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`transfer_${activity.id}`}
                                checked={includeTransfers}
                                onCheckedChange={(checked) => handleTransferToggle(activity.id, checked)}
                              />
                              <label 
                                htmlFor={`transfer_${activity.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Include Transfer (+{formatCurrency(activity.transferPrice)} {activity.currency})
                              </label>
                            </div>
                          )}

                          {/* Price Breakdown */}
                          <div className="bg-muted p-2 rounded text-xs">
                            <div className="flex justify-between">
                              <span>Adults ({query.paxDetails.adults}):</span>
                              <span>{formatCurrency((editedPrices?.adult || activity.adultPrice) * query.paxDetails.adults)}</span>
                            </div>
                            {query.paxDetails.children > 0 && (
                              <div className="flex justify-between">
                                <span>Children ({query.paxDetails.children}):</span>
                                <span>{formatCurrency((editedPrices?.child || activity.childPrice) * query.paxDetails.children)}</span>
                              </div>
                            )}
                            {includeTransfers && activity.transferPrice && (
                              <div className="flex justify-between">
                                <span>Transfer:</span>
                                <span>{formatCurrency(activity.transferPrice)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                              <span>Total:</span>
                              <span>{formatCurrency(totalPrice)} {activity.currency}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedActivities.length > 0 && (
            <Button onClick={handleAddActivities} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Selected Activities ({selectedActivities.length})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Selected Activities Preview */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedModules.map(module => (
                <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <div className="font-medium text-sm">{module.data.activity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {module.data.activity.duration} • {module.data.adults + module.data.children} PAX
                      {module.data.includeTransfer && ' • Transfer Included'}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(module.pricing.finalPrice)} {module.pricing.currency}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SightseeingModule;
