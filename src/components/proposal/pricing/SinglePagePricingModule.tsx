import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Calculator } from 'lucide-react';
import { Query } from '@/types/query';
import { EnhancedMarkupData, AccommodationPricingOption, MarkupSettings } from '@/types/enhancedMarkup';
import { AccommodationOptionsManager } from './AccommodationOptionsManager';
import { ServiceCostCalculator } from './ServiceCostCalculator';
import { MarkupSlabManager } from './MarkupSlabManager';
import { PricingDistributionCalculator } from './PricingDistributionCalculator';
import { DiscountEditor } from './DiscountEditor';
import { TaxSelector } from './TaxSelector';
import { FinalPricingSummaryCard } from './FinalPricingSummaryCard';
import { getCurrencyByCountry } from '@/utils/currencyUtils';

interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  category: 'group' | 'seasonal' | 'early-bird' | 'loyalty' | 'custom';
  description: string;
  isActive: boolean;
}

interface TaxResult {
  baseAmount: number;
  taxAmount: number;
  tdsAmount?: number;
  totalAmount: number;
  taxType: string;
  taxRate: number;
  isInclusive: boolean;
}

interface SinglePagePricingModuleProps {
  proposalData?: any;
  query?: Query;
  onPricingUpdate?: (pricing: any) => void;
}

