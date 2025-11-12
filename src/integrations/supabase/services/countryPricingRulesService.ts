import { supabase } from '@/integrations/supabase/client';
import { CountryPricingRule } from '@/types/countryPricing';
import { PricingConfigurationService } from '@/integrations/supabase/services/pricingConfigurationService';

// Supabase-backed CRUD for public.country_pricing_rules
// Avoids local fallbacks and matches UI CountryPricingRule shape

export type CountryPricingRuleRow = {
  id: string;
  config_id: string;
  country_code: string;
  country_name: string;
  currency: string;
  currency_symbol: string;
  pricing_currency: string | null;
  pricing_currency_symbol: string | null;
  default_markup: number; // numeric(5,2)
  markup_type: 'percentage' | 'fixed';
  tier: 'budget' | 'standard' | 'premium' | 'luxury';
  tier_multiplier: number; // numeric(5,2)
  region: string | null;
  conversion_margin: number; // numeric(5,2)
  seasonal_adjustment: number | null;
  is_active: boolean;
  is_popular: boolean;
  created_at?: string;
  updated_at?: string;
};

const TABLE = 'country_pricing_rules';
const sb: any = supabase;

export function toUI(row: CountryPricingRuleRow): CountryPricingRule {
  return {
    id: row.id,
    countryCode: row.country_code,
    countryName: row.country_name,
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    defaultMarkup: Number(row.default_markup ?? 0),
    markupType: row.markup_type,
    isActive: !!row.is_active,
    region: row.region ?? '',
    tier: row.tier,
    conversionMargin: Number(row.conversion_margin ?? 0),
    seasonalAdjustment: row.seasonal_adjustment ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function toRow(configId: string, rule: Partial<CountryPricingRule>): Partial<CountryPricingRuleRow> {
  return {
    config_id: configId,
    country_code: rule.countryCode!,
    country_name: rule.countryName ?? rule.countryCode!,
    currency: rule.currency!,
    currency_symbol: rule.currencySymbol!,
    default_markup: Number(rule.defaultMarkup ?? 0),
    markup_type: (rule.markupType ?? 'percentage') as 'percentage' | 'fixed',
    tier: (rule.tier ?? 'standard') as CountryPricingRuleRow['tier'],
    tier_multiplier: 1.0,
    region: rule.region ?? null,
    conversion_margin: Number(rule.conversionMargin ?? 0),
    seasonal_adjustment: rule.seasonalAdjustment ?? null,
    is_active: rule.isActive ?? true,
    is_popular: false,
  };
}

export const CountryPricingRulesSupabase = {
  async listByConfig(configurationId: string): Promise<CountryPricingRuleRow[]> {
    const { data, error } = await sb
      .from(TABLE)
      .select('*')
      .eq('config_id', configurationId)
      .order('country_code', { ascending: true });
    if (error) throw error;
    return (data ?? []) as CountryPricingRuleRow[];
  },

  async getByCountry(configurationId: string, countryCode: string): Promise<CountryPricingRuleRow | null> {
    try {
      const { data } = await sb
        .from(TABLE)
        .select('*')
        .eq('config_id', configurationId)
        .eq('country_code', countryCode)
        .limit(1)
        .single();
      return (data ?? null) as CountryPricingRuleRow | null;
    } catch (err: any) {
      if (err?.code === 'PGRST116') return null;
      throw err;
    }
  },

  async create(configurationId: string, rule: Partial<CountryPricingRule>): Promise<CountryPricingRuleRow> {
    const payload = toRow(configurationId, rule);
    const { data, error } = await sb
      .from(TABLE)
      .upsert(payload, { onConflict: 'config_id,country_code' })
      .select()
      .single();
    if (error) throw error;
    return data as CountryPricingRuleRow;
  },

  async update(ruleId: string, updates: Partial<CountryPricingRule>): Promise<CountryPricingRuleRow> {
    const defaultConfig = await PricingConfigurationService.getDefaultConfiguration();
    if (!defaultConfig?.id) throw new Error('Default pricing configuration not found');
    const mapped = toRow(defaultConfig.id, updates);
    const { data, error } = await sb
      .from(TABLE)
      .update(mapped)
      .eq('id', ruleId)
      .select()
      .single();
    if (error) throw error;
    return data as CountryPricingRuleRow;
  },

  async delete(ruleId: string): Promise<void> {
    const { error } = await sb
      .from(TABLE)
      .delete()
      .eq('id', ruleId);
    if (error) throw error;
  },

  async toggleStatus(ruleId: string, isActive: boolean): Promise<CountryPricingRuleRow> {
    const { data, error } = await sb
      .from(TABLE)
      .update({ is_active: isActive })
      .eq('id', ruleId)
      .select()
      .single();
    if (error) throw error;
    return data as CountryPricingRuleRow;
  },
};