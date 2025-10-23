
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Query } from '@/types/query';
import { PricingService } from '@/services/pricingService';
import { formatCurrency } from '@/lib/formatters';
import { 
  Calculator, DollarSign, Users, Trash2, Edit, 
  Car, Hotel, Landmark, Plus, Settings, TrendingUp
} from 'lucide-react';

interface SelectedModule {
  id: string;
  type: 'transport' | 'hotel' | 'sightseeing' | 'restaurant' | 'additional';
  data: any;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
  };
}

interface PricingSummaryProps {
  selectedModules: SelectedModule[];
  totalPricing: {
    subtotal: number;
    markup: number;
    total: number;
    perPerson: number;
    currency: string;
  };
  query: Query;
  onRemoveModule: (moduleId: string) => void;
  onUpdatePricing: (moduleId: string, pricing: any) => void;
}

const PricingSummary: React.FC<PricingSummaryProps> = ({
  selectedModules,
  totalPricing,
  query,
  onRemoveModule,
  onUpdatePricing
}) => {
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [showPricingSettings, setShowPricingSettings] = useState(false);

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'transport': return Car;
      case 'hotel': return Hotel;
      case 'sightseeing': return Landmark;
      case 'additional': return Plus;
      default: return Calculator;
    }
  };

  const getModuleTypeColor = (type: string) => {
    switch (type) {
      case 'transport': return 'bg-green-100 text-green-800';
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'sightseeing': return 'bg-orange-100 text-orange-800';
      case 'additional': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startEditing = (moduleId: string, currentPrice: number) => {
    setEditingModule(moduleId);
    setTempPrice(currentPrice);
  };

  const saveEdit = () => {
    if (editingModule) {
      onUpdatePricing(editingModule, { finalPrice: tempPrice });
      setEditingModule(null);
      setTempPrice(0);
    }
  };

  const cancelEdit = () => {
    setEditingModule(null);
    setTempPrice(0);
  };

  // Fix the grouping logic with proper typing
  const groupedModules = selectedModules.reduce((acc: Record<string, SelectedModule[]>, module) => {
    if (!acc[module.type]) {
      acc[module.type] = [];
    }
    acc[module.type].push(module);
    return acc;
  }, {});

  const moduleTypeTotals = Object.entries(groupedModules).map(([type, modules]) => ({
    type,
    total: modules.reduce((sum, module) => sum + module.pricing.finalPrice, 0),
    count: modules.length
  }));

  const paxCount = query.paxDetails.adults + query.paxDetails.children;
  const pricingSettings = PricingService.getSettings();

  return (
    <div className="space-y-4">
      {/* Module Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Selected Modules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedModules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No modules selected yet</p>
              <p className="text-xs">Add transport, hotels, or activities to start building your proposal</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedModules.map(module => {
                const Icon = getModuleIcon(module.type);
                const isEditing = editingModule === module.id;
                
                return (
                  <div key={module.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {module.data.hotel?.name || 
                             module.data.route?.from + ' → ' + module.data.route?.to ||
                             module.data.activity?.name ||
                             module.data.service?.name ||
                             'Unknown Module'}
                          </span>
                          <Badge className={`text-xs ${getModuleTypeColor(module.type)}`}>
                            {module.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {module.data.vehicle?.name ||
                           module.data.roomType?.name ||
                           module.data.activity?.duration ||
                           module.data.service?.unit ||
                           'Details'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-20 h-6 text-xs"
                          />
                          <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                            ✓
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-6 w-6 p-0">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {formatCurrency(module.pricing.finalPrice)} {module.pricing.currency}
                          </span>
                          {pricingSettings.allowStaffPricingEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(module.id, module.pricing.finalPrice)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveModule(module.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Type Breakdown */}
      {moduleTypeTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cost by Module Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {moduleTypeTotals.map(({ type, total, count }) => {
                const Icon = getModuleIcon(type);
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{type}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(total)} {totalPricing.currency}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Summary
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPricingSettings(!showPricingSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* PAX Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total PAX:
            </span>
            <span>{query.paxDetails.adults} Adults + {query.paxDetails.children} Children = {paxCount}</span>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(totalPricing.subtotal)} {totalPricing.currency}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Markup ({pricingSettings.useSlabPricing ? 'Slab' : pricingSettings.defaultMarkupPercentage + '%'}):</span>
              <span>{formatCurrency(totalPricing.markup)} {totalPricing.currency}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-lg">
                {formatCurrency(totalPricing.total)} {totalPricing.currency}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Per Person:</span>
              <span className="font-medium">
                {formatCurrency(totalPricing.perPerson)} {totalPricing.currency}
              </span>
            </div>
          </div>

          {/* Markup Settings Display */}
          {showPricingSettings && (
            <div className="mt-4 p-3 bg-muted rounded text-xs">
              <div className="font-medium mb-2">Current Pricing Settings:</div>
              <div>Markup Type: {pricingSettings.useSlabPricing ? 'Slab Based' : 'Percentage'}</div>
              <div>Default Markup: {pricingSettings.defaultMarkupPercentage}%</div>
              <div>Staff Can Edit: {pricingSettings.allowStaffPricingEdit ? 'Yes' : 'No'}</div>
              {pricingSettings.useSlabPricing && (
                <div className="mt-2">
                  <div className="font-medium">Active Slabs:</div>
                  {pricingSettings.markupSlabs.filter(s => s.isActive).map(slab => (
                    <div key={slab.id} className="ml-2">
                      {formatCurrency(slab.minAmount)}-{formatCurrency(slab.maxAmount)}: 
                      {slab.markupType === 'fixed' ? ` +${formatCurrency(slab.markupValue)}` : ` +${slab.markupValue}%`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Proposal Button */}
          <Button 
            className="w-full mt-4" 
            size="lg"
            disabled={selectedModules.length === 0}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Create Proposal ({formatCurrency(totalPricing.total)} {totalPricing.currency})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingSummary;
