
export interface Country {
  id: string;
  name: string;
  code: string;
  continent: string;
  region: string;
  currency: string;
  currency_symbol: string;
  status: string;
  flag_url?: string | null;
  is_popular: boolean;
  visa_required: boolean;
  languages: any; // JSON type from Supabase
  pricing_currency_override: boolean;
  pricing_currency?: string | null;
  pricing_currency_symbol?: string | null;
  created_at: string;
  updated_at: string;
}
