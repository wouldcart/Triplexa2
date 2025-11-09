import { supabase } from '@/integrations/supabase/client';
import { PricingSettings, MarkupSlab } from '@/types/pricing';

// Minimal Supabase-backed CRUD for unified pricing configuration.
// Maps to existing PricingSettings shape without breaking current UI logic.

export type PricingConfigurationRow = {
  id: string;
  country_code: string;
  country_name: string;
  currency: string;
  currency_symbol: string;
  tax_type: 'GST' | 'VAT' | 'SALES_TAX' | 'NONE';
  tax_enabled: boolean;
  tds_enabled: boolean;
  tds_rate: number | null;
  tds_threshold: number | null;
  tds_exemption_limit: number | null;
  tds_company_registration: string | null;
  base_markup_percentage: number;
  slab_markup_enabled: boolean;
  tier_multiplier: number | null;
  seasonal_adjustment: number | null;
  minimum_markup: number | null;
  maximum_markup: number | null;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PricingMarkupSlabRow = {
  id: string;
  configuration_id: string;
  name: string;
  min_amount: number | null;
  max_amount: number | null;
  markup_percentage: number;
  created_at?: string;
  updated_at?: string;
};

const CONFIG_TABLE = 'pricing_configurations';
const SLABS_TABLE = 'pricing_markup_slabs';

// Use a relaxed client to avoid compile-time coupling to generated DB types
const sb: any = supabase;

export const PricingConfigurationService = {
  async listConfigurations(): Promise<PricingConfigurationRow[]> {
    const { data, error } = await sb
      .from(CONFIG_TABLE)
      .select('*')
      .order('country_code', { ascending: true });
    if (error) throw error;
    return (data ?? []) as PricingConfigurationRow[];
  },

  async getDefaultConfiguration(): Promise<PricingConfigurationRow | null> {
    try {
      const { data } = await sb
        .from(CONFIG_TABLE)
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .limit(1)
        .single();
      return (data ?? null) as PricingConfigurationRow | null;
    } catch (error: any) {
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
  },

  async getConfigurationByCountry(countryCode: string): Promise<PricingConfigurationRow | null> {
    try {
      const { data } = await sb
        .from(CONFIG_TABLE)
        .select('*')
        .eq('country_code', countryCode)
        .limit(1)
        .single();
      return (data ?? null) as PricingConfigurationRow | null;
    } catch (error: any) {
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
  },

  async upsertConfiguration(row: Partial<PricingConfigurationRow> & { country_code: string }): Promise<PricingConfigurationRow> {
    const { data, error } = await sb
      .from(CONFIG_TABLE)
      .upsert(row, { onConflict: 'country_code' })
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('Upsert configuration returned no data');
    return data as PricingConfigurationRow;
  },

  async deleteConfiguration(id: string): Promise<void> {
    const { error } = await sb
      .from(CONFIG_TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async listMarkupSlabs(configurationId: string): Promise<PricingMarkupSlabRow[]> {
    try {
      const { data, error } = await sb
        .from(SLABS_TABLE)
        .select('*')
        .eq('configuration_id', configurationId)
        .order('min_amount', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PricingMarkupSlabRow[];
    } catch (err) {
      console.warn('Markup slabs table not available or query failed; proceeding with empty slabs.', err);
      return [];
    }
  },

  async replaceMarkupSlabs(configurationId: string, slabs: MarkupSlab[]): Promise<void> {
    try {
      const { error: delErr } = await sb
        .from(SLABS_TABLE)
        .delete()
        .eq('configuration_id', configurationId);
      if (delErr) throw delErr;

      if (!slabs || slabs.length === 0) return;

      const rows: Omit<PricingMarkupSlabRow, 'id'>[] = slabs.map((s) => ({
        configuration_id: configurationId,
        name: s.name,
        min_amount: s.minAmount ?? null,
        max_amount: s.maxAmount ?? null,
        markup_percentage: s.markupType === 'percentage' ? s.markupValue : 0,
      }));

      const { error: insErr } = await sb
        .from(SLABS_TABLE)
        .insert(rows);
      if (insErr) throw insErr;
    } catch (err) {
      console.warn('Unable to persist markup slabs to Supabase; keeping local copy only.', err);
    }
  },

  // Helpers to map Supabase rows into existing PricingSettings shape
  async toPricingSettings(config: PricingConfigurationRow | null): Promise<PricingSettings | null> {
    if (!config) return null;
    const slabs = await this.listMarkupSlabs(config.id);
    const mappedSlabs: MarkupSlab[] = slabs.map((r) => ({
      id: r.id,
      name: r.name,
      minAmount: r.min_amount ?? 0,
      maxAmount: r.max_amount ?? 0,
      markupType: 'percentage',
      markupValue: r.markup_percentage ?? 0,
      currency: config.currency,
      isActive: true,
      createdAt: r.created_at ?? new Date().toISOString(),
      updatedAt: r.updated_at ?? new Date().toISOString(),
    }));

    const settings: PricingSettings = {
      defaultMarkupPercentage: config.base_markup_percentage ?? 10,
      useSlabPricing: config.slab_markup_enabled ?? false,
      slabApplicationMode: 'total',
      markupSlabs: mappedSlabs,
      showPricingToAgents: true,
      showPricingToStaff: true,
      allowStaffPricingEdit: true,
    };
    return settings;
  },

  async setDefaultConfiguration(countryCode: string, currency?: string): Promise<PricingConfigurationRow> {
    // Clear any existing default
    await sb
      .from(CONFIG_TABLE)
      .update({ is_default: false })
      .eq('is_default', true);

    // Ensure configuration exists and mark as default
    const row: Partial<PricingConfigurationRow> & { country_code: string } = {
      country_code: countryCode,
      currency: currency ?? 'USD',
      is_active: true,
      is_default: true,
      base_markup_percentage: 10,
      slab_markup_enabled: false,
    } as any;

    const { data, error } = await sb
      .from(CONFIG_TABLE)
      .upsert(row, { onConflict: 'country_code' })
      .select()
      .single();
    if (error) throw error;
    return data as PricingConfigurationRow;
  },
};