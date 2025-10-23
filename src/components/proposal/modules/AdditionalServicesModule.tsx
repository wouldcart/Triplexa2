
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Edit, FileText, Shield, Plane, Phone, Camera, Wifi } from 'lucide-react';

interface AdditionalService {
  id: string;
  name: string;
  description: string;
  type: 'visa' | 'insurance' | 'guide' | 'photography' | 'sim_card' | 'wifi' | 'custom';
  price: number;
  currency: string;
  unit: 'per_person' | 'per_group' | 'per_day' | 'one_time';
  isOptional: boolean;
}

interface AdditionalServicesModuleProps {
  query: Query;
  onAddModule: (module: any) => void;
  selectedModules: any[];
  onUpdatePricing: (moduleId: string, pricing: any) => void;
}

const AdditionalServicesModule: React.FC<AdditionalServicesModuleProps> = ({ 
  query, 
  onAddModule, 
  selectedModules, 
  onUpdatePricing 
}) => {
  const [customService, setCustomService] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'per_person' as const,
    isOptional: true
  });

  const predefinedServices: AdditionalService[] = [
    {
      id: 'visa_assistance',
      name: 'Visa Assistance',
      description: 'Complete visa processing support including document review and submission',
      type: 'visa',
      price: 1500,
      currency: 'THB',
      unit: 'per_person',
      isOptional: true
    },
    {
      id: 'travel_insurance',
      name: 'Travel Insurance',
      description: 'Comprehensive travel insurance covering medical, trip cancellation, and baggage',
      type: 'insurance',
      price: 800,
      currency: 'THB',
      unit: 'per_person',
      isOptional: true
    },
    {
      id: 'english_guide',
      name: 'English Speaking Guide',
      description: 'Professional English speaking guide for full day tours',
      type: 'guide',
      price: 2000,
      currency: 'THB',
      unit: 'per_day',
      isOptional: true
    },
    {
      id: 'photography_service',
      name: 'Photography Service',
      description: 'Professional photographer for special occasions and sightseeing',
      type: 'photography',
      price: 3500,
      currency: 'THB',
      unit: 'per_day',
      isOptional: true
    },
    {
      id: 'sim_card',
      name: 'Local SIM Card',
      description: 'Prepaid SIM card with data and local calls for the duration of stay',
      type: 'sim_card',
      price: 500,
      currency: 'THB',
      unit: 'per_person',
      isOptional: true
    },
    {
      id: 'portable_wifi',
      name: 'Portable WiFi Device',
      description: 'Pocket WiFi device for internet access throughout the trip',
      type: 'wifi',
      price: 300,
      currency: 'THB',
      unit: 'per_day',
      isOptional: true
    }
  ];

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'visa': return FileText;
      case 'insurance': return Shield;
      case 'guide': return Plus;
      case 'photography': return Camera;
      case 'sim_card': return Phone;
      case 'wifi': return Wifi;
      default: return Plus;
    }
  };

  const calculateServicePrice = (service: AdditionalService) => {
    const paxCount = query.paxDetails.adults + query.paxDetails.children;
    const tripDays = query.tripDuration.days;

    switch (service.unit) {
      case 'per_person':
        return service.price * paxCount;
      case 'per_day':
        return service.price * tripDays;
      case 'per_group':
      case 'one_time':
      default:
        return service.price;
    }
  };

  const getUnitDescription = (unit: string, service: AdditionalService) => {
    const paxCount = query.paxDetails.adults + query.paxDetails.children;
    const tripDays = query.tripDuration.days;

    switch (unit) {
      case 'per_person':
        return `${formatCurrency(service.price)} × ${paxCount} people`;
      case 'per_day':
        return `${formatCurrency(service.price)} × ${tripDays} days`;
      case 'per_group':
        return 'Per group (one time)';
      case 'one_time':
        return 'One time charge';
      default:
        return '';
    }
  };

  const handleAddPredefinedService = (service: AdditionalService) => {
    const totalPrice = calculateServicePrice(service);
    
    onAddModule({
      id: `additional_${service.id}_${Date.now()}`,
      type: 'additional',
      data: {
        service,
        isPredefined: true,
        paxCount: query.paxDetails.adults + query.paxDetails.children,
        tripDays: query.tripDuration.days
      },
      pricing: {
        basePrice: totalPrice,
        finalPrice: totalPrice,
        currency: service.currency
      }
    });
  };

  const handleAddCustomService = () => {
    if (!customService.name || !customService.price) return;

    const service: AdditionalService = {
      id: `custom_${Date.now()}`,
      name: customService.name,
      description: customService.description,
      type: 'custom',
      price: customService.price,
      currency: 'THB',
      unit: customService.unit,
      isOptional: customService.isOptional
    };

    const totalPrice = calculateServicePrice(service);
    
    onAddModule({
      id: `additional_${service.id}_${Date.now()}`,
      type: 'additional',
      data: {
        service,
        isPredefined: false,
        paxCount: query.paxDetails.adults + query.paxDetails.children,
        tripDays: query.tripDuration.days
      },
      pricing: {
        basePrice: totalPrice,
        finalPrice: totalPrice,
        currency: service.currency
      }
    });

    // Reset form
    setCustomService({
      name: '',
      description: '',
      price: 0,
      unit: 'per_person',
      isOptional: true
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Additional Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predefined Services */}
          <div className="space-y-3">
            <h4 className="font-medium">Suggested Services</h4>
            <div className="grid gap-3">
              {predefinedServices.map(service => {
                const Icon = getServiceIcon(service.type);
                const totalPrice = calculateServicePrice(service);
                const isSelected = selectedModules.some(m => 
                  m.data.service.id === service.id || m.data.service.name === service.name
                );

                return (
                  <div
                    key={service.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{service.name}</h5>
                            {service.isOptional && (
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          <div className="text-xs text-muted-foreground">
                            {getUnitDescription(service.unit, service)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold">
                          {formatCurrency(totalPrice)} {service.currency}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">total</div>
                        <Button
                          size="sm"
                          onClick={() => handleAddPredefinedService(service)}
                          disabled={isSelected}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Service Form */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">Add Custom Service</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Service name"
                value={customService.name}
                onChange={(e) => setCustomService(prev => ({ ...prev, name: e.target.value }))}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Price"
                  value={customService.price || ''}
                  onChange={(e) => setCustomService(prev => ({ ...prev, price: Number(e.target.value) }))}
                />
                <select
                  value={customService.unit}
                  onChange={(e) => setCustomService(prev => ({ ...prev, unit: e.target.value as any }))}
                  className="px-3 py-2 border rounded"
                >
                  <option value="per_person">Per Person</option>
                  <option value="per_group">Per Group</option>
                  <option value="per_day">Per Day</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>
            </div>
            <Textarea
              placeholder="Service description (optional)"
              value={customService.description}
              onChange={(e) => setCustomService(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Total: {formatCurrency(calculateServicePrice({
                  ...customService,
                  id: 'temp',
                  type: 'custom',
                  currency: 'THB',
                  isOptional: true
                }))} THB
              </div>
              <Button 
                onClick={handleAddCustomService}
                disabled={!customService.name || !customService.price}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Services Preview */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Additional Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedModules.map(module => {
                const Icon = getServiceIcon(module.data.service.type);
                return (
                  <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{module.data.service.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getUnitDescription(module.data.service.unit, module.data.service)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(module.pricing.finalPrice)} {module.pricing.currency}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdditionalServicesModule;
