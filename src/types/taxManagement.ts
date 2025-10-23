
export interface TaxConfiguration {
  id: string;
  countryCode: string;
  taxType: 'GST' | 'VAT' | 'SALES_TAX' | 'NONE';
  isActive: boolean;
  taxRates: TaxRate[];
  tdsConfiguration?: TDSConfiguration;
  exemptions: TaxExemption[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxRate {
  id: string;
  serviceType: 'transport' | 'hotel' | 'sightseeing' | 'restaurant' | 'activity' | 'all';
  rate: number;
  description: string;
  isDefault: boolean;
}

export interface TDSConfiguration {
  isApplicable: boolean;
  rate: number;
  threshold: number;
  exemptionLimit: number;
  companyRegistration?: string;
}

export interface TaxExemption {
  id: string;
  serviceType: string;
  reason: string;
  isActive: boolean;
}

export interface TaxCalculationResult {
  baseAmount: number;
  taxAmount: number;
  tdsAmount?: number;
  totalAmount: number;
  taxBreakdown: TaxBreakdownItem[];
  isInclusive: boolean;
}

export interface TaxBreakdownItem {
  type: string;
  rate: number;
  amount: number;
  description: string;
}

export interface EnhancedMarkupRule {
  id: string;
  countryCode: string;
  baseMarkupPercentage: number;
  slabMarkupEnabled: boolean;
  slabRules: MarkupSlabRule[];
  tierMultiplier: number;
  seasonalAdjustment?: number;
  minimumMarkup?: number;
  maximumMarkup?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupSlabRule {
  id: string;
  minAmount: number;
  maxAmount: number;
  additionalPercentage: number;
  fixedAmount?: number;
  description: string;
}
