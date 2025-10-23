import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/User';
import { useAuth } from '@/contexts/AuthContext';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { CurrencyService, CurrencyInfo } from '@/services/currencyService';

// Language types and constants
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français', 
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  hi: 'हिन्दी'
};

interface AppContextType {
  // UI State
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  
  // Language & Localization
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (key: string) => string;
  isMultiLanguageEnabled: boolean;
  setMultiLanguageEnabled: (enabled: boolean) => void;
  hasLanguageAccess: boolean;
  availableLanguages: Language[];
  setAvailableLanguages: (languages: Language[]) => void;
  languageNames: Record<Language, string>;

  // Regional Settings
  timezone: string;
  setTimezone: (tz: string) => void;
  availableTimezones: string[];
  currency: string;
  setCurrency: (currency: string) => void;
  availableCurrencies: CurrencyInfo[];
  
  // Auth-related helpers (using AuthContext)
  currentUser: User | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Basic translations for common terms
const translations: Record<Language, Record<string, string>> = {
  en: {
    'search': 'Search',
    'language': 'Language',
    'light': 'Light',
    'dark': 'Dark', 
    'system': 'System',
    'success': 'Success',
    'bookings': 'Bookings',
    'hotels': 'Hotels',
    'agents': 'Agents',
    'queries': 'Queries'
  },
  es: {
    'search': 'Buscar',
    'language': 'Idioma',
    'light': 'Claro',
    'dark': 'Oscuro',
    'system': 'Sistema',
    'success': 'Éxito',
    'bookings': 'Reservas',
    'hotels': 'Hoteles',
    'agents': 'Agentes',
    'queries': 'Consultas'
  },
  fr: {
    'search': 'Rechercher',
    'language': 'Langue',
    'light': 'Clair',
    'dark': 'Sombre',
    'system': 'Système',
    'success': 'Succès',
    'bookings': 'Réservations',
    'hotels': 'Hôtels',
    'agents': 'Agents',
    'queries': 'Requêtes'
  },
  de: {
    'search': 'Suchen',
    'language': 'Sprache',
    'light': 'Hell',
    'dark': 'Dunkel',
    'system': 'System',
    'success': 'Erfolg',
    'bookings': 'Buchungen',
    'hotels': 'Hotels',
    'agents': 'Agenten',
    'queries': 'Anfragen'
  },
  it: {
    'search': 'Cerca',
    'language': 'Lingua',
    'light': 'Chiaro',
    'dark': 'Scuro',
    'system': 'Sistema',
    'success': 'Successo',
    'bookings': 'Prenotazioni',
    'hotels': 'Hotel',
    'agents': 'Agenti',
    'queries': 'Query'
  },
  pt: {
    'search': 'Pesquisar',
    'language': 'Idioma',
    'light': 'Claro',
    'dark': 'Escuro',
    'system': 'Sistema',
    'success': 'Sucesso',
    'bookings': 'Reservas',
    'hotels': 'Hotéis',
    'agents': 'Agentes',
    'queries': 'Consultas'
  },
  ru: {
    'search': 'Поиск',
    'language': 'Язык',
    'light': 'Светлый',
    'dark': 'Тёмный',
    'system': 'Система',
    'success': 'Успех',
    'bookings': 'Бронирования',
    'hotels': 'Отели',
    'agents': 'Агенты',
    'queries': 'Запросы'
  },
  zh: {
    'search': '搜索',
    'language': '语言',
    'light': '浅色',
    'dark': '深色',
    'system': '系统',
    'success': '成功',
    'bookings': '预订',
    'hotels': '酒店',
    'agents': '代理',
    'queries': '查询'
  },
  ja: {
    'search': '検索',
    'language': '言語',
    'light': 'ライト',
    'dark': 'ダーク',
    'system': 'システム',
    'success': '成功',
    'bookings': '予約',
    'hotels': 'ホテル',
    'agents': 'エージェント',
    'queries': 'クエリ'
  },
  ko: {
    'search': '검색',
    'language': '언어',
    'light': '밝게',
    'dark': '어둡게',
    'system': '시스템',
    'success': '성공',
    'bookings': '예약',
    'hotels': '호텔',
    'agents': '에이전트',
    'queries': '쿼리'
  },
  ar: {
    'search': 'بحث',
    'language': 'اللغة',
    'light': 'فاتح',
    'dark': 'داكن',
    'system': 'النظام',
    'success': 'نجح',
    'bookings': 'الحجوزات',
    'hotels': 'الفنادق',
    'agents': 'الوكلاء',
    'queries': 'الاستفسارات'
  },
  hi: {
    'search': 'खोजें',
    'language': 'भाषा',
    'light': 'हल्का',
    'dark': 'गहरा',
    'system': 'सिस्टम',
    'success': 'सफलता',
    'bookings': 'बुकिंग',
    'hotels': 'होटल',
    'agents': 'एजेंट',
    'queries': 'प्रश्न'
  }
};

const defaultContext: AppContextType = {
  // UI State
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
  sidebarOpen: true,
  setSidebarOpen: () => {},
  isFullscreen: false,
  toggleFullscreen: () => {},
  
  // Language & Localization
  language: 'en',
  setLanguage: () => {},
  translate: (key: string) => key,
  isMultiLanguageEnabled: true,
  setMultiLanguageEnabled: () => {},
  hasLanguageAccess: true,
  availableLanguages: ['en', 'es', 'fr', 'de'],
  setAvailableLanguages: () => {},
  languageNames,

  // Regional Settings
  timezone: 'UTC',
  setTimezone: () => {},
  availableTimezones: [],
  currency: 'USD',
  setCurrency: () => {},
  availableCurrencies: [],
  
  // Auth-related helpers (using AuthContext)
  currentUser: null,
  isLoggedIn: false,
  isAuthenticated: false,
  hasPermission: () => false
};

const AppContext = createContext<AppContextType>(defaultContext);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get auth state from AuthContext
  const { user: currentUser } = useAuth();
  
