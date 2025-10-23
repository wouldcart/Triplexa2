import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Calculator, 
  Users, 
  Baby, 
  Bed, 
  Save, 
  RotateCcw,
  AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { AccommodationPricing, PricingData } from './types';
import { PriceBreakdown } from './PriceBreakdown';

interface PricingEditorProps {
  accommodation: AccommodationPricing;
  destinationCountry: string;
  onSave: (updatedAccommodation: AccommodationPricing) => void;
  onCancel: () => void;
}

export const PricingEditor: React.FC<PricingEditorProps> = ({
  accommodation,
  destinationCountry,
  onSave,
  onCancel
}) => {
  const [editedPricing, setEditedPricing] = useState<PricingData>(accommodation.pricing);
  const [customTotal, setCustomTotal] = useState(
    accommodation.customPricing?.totalPrice || 0
  );
  const [useCustomTotal, setUseCustomTotal] = useState(
    accommodation.customPricing?.isCustom || false
  );

  const calculateAutomaticTotal = (): number => {
    const { numberOfRooms, numberOfNights, numberOfChildren, numberOfExtraBeds } = accommodation;
    
    const roomsCost = editedPricing.adultPrice * numberOfRooms * numberOfNights;
    const childrenCost = editedPricing.childPrice * numberOfChildren * numberOfNights;
    const extraBedsCost = editedPricing.extraBedPrice * numberOfExtraBeds * numberOfNights;
    
    return roomsCost + childrenCost + extraBedsCost;
  };

  const automaticTotal = calculateAutomaticTotal();
  const finalTotal = useCustomTotal ? customTotal : automaticTotal;

  useEffect(() => {
    if (!useCustomTotal) {
      setCustomTotal(automaticTotal);
    }
  }, [automaticTotal, useCustomTotal]);

  const handleSave = () => {
    const updatedAccommodation: AccommodationPricing = {
      ...accommodation,
      pricing: editedPricing,
      customPricing: useCustomTotal 
        ? { totalPrice: customTotal, isCustom: true }
        : { totalPrice: automaticTotal, isCustom: false }
    };
    onSave(updatedAccommodation);
  };

  const handleReset = () => {
    setEditedPricing(accommodation.pricing);
    setCustomTotal(accommodation.customPricing?.totalPrice || 0);
    setUseCustomTotal(accommodation.customPricing?.isCustom || false);
  };

  const previewAccommodation: AccommodationPricing = {
    ...accommodation,
    pricing: editedPricing,
    customPricing: { totalPrice: finalTotal, isCustom: useCustomTotal }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Edit Pricing
            <Badge variant="outline" className="ml-2">
              {accommodation.numberOfRooms} room{accommodation.numberOfRooms > 1 ? 's' : ''} 
              × {accommodation.numberOfNights} night{accommodation.numberOfNights > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Pricing Section */}
          <div>
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4" />
              Base Pricing (per night)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="adult-price" className="flex items-center gap-2 text-sm">
                  <Users className="h-3 w-3" />
                  Adult/Room Price
                </Label>
                <Input
                  id="adult-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedPricing.adultPrice}
                  onChange={(e) => setEditedPricing(prev => ({ 
                    ...prev, 
                    adultPrice: parseFloat(e.target.value) || 0 
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Base price per room per night
                </p>
              </div>

              <div>
                <Label htmlFor="child-price" className="flex items-center gap-2 text-sm">
                  <Baby className="h-3 w-3" />
                  Child Price
                </Label>
                <Input
                  id="child-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedPricing.childPrice}
                  onChange={(e) => setEditedPricing(prev => ({ 
                    ...prev, 
                    childPrice: parseFloat(e.target.value) || 0 
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Per child per night
                </p>
              </div>

              <div>
                <Label htmlFor="extra-bed-price" className="flex items-center gap-2 text-sm">
                  <Bed className="h-3 w-3" />
                  Extra Bed Price
                </Label>
                <Input
                  id="extra-bed-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedPricing.extraBedPrice}
                  onChange={(e) => setEditedPricing(prev => ({ 
                    ...prev, 
                    extraBedPrice: parseFloat(e.target.value) || 0 
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Per extra bed per night
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Total Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Custom Total Override</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="custom-total-switch" className="text-sm">
                  Enable Custom Total
                </Label>
                <Switch
                  id="custom-total-switch"
                  checked={useCustomTotal}
                  onCheckedChange={setUseCustomTotal}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">
                  Calculated Total (Auto)
                </Label>
                <div className="p-3 bg-muted/50 rounded border">
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(automaticTotal, destinationCountry)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="custom-total" className="text-sm">
                  Custom Total {useCustomTotal && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="custom-total"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customTotal}
                  onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 0)}
                  disabled={!useCustomTotal}
                  className={`mt-1 ${useCustomTotal ? 'border-orange-300' : ''}`}
                />
                {useCustomTotal && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This will override the calculated total
                  </p>
                )}
              </div>
            </div>

            {useCustomTotal && Math.abs(customTotal - automaticTotal) > 0.01 && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Difference:</span>
                  <span className={`font-semibold ${
                    customTotal > automaticTotal ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {customTotal > automaticTotal ? '+' : ''}
                    {formatCurrency(customTotal - automaticTotal, destinationCountry)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Live Preview</Label>
        <PriceBreakdown
          accommodation={previewAccommodation}
          destinationCountry={destinationCountry}
        />
      </div>
    </div>
  );
};