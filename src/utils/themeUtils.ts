/**
 * Theme Utility Functions
 * Provides comprehensive theme management utilities for the application
 */

export interface ThemeConfig {
  light: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
  dark: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
}

export const defaultThemeConfig: ThemeConfig = {
  light: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)'
  }
};

/**
 * Get current theme from document
 */
export const getCurrentTheme = (): 'light' | 'dark' => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

/**
 * Get system theme preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Apply theme to document
 */
export const applyTheme = (theme: 'light' | 'dark' | 'system'): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  
  if (theme === 'system') {
    const systemTheme = getSystemTheme();
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

/**
 * Get CSS custom properties for theme
 */
export const getThemeCSSVariables = (config: ThemeConfig = defaultThemeConfig): Record<string, string> => {
  const variables: Record<string, string> = {};
  
  // Light theme variables
  Object.entries(config.light).forEach(([key, value]) => {
    variables[`--theme-light-${key}`] = value;
  });
  
  // Dark theme variables
  Object.entries(config.dark).forEach(([key, value]) => {
    variables[`--theme-dark-${key}`] = value;
  });
  
  return variables;
};

/**
 * Apply CSS custom properties to document
 */
export const applyThemeCSSVariables = (config: ThemeConfig = defaultThemeConfig): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const variables = getThemeCSSVariables(config);
  
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

/**
 * Create smooth theme transition
 */
export const enableSmoothThemeTransitions = (duration: number = 300): void => {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    * {
      transition: background-color ${duration}ms ease-in-out,
                  color ${duration}ms ease-in-out,
                  border-color ${duration}ms ease-in-out,
                  box-shadow ${duration}ms ease-in-out !important;
    }
  `;
  style.id = 'theme-transition-style';
  document.head.appendChild(style);
  
  // Remove after transition completes
  setTimeout(() => {
    const existingStyle = document.getElementById('theme-transition-style');
    if (existingStyle) {
      existingStyle.remove();
    }
  }, duration + 100);
};

/**
 * Logo theme utilities
 */
export interface LogoThemeConfig {
  lightLogo?: string;
  darkLogo?: string;
  fallbackText?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Determine which logo to show based on theme
 */
export const getLogoForTheme = (config: LogoThemeConfig, theme: 'light' | 'dark'): string | null => {
  return theme === 'dark' && config.darkLogo ? config.darkLogo : config.lightLogo || null;
};

/**
 * Create logo with fallback
 */
export const createLogoWithFallback = (config: LogoThemeConfig, theme: 'light' | 'dark'): string => {
  const logo = getLogoForTheme(config, theme);
  if (logo) return logo;
  
  // Create SVG fallback
  const text = config.fallbackText || 'Logo';
  const bgColor = theme === 'dark' ? '#374151' : '#3b82f6';
  const textColor = '#ffffff';
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" fill="${bgColor}" rx="8"/>
      <text x="60" y="25" font-family="Arial, sans-serif" font-size="16" 
            font-weight="bold" text-anchor="middle" fill="${textColor}">
        ${text}
      </text>
    </svg>
  `)}`;
};

/**
 * Preload logos for better performance
 */
export const preloadLogos = (lightLogo?: string, darkLogo?: string): void => {
  if (typeof document === 'undefined') return;
  
  const logos = [lightLogo, darkLogo].filter(Boolean) as string[];
  
  logos.forEach(logoUrl => {
    const img = new Image();
    img.src = logoUrl;
  });
};

/**
 * Cache logo URLs with version control
 */
export class LogoCache {
  private cache: Map<string, string> = new Map();
  private version: string;
  
  constructor(version: string = 'v1') {
    this.version = version;
  }
  
  get(key: string): string | undefined {
    return this.cache.get(`${this.version}:${key}`);
  }
  
  set(key: string, value: string): void {
    this.cache.set(`${this.version}:${key}`, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  bustCache(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  }
}

/**
 * Theme detection utilities
 */
export const themeUtils = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  /**
   * Get theme from localStorage
   */
  getStoredTheme: (key: string = 'theme'): string | null => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  
  /**
   * Store theme in localStorage
   */
  storeTheme: (theme: string, key: string = 'theme'): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, theme);
  },
  
  /**
   * Remove theme from localStorage
   */
  removeStoredTheme: (key: string = 'theme'): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
  
  /**
   * Add theme change listener
   */
  onThemeChange: (callback: (theme: 'light' | 'dark') => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
};

/**
 * Accessibility utilities for themes
 */
export const themeAccessibility = {
  /**
   * Get appropriate contrast color
   */
  getContrastColor: (backgroundColor: string): 'black' | 'white' => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? 'black' : 'white';
  },
  
  /**
   * Get ARIA attributes for theme toggle
   */
  getToggleAriaAttributes: (currentTheme: 'light' | 'dark'): Record<string, string> => {
    return {
      'aria-label': `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`,
      'aria-pressed': currentTheme === 'dark' ? 'false' : 'true',
      'role': 'switch',
      'title': `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`
    };
  },
  
  /**
   * Get screen reader text for theme
   */
  getScreenReaderText: (theme: 'light' | 'dark'): string => {
    return theme === 'dark' ? 'Currently in dark mode' : 'Currently in light mode';
  }
};

export default {
  defaultThemeConfig,
  getCurrentTheme,
  getSystemTheme,
  applyTheme,
  getThemeCSSVariables,
  applyThemeCSSVariables,
  enableSmoothThemeTransitions,
  getLogoForTheme,
  createLogoWithFallback,
  preloadLogos,
  LogoCache,
  themeUtils,
  themeAccessibility
};