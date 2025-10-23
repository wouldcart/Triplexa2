import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign } from 'lucide-react';
import { Query } from '@/types/query';
import { EnhancedMarkupData, AccommodationPricingOption, MarkupSettings } from '@/types/enhancedMarkup';
import { AccommodationOptionsManager } from './AccommodationOptionsManager';
import { ServiceCostCalculator } from './ServiceCostCalculator';
import { MarkupSlabManager } from './MarkupSlabManager';
import { PricingDistributionCalculator } from './PricingDistributionCalculator';
import { ComprehensivePricingTable } from './ComprehensivePricingTable';
import { getCurrencyByCountry } from '@/utils/currencyUtils';
import { useAccommodationStore } from '@/stores/useAccommodationStore';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';

interface EnhancedMarkupModuleProps {
  proposalData?: any;
  query?: Query;
  onPricingUpdate?: (pricing: any) => void;
}

export const EnhancedMarkupModule: React.FC<EnhancedMarkupModuleProps> = ({
  proposalData,
  query,
  onPricingUpdate
}) => {
  const queryId = query?.id || '';
  const { 
    selectedAccommodations, 
    loading: accommodationLoading,
    saveSelectedAccommodations 
  } = useAccommodationStore(queryId);
  
  const { 
    data: persistenceData, 
    updateAccommodationData 
  } = useProposalPersistence(queryId);
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

  const currency = getCurrencyByCountry(query?.destination?.country || 'Thailand');

  // Extract itinerary details and calculate pricing options
  useEffect(() => {
    if (proposalData?.days || selectedAccommodations.length > 0) {
      calculatePricingOptions();
    }
  }, [proposalData, markupData.markupSettings, selectedAccommodations]);

  // Sync accommodation data with persistence
  useEffect(() => {
    if (markupData.options.length > 0) {
      updateAccommodationData({
        selectedAccommodations,
        markupData
      });
    }
  }, [markupData, selectedAccommodations, updateAccommodationData]);

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
    // First check if we have accommodations from the store
    if (selectedAccommodations.length > 0) {
      return selectedAccommodations.filter(acc => acc.type === type);
    }

    // Fallback to extracting from proposal data
    if (!proposalData?.days) return [];
    
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Enhanced Markup Management</h2>
      </div>

      <Tabs defaultValue="accommodations" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accommodations">Hotels</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="markup">Markup</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="accommodations" className="space-y-4">
          <AccommodationOptionsManager
            formatCurrency={formatCurrency}
            queryId={queryId}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <ServiceCostCalculator
            markupData={markupData}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="markup" className="space-y-4">
          <MarkupSlabManager
            markupSettings={markupData.markupSettings}
            onSettingsChange={(settings) => setMarkupData(prev => ({ ...prev, markupSettings: settings }))}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <PricingDistributionCalculator
            markupData={markupData}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <ComprehensivePricingTable
            markupData={markupData}
            formatCurrency={formatCurrency}
            onOptionSelect={(option) => setMarkupData(prev => ({ ...prev, selectedOption: option }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};