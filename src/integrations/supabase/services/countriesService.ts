import { supabase } from '@/integrations/supabase/client';

// Lightweight service to read countries with pricing currency info from Supabase
// Avoids any localStorage or hardcoded data usage.

export type CountryRow = {
  id: string;
  code: string;
  name: string;
  region: string;
  continent: string;
  currency: string;
  currency_symbol: string;
  pricing_currency: string | null;
  pricing_currency_symbol: string | null;
  pricing_currency_override: boolean | null;
  is_popular: boolean | null;
};

export type CountryListItem = {
  code: string;
  name: string;
  region: string;
  currency: string;
  currency_symbol: string;
  is_popular: boolean;
};

const sb: any = supabase;

export const CountriesService = {
  async listActiveCountries(): Promise<CountryListItem[]> {
    const { data, error } = await sb
      .from('countries')
      .select('code,name,region,continent,currency,currency_symbol,pricing_currency,pricing_currency_symbol,pricing_currency_override,is_popular,status')
      .eq('status', 'active')
      .order('name', { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as CountryRow[];
    return rows.map((r) => ({
      code: r.code,
      name: r.name,
      region: r.region,
      currency: r.pricing_currency && r.pricing_currency_override ? r.pricing_currency : r.currency,
      currency_symbol: r.pricing_currency_symbol && r.pricing_currency_override ? r.pricing_currency_symbol : r.currency_symbol,
      is_popular: !!r.is_popular,
    }));
  },

  async getByCode(code: string): Promise<CountryListItem | null> {
    try {
      const { data } = await sb
        .from('countries')
        .select('code,name,region,currency,currency_symbol,pricing_currency,pricing_currency_symbol,pricing_currency_override,is_popular,status')
        .eq('code', code)
        .eq('status', 'active')
        .limit(1)
        .single();
      if (!data) return null;
      const r = data as CountryRow;
      return {
        code: r.code,
        name: r.name,
        region: r.region,
        currency: r.pricing_currency && r.pricing_currency_override ? r.pricing_currency : r.currency,
        currency_symbol: r.pricing_currency_symbol && r.pricing_currency_override ? r.pricing_currency_symbol : r.currency_symbol,
        is_popular: !!r.is_popular,
      };
    } catch (err: any) {
      if (err?.code === 'PGRST116') return null;
      throw err;
    }
  },
};