export const SinglePagePricingModule: React.FC<SinglePagePricingModuleProps> = ({
  proposalData,
  query,
  onPricingUpdate
}) => {
  const [markupData, setMarkupData] = useState<EnhancedMarkupData>({
    options: [],
    selectedOption: 'standard',
    markupSettings: {
      type: 'percentage',
      percentage: 15,
      slabs: [
        { minAmount: 0, maxAmount: 5000, percentage: 10 },
        { minAmount: 5001, maxAmount: 10000, percentage: 8 },
        { minAmount: 10001, maxAmount: Infinity, percentage: 7 }
      ]
    },
    adults: query?.paxDetails?.adults || 1,
    children: query?.paxDetails?.children || 0,
    totalPax: (query?.paxDetails?.adults || 1) + (query?.paxDetails?.children || 0)
  });

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [taxResult, setTaxResult] = useState<TaxResult>({
    baseAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    taxType: 'None',
    taxRate: 0,
    isInclusive: false
  });

  const currency = getCurrencyByCountry(query?.destination?.country || 'Thailand');
  const countryCode = query?.destination?.country || 'TH';

  // Extract itinerary details and calculate pricing options
  useEffect(() => {
    if (proposalData?.days) {
      calculatePricingOptions();
    }
  }, [proposalData, markupData.markupSettings]);

  const calculatePricingOptions = () => {
    if (!proposalData?.days) return;

    const options: AccommodationPricingOption[] = ['standard', 'optional', 'alternative'].map(type => {
      const accommodations = extractAccommodationsByType(type as any);
      const serviceCosts = calculateServiceCosts();
      const baseTotal = accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0) + 
                       serviceCosts.sightseeing.total + 
                       serviceCosts.transport.totalCost + 
                       serviceCosts.dining.total +
                       serviceCosts.accommodation.totalCost;
      
      const markup = calculateMarkup(baseTotal);
      const finalTotal = baseTotal + markup;
      const distribution = calculateDistribution(finalTotal);

      return {
        type: type as any,
        accommodations,
        serviceCosts,
        baseTotal,
        markup,
        finalTotal,
        distribution
      };
    });

    setMarkupData(prev => ({ ...prev, options }));
    
    // Update parent component
    onPricingUpdate?.({
      markupData: { ...markupData, options },
      selectedOption: markupData.selectedOption,
      finalPricing: options.find(opt => opt.type === markupData.selectedOption)
    });
  };

  const extractAccommodationsByType = (type: 'standard' | 'optional' | 'alternative') => {
    const accommodations = [];
    
    proposalData.days.forEach((day: any) => {
      if (day.accommodations && Array.isArray(day.accommodations)) {
        const accommodation = day.accommodations.find((acc: any) => 
          acc.option === (type === 'standard' ? 1 : type === 'optional' ? 2 : 3)
        ) || day.accommodations[0]; // Fallback to first if specific option not found

        if (accommodation) {
          accommodations.push({
            id: `${day.id}_${type}`,
            hotelName: accommodation.name || 'Unnamed Hotel',
            roomType: accommodation.roomType || 'Standard Room',
            nights: accommodation.nights || 1,
            pricePerNight: accommodation.pricePerNight || 0,
            numberOfRooms: accommodation.numberOfRooms || 1,
            totalPrice: (accommodation.pricePerNight || 0) * (accommodation.nights || 1) * (accommodation.numberOfRooms || 1),
            type,
            dayId: day.id,
            city: day.city || accommodation.city || ''
          });
        }
      }
    });

    return accommodations;
  };

  const calculateServiceCosts = () => {
    let sightseeingTotal = 0;
    let transportTotal = 0;
    let diningTotal = 0;
    let accommodationTotal = 0;
    let totalRooms = 0;
    let totalNights = 0;

    proposalData.days.forEach((day: any) => {
      // Sightseeing calculation
      if (day.activities) {
        day.activities.forEach((activity: any) => {
          if (activity.adultPrice && activity.childPrice) {
            sightseeingTotal += (activity.adultPrice * markupData.adults) + (activity.childPrice * markupData.children);
          } else if (activity.flatRate) {
            sightseeingTotal += activity.flatRate * markupData.totalPax;
          } else {
            sightseeingTotal += activity.finalCost || 0;
          }
        });
      }

      // Transport calculation
      if (day.transport) {
        transportTotal += day.transport.finalCost || 0;
      }

      // Dining calculation
      if (day.meals) {
        day.meals.forEach((meal: any) => {
          if (meal.adultPrice && meal.childPrice) {
            diningTotal += (meal.adultPrice * markupData.adults) + (meal.childPrice * markupData.children);
          } else if (meal.flatRate) {
            diningTotal += meal.flatRate * markupData.totalPax;
          } else {
            diningTotal += meal.cost || 0;
          }
        });
      }

      // Accommodation calculation
      if (day.accommodations && Array.isArray(day.accommodations)) {
        day.accommodations.forEach((accommodation: any) => {
          const roomCost = (accommodation.pricePerNight || 0) * (accommodation.nights || 1) * (accommodation.numberOfRooms || 1);
          accommodationTotal += roomCost;
          totalRooms += accommodation.numberOfRooms || 1;
          totalNights += accommodation.nights || 1;
        });
      }
    });

    return {
      sightseeing: { total: sightseeingTotal },
      transport: { 
        totalCost: transportTotal, 
        perPersonCost: transportTotal / markupData.totalPax 
      },
      dining: { total: diningTotal },
      accommodation: {
        totalCost: accommodationTotal,
        perPersonCost: accommodationTotal / markupData.totalPax,
        totalRooms,
        totalNights
      }
    };
  };

  const calculateMarkup = (baseAmount: number): number => {
    if (markupData.markupSettings.type === 'percentage') {
      return baseAmount * (markupData.markupSettings.percentage || 0) / 100;
    } else {
      // Slab-based markup
      const slab = markupData.markupSettings.slabs?.find(s => 
        baseAmount >= s.minAmount && baseAmount <= s.maxAmount
      );
      return slab ? baseAmount * slab.percentage / 100 : 0;
    }
  };

  const calculateDistribution = (finalTotal: number) => {
    const adultPrice = finalTotal / markupData.adults;
    const childPrice = finalTotal / markupData.children || 0;
    
    return {
      method: 'separate' as const,
      adultPrice,
      childPrice,
      totalPrice: finalTotal
    };
  };

  const formatCurrency = (amount: number) => {
    const { symbol, code } = currency;
    if (code === 'THB' || code === 'INR') {
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
  const baseAmountForCalculations = selectedOption?.baseTotal || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Comprehensive Pricing Management</h2>
      </div>

      {/* Base Amount Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Base Cost Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(baseAmountForCalculations)}
            </div>
            <p className="text-muted-foreground">
              Base cost for {query?.paxDetails.adults || 1} adults
              {query?.paxDetails.children ? ` and ${query.paxDetails.children} children` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accommodation Options */}
      <section>
        <AccommodationOptionsManager
          formatCurrency={formatCurrency}
          queryId={query?.id}
        />
      </section>

      <Separator />

      {/* Service Cost Breakdown */}
      <section>
        {selectedOption && (
          <ServiceCostCalculator
            markupData={markupData}
            formatCurrency={formatCurrency}
          />
        )}
      </section>

      <Separator />

      {/* Markup Configuration */}
      <section>
        <MarkupSlabManager
          markupSettings={markupData.markupSettings}
          onSettingsChange={(settings) => setMarkupData(prev => ({ ...prev, markupSettings: settings }))}
          formatCurrency={formatCurrency}
        />
      </section>

      <Separator />

      {/* Discount Management */}
      <section>
        <DiscountEditor
          discounts={discounts}
          onDiscountsChange={setDiscounts}
          baseAmount={baseAmountForCalculations + (selectedOption?.markup || 0)}
          formatCurrency={formatCurrency}
        />
      </section>

      <Separator />

      {/* Tax Configuration */}
      <section>
        <TaxSelector
          baseAmount={baseAmountForCalculations + (selectedOption?.markup || 0)}
          countryCode={countryCode}
          onTaxChange={setTaxResult}
          formatCurrency={formatCurrency}
        />
      </section>

      <Separator />

      {/* Pricing Distribution */}
      <section>
        {selectedOption && (
          <PricingDistributionCalculator
            markupData={markupData}
            formatCurrency={formatCurrency}
          />
        )}
      </section>

      <Separator />

      {/* Final Summary */}
      <section>
        {selectedOption && (
          <FinalPricingSummaryCard
            markupData={markupData}
            discounts={discounts}
            taxResult={taxResult}
            formatCurrency={formatCurrency}
          />
        )}
      </section>
    </div>
  );
};