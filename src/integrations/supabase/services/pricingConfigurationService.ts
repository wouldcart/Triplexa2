import { supabase } from '@/integrations/supabase/client';
import { PricingSettings, MarkupSlab } from '@/types/pricing';
import { CountriesService } from '@/integrations/supabase/services/countriesService';

// Minimal Supabase-backed CRUD for unified pricing configuration.
// Maps to existing PricingSettings shape without breaking current UI logic.

// Pricing configuration row matching public.pricing_configurations schema,
// extended with legacy fields to preserve existing UI type usage.
export type PricingConfigurationRow = {
  id: string;
  config_name: string;
  is_active: boolean;
  default_markup_percentage: number;
  use_slab_pricing: boolean;
  slab_application_mode: 'per-person' | 'total';
  enable_country_based_pricing: boolean;
  default_country: string | null;
  base_currency: string;
  auto_update_rates: boolean;
  update_frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  show_pricing_to_agents: boolean;
  show_pricing_to_staff: boolean;
  allow_staff_pricing_edit: boolean;
  show_cost_breakdown: boolean;
  hide_markup_from_agents: boolean;
  minimum_markup_amount: number | null;
  maximum_markup_percentage: number | null;
  round_final_price: boolean;
  rounding_method: 'up' | 'down' | 'nearest';
  rounding_increment: number;
  apply_tax_after_markup: boolean;
  tax_inclusive_pricing: boolean;
  created_at?: string;
  updated_at?: string;

  // Legacy fields maintained for compatibility with existing UI logic
  country_code?: string;
  country_name?: string;
  currency?: string;
  currency_symbol?: string;
  base_markup_percentage?: number; // legacy alias
  slab_markup_enabled?: boolean; // legacy alias
  is_default?: boolean; // not in DB, used in UI
  tier_multiplier?: number | null;
  seasonal_adjustment?: number | null;
  minimum_markup?: number | null;
  maximum_markup?: number | null;
};

// Markup slab row matching public.markup_slabs schema
export type PricingMarkupSlabRow = {
  id: string;
  config_id: string;
  slab_name: string | null;
  description: string | null;
  min_amount: number;
  max_amount: number;
  markup_type: 'percentage' | 'fixed' | 'hybrid';
  additional_percentage: number;
  fixed_amount: number | null;
  is_active: boolean;
  priority: number;
  application_mode_override?: 'per-person' | 'total' | null;
  created_at?: string;
  updated_at?: string;
};

const CONFIG_TABLE = 'pricing_configurations';
const SLABS_TABLE = 'markup_slabs';
const DEFAULT_CONFIG_NAME = 'Default Pricing Configuration';

// Use a relaxed client to avoid compile-time coupling to generated DB types
const sb: any = supabase;

export const PricingConfigurationService = {
  async listConfigurations(): Promise<PricingConfigurationRow[]> {
    const { data, error } = await sb
      .from(CONFIG_TABLE)
      .select('*')
      .order('config_name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as PricingConfigurationRow[];
  },

  async getDefaultConfiguration(): Promise<PricingConfigurationRow | null> {
    try {
      // Prefer seeded default by name; fall back to latest active
      const { data: byName } = await sb
        .from(CONFIG_TABLE)
        .select('*')
        .eq('config_name', DEFAULT_CONFIG_NAME)
        .limit(1)
        .single();
      if (byName) return byName as PricingConfigurationRow;

      const { data: latestActive } = await sb
        .from(CONFIG_TABLE)
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      return (latestActive ?? null) as PricingConfigurationRow | null;
    } catch (error: any) {
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
  },

  // Legacy helper retained for compatibility; maps to default_country
  async getConfigurationByCountry(countryCode: string): Promise<PricingConfigurationRow | null> {
    try {
      const { data } = await sb
        .from(CONFIG_TABLE)
        .select('*')
        .eq('default_country', countryCode)
        .limit(1)
        .single();
      return (data ?? null) as PricingConfigurationRow | null;
    } catch (error: any) {
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
  },

  // Upserts the main pricing configuration, mapping legacy inputs to new schema.
  async upsertConfiguration(row: Partial<PricingConfigurationRow> & { country_code: string }): Promise<PricingConfigurationRow> {
    // Ensure a default configuration exists. If none found, create one
    // enriched with country metadata so NOT NULL constraints (e.g. country_name,
    // currency_symbol) are satisfied in first insert.
    let current = await this.getDefaultConfiguration();
    if (!current) {
      try {
        await this.setDefaultConfiguration(row.country_code, row.currency);
        current = await this.getDefaultConfiguration();
      } catch (e) {
        // If creation fails, surface the error to caller
        throw e;
      }
      if (!current) {
        throw new Error('Failed to initialize default pricing configuration');
      }
    }
    const updates: Partial<PricingConfigurationRow> = {
      config_name: current?.config_name ?? DEFAULT_CONFIG_NAME,
      is_active: row.is_active ?? current?.is_active ?? true,
      default_markup_percentage: (row.base_markup_percentage ?? current?.default_markup_percentage ?? 10) as number,
      use_slab_pricing: (row.slab_markup_enabled ?? current?.use_slab_pricing ?? false) as boolean,
      enable_country_based_pricing: (row.enable_country_based_pricing ?? current?.enable_country_based_pricing ?? false) as boolean,
      // Provide both legacy and new schema fields
      country_code: row.country_code ?? current?.country_code ?? current?.default_country ?? null,
      default_country: row.country_code ?? current?.default_country ?? null,
      base_currency: row.currency ?? current?.base_currency ?? 'USD',
      // Include legacy `currency` to satisfy DBs with NOT NULL constraints
      currency: row.currency ?? current?.currency ?? row.base_currency ?? current?.base_currency ?? 'USD',
    };

    // Ensure NOT NULL fields when inserts occur via upsert
    if (!current?.country_name || !current?.currency_symbol || !updates.country_name || !updates.currency_symbol) {
      const code = updates.default_country ?? row.country_code;
      try {
        const meta = code ? await CountriesService.getByCode(code) : null;
        if (meta) {
          updates.country_name = updates.country_name ?? meta.name;
          updates.currency_symbol = updates.currency_symbol ?? meta.currency_symbol;
          updates.currency = updates.currency ?? meta.currency;
          updates.base_currency = updates.base_currency ?? meta.currency;
        } else {
          updates.country_name = updates.country_name ?? (code ?? 'Unknown');
          updates.currency_symbol = updates.currency_symbol ?? '$';
        }
      } catch {
        updates.country_name = updates.country_name ?? (code ?? 'Unknown');
        updates.currency_symbol = updates.currency_symbol ?? '$';
      }
    }

    const payload: any = current?.id ? { id: current.id, ...updates } : { ...updates };
    const { data, error } = await sb
      .from(CONFIG_TABLE)
      .upsert(payload, { onConflict: 'id' })
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
        .eq('config_id', configurationId)
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
        .eq('config_id', configurationId);
      if (delErr) throw delErr;

      if (!slabs || slabs.length === 0) return;

      const rows = slabs.map((s) => ({
        config_id: configurationId,
        slab_name: s.name,
        description: null,
        min_amount: s.minAmount ?? 0,
        max_amount: s.maxAmount ?? 0,
        markup_type: s.markupType,
        additional_percentage: s.markupType === 'percentage' ? s.markupValue : 0,
        fixed_amount: s.markupType === 'fixed' ? s.markupValue : 0,
        is_active: s.isActive,
        priority: 1,
        application_mode_override: null,
      }));

      const { error: insErr } = await sb
        .from(SLABS_TABLE)
        .insert(rows);
      if (insErr) throw insErr;
    } catch (err) {
      console.warn('Unable to persist markup slabs to Supabase; keeping local copy only.', err);
    }
  },

  // Create a single markup slab for a configuration
  async createMarkupSlab(configurationId: string, slab: MarkupSlab): Promise<PricingMarkupSlabRow> {
    const payload: Omit<PricingMarkupSlabRow, 'id' | 'created_at' | 'updated_at'> = {
      config_id: configurationId,
      slab_name: slab.name,
      description: null,
      min_amount: slab.minAmount ?? 0,
      max_amount: slab.maxAmount ?? 0,
      markup_type: slab.markupType,
      additional_percentage: slab.markupType === 'percentage' ? slab.markupValue : 0,
      fixed_amount: slab.markupType === 'fixed' ? slab.markupValue : 0,
      is_active: slab.isActive,
      priority: 1,
      application_mode_override: null,
    };
    const { data, error } = await sb
      .from(SLABS_TABLE)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as PricingMarkupSlabRow;
  },

  // Read a single markup slab by id
  async getMarkupSlabById(slabId: string): Promise<PricingMarkupSlabRow | null> {
    try {
      const { data } = await sb
        .from(SLABS_TABLE)
        .select('*')
        .eq('id', slabId)
        .single();
      return (data ?? null) as PricingMarkupSlabRow | null;
    } catch (error: any) {
      if (error?.code === 'PGRST116') return null;
      throw error;
    }
  },

  // Update a single markup slab by id
  async updateMarkupSlab(slabId: string, slab: Partial<MarkupSlab>): Promise<PricingMarkupSlabRow> {
    const updates: Partial<PricingMarkupSlabRow> = {};
    if (typeof slab.name !== 'undefined') updates.slab_name = slab.name ?? null;
    if (typeof slab.minAmount !== 'undefined') updates.min_amount = slab.minAmount ?? 0;
    if (typeof slab.maxAmount !== 'undefined') updates.max_amount = slab.maxAmount ?? 0;
    if (typeof slab.markupType !== 'undefined') updates.markup_type = slab.markupType as any;
    if (typeof slab.markupValue !== 'undefined' && slab.markupType === 'percentage') updates.additional_percentage = slab.markupValue ?? 0;
    if (typeof slab.markupValue !== 'undefined' && slab.markupType === 'fixed') updates.fixed_amount = slab.markupValue ?? 0;
    if (typeof slab.isActive !== 'undefined') updates.is_active = Boolean(slab.isActive);

    const { data, error } = await sb
      .from(SLABS_TABLE)
      .update(updates)
      .eq('id', slabId)
      .select()
      .single();
    if (error) throw error;
    return data as PricingMarkupSlabRow;
  },

  // Delete a single markup slab by id
  async deleteMarkupSlab(slabId: string): Promise<void> {
    const { error } = await sb
      .from(SLABS_TABLE)
      .delete()
      .eq('id', slabId);
    if (error) throw error;
  },

  // Convenience: toggle or set is_active for a slab
  async updateMarkupSlabStatus(slabId: string, isActive: boolean): Promise<PricingMarkupSlabRow> {
    const { data, error } = await sb
      .from(SLABS_TABLE)
      .update({ is_active: isActive })
      .eq('id', slabId)
      .select()
      .single();
    if (error) throw error;
    return data as PricingMarkupSlabRow;
  },

  // Bulk: set is_active for all slabs tied to a configuration
  async updateAllMarkupSlabStatusForConfig(configurationId: string, isActive: boolean): Promise<number> {
    const { data, error } = await sb
      .from(SLABS_TABLE)
      .update({ is_active: isActive })
      .eq('config_id', configurationId)
      .select('id');
    if (error) throw error;
    return Array.isArray(data) ? data.length : 0;
  },

  // Helpers to map Supabase rows into existing PricingSettings shape
  async toPricingSettings(config: PricingConfigurationRow | null): Promise<PricingSettings | null> {
    if (!config) return null;
    const slabs = await this.listMarkupSlabs(config.id);
    const mappedSlabs: MarkupSlab[] = slabs.map((r) => ({
      id: r.id,
      name: r.slab_name ?? 'Unnamed Slab',
      minAmount: Number(r.min_amount ?? 0),
      maxAmount: Number(r.max_amount ?? 0),
      markupType: r.markup_type === 'fixed' ? 'fixed' : 'percentage',
      markupValue:
        r.markup_type === 'fixed'
          ? Number(r.fixed_amount ?? 0)
          : Number(r.additional_percentage ?? 0),
      currency: config.base_currency ?? 'USD',
      isActive: Boolean(r.is_active),
      createdAt: r.created_at ?? new Date().toISOString(),
      updatedAt: r.updated_at ?? new Date().toISOString(),
    }));

    const settings: PricingSettings = {
      defaultMarkupPercentage: Number(config.default_markup_percentage ?? 10),
      useSlabPricing: Boolean(config.use_slab_pricing ?? false),
      slabApplicationMode: (config.slab_application_mode ?? 'total') as 'per-person' | 'total',
      markupSlabs: mappedSlabs,
      showPricingToAgents: Boolean(config.show_pricing_to_agents ?? true),
      showPricingToStaff: Boolean(config.show_pricing_to_staff ?? true),
      allowStaffPricingEdit: Boolean(config.allow_staff_pricing_edit ?? true),
    };
    return settings;
  },

  async setDefaultConfiguration(countryCode: string, currency?: string): Promise<PricingConfigurationRow> {
    // Fetch country metadata for safe defaults
    let countryMeta: { name: string; currency: string; currency_symbol: string } | null = null;
    try {
      const found = await CountriesService.getByCode(countryCode);
      if (found) {
        countryMeta = {
          name: found.name,
          currency: found.currency,
          currency_symbol: found.currency_symbol,
        };
      }
    } catch (err) {
      console.warn('Failed to fetch country metadata; applying safe defaults.', err);
    }

    const current = await this.getDefaultConfiguration();
    const payload: Partial<PricingConfigurationRow> = {
      id: current?.id,
      config_name: current?.config_name ?? DEFAULT_CONFIG_NAME,
      is_active: true,
      // Support legacy schema requiring country_code, and newer default_country
      country_code: countryCode,
      default_country: countryCode,
      base_currency: currency ?? countryMeta?.currency ?? current?.base_currency ?? 'USD',
      // Persist legacy `currency` alongside `base_currency`
      currency: currency ?? countryMeta?.currency ?? current?.currency ?? current?.base_currency ?? 'USD',
      default_markup_percentage: current?.default_markup_percentage ?? 10,
      use_slab_pricing: current?.use_slab_pricing ?? false,
    };

    // Enrich with country name and symbol when available
    if (countryMeta) {
      payload.country_name = countryMeta.name;
      payload.currency_symbol = countryMeta.currency_symbol;
    } else {
      // Provide safe fallbacks to satisfy NOT NULL constraints
      payload.country_name = countryCode;
      payload.currency_symbol = '$';
    }

    const { data, error } = await sb
      .from(CONFIG_TABLE)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as PricingConfigurationRow;
  },
};