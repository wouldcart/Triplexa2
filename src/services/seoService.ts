// SEO and Profile Service for database operations
// Note: This service is designed to work with the new database schema
// For now, it includes fallback functionality for when tables don't exist

export interface SEOSettings {
  id?: string;
  page_route: string;
  title: string;
  description: string;
  keywords: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  structured_data?: any;
  meta_robots?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EnhancedProfile {
  id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  address?: any;
  social_links?: any;
  preferences?: any;
  settings?: any;
  timezone?: string;
  language?: string;
  notification_preferences?: any;
  privacy_settings?: any;
  last_active?: string;
  is_verified?: boolean;
  verification_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileActivityLog {
  id?: string;
  user_id: string;
  action: string;
  field_changed?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

// Default SEO settings for different routes
const DEFAULT_SEO_SETTINGS: Record<string, SEOSettings> = {
  '/dashboard': {
    page_route: '/dashboard',
    title: 'Dashboard - Tour Management System',
    description: 'Comprehensive dashboard for tour operators with analytics, bookings, and business intelligence.',
    keywords: ['dashboard', 'tour management', 'analytics', 'business intelligence'],
    og_title: 'Tour Management Dashboard',
    og_description: 'Access your complete tour business overview with real-time analytics and insights.',
    meta_robots: 'index,follow',
    is_active: true
  },
  '/sales/dashboard': {
    page_route: '/sales/dashboard',
    title: 'Sales Dashboard - Tour Management System',
    description: 'Advanced sales analytics and performance metrics for tour operators and travel agencies.',
    keywords: ['sales dashboard', 'sales analytics', 'tour sales', 'performance metrics'],
    og_title: 'Sales Performance Dashboard',
    og_description: 'Track your sales performance with detailed analytics and revenue insights.',
    meta_robots: 'index,follow',
    is_active: true
  },
  '/inventory/restaurants': {
    page_route: '/inventory/restaurants',
    title: 'Restaurant Management - Tour Inventory System',
    description: 'Comprehensive restaurant inventory management for tour operators with pricing, cuisine types, and booking details.',
    keywords: ['restaurant management', 'tour inventory', 'dining options', 'restaurant booking'],
    og_title: 'Restaurant Inventory Management',
    og_description: 'Manage your restaurant partnerships and dining options for tour packages.',
    meta_robots: 'index,follow',
    is_active: true
  },
  '/profile': {
    page_route: '/profile',
    title: 'User Profile - Tour Management System',
    description: 'Manage your profile settings, preferences, and account information in the tour management system.',
    keywords: ['user profile', 'account settings', 'profile management', 'user preferences'],
    og_title: 'User Profile Settings',
    og_description: 'Update your profile information and customize your tour management experience.',
    meta_robots: 'index,follow',
    is_active: true
  }
};

class SEOService {
  private localStorageKey = 'tour_seo_settings';
  private profileStorageKey = 'tour_enhanced_profiles';
  private activityLogKey = 'tour_activity_log';

  // SEO Settings Methods
  async getSEOSettings(pageRoute: string): Promise<SEOSettings | null> {
    try {
      // Try to get from localStorage first (fallback)
      const stored = localStorage.getItem(this.localStorageKey);
      const settings = stored ? JSON.parse(stored) : {};
      
      // Return stored setting or default
      return settings[pageRoute] || DEFAULT_SEO_SETTINGS[pageRoute] || null;
    } catch (error) {
      console.error('Error in getSEOSettings:', error);
      return DEFAULT_SEO_SETTINGS[pageRoute] || null;
    }
  }

  async getAllSEOSettings(): Promise<SEOSettings[]> {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      const settings = stored ? JSON.parse(stored) : {};
      
      // Merge with defaults
      const allSettings = { ...DEFAULT_SEO_SETTINGS, ...settings };
      return Object.values(allSettings);
    } catch (error) {
      console.error('Error in getAllSEOSettings:', error);
      return Object.values(DEFAULT_SEO_SETTINGS);
    }
  }

  async upsertSEOSettings(settings: Partial<SEOSettings>): Promise<SEOSettings | null> {
    try {
      if (!settings.page_route) {
        throw new Error('page_route is required');
      }

      const stored = localStorage.getItem(this.localStorageKey);
      const allSettings = stored ? JSON.parse(stored) : {};
      
      const updatedSettings = {
        ...allSettings[settings.page_route],
        ...settings,
        updated_at: new Date().toISOString()
      };

      allSettings[settings.page_route] = updatedSettings;
      localStorage.setItem(this.localStorageKey, JSON.stringify(allSettings));

      return updatedSettings as SEOSettings;
    } catch (error) {
      console.error('Error in upsertSEOSettings:', error);
      return null;
    }
  }

  // Enhanced Profile Methods
  async getEnhancedProfile(userId: string): Promise<EnhancedProfile | null> {
    try {
      const stored = localStorage.getItem(this.profileStorageKey);
      const profiles = stored ? JSON.parse(stored) : {};
      return profiles[userId] || null;
    } catch (error) {
      console.error('Error in getEnhancedProfile:', error);
      return null;
    }
  }

  async upsertEnhancedProfile(profile: Partial<EnhancedProfile>): Promise<EnhancedProfile | null> {
    try {
      if (!profile.user_id) {
        throw new Error('user_id is required');
      }

      const stored = localStorage.getItem(this.profileStorageKey);
      const profiles = stored ? JSON.parse(stored) : {};
      
      const existingProfile = profiles[profile.user_id] || {};
      const updatedProfile = {
        ...existingProfile,
        ...profile,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      profiles[profile.user_id] = updatedProfile;
      localStorage.setItem(this.profileStorageKey, JSON.stringify(profiles));

      // Log the activity
      await this.logProfileActivity(
        profile.user_id,
        existingProfile.id ? 'update' : 'create',
        'profile',
        existingProfile,
        updatedProfile
      );

      return updatedProfile as EnhancedProfile;
    } catch (error) {
      console.error('Error in upsertEnhancedProfile:', error);
      return null;
    }
  }

  async getProfileActivityLog(userId: string, limit: number = 50): Promise<ProfileActivityLog[]> {
    try {
      const stored = localStorage.getItem(this.activityLogKey);
      const logs = stored ? JSON.parse(stored) : [];
      
      return logs
        .filter((log: ProfileActivityLog) => log.user_id === userId)
        .sort((a: ProfileActivityLog, b: ProfileActivityLog) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getProfileActivityLog:', error);
      return [];
    }
  }

  async logProfileActivity(
    userId: string, 
    action: string, 
    fieldChanged?: string, 
    oldValue?: any, 
    newValue?: any
  ): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.activityLogKey);
      const logs = stored ? JSON.parse(stored) : [];
      
      const newLog: ProfileActivityLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        action,
        field_changed: fieldChanged,
        old_value: oldValue,
        new_value: newValue,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      logs.push(newLog);
      
      // Keep only last 1000 logs to prevent storage bloat
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem(this.activityLogKey, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('Error in logProfileActivity:', error);
      return false;
    }
  }

  // Real-time simulation methods (for localStorage-based implementation)
  subscribeToSEOSettings(callback: (settings: SEOSettings) => void) {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.localStorageKey && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          Object.values(settings).forEach(setting => {
            callback(setting as SEOSettings);
          });
        } catch (error) {
          console.error('Error parsing SEO settings from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return {
      unsubscribe: () => {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }

  subscribeToEnhancedProfile(userId: string, callback: (profile: EnhancedProfile) => void) {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.profileStorageKey && e.newValue) {
        try {
          const profiles = JSON.parse(e.newValue);
          if (profiles[userId]) {
            callback(profiles[userId]);
          }
        } catch (error) {
          console.error('Error parsing profile from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return {
      unsubscribe: () => {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }

  // Utility methods
  async getCurrentUser() {
    // Fallback user simulation
    return {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email: 'user@example.com'
    };
  }

  // Auto-save functionality
  createAutoSave<T>(
    key: string,
    saveFunction: (data: T) => Promise<T | null>,
    debounceMs: number = 1000
  ) {
    let timeoutId: NodeJS.Timeout;
    
    return (data: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await saveFunction(data);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }, debounceMs);
    };
  }
}

export const seoService = new SEOService();
export default seoService;