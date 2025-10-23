import { supabase, authHelpers } from '@/lib/supabaseClient';
import { Json } from '@/integrations/supabase/types';

// Type definitions for app settings
export interface AppSetting {
  id: string;
  category: string;
  setting_key: string;
  setting_value?: string;
  setting_json?: Json;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface AppSettingInsert {
  category: string;
  setting_key: string;
  setting_value?: string;
  setting_json?: Json;
  updated_by?: string;
}

export interface AppSettingUpdate {
  category?: string;
  setting_key?: string;
  setting_value?: string;
  setting_json?: Json;
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

// For now, we'll use localStorage as a fallback until the database table is created
const STORAGE_KEY = 'app_settings_fallback';

// Allowed roles for accessing settings
const ALLOWED_ROLES = ['super_admin', 'manager'];

class AppSettingsService {
  // Check if user has required permissions
  static async checkPermissions(): Promise<boolean> {
    try {
      // Guard: ensure we have an active session before calling getUser
      const { session, error: sessionError } = await authHelpers.getSession();
      if (sessionError || !session) {
        console.warn('AppSettingsService: No active session — skipping settings check');
        return false;
      }

      const { user } = await authHelpers.getUser();
      if (!user) {
        console.log('❌ AppSettingsService: No authenticated user');
        return false;
      }

      // Use get_current_user_role function instead of direct table query
      const { data: userRole, error: roleError } = await supabase
        .rpc('get_current_user_role');

      if (roleError) {
        console.error('❌ AppSettingsService: Error getting user role:', roleError);
        return false;
      }

      if (!userRole) {
        console.log('❌ AppSettingsService: No role found for user');
        return false;
      }

      // Check if user has required role
      const hasRequiredRole = ALLOWED_ROLES.includes(userRole);
      console.log('🔐 AppSettingsService: Permission check result:', { role: userRole, hasRequiredRole });
      
      return hasRequiredRole;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Get all settings grouped by category (using localStorage fallback)
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

      // Try localStorage fallback
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

  // Get settings by category (using localStorage fallback)
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

      // Try localStorage fallback
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

  // Get a specific setting (using localStorage fallback)
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

      // Try localStorage fallback
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

  // Create a new setting (using localStorage fallback)
  static async createSetting(setting: AppSettingInsert): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      // Get current user
      const { user } = await authHelpers.getUser();
      
      // Create new setting
      const newSetting: AppSetting = {
        id: crypto.randomUUID(),
        category: setting.category,
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        setting_json: setting.setting_json,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      };

      // Save to localStorage
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

  // Update an existing setting (using localStorage fallback)
  static async updateSetting(
    category: string, 
    settingKey: string, 
    updates: AppSettingUpdate
  ): Promise<AppSettingsServiceResponse<AppSetting | null>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: null,
          error: 'Insufficient permissions',
          success: false
        };
      }

      // Get current user
      const { user } = await authHelpers.getUser();
      
      // Get from localStorage
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
        updated_by: user?.id
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

  // Delete a setting (using localStorage fallback)
  static async deleteSetting(category: string, settingKey: string): Promise<AppSettingsServiceResponse<boolean>> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return {
          data: false,
          error: 'Insufficient permissions',
          success: false
        };
      }

      // Get from localStorage
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

      // Get from localStorage
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