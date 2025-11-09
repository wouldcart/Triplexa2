import { supabase } from '@/lib/supabaseClient';
import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CountryRow = Tables<'countries'>;
export type CountryInsert = TablesInsert<'countries'>;
export type CountryUpdate = TablesUpdate<'countries'>;

// Reduce complex type inference by using a simple alias for augmented rows
export type CountryWithCityCount = CountryRow & { city_count: number };

// Helper to avoid deep type instantiation when spreading complex Supabase row types
const toCountryWithCityCount = (country: CountryRow, cityCount: number): CountryWithCityCount => {
  const base = country as unknown as {};
  return { ...base, city_count: cityCount } as CountryWithCityCount;
};

export interface CountryServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class CountriesService {
  // Helper to perform a lightweight head count query without triggering deep generic instantiation
  private static async fetchCitiesHeadCount(countryName: string): Promise<number> {
    const res = await (supabase.from('cities') as any)
      .select('*', { count: 'exact', head: true })
      .eq('country', countryName) as { count: number | null };
    return res.count ?? 0;
  }
  /**
   * Fetch all countries from the database (User-facing version)
   */
  static async getAllCountries(): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Fetch all countries from the database (Admin version)
   */
  static async getAllCountriesAdmin(): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Get a specific country by ID (User-facing version)
   */
  static async getCountryById(id: string): Promise<CountryServiceResponse<CountryRow>> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching country:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching country:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Create a new country (User-facing version)
   */
  static async createCountry(country: CountryInsert): Promise<CountryServiceResponse<CountryRow>> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .insert(country)
        .select()
        .single();

