
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, DollarSign, Users, Package } from 'lucide-react';

interface EmailPricingOptionsProps {
  options: {
    showPricing: boolean;
    showPerPersonPricing: boolean;
    showTotalPricing: boolean;
    showAdultChildPricing: boolean;
    packageType: 'land' | 'full' | 'landHotelVisa';
    showPricingBreakdown: boolean;
  };
  onOptionChange: (option: string, value: boolean | string) => void;
}

export const EmailPricingOptions: React.FC<EmailPricingOptionsProps> = ({
  options,
  onOptionChange
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Email Pricing Display Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Pricing Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-pricing" className="text-sm font-medium">
            Show Pricing in Email
          </Label>
          <Switch
            id="show-pricing"
            checked={options.showPricing}
            onCheckedChange={(checked) => onOptionChange('showPricing', checked)}
          />
        </div>

        {options.showPricing && (
          <>
            <Separator />
            
            {/* Pricing Type Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing Display
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="per-person-pricing"
                    checked={options.showPerPersonPricing}
                    onCheckedChange={(checked) => onOptionChange('showPerPersonPricing', !!checked)}
                  />
                  <Label htmlFor="per-person-pricing" className="text-sm">Per Person Pricing</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="total-pricing"
                    checked={options.showTotalPricing}
                    onCheckedChange={(checked) => onOptionChange('showTotalPricing', !!checked)}
                  />
                  <Label htmlFor="total-pricing" className="text-sm">Total Package Pricing</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="adult-child-pricing"
                    checked={options.showAdultChildPricing}
                    onCheckedChange={(checked) => onOptionChange('showAdultChildPricing', !!checked)}
                  />
                  <Label htmlFor="adult-child-pricing" className="text-sm">Adult/Child Pricing</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pricing-breakdown"
                    checked={options.showPricingBreakdown}
                    onCheckedChange={(checked) => onOptionChange('showPricingBreakdown', !!checked)}
                  />
                  <Label htmlFor="pricing-breakdown" className="text-sm">Pricing Breakdown</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Package Type Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Package Options
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="land-only"
                    name="package-type"
                    checked={options.packageType === 'land'}
                    onChange={() => onOptionChange('packageType', 'land')}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="land-only" className="text-sm">Land Package Only</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="full-package"
                    name="package-type"
                    checked={options.packageType === 'full'}
                    onChange={() => onOptionChange('packageType', 'full')}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="full-package" className="text-sm">Full Package</Label>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