  // UI State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored as Language) || 'en';
  });
  const [isMultiLanguageEnabled, setIsMultiLanguageEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('isMultiLanguageEnabled');
    return stored ? JSON.parse(stored) : true;
  });
  const [availableLanguages, setAvailableLanguagesState] = useState<Language[]>(() => {
    const stored = localStorage.getItem('availableLanguages');
    return stored ? JSON.parse(stored) : ['en', 'es', 'fr', 'de', 'it', 'pt'];
  });

  // Regional Settings state
  const [timezone, setTimezoneState] = useState<string>(() => {
    const stored = localStorage.getItem('timezone');
    return stored || 'UTC';
  });
  const [currency, setCurrencyState] = useState<string>(() => {
    const stored = localStorage.getItem('currency');
    return stored || 'USD';
  });
  const [availableTimezones, setAvailableTimezones] = useState<string[]>(() => {
    try {
      // Prefer full list provided by the runtime
      // @ts-ignore supportedValuesOf may not exist in some TS lib targets
      const tzs = (Intl as any).supportedValuesOf?.('timeZone') || [];
      let list: string[] = Array.isArray(tzs) && tzs.length ? tzs : ['UTC', 'Asia/Kolkata'];
      if (!list.includes('Asia/Kolkata')) {
        list = [...list, 'Asia/Kolkata'];
      }
      return list;
    } catch {
      return ['UTC', 'Asia/Kolkata'];
    }
  });
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>(() => {
    return CurrencyService.getAvailableCurrencies();
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Load remote persisted regional settings on mount
  useEffect(() => {
    (async () => {
      try {
        const tzRes = await AppSettingsService.getSetting(SETTING_CATEGORIES.GENERAL, 'default_timezone');
        if (tzRes.success && tzRes.data?.setting_value) {
          setTimezoneState(tzRes.data.setting_value);
          localStorage.setItem('timezone', tzRes.data.setting_value);
        }

        const curRes = await AppSettingsService.getSetting(SETTING_CATEGORIES.GENERAL, 'default_currency');
        if (curRes.success && curRes.data?.setting_value) {
          setCurrencyState(curRes.data.setting_value);
          localStorage.setItem('currency', curRes.data.setting_value);
        }

        const langRes = await AppSettingsService.getSetting(SETTING_CATEGORIES.GENERAL, 'default_language');
        if (langRes.success && langRes.data?.setting_value) {
          const val = langRes.data.setting_value as Language;
          setLanguage(val);
          localStorage.setItem('language', val);
        }
      } catch (e) {
        // Ignore errors and rely on localStorage defaults
        console.warn('Failed loading remote app settings, using local defaults');
      }
    })();
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'hr_manager') {
      // HR managers have specific permissions for HR-related functionality
      return ['staff.*', 'hr.*', 'attendance.*', 'payroll.*', 'staff.view', 'staff.create', 'staff.edit'].includes(permission) ||
             currentUser.permissions?.includes(permission) || false;
    }
    if (currentUser.role === 'manager') {
      // Managers have most permissions
      return !['system.config', 'system.backup'].includes(permission);
    }
    return currentUser.permissions?.includes(permission) || false;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const translate = (key: string): string => {
    const langTranslations = translations[language] || translations.en;
    return langTranslations[key] || key;
  };

  const isLoggedIn = !!currentUser;
  const isAuthenticated = !!currentUser;
  const hasLanguageAccess = currentUser?.languageAccess !== false;

  const addNotification = (notification: Notification) => {
    const id = String(Math.random());
    const newNotification = { ...notification, id };
    setNotifications(prevNotifications => [...prevNotifications, newNotification]);

    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const setMultiLanguageEnabled = (enabled: boolean) => {
    setIsMultiLanguageEnabledState(enabled);
    localStorage.setItem('isMultiLanguageEnabled', JSON.stringify(enabled));
  };

  const setAvailableLanguages = (languages: Language[]) => {
    setAvailableLanguagesState(languages);
    localStorage.setItem('availableLanguages', JSON.stringify(languages));
  };

  const persistSetting = async (key: string, value: string) => {
    try {
      // Try update first
      const updateRes = await AppSettingsService.updateSetting(SETTING_CATEGORIES.GENERAL, key, {
        setting_value: value,
        is_active: true
      });
      if (!updateRes.success) {
        // If not found, create it
        await AppSettingsService.createSetting({
          category: SETTING_CATEGORIES.GENERAL,
          setting_key: key,
          setting_value: value,
          is_active: true
        });
      }
    } catch (err) {
      console.warn('Failed to persist setting', key, err);
    }
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    localStorage.setItem('timezone', tz);
    persistSetting('default_timezone', tz);
  };

  const setCurrency = (cur: string) => {
    setCurrencyState(cur);
    localStorage.setItem('currency', cur);
    persistSetting('default_currency', cur);
  };

  // Persist language selection to remote settings as well
  useEffect(() => {
    (async () => {
      try {
        await persistSetting('default_language', language);
      } catch {}
    })();
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        // UI State
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        sidebarOpen,
        setSidebarOpen,
        isFullscreen,
        toggleFullscreen,
      
        // Language & Localization
        language,
        setLanguage,
        translate,
        isMultiLanguageEnabled,
        setMultiLanguageEnabled,
        hasLanguageAccess,
        availableLanguages,
        setAvailableLanguages,
        languageNames,

        // Regional Settings
        timezone,
        setTimezone,
        availableTimezones,
        currency,
        setCurrency,
        availableCurrencies,
        
        // Auth-related helpers (using AuthContext)
        currentUser,
        isLoggedIn,
        isAuthenticated,
        hasPermission
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  return useContext(AppContext);
};
