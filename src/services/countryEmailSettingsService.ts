import { supabase } from '@/lib/supabaseClient';

export interface CountryEmailSetting {
  id?: string;
  country_id: string;
  country_name?: string;
  country_code?: string;
  cc_emails: string[];
  bcc_emails: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface CountryEmailSettingResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class CountryEmailSettingsService {
  private static instance: CountryEmailSettingsService;
  private readonly tableName = 'country_email_settings';

  private constructor() {}

  static getInstance(): CountryEmailSettingsService {
    if (!CountryEmailSettingsService.instance) {
      CountryEmailSettingsService.instance = new CountryEmailSettingsService();
    }
    return CountryEmailSettingsService.instance;
  }

  /**
   * Get all country email settings with country details
   */
  async getCountryEmailSettings(): Promise<CountryEmailSettingResponse<CountryEmailSetting[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *, 
          countries!inner(name, code, status)
        `)
        .order('countries(name)', { ascending: true });

      if (error) {
        console.error('Error fetching country email settings:', error);
        // Handle schema cache issues
        if (error.code === 'PGRST205') {
          console.warn('Table not found in schema cache, returning empty array');
          return { success: true, data: [] };
        }
        return { success: false, error: error.message };
      }

      console.log('Country email settings fetched:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching country email settings:', error);
      return { success: false, error: 'Failed to fetch country email settings' };
    }
  }

  /**
   * Get country email setting by country ID
   */
  async getCountryEmailSettingByCountryId(countryId: string): Promise<CountryEmailSettingResponse<CountryEmailSetting | null>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`*, countries!inner(name, code, status)`)
        .eq('country_id', countryId);

      if (error) {
        console.error('Error fetching country email setting:', error);
        return { success: false, error: error.message };
      }

      // Return the first result if found, otherwise null
      return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error) {
      console.error('Unexpected error fetching country email setting:', error);
      return { success: false, error: 'Failed to fetch country email setting' };
    }
  }

  /**
   * Create or update country email setting
   */
  async saveCountryEmailSetting(setting: Omit<CountryEmailSetting, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<CountryEmailSettingResponse<CountryEmailSetting>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if setting already exists for this country
      const existingSetting = await this.getCountryEmailSettingByCountryId(setting.country_id);
      
      if (existingSetting.success && existingSetting.data) {
        // Update existing setting
        const { data, error } = await supabase
          .from(this.tableName)
          .update({
            cc_emails: setting.cc_emails,
            bcc_emails: setting.bcc_emails,
            is_active: setting.is_active,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('country_id', setting.country_id)
          .select()
          .single();

        if (error) {
          console.error('Error updating country email setting:', error);
          return { success: false, error: error.message };
        }

        return { success: true, data };
      } else {
        // Create new setting
        const settingData = {
          ...setting,
          created_by: user.id,
          updated_by: user.id,
        };

        const { data, error } = await supabase
          .from(this.tableName)
          .insert(settingData)
          .select()
          .single();

        if (error) {
          console.error('Error creating country email setting:', error);
          // Handle schema cache issues
          if (error.code === 'PGRST205') {
            return { success: false, error: 'Country email settings table is not available. Please try again in a few moments.' };
          }
          return { success: false, error: error.message };
        }

        return { success: true, data };
      }
    } catch (error) {
      console.error('Unexpected error saving country email setting:', error);
      return { success: false, error: 'Failed to save country email setting' };
    }
  }

  /**
   * Delete country email setting
   */
  async deleteCountryEmailSetting(id: string): Promise<CountryEmailSettingResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting country email setting:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Unexpected error deleting country email setting:', error);
      return { success: false, error: 'Failed to delete country email setting' };
    }
  }

  /**
   * Toggle country email setting status
   */
  async toggleCountryEmailSettingStatus(id: string): Promise<CountryEmailSettingResponse<boolean>> {
    try {
      const { data: currentSetting, error: fetchError } = await supabase
        .from(this.tableName)
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError || !currentSetting) {
        return { success: false, error: fetchError?.message || 'Country email setting not found' };
      }

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: !currentSetting.is_active })
        .eq('id', id);

      if (error) {
        console.error('Error toggling country email setting status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Unexpected error toggling country email setting status:', error);
      return { success: false, error: 'Failed to toggle country email setting status' };
    }
  }

  /**
   * Get CC and BCC emails for a specific country
   */
  async getCountryEmailRecipients(countryId: string): Promise<{
    cc_emails: string[];
    bcc_emails: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('cc_emails, bcc_emails')
        .eq('country_id', countryId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { cc_emails: [], bcc_emails: [] };
      }

      return {
        cc_emails: data.cc_emails || [],
        bcc_emails: data.bcc_emails || []
      };
    } catch (error) {
      console.error('Error getting country email recipients:', error);
      return { cc_emails: [], bcc_emails: [] };
    }
  }

  /**
   * Get all active countries without email settings
   */
  async getCountriesWithoutSettings(): Promise<CountryEmailSettingResponse<any[]>> {
    try {
      // First get all active countries
      const { data: activeCountries, error: countriesError } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('status', 'active');

      if (countriesError) {
        console.error('Error fetching active countries:', countriesError);
        return { success: false, error: countriesError.message };
      }

      // Then get countries that already have email settings
      const { data: settingsCountries, error: settingsError } = await supabase
        .from('country_email_settings')
        .select('country_id')
        .eq('is_active', true);

      if (settingsError) {
        console.error('Error fetching countries with settings:', settingsError);
        return { success: false, error: settingsError.message };
      }

      // Filter out countries that already have settings
      const countriesWithSettings = settingsCountries?.map(s => s.country_id) || [];
      const countriesWithoutSettings = activeCountries?.filter(country => 
        !countriesWithSettings.includes(country.id)
      ) || [];

      return { success: true, data: countriesWithoutSettings };
    } catch (error) {
      console.error('Unexpected error fetching countries without settings:', error);
      return { success: false, error: 'Failed to fetch countries without settings' };
    }
  }
}

export const countryEmailSettingsService = CountryEmailSettingsService.getInstance();