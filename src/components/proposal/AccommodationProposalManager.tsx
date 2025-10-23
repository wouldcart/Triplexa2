import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Hotel, Eye, Send, Settings, Package, Users, Calendar, DollarSign, CheckCircle2, FileText, MapPin } from 'lucide-react';
import { Query } from '@/types/query';
import { AccommodationStay } from '@/utils/accommodationCalculations';
import { calculateAccommodationOptionsPricing, OptionPricingBreakdown, AccommodationPricingBreakdown } from '@/utils/accommodationPricingUtils';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { formatCurrency } from '@/utils/currencyUtils';
import { AccommodationPricingBreakdown as AccommodationPricingBreakdownComponent } from '@/components/proposal/pricing/AccommodationPricingBreakdown';
import { MultiOptionProposalPreview } from './MultiOptionProposalPreview';
import { ItineraryDay } from './DayByDayItineraryBuilder';
interface AccommodationProposalManagerProps {
  query: Query;
  accommodations: AccommodationStay[];
  days?: ItineraryDay[];
  onSendProposal?: (options: OptionPricingBreakdown[]) => void;
}
interface ProposalSettings {
  showPricingBreakdown: boolean;
  separateAdultChild: boolean;
  includeMarkup: boolean;
  markupPercentage: number;
  applyTax: boolean;
  taxPercentage: number;
  includeAllOptions: boolean;
}
export const AccommodationProposalManager: React.FC<AccommodationProposalManagerProps> = ({
  query,
  accommodations,
  days = [],
  onSendProposal
}) => {
  const [proposalSettings, setProposalSettings] = useState<ProposalSettings>({
    showPricingBreakdown: true,
    separateAdultChild: true,
    includeMarkup: true,
    markupPercentage: 15,
    applyTax: true,
    taxPercentage: 12,
    includeAllOptions: true
  });
  const [optionsPricing, setOptionsPricing] = useState<OptionPricingBreakdown[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Group accommodations by option number
  const accommodationsByOption = {
    1: accommodations.filter(acc => acc.optionNumber === 1),
    2: accommodations.filter(acc => acc.optionNumber === 2),
    3: accommodations.filter(acc => acc.optionNumber === 3)
  };

  // Get available options (only those with accommodations)
  const availableOptions = [1, 2, 3].filter(optionNum => accommodationsByOption[optionNum as keyof typeof accommodationsByOption].length > 0);

  // Calculate pricing for all options
  useEffect(() => {
    if (accommodations.length > 0) {
      const pricingBreakdowns = calculateAccommodationOptionsPricing(accommodations, query);
      setOptionsPricing(pricingBreakdowns);
    }
  }, [accommodations, query]);

  // Apply markup and tax to pricing
  const getEnhancedPricing = (optionBreakdown: OptionPricingBreakdown): OptionPricingBreakdown & {
    withMarkup: number;
    withTax: number;
    finalTotal: number;
  } => {
    const baseTotal = optionBreakdown.totalCost;

    // Apply markup
    const markupAmount = proposalSettings.includeMarkup ? baseTotal * proposalSettings.markupPercentage / 100 : 0;
    const withMarkup = baseTotal + markupAmount;

    // Apply tax
    const taxResult = proposalSettings.applyTax ? TaxCalculationService.calculateTax(withMarkup, query.destination.country || 'IN', 'accommodation') : 0;
    const taxAmount = typeof taxResult === 'number' ? taxResult : taxResult.taxAmount;
    const finalTotal = withMarkup + taxAmount;
    return {
      ...optionBreakdown,
      withMarkup,
      withTax: taxAmount,
      finalTotal
    };
  };
  const enhancedPricingOptions = optionsPricing.map(getEnhancedPricing);
  const handleSendProposal = () => {
    if (onSendProposal) {
      onSendProposal(optionsPricing);
    }
  };

  // Don't show if less than 2 options
  if (availableOptions.length < 2) {
    return <Card className="bg-muted/30">
        <CardContent className="p-6 text-center">
          <Hotel className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Add 2 or more accommodation options to enable proposal management</p>
          <p className="text-sm text-muted-foreground mt-1">
            Currently {availableOptions.length} option(s) available
          </p>
        </CardContent>
      </Card>;
  }
  return;
};