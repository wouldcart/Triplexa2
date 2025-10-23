import React from 'react';
import { Query } from '@/types/query';
import { SinglePagePricingModule } from './SinglePagePricingModule';
interface AdvancedPricingModuleProps {
  proposalData?: any;
  query?: Query;
  team?: any[];
  currencyCode?: string;
  onPricingUpdate?: (pricing: any) => void;
  useEnhancedMarkup?: boolean;
}
export const AdvancedPricingModule: React.FC<AdvancedPricingModuleProps> = ({
  proposalData,
  query,
  team,
  currencyCode,
  onPricingUpdate,
  useEnhancedMarkup = true
}) => {
  // Use the new single-page design instead of tabs
  return (
    <SinglePagePricingModule
      proposalData={proposalData}
      query={query}
      onPricingUpdate={onPricingUpdate}
    />
  );
};