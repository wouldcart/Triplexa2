import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Users, Baby, DollarSign } from "lucide-react";
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';

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

interface PricingCalculatorProps {
  query: Query;
  totalItineraryCost: number;
  totalHotelCost: number;
  onPricingChange: (pricing: any) => void;
  pricingOptions?: PricingOptions;
  markupSettings?: MarkupSettings;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  query,
  totalItineraryCost,
  totalHotelCost,
  onPricingChange,
  pricingOptions = {
    showPerPersonPricing: true,
    showLandPackage: true,
    showHotelSeparate: true
  },
  markupSettings = {
    landPackageMarkup: 15,
    hotelMarkup: 10,
    perPersonMarkup: 12,
    childDiscount: 25,
    infantDiscount: 90
  }
}) => {
  const [currency] = useState(query.destination.country === 'Thailand' ? 'THB' : 'USD');

  const calculatePricing = () => {
    const adults = query.paxDetails.adults;
    const children = query.paxDetails.children;
    const infants = query.paxDetails.infants;
    const totalPax = adults + children; // Infants don't count as PAX

    // Base costs
    const landPackageCost = totalItineraryCost;
    const hotelCost = totalHotelCost;
    const totalBaseCost = landPackageCost + hotelCost;

    // Land Package Pricing
    const landPackageMarkup = (landPackageCost * markupSettings.landPackageMarkup) / 100;
    const landPackageTotal = landPackageCost + landPackageMarkup;

    // Hotel Pricing
    const hotelMarkup = (hotelCost * markupSettings.hotelMarkup) / 100;
    const hotelTotal = hotelCost + hotelMarkup;

    // Per Person Pricing
    const perPersonBase = totalPax > 0 ? totalBaseCost / totalPax : 0;
    const perPersonMarkup = (perPersonBase * markupSettings.perPersonMarkup) / 100;
    const perPersonTotal = perPersonBase + perPersonMarkup;

    // Adult pricing
    const adultPrice = perPersonTotal;
    
    // Child pricing (with discount)
    const childPrice = perPersonTotal * (1 - markupSettings.childDiscount / 100);
    
    // Infant pricing (with discount)
    const infantPrice = perPersonTotal * (1 - markupSettings.infantDiscount / 100);

    // Total calculations
    const totalAdultCost = adults * adultPrice;
    const totalChildCost = children * childPrice;
    const totalInfantCost = infants * infantPrice;
    const grandTotal = totalAdultCost + totalChildCost + totalInfantCost;

    return {
      landPackage: {
        base: landPackageCost,
        markup: landPackageMarkup,
        total: landPackageTotal
      },
      hotel: {
        base: hotelCost,
        markup: hotelMarkup,
        total: hotelTotal
      },
      perPerson: {
        adult: adultPrice,
        child: childPrice,
        infant: infantPrice,
        base: perPersonBase
      },
      totals: {
        adults: totalAdultCost,
        children: totalChildCost,
        infants: totalInfantCost,
        grand: grandTotal,
        base: totalBaseCost
      },
      paxBreakdown: {
        adults,
        children,
        infants,
        totalPax
      }
    };
  };

  const pricing = calculatePricing();

  useEffect(() => {
    onPricingChange({ pricing: pricing, settings: { pricingOptions, markupSettings } });
  }, [totalItineraryCost, totalHotelCost, pricingOptions, markupSettings]);

  return (
    <div className="space-y-4">
      {/* PAX Breakdown - More Compact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            PAX Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-md">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-700">{pricing.paxBreakdown.adults}</div>
              <div className="text-xs text-blue-600">Adults</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-md">
              <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-700">{pricing.paxBreakdown.children}</div>
              <div className="text-xs text-green-600">Children</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-md">
              <Baby className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-orange-700">{pricing.paxBreakdown.infants}</div>
              <div className="text-xs text-orange-600">Infants</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-md">
              <Calculator className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-purple-700">{pricing.paxBreakdown.totalPax}</div>
              <div className="text-xs text-purple-600">Total PAX</div>
              <div className="text-[10px] text-purple-500 mt-1">
                (Infants not counted)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Options - Compact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Land Package Pricing */}
        {pricingOptions.showLandPackage && (
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Land Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Cost:</span>
                <span className="font-medium">{formatCurrency(pricing.landPackage.base, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Markup ({markupSettings.landPackageMarkup}%):</span>
                <span className="text-green-600 font-medium">+{formatCurrency(pricing.landPackage.markup, currency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(pricing.landPackage.total, currency)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hotel Pricing */}
        {pricingOptions.showHotelSeparate && (
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Hotel Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Cost:</span>
                <span className="font-medium">{formatCurrency(pricing.hotel.base, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Markup ({markupSettings.hotelMarkup}%):</span>
                <span className="text-green-600 font-medium">+{formatCurrency(pricing.hotel.markup, currency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(pricing.hotel.total, currency)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Per Person Pricing - Compact */}
      {pricingOptions.showPerPersonPricing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Per Person Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border rounded-md bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center">
                  <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="font-semibold text-sm text-blue-700">Adult Price</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(pricing.perPerson.adult, currency)}
                  </div>
                  <Badge className="mt-1 text-xs px-2 py-0">Base Rate</Badge>
                </div>
              </div>
              
              <div className="p-3 border rounded-md bg-gradient-to-br from-green-50 to-green-100">
                <div className="text-center">
                  <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="font-semibold text-sm text-green-700">Child Price</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(pricing.perPerson.child, currency)}
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs px-2 py-0">
                    {markupSettings.childDiscount}% off
                  </Badge>
                </div>
              </div>
              
              <div className="p-3 border rounded-md bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="text-center">
                  <Baby className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <div className="font-semibold text-sm text-orange-700">Infant Price</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatCurrency(pricing.perPerson.infant, currency)}
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs px-2 py-0">
                    {markupSettings.infantDiscount}% off
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Summary - Compact and Focused */}
      <Card className="border-2 border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Total Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Cost Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-1">
                  <span>Adults ({pricing.paxBreakdown.adults}):</span>
                  <span className="font-medium">{formatCurrency(pricing.totals.adults, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Children ({pricing.paxBreakdown.children}):</span>
                  <span className="font-medium">{formatCurrency(pricing.totals.children, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Infants ({pricing.paxBreakdown.infants}):</span>
                  <span className="font-medium">{formatCurrency(pricing.totals.infants, currency)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Package Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-1">
                  <span>Land Package:</span>
                  <span className="font-medium">{formatCurrency(pricing.landPackage.total, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Hotel Package:</span>
                  <span className="font-medium">{formatCurrency(pricing.hotel.total, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Base Cost:</span>
                  <span className="font-medium">{formatCurrency(pricing.totals.base, currency)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-lg font-bold text-primary">Grand Total</div>
                <div className="text-xs text-muted-foreground">
                  Average per PAX: {pricing.paxBreakdown.totalPax > 0 ? formatCurrency(pricing.totals.grand / pricing.paxBreakdown.totalPax, currency) : formatCurrency(0, currency)}
                </div>
              </div>
              <div className="text-xl font-bold text-primary">
                {formatCurrency(pricing.totals.grand, currency)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