      if (error) {
        console.error('Error creating country:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error creating country:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Update a country (User-facing version)
   */
  static async updateCountry(id: string, updates: CountryUpdate): Promise<CountryServiceResponse<CountryRow>> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating country:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error updating country:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Delete a country (User-facing version)
   */
  // CountriesService.deleteCountry（将城市引用检查改为按国家 ID）
  static async deleteCountry(id: string): Promise<CountryServiceResponse<void>> {
    // ... existing code ...
    // 使用关联表过滤按国家 ID 检查是否有城市引用
    const { data: citiesUsingCountry, error: citiesError } = await supabase
      .from('cities')
      .select('id, name, countries!inner(id)')
      .eq('countries.id', id)
      .limit(1);
  
    if (citiesError) {
      return { data: null, error: citiesError.message, success: false };
    }
  
    if (citiesUsingCountry && citiesUsingCountry.length > 0) {
      return {
        data: null,
        error: 'Cannot delete country as it is being used by one or more cities',
        success: false,
      };
    }

    const { error } = await supabase
      .from('countries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting country:', error);
      return {
        data: null,
        error: error.message,
        success: false
      };
    }

    return {
      data: null,
      error: null,
      success: true
    };
  }

  /**
   * Get countries by status
   */
  static async getCountriesByStatus(status: string): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .eq('status', status)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries by status:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching countries by status:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Search countries by name or code
   */
  static async searchCountries(query: string): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error searching countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error searching countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk insert multiple countries
   */
  static async bulkInsertCountries(countries: CountryInsert[]): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .insert(countries)
        .select();

      if (error) {
        console.error('Error bulk inserting countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk inserting countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Get countries by continent
   */
  static async getCountriesByContinent(continent: string): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .eq('continent', continent)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries by continent:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching countries by continent:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Get countries by currency
   */
  static async getCountriesByCurrency(currency: string): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .eq('currency', currency)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries by currency:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching countries by currency:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Override pricing currency for a country
   */
  static async overridePricingCurrency(
    countryId: string, 
    pricingCurrency: string, 
    pricingCurrencySymbol: string
  ): Promise<CountryServiceResponse<CountryRow>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({
          pricing_currency: pricingCurrency,
          pricing_currency_symbol: pricingCurrencySymbol,
          pricing_currency_override: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', countryId)
        .select()
        .single();

      if (error) {
        console.error('Error overriding pricing currency:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error overriding pricing currency:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Remove pricing currency override for a country
   */
  static async removePricingCurrencyOverride(countryId: string): Promise<CountryServiceResponse<CountryRow>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({
          pricing_currency: null,
          pricing_currency_symbol: null,
          pricing_currency_override: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', countryId)
        .select()
        .single();

      if (error) {
        console.error('Error removing pricing currency override:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error removing pricing currency override:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk override pricing currency for multiple countries
   */
  static async bulkOverridePricingCurrency(
    countryIds: string[], 
    pricingCurrency: string, 
    pricingCurrencySymbol: string
  ): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({
          pricing_currency: pricingCurrency,
          pricing_currency_symbol: pricingCurrencySymbol,
          pricing_currency_override: true,
          updated_at: new Date().toISOString()
        })
        .in('id', countryIds)
        .select();

      if (error) {
        console.error('Error bulk overriding pricing currency:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk overriding pricing currency:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Get countries with pricing currency overrides
   */
  static async getCountriesWithPricingOverrides(): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('*')
        .eq('pricing_currency_override', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries with pricing overrides:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error fetching countries with pricing overrides:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk delete multiple countries
   */
  static async bulkDeleteCountries(countryIds: string[]): Promise<CountryServiceResponse<void>> {
    try {
      if (!countryIds || countryIds.length === 0) {
        return {
          data: null,
          error: 'No country IDs provided for deletion',
          success: false
        };
      }

      const { error } = await supabaseAdmin
        .from('countries')
        .delete()
        .in('id', countryIds);

      if (error) {
        console.error('Error bulk deleting countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk deleting countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk toggle status for multiple countries
   */
  static async bulkToggleStatus(countryIds: string[], newStatus: 'active' | 'inactive'): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      if (!countryIds || countryIds.length === 0) {
        return {
          data: null,
          error: 'No country IDs provided for status toggle',
          success: false
        };
      }

      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', countryIds)
        .select();

      if (error) {
        console.error('Error bulk toggling country status:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk toggling country status:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk update multiple countries with the same data
   */
  static async bulkUpdateCountries(countryIds: string[], updates: Partial<CountryUpdate>): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      if (!countryIds || countryIds.length === 0) {
        return {
          data: null,
          error: 'No country IDs provided for bulk update',
          success: false
        };
      }

      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', countryIds)
        .select();

      if (error) {
        console.error('Error bulk updating countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk updating countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk upsert countries (insert new, update existing based on country code)
   */
  static async bulkUpsertCountries(countries: CountryInsert[]): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .upsert(countries, { 
          onConflict: 'code',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Error bulk upserting countries:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: data || [],
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk upserting countries:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Update country by code (for import operations)
   */
  static async updateCountryByCode(code: string, updates: CountryUpdate): Promise<CountryServiceResponse<CountryRow>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('countries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('code', code)
        .select()
        .single();

      if (error) {
        console.error('Error updating country by code:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error updating country by code:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Bulk update countries by their codes
   */
  static async bulkUpdateCountriesByCode(updates: Array<{ code: string; data: CountryUpdate }>): Promise<CountryServiceResponse<CountryRow[]>> {
    try {
      const results: CountryRow[] = [];
      const errors: string[] = [];

      // Process updates in batches
      for (const update of updates) {
        try {
          const result = await this.updateCountryByCode(update.code, update.data);
          if (result.success && result.data) {
            results.push(result.data);
          } else {
            errors.push(`Failed to update ${update.code}: ${result.error}`);
          }
        } catch (err) {
          errors.push(`Error updating ${update.code}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        return {
          data: null,
          error: errors.join('; '),
          success: false
        };
      }

      return {
        data: results,
        error: errors.length > 0 ? `Partial success: ${errors.join('; ')}` : null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error bulk updating countries by code:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  /**
   * Get countries with city count for better integration
   */
  static async getCountriesWithCityCount(): Promise<CountryServiceResponse<CountryWithCityCount[]>> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching countries with city count:', error);
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      // Manually count cities for each country
      const countriesData = (data || []) as CountryRow[];
      const transformedData: CountryWithCityCount[] = await Promise.all(
        countriesData.map(async (country) => {
          // Extract name with light typing to avoid deep instantiation on CountryRow
          const countryName: string = (country as any).name as string;
          const count = await CountriesService.fetchCitiesHeadCount(countryName);
          return toCountryWithCityCount(country, count);
        })
      );

      return {
        data: transformedData,
        error: null,
        success: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Unexpected error in getCountriesWithCityCount:', err);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }
}