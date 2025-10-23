
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Calculator, DollarSign, Users, Percent } from 'lucide-react';
import { PricingCalculator } from './PricingCalculator';
import { Query } from '@/types/query';

interface PricingOptionsModalProps {
  query: Query;
  totalItineraryCost: number;
  totalHotelCost: number;
  onPricingUpdate: (pricing: any) => void;
}

interface PricingOptions {
  showPerPersonPricing: boolean;
  showLandPackage: boolean;
  showHotelSeparate: boolean;
}

interface MarkupSettings {
  landPackageMarkup: number;
  hotelMarkup: number;
  perPersonMarkup: number;
  childDiscount: number;
  infantDiscount: number;
}

export const PricingOptionsModal: React.FC<PricingOptionsModalProps> = ({
  query,
  totalItineraryCost,
  totalHotelCost,
  onPricingUpdate
}) => {
  const [pricingOptions, setPricingOptions] = useState<PricingOptions>({
    showPerPersonPricing: true,
    showLandPackage: true,
    showHotelSeparate: true
  });

  const [markupSettings, setMarkupSettings] = useState<MarkupSettings>({
    landPackageMarkup: 15,
    hotelMarkup: 10,
    perPersonMarkup: 12,
    childDiscount: 25,
    infantDiscount: 90
  });

  const handlePricingOptionChange = (option: keyof PricingOptions, checked: boolean) => {
    const newOptions = { ...pricingOptions, [option]: checked };
    setPricingOptions(newOptions);
    onPricingUpdate({ options: newOptions, markup: markupSettings });
  };

  const handleMarkupChange = (setting: keyof MarkupSettings, value: number) => {
    const newMarkup = { ...markupSettings, [setting]: value };
    setMarkupSettings(newMarkup);
    onPricingUpdate({ options: pricingOptions, markup: newMarkup });
  };

  return (
    <div className="space-y-6">
      {/* Pricing Options Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pricing Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="per-person"
                checked={pricingOptions.showPerPersonPricing}
                onCheckedChange={(checked) => handlePricingOptionChange('showPerPersonPricing', !!checked)}
              />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <Label htmlFor="per-person" className="text-sm font-medium">
                  Per Person Pricing
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="land-package"
                checked={pricingOptions.showLandPackage}
                onCheckedChange={(checked) => handlePricingOptionChange('showLandPackage', !!checked)}
              />
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <Label htmlFor="land-package" className="text-sm font-medium">
                  Land Package Pricing
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotel-separate"
                checked={pricingOptions.showHotelSeparate}
                onCheckedChange={(checked) => handlePricingOptionChange('showHotelSeparate', !!checked)}
              />
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <Label htmlFor="hotel-separate" className="text-sm font-medium">
                  Hotel Pricing Separate
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Markup & Discount Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Land Package Markup (%)</Label>
              <Input
                type="number"
                value={markupSettings.landPackageMarkup}
                onChange={(e) => handleMarkupChange('landPackageMarkup', Number(e.target.value))}
                min="0"
                max="100"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Hotel Markup (%)</Label>
              <Input
                type="number"
                value={markupSettings.hotelMarkup}
                onChange={(e) => handleMarkupChange('hotelMarkup', Number(e.target.value))}
                min="0"
                max="100"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Per Person Markup (%)</Label>
              <Input
                type="number"
                value={markupSettings.perPersonMarkup}
                onChange={(e) => handleMarkupChange('perPersonMarkup', Number(e.target.value))}
                min="0"
                max="100"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Child Discount (%)</Label>
              <Input
                type="number"
                value={markupSettings.childDiscount}
                onChange={(e) => handleMarkupChange('childDiscount', Number(e.target.value))}
                min="0"
                max="100"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Infant Discount (%)</Label>
              <Input
                type="number"
                value={markupSettings.infantDiscount}
                onChange={(e) => handleMarkupChange('infantDiscount', Number(e.target.value))}
                min="0"
                max="100"
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Calculator */}
      <PricingCalculator
        query={query}
        totalItineraryCost={totalItineraryCost}
        totalHotelCost={totalHotelCost}
        onPricingChange={onPricingUpdate}
        pricingOptions={pricingOptions}
        markupSettings={markupSettings}
      />
    </div>
  );
};
