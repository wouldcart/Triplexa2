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
      }
      
      return !error;
    } catch (err) {
      console.warn('AppSettingsService: Error checking table existence, using localStorage fallback:', err);
      return false;
    }
  }

  // Check if user has permission to access app settings
  static async checkPermissions(): Promise<boolean> {
    try {
      // Guard: ensure we have an active session before calling getUser
      const { session, error: sessionError } = await authHelpers.getSession();
      if (sessionError || !session) {
        console.info('AppSettingsService (DB): No active session — using localStorage fallback');
        return false;
      }

      const { user, error: userError } = await authHelpers.getUser();
      if (userError) {
        console.warn('AppSettingsService (DB): getUser error handled:', userError?.message || userError);
        return false;
      }
      if (!user) return false;

      // Use get_current_user_role function instead of direct table query
      const { data: userRole, error: roleError } = await supabase
        .rpc('get_current_user_role');

      if (roleError) {
        const errorCode = roleError.code || '';
        const errorMessage = roleError.message?.toLowerCase() || '';
        
        // Handle specific error codes that indicate database access issues
        if (
          errorCode === '406' ||
          errorCode === 'PGRST301' ||
          errorCode === 'PGRST116' ||
          errorMessage.includes('not acceptable') ||
          errorMessage.includes('permission denied') ||
          errorMessage.includes('function') && errorMessage.includes('does not exist')
        ) {
          console.warn('❌ AppSettingsService (DB): Database function not accessible, using localStorage fallback:', roleError);
          this.markDatabaseInaccessible();
        } else {
          console.error('❌ AppSettingsService (DB): Error getting user role:', roleError);
        }
        return false;
      }

      if (!userRole) {
        console.log('❌ AppSettingsService (DB): No role found for user');
        return false;
      }

      // Check if user has required role
      const hasRequiredRole = ALLOWED_ROLES.includes(userRole);
      console.log('🔐 AppSettingsService (DB): Permission check result:', { role: userRole, hasRequiredRole });
      
      return hasRequiredRole;
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
          console.error('Database error, falling back to localStorage:', error);
          return this.getAllSettingsFromStorage();
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
        // Use localStorage fallback
        return this.getAllSettingsFromStorage();
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
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      // Group by category
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
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
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
          console.error('Database error, falling back to localStorage:', error);
          return this.getSettingsByCategoryFromStorage(category);
        }

        return {
          data: data as AppSetting[] || [],
          error: null,
          success: true
        };
      } else {
        // Use localStorage fallback
        return this.getSettingsByCategoryFromStorage(category);
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
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      const categorySettings = settings.filter(s => s.category === category);

      return {
        data: categorySettings,
        error: null,
        success: true
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get a specific setting
  static async getSetting(category: string, settingKey: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      // Check if database is accessible from cache first
      if (!this.isDatabaseAccessible()) {
        console.log('AppSettingsService: Database marked as inaccessible, using localStorage fallback');
        return this.getSettingFromStorage(category, settingKey);
      }

      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        this.markDatabaseInaccessible();
        return this.getSettingFromStorage(category, settingKey);
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
          const errorCode = error.code || '';
          const errorMessage = error.message?.toLowerCase() || '';
          
          // Handle specific error codes that indicate database access issues
          if (
            errorCode === '406' ||
            errorCode === 'PGRST301' ||
            errorMessage.includes('not acceptable') ||
            errorMessage.includes('permission denied')
          ) {
            console.warn('AppSettingsService: Database access issue, using localStorage fallback:', error);
            this.markDatabaseInaccessible();
          } else {
            console.error('AppSettingsService: Database error, falling back to localStorage:', error);
          }
          
          return this.getSettingFromStorage(category, settingKey);
        }

        // No error: if no row found, return null without error
        if (!data) {
          return {
            data: null,
            error: null,
            success: true
          };
        }

        // Mark database as accessible since operation succeeded
        this.markDatabaseAccessible();
        
        return {
          data: data as AppSetting,
          error: null,
          success: true
        };
      } else {
        // Use localStorage fallback
        return this.getSettingFromStorage(category, settingKey);
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Get setting from localStorage
  static async getSettingFromStorage(category: string, settingKey: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      const setting = settings.find(s => s.category === category && s.setting_key === settingKey);

      return {
        data: setting || null,
        error: null,
        success: true
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Create a new setting
  static async createSetting(setting: AppSettingInsert): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      const { session } = await authHelpers.getSession();
      const userId = session?.user?.id;
      if (!hasPermission) {
        // Unauthenticated or unauthorized — fallback to localStorage
        return this.createSettingInStorage(setting, userId);
      }
      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database; prefer upsert to avoid unique constraint violations on (category, setting_key)
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .upsert(
            { ...setting, updated_by: userId },
            { onConflict: 'category,setting_key' }
          )
          .select()
          .single();

        if (error) {
          console.error('Database error, falling back to localStorage:', error);
          return this.createSettingInStorage(setting, userId);
        }

        return {
          data: data as AppSetting,
          error: null,
          success: true
        };
      } else {
        // Use localStorage fallback
        return this.createSettingInStorage(setting, userId);
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
  static async createSettingInStorage(setting: AppSettingInsert, userId?: string): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const newSetting: AppSetting = {
        id: crypto.randomUUID(),
        category: setting.category,
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        setting_json: setting.setting_json,
        description: setting.description,
        data_type: setting.data_type || 'text',
        is_required: setting.is_required || false,
        is_active: setting.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      // Check if setting already exists
      const existingIndex = settings.findIndex(s => 
        s.category === setting.category && s.setting_key === setting.setting_key
      );
      
      if (existingIndex >= 0) {
        // Update existing
        settings[existingIndex] = { ...settings[existingIndex], ...newSetting };
      } else {
        // Add new
        settings.push(newSetting);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      return {
        data: newSetting,
        error: null,
        success: true
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
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
        // Unauthenticated or unauthorized — fallback to localStorage
        return this.updateSettingInStorage(category, settingKey, updates, userId);
      }
      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        // Use database with type assertion
        const { data, error } = await (supabase as any)
          .from('app_settings')
          .update({
            ...updates,
            updated_by: userId
          })
          .eq('category', category)
          .eq('setting_key', settingKey)
          .select()
          .single();

        if (error) {
          console.error('Database error, falling back to localStorage:', error);
          return this.updateSettingInStorage(category, settingKey, updates, userId);
        }

        return {
          data: data as AppSetting,
          error: null,
          success: true
        };
      } else {
        // Use localStorage fallback
        return this.updateSettingInStorage(category, settingKey, updates, userId);
      }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Update setting in localStorage
  static async updateSettingInStorage(
    category: string, 
    settingKey: string, 
    updates: AppSettingUpdate,
    userId?: string
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      const settingIndex = settings.findIndex(s => 
        s.category === category && s.setting_key === settingKey
      );
      
      if (settingIndex === -1) {
        return {
          data: null,
          error: 'Setting not found',
          success: false
        };
      }
      
      // Update the setting
      settings[settingIndex] = {
        ...settings[settingIndex],
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      return {
        data: settings[settingIndex],
        error: null,
        success: true
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
  }

  // Delete a setting
  static async deleteSetting(category: string, settingKey: string): Promise<AppSettingsServiceResponse<boolean>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        // Unauthenticated or unauthorized — fallback to localStorage
        return this.deleteSettingFromStorage(category, settingKey);
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
          console.error('Database error, falling back to localStorage:', error);
          return this.deleteSettingFromStorage(category, settingKey);
        }

        return {
          data: true,
          error: null,
          success: true
        };
      } else {
        // Use localStorage fallback
        return this.deleteSettingFromStorage(category, settingKey);
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
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      const settingIndex = settings.findIndex(s => 
        s.category === category && s.setting_key === settingKey
      );
      
      if (settingIndex === -1) {
        return {
          data: false,
          error: 'Setting not found',
          success: false
        };
      }
      
      // Remove the setting
      settings.splice(settingIndex, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error: any) {
      return {
        data: false,
        error: error.message,
        success: false
      };
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
          console.error('Database error, falling back to localStorage:', error);
          return this.getCategoriesFromStorage();
        }

        const settings = data as { category: string }[];
        const categories = [...new Set(settings.map(s => s.category))];

        return {
          data: categories,
          error: null,
          success: true
        };
      } else {
        // Use localStorage fallback
        return this.getCategoriesFromStorage();
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
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: AppSetting[] = stored ? JSON.parse(stored) : [];
      
      const categories = [...new Set(settings.map(s => s.category))];

      return {
        data: categories,
        error: null,
        success: true
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }
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