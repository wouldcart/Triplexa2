import { supabase, authHelpers } from '@/lib/supabaseClient';
import { Json } from '@/integrations/supabase/types';

// Using centralized supabase client to avoid multiple GoTrueClient instances

// Type definitions for app settings
export interface AppSetting {
  id: string;
  category: string;
  setting_key: string;
  setting_value?: string;
  setting_json?: Json;
  description?: string;
  data_type?: string;
  is_required?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface AppSettingInsert {
  category: string;
  setting_key: string;
  setting_value?: string;
  setting_json?: Json;
  description?: string;
  data_type?: string;
  is_required?: boolean;
  is_active?: boolean;
  updated_by?: string;
}

export interface AppSettingUpdate {
  category?: string;
  setting_key?: string;
  setting_value?: string;
  setting_json?: Json;
  description?: string;
  data_type?: string;
  is_required?: boolean;
  is_active?: boolean;
  updated_by?: string;
}

// Categories for organizing settings
export const SETTING_CATEGORIES = {
  GENERAL: 'General',
  SEO: 'SEO & Meta',
  BRANDING: 'Branding & UI',
  PERMISSIONS: 'Permissions & Roles',
  AUTHENTICATION: 'Authentication & Security',
  NOTIFICATIONS: 'Notifications & Communication',
  PAYMENT: 'Payment & Finance',
  INTEGRATIONS: 'Integrations',
  MAINTENANCE: 'System Maintenance',
  CONTENT: 'Custom Content'
} as const;

export type SettingCategory = typeof SETTING_CATEGORIES[keyof typeof SETTING_CATEGORIES];

// Service response interface
export interface AppSettingsServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// For localStorage fallback
const STORAGE_KEY = 'app_settings_fallback';

// Allowed roles for app settings management
const ALLOWED_ROLES = ['super_admin', 'manager', 'agent', 'staff', 'hr_manager'];

// Cache for database access status to prevent repeated 406 errors
let databaseAccessCache: {
  accessible: boolean;
  lastChecked: number;
  cacheExpiry: number;
} = {
  accessible: true,
  lastChecked: 0,
  cacheExpiry: 5 * 60 * 1000 // 5 minutes
};

class AppSettingsService {
  // Check if database access is available (with caching to prevent repeated 406 errors)
  static isDatabaseAccessible(): boolean {
    const now = Date.now();
    const cacheValid = (now - databaseAccessCache.lastChecked) < databaseAccessCache.cacheExpiry;
    
    if (cacheValid) {
      return databaseAccessCache.accessible;
    }
    
    // Cache expired, will be refreshed on next database operation
    return true; // Optimistically assume accessible until proven otherwise
  }

  // Mark database as inaccessible (called when 406 errors occur)
  static markDatabaseInaccessible(): void {
    databaseAccessCache.accessible = false;
    databaseAccessCache.lastChecked = Date.now();
  }

  // Mark database as accessible (called when operations succeed)
  static markDatabaseAccessible(): void {
    databaseAccessCache.accessible = true;
    databaseAccessCache.lastChecked = Date.now();
  }

  // Check if database table exists
  static async checkTableExists(): Promise<boolean> {
    try {
      // Try to query the table directly with type assertion
      const { error } = await (supabase as any)
        .from('app_settings')
        .select('id')
        .limit(1);
      
      // If table doesn't exist or we get permission errors, return false
      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';
        const isNetworkFetchError = errorMessage.includes('failed to fetch') || errorMessage.includes('network') || errorMessage.includes('fetch');
        
        // Common error conditions that indicate table issues
        if (
          errorMessage.includes('does not exist') ||
          errorMessage.includes('permission denied') ||
          errorMessage.includes('not acceptable') ||
          errorCode === '406' ||
          errorCode === 'PGRST301' ||
          errorCode === 'PGRST116'
        ) {
          console.warn('AppSettingsService: Database table not accessible, using localStorage fallback');
          return false;
        }

        // Network connectivity issues: mark DB inaccessible to avoid repeated attempts
        if (isNetworkFetchError) {
          console.warn('AppSettingsService: Network error accessing database, falling back to localStorage');
          this.markDatabaseInaccessible();
          return false;
        }
      }
      
      return !error;
    } catch (err) {
      console.warn('AppSettingsService: Error checking table existence, using localStorage fallback:', err);
      // On unexpected network/type errors, mark inaccessible to prevent repeated attempts
      this.markDatabaseInaccessible();
      return false;
    }
  }

  // Check if user has permission to access app settings
  static async checkPermissions(): Promise<boolean> {
    try {
      // Supabase-only mode: if we have a session, permit writes without role RPC
      const { session } = await authHelpers.getSession();
      return !!session;
    } catch (error) {
      console.error('AppSettingsService: Error checking permissions:', error);
      return false;
    }
  }

  // Get all settings grouped by category
  static async getAllSettings(): Promise<AppSettingsServiceResponse<Record<string, AppSetting[]>>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database with type assertion
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('setting_key', { ascending: true });

        if (error) {
          console.error('AppSettingsService: Database error while fetching all settings:', error);
          return {
            data: null,
            error: error.message ?? 'Database error',
            success: false
          };
        }

        // Group by category with proper typing
        const settings = data as AppSetting[];
        const grouped = settings.reduce((acc, setting) => {
          if (!acc[setting.category]) {
            acc[setting.category] = [];
          }
          acc[setting.category].push(setting);
          return acc;
        }, {} as Record<string, AppSetting[]>);

        return {
          data: grouped,
          error: null,
          success: true
        };
      } else {
        return {
          data: null,
          error: 'Table app_settings does not exist',
          success: false
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get settings from localStorage (fallback)
  static async getAllSettingsFromStorage(): Promise<AppSettingsServiceResponse<Record<string, AppSetting[]>>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { data: parsed, error: null, success: true };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Get settings by category
  static async getSettingsByCategory(category: string): Promise<AppSettingsServiceResponse<AppSetting[]>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database with type assertion
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .select('*')
          .eq('category', category)
          .eq('is_active', true)
          .order('setting_key', { ascending: true });

        if (error) {
          console.error('AppSettingsService: Database error while fetching category settings:', error);
          return {
            data: null,
            error: error.message ?? 'Database error',
            success: false
          };
        }

        return {
          data: data as AppSetting[] || [],
          error: null,
          success: true
        };
      } else {
        return {
          data: null,
          error: 'Table app_settings does not exist',
          success: false
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get settings by category from localStorage
  static async getSettingsByCategoryFromStorage(category: string): Promise<AppSettingsServiceResponse<AppSetting[]>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      const list = parsed[category] || [];
      return { data: list, error: null, success: true };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Get a specific setting
  static async getSetting(category: string, settingKey: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database with type assertion
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .select('*')
          .eq('category', category)
          .eq('setting_key', settingKey)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('AppSettingsService: Database error while fetching setting', error);
          return {
            data: null,
            error: error.message ?? 'Database error',
            success: false
          };
        }

        // No error: if no row found, return null without error
        if (!data) {
          return {
            data: null,
            error: null,
            success: true
          };
        }
        
        return {
          data: data as AppSetting,
          error: null,
          success: true
        };
      } else {
        return {
          data: null,
          error: 'Table app_settings does not exist',
          success: false
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get a single setting by its UUID (database or storage fallback)
  static async getSettingById(id: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      const tableExists = await this.checkTableExists();
      if (tableExists) {
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('AppSettingsService: Database error while fetching by ID', error);
          return { data: null, error: error.message ?? 'Database error', success: false };
        }
        return {
          data: (data as AppSetting) || null,
          error: null,
          success: true
        };
      } else {
        return { data: null, error: 'Table app_settings does not exist', success: false };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get setting by ID from localStorage
  static async getSettingByIdFromStorage(id: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      for (const key of Object.keys(parsed)) {
        const found = (parsed[key] || []).find(s => s.id === id);
        if (found) return { data: found, error: null, success: true };
      }
      return { data: null, error: null, success: true };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Get setting from localStorage
  static async getSettingFromStorage(category: string, settingKey: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      const list = parsed[category] || [];
      const found = list.find(s => s.setting_key === settingKey) || null;
      return { data: found, error: null, success: true };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Create a new setting
  static async createSetting(setting: AppSettingInsert): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      const { session } = await authHelpers.getSession();
      const userId = session?.user?.id;
      if (!hasPermission) {
        return { data: null, error: 'Insufficient permissions', success: false };
      }
      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use REST upsert directly to avoid RPC recursion causing 54001 errors
        const upsertPayload = { ...setting, updated_by: userId };

        const rest = await (supabase as any)
          .from('app_settings')
          .upsert(upsertPayload, { onConflict: 'category,setting_key' })
          .select()
          .single();

        let data: any = rest.data;
        let error: any = rest.error;

        // If stack recursion error occurs, retry without updated_by to bypass potential triggers
        if (error && (error.code === '54001' || /stack depth/i.test(error.message || ''))) {
          const retry = await (supabase as any)
            .from('app_settings')
            .upsert({ ...upsertPayload, updated_by: null }, { onConflict: 'category,setting_key' })
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          const errObj = error as any;
          // If persistent stack depth errors, fall back to local storage and mark DB inaccessible
          if (errObj?.code === '54001' || /stack depth/i.test(errObj?.message || '')) {
            console.warn('AppSettingsService: Stack depth error detected. Falling back to localStorage.');
            this.markDatabaseInaccessible();
            const fallback = await this.createSettingInStorage(setting, userId);
            return fallback;
          }
          console.warn('AppSettingsService: Database error while creating setting:', {
            code: errObj?.code,
            message: errObj?.message,
            details: errObj?.details,
            hint: errObj?.hint
          });
          return { data: null, error: errObj?.message ?? 'Database error', success: false };
        }

        return { data: data as AppSetting, error: null, success: true };
      } else {
        return { data: null, error: 'Table app_settings does not exist', success: false };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Create setting in localStorage
  static async createSettingInStorage(setting: AppSettingInsert, _userId?: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      const now = new Date().toISOString();
      const id = `local-${setting.category}:${setting.setting_key}`;
      const record: AppSetting = {
        id,
        category: setting.category,
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        setting_json: setting.setting_json,
        description: setting.description,
        data_type: setting.data_type,
        is_required: setting.is_required ?? false,
        is_active: setting.is_active ?? true,
        created_at: now,
        updated_at: now,
        updated_by: _userId || undefined,
      };
      const list = parsed[setting.category] || [];
      const idx = list.findIndex(s => s.setting_key === setting.setting_key);
      if (idx >= 0) list[idx] = { ...list[idx], ...record, updated_at: now };
      else list.push(record);
      parsed[setting.category] = list;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return { data: record, error: null, success: true };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Update an existing setting
  static async updateSetting(
    category: string, 
    settingKey: string, 
    updates: AppSettingUpdate
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      const { session } = await authHelpers.getSession();
      const userId = session?.user?.id;
      if (!hasPermission) {
        return { data: null, error: 'Insufficient permissions', success: false };
      }
      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use REST upsert directly to avoid RPC recursion causing 54001 errors
        const upsertPayload = {
          category,
          setting_key: settingKey,
          ...updates,
          updated_by: userId,
        };

        const rest = await (supabase as any)
          .from('app_settings')
          .upsert(upsertPayload, { onConflict: 'category,setting_key' })
          .select()
          .single();

        let data: any = rest.data;
        let error: any = rest.error;

        // If recursion error occurs, retry without updated_by to bypass potential triggers
        if (error && (error.code === '54001' || /stack depth/i.test(error.message || ''))) {
          const retry = await (supabase as any)
            .from('app_settings')
            .upsert({ ...upsertPayload, updated_by: null }, { onConflict: 'category,setting_key' })
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          const errObj = error as any;
          // Stack depth recursion: fall back to localStorage
          if (errObj?.code === '54001' || /stack depth/i.test(errObj?.message || '')) {
            console.warn('AppSettingsService: Stack depth error detected during update. Falling back to localStorage.');
            this.markDatabaseInaccessible();
            const fallback = await this.updateSettingInStorage(category, settingKey, updates, userId);
            return fallback;
          }
          console.warn('Database error while updating setting:', {
            code: errObj?.code,
            message: errObj?.message,
            details: errObj?.details,
            hint: errObj?.hint,
          });
          return { data: null, error: errObj?.message ?? 'Database error', success: false };
        }

        return {
          data: data as AppSetting,
          error: null,
          success: true,
        };
      } else {
        return { data: null, error: 'Table app_settings does not exist', success: false };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Update setting by ID
  static async updateSettingById(
    id: string,
    updates: AppSettingUpdate
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      const { session } = await authHelpers.getSession();
      const userId = session?.user?.id;
      if (!hasPermission) {
        return { data: null, error: 'Insufficient permissions', success: false };
      }
      const tableExists = await this.checkTableExists();
      if (tableExists) {
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .update({
            ...updates,
            updated_by: userId
          })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          if ((error as any)?.code === '54001' || /stack depth/i.test((error as any)?.message || '')) {
            console.warn('AppSettingsService: Stack depth error detected during update by ID. Falling back to localStorage.');
            this.markDatabaseInaccessible();
            const fallback = await this.updateSettingByIdInStorage(id, updates, userId);
            return fallback;
          }
          console.warn('Database error while updating by ID:', error);
          return { data: null, error: (error as any).message ?? 'Database error', success: false };
        }

        return {
          data: (data as AppSetting) || null,
          error: null,
          success: true
        };
      } else {
        return { data: null, error: 'Table app_settings does not exist', success: false };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Update setting by ID in localStorage
  static async updateSettingByIdInStorage(
    id: string,
    updates: AppSettingUpdate,
    _userId?: string
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      let updated: AppSetting | null = null;
      const now = new Date().toISOString();
      for (const category of Object.keys(parsed)) {
        const list = parsed[category] || [];
        const idx = list.findIndex(s => s.id === id);
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            ...updates,
            updated_at: now,
            updated_by: _userId || list[idx].updated_by,
          } as AppSetting;
          updated = list[idx];
          parsed[category] = list;
          break;
        }
      }
      if (!updated) return { data: null, error: 'Not found', success: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return { data: updated, error: null, success: true };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Update setting in localStorage
  static async updateSettingInStorage(
    category: string, 
    settingKey: string, 
    updates: AppSettingUpdate,
    _userId?: string
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      const now = new Date().toISOString();
      const list = parsed[category] || [];
      const idx = list.findIndex(s => s.setting_key === settingKey);
      if (idx >= 0) {
        const updated: AppSetting = {
          ...list[idx],
          ...updates,
          updated_at: now,
          updated_by: _userId || list[idx].updated_by,
        } as AppSetting;
        list[idx] = updated;
        parsed[category] = list;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return { data: updated, error: null, success: true };
      } else {
        // Create new if missing
        const record: AppSetting = {
          id: `local-${category}:${settingKey}`,
          category,
          setting_key: settingKey,
          setting_value: updates.setting_value,
          setting_json: updates.setting_json,
          description: updates.description,
          data_type: updates.data_type,
          is_required: updates.is_required ?? false,
          is_active: updates.is_active ?? true,
          created_at: now,
          updated_at: now,
          updated_by: _userId,
        };
        list.push(record);
        parsed[category] = list;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return { data: record, error: null, success: true };
      }
    } catch (e: any) {
      return { data: null, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Delete a setting
  static async deleteSetting(category: string, settingKey: string): Promise<AppSettingsServiceResponse<boolean>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return { data: false, error: 'Insufficient permissions', success: false };
      }

      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database with type assertion
        const { error } = await (supabase as any)
          .from('app_settings')
          .delete()
          .eq('category', category)
          .eq('setting_key', settingKey);

        if (error) {
          console.error('Database error while deleting setting:', error);
          return { data: false, error: error.message ?? 'Database error', success: false };
        }

        return {
          data: true,
          error: null,
          success: true
        };
      } else {
        return { data: false, error: 'Table app_settings does not exist', success: false };
      }
    } catch (error: any) {
      return {
        data: false,
        error: error.message,
        success: false
      };
    }
  }

  // Delete setting from localStorage
  static async deleteSettingFromStorage(category: string, settingKey: string): Promise<AppSettingsServiceResponse<boolean>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, AppSetting[]> = raw ? JSON.parse(raw) : {};
      const list = parsed[category] || [];
      const next = list.filter(s => s.setting_key !== settingKey);
      parsed[category] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return { data: true, error: null, success: true };
    } catch (e: any) {
      return { data: false, error: e?.message || 'Local storage error', success: false };
    }
  }

  // Get setting value directly
  static async getSettingValue(category: string, settingKey: string): Promise<any> {
    const result = await this.getSetting(category, settingKey);
    if (result.success && result.data) {
      return result.data.setting_json || result.data.setting_value;
    }
    return null;
  }

  // Get all categories
  static async getCategories(): Promise<AppSettingsServiceResponse<string[]>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database with type assertion
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .select('category')
          .eq('is_active', true);

        if (error) {
          console.error('Database error while fetching categories:', error);
          return { data: null, error: error.message ?? 'Database error', success: false };
        }

        const settings = data as { category: string }[];
        const categories = [...new Set(settings.map(s => s.category))];

        return {
          data: categories,
          error: null,
          success: true
        };
      } else {
        return { data: null, error: 'Table app_settings does not exist', success: false };
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get categories from localStorage
  static async getCategoriesFromStorage(): Promise<AppSettingsServiceResponse<string[]>> {
    // Supabase-only: delegate to getCategories
    return this.getCategories();
  }
}

// Export both the class and an instance
export { AppSettingsService };
export const appSettingsService = new AppSettingsService();

// Convenience helpers to consolidate logic in one place
export class AppSettingsHelpers {
  // Upsert a setting: create if missing, otherwise update
  static async upsertSetting(setting: AppSettingInsert): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    const existing = await AppSettingsService.getSetting(setting.category, setting.setting_key);
    if (existing.success && existing.data) {
      return AppSettingsService.updateSetting(setting.category, setting.setting_key, {
        setting_value: setting.setting_value,
        setting_json: setting.setting_json,
        description: setting.description,
        data_type: setting.data_type,
        is_required: setting.is_required,
        is_active: setting.is_active
      });
    }
    return AppSettingsService.createSetting(setting);
  }

  // Ensure a setting exists with a default value; returns the setting
  static async ensureSettingValue(
    category: string,
    settingKey: string,
    defaultValue: string | Json
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    const current = await AppSettingsService.getSetting(category, settingKey);
    if (current.success && current.data) {
      return current as AppSettingsServiceResponse<AppSetting | null>;
    }
    return this.upsertSetting({
      category,
      setting_key: settingKey,
      ...(typeof defaultValue === 'string'
        ? { setting_value: defaultValue as string }
        : { setting_json: defaultValue as Json })
    });
  }
}