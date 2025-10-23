import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/utils/currencyUtils';
import { Calculator, Edit3 } from 'lucide-react';
import { AccommodationPricing, PriceBreakdownItem } from './types';

interface PriceBreakdownProps {
  accommodation: AccommodationPricing;
  destinationCountry: string;
  onEdit?: () => void;
  compact?: boolean;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  accommodation,
  destinationCountry,
  onEdit,
  compact = false
}) => {
  const calculateBreakdown = (): PriceBreakdownItem[] => {
    const { numberOfRooms, numberOfNights, numberOfChildren, numberOfExtraBeds, pricing } = accommodation;
    const breakdown: PriceBreakdownItem[] = [];

    // Room cost (adult price per room per night)
    if (numberOfRooms > 0) {
      breakdown.push({
        label: `Room${numberOfRooms > 1 ? 's' : ''}`,
        quantity: numberOfRooms,
        unitPrice: pricing.adultPrice,
        totalPrice: pricing.adultPrice * numberOfRooms * numberOfNights,
        nights: numberOfNights
      });
    }

    // Children cost
    if (numberOfChildren > 0) {
      breakdown.push({
        label: `Child${numberOfChildren > 1 ? 'ren' : ''}`,
        quantity: numberOfChildren,
        unitPrice: pricing.childPrice,
        totalPrice: pricing.childPrice * numberOfChildren * numberOfNights,
        nights: numberOfNights
      });
    }

    // Extra beds cost
    if (numberOfExtraBeds > 0) {
      breakdown.push({
        label: `Extra Bed${numberOfExtraBeds > 1 ? 's' : ''}`,
        quantity: numberOfExtraBeds,
        unitPrice: pricing.extraBedPrice,
        totalPrice: pricing.extraBedPrice * numberOfExtraBeds * numberOfNights,
        nights: numberOfNights
      });
    }

    return breakdown;
  };

  const breakdown = calculateBreakdown();
  const subtotal = breakdown.reduce((sum, item) => sum + item.totalPrice, 0);
  const finalTotal = accommodation.customPricing?.isCustom 
    ? accommodation.customPricing.totalPrice 
    : subtotal;

  if (compact) {
    return (
      <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>
              {item.label} ({item.quantity}×{item.nights}n):
            </span>
            <span>{formatCurrency(item.totalPrice, destinationCountry)}</span>
          </div>
        ))}
        {accommodation.customPricing?.isCustom && (
          <div className="flex justify-between text-orange-600">
            <span>Custom Adjustment:</span>
            <span>
              {formatCurrency(finalTotal - subtotal, destinationCountry)}
            </span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-green-600 border-t pt-1">
          <span>Total:</span>
          <span>{formatCurrency(finalTotal, destinationCountry)}</span>
        </div>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1 mt-1 p-1 rounded hover:bg-muted"
          >
            <Edit3 className="h-3 w-3" />
            Edit Pricing
          </button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Price Breakdown
          </div>
          {accommodation.customPricing?.isCustom && (
            <Badge variant="secondary" className="text-xs">
              Custom Pricing
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <div className="flex flex-col">
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">
                {item.quantity} × {formatCurrency(item.unitPrice, destinationCountry)}
                {item.nights && ` × ${item.nights} night${item.nights > 1 ? 's' : ''}`}
              </span>
            </div>
            <span className="font-medium">
              {formatCurrency(item.totalPrice, destinationCountry)}
            </span>
          </div>
        ))}
        
        {breakdown.length > 1 && (
          <div className="flex justify-between items-center text-sm border-t pt-2">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(subtotal, destinationCountry)}</span>
          </div>
        )}

        {accommodation.customPricing?.isCustom && (
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-orange-600">Custom Adjustment:</span>
            <span className="text-orange-600">
              {formatCurrency(finalTotal - subtotal, destinationCountry)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-base font-bold text-green-600 border-t-2 pt-2">
          <span>Total:</span>
          <span>{formatCurrency(finalTotal, destinationCountry)}</span>
        </div>

        {onEdit && (
          <button 
            onClick={onEdit}
            className="w-full text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2 mt-2 p-2 rounded hover:bg-muted border border-dashed border-primary/30"
          >
            <Edit3 className="h-4 w-4" />
            Edit Pricing
          </button>
        )}
      </CardContent>
    </Card>
  );
};