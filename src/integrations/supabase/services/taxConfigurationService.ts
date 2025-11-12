import { supabase } from '@/integrations/supabase/client';
import { TaxConfiguration, TaxRate, TDSConfiguration } from '@/types/taxManagement';

// Supabase row type for tax_configurations table
export type TaxConfigurationRow = {
  id: string;
  config_id: string;
  country_code: string;
  region_code: string | null;
  tax_type: 'GST' | 'VAT' | 'SALES_TAX' | 'SERVICE_TAX' | 'NONE';
  tax_name: string;
  default_rate: number | null;
  hotel_rate: number | null;
  transport_rate: number | null;
  sightseeing_rate: number | null;
  restaurant_rate: number | null;
  activity_rate: number | null;
  tds_applicable: boolean;
  tds_rate: number | null;
  tds_threshold: number | null;
  tds_exemption_limit: number | null;
  is_inclusive: boolean;
  compound_tax: boolean;
  tax_registration_number: string | null;
  company_registration: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const sb: any = supabase;

// Lock to the canonical table per requirements
const TAX_TABLE = 'tax_configurations';

export async function getActiveTable(): Promise<string> {
  // Always report canonical table; keeps UI consistent and avoids noisy detection logs
  return TAX_TABLE;
}

function toTaxRates(row: TaxConfigurationRow): TaxRate[] {
  const rates: TaxRate[] = [];
  if (row.default_rate && row.default_rate > 0) {
    rates.push({
      id: `${row.id}-all`,
      serviceType: 'all',
      rate: Number(row.default_rate),
      description: row.tax_name || 'Default Tax',
      isDefault: true,
    });
  }
  const serviceMap: Array<{ key: keyof TaxConfigurationRow; type: TaxRate['serviceType']; label: string }> = [
    { key: 'hotel_rate', type: 'hotel', label: 'Hotel Tax' },
    { key: 'transport_rate', type: 'transport', label: 'Transport Tax' },
    { key: 'sightseeing_rate', type: 'sightseeing', label: 'Sightseeing Tax' },
    { key: 'restaurant_rate', type: 'restaurant', label: 'Restaurant Tax' },
    { key: 'activity_rate', type: 'activity', label: 'Activity Tax' },
  ];
  for (const s of serviceMap) {
    const val = row[s.key] as number | null;
    if (val && val > 0) {
      rates.push({
        id: `${row.id}-${s.type}`,
        serviceType: s.type,
        rate: Number(val),
        description: s.label,
        isDefault: false,
      });
    }
  }
  return rates;
}

function toTDS(row: TaxConfigurationRow): TDSConfiguration | undefined {
  if (!row.tds_applicable && !row.tds_rate && !row.tds_threshold && !row.tds_exemption_limit) return undefined;
  return {
    isApplicable: !!row.tds_applicable,
    rate: Number(row.tds_rate ?? 0),
    threshold: Number(row.tds_threshold ?? 0),
    exemptionLimit: Number(row.tds_exemption_limit ?? 0),
    companyRegistration: row.company_registration ?? undefined,
  };
}

export function toUI(row: TaxConfigurationRow): TaxConfiguration {
  return {
    id: row.id,
    countryCode: row.country_code,
    taxType: row.tax_type === 'SERVICE_TAX' ? 'GST' : (row.tax_type as TaxConfiguration['taxType']), // normalize if needed
    isActive: !!row.is_active,
    taxRates: toTaxRates(row),
    tdsConfiguration: toTDS(row),
    exemptions: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromUI(config: TaxConfiguration, configId: string): Partial<TaxConfigurationRow> {
  const findRate = (type: TaxRate['serviceType']): number | null => {
    const r = config.taxRates.find((x) => x.serviceType === type);
    return r ? Number(r.rate) : null;
  };
  const defaultAll = config.taxRates.find((x) => x.serviceType === 'all' || x.isDefault);
  const tds = config.tdsConfiguration;
  return {
    id: config.id,
    config_id: configId,
    country_code: config.countryCode,
    region_code: null,
    tax_type: config.taxType,
    tax_name: defaultAll?.description || 'Default Tax',
    default_rate: defaultAll ? Number(defaultAll.rate) : null,
    hotel_rate: findRate('hotel'),
    transport_rate: findRate('transport'),
    sightseeing_rate: findRate('sightseeing'),
    restaurant_rate: findRate('restaurant'),
    activity_rate: findRate('activity'),
    tds_applicable: !!tds?.isApplicable,
    tds_rate: tds ? Number(tds.rate) : null,
    tds_threshold: tds ? Number(tds.threshold) : null,
    tds_exemption_limit: tds ? Number(tds.exemptionLimit) : null,
    is_inclusive: false,
    compound_tax: false,
    tax_registration_number: null,
    company_registration: tds?.companyRegistration ?? null,
    is_active: !!config.isActive,
  } as Partial<TaxConfigurationRow>;
}

export const TaxConfigurationSupabase = {
  async listByConfig(configurationId: string): Promise<TaxConfigurationRow[]> {
    const { data, error } = await sb
      .from(TAX_TABLE)
      .select('*')
      .eq('config_id', configurationId)
      .order('country_code', { ascending: true });
    if (error) throw error;
    return (data ?? []) as TaxConfigurationRow[];
  },

  async getByCountry(configurationId: string, countryCode: string): Promise<TaxConfigurationRow | null> {
    try {
      const { data } = await sb
        .from(TAX_TABLE)
        .select('*')
        .eq('config_id', configurationId)
        .eq('country_code', countryCode)
        .limit(1)
        .single();
      return (data ?? null) as TaxConfigurationRow | null;
    } catch (err: any) {
      if (err?.code === 'PGRST116') return null;
      throw err;
    }
  },

  async upsert(configurationId: string, row: Partial<TaxConfigurationRow>): Promise<TaxConfigurationRow> {
    const payload = { ...row, config_id: configurationId };
    const { data, error } = await sb
      .from(TAX_TABLE)
      .upsert(payload, { onConflict: 'config_id,country_code,region_code' })
      .select('*')
      .limit(1)
      .single();
    if (error) throw error;
    return data as TaxConfigurationRow;
  },

  async delete(configurationId: string, countryCode: string): Promise<void> {
    const { error } = await sb
      .from(TAX_TABLE)
      .delete()
      .eq('config_id', configurationId)
      .eq('country_code', countryCode);
    if (error) throw error;
  },
};