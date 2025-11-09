import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService';
import { authHelpers } from '@/lib/supabaseClient';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  siteName?: string;
  twitterHandle?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
}

interface SEOContextType {
  seoData: SEOData;
  updateSEO: (data: Partial<SEOData>) => void;
  resetSEO: () => void;
}

const defaultSEOData: SEOData = {
  title: 'Travel Management System',
  description: 'Comprehensive B2B tour management system for DMCs, travel agents, and tour operators.',
  keywords: 'tour management, travel software, DMC software, B2B travel, booking system, itinerary builder, travel CRM, destination management',
  image: 'https://lovable.dev/opengraph-image-p98pqg.png',
  type: 'website',
  author: 'Tripoex',
  locale: 'en_US',
  siteName: 'Travel Management System',
  twitterHandle: '',
  noIndex: false,
};

const SEOContext = createContext<SEOContextType | undefined>(undefined);

export const useSEO = (): SEOContextType => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
};

interface SEOProviderProps {
  children: ReactNode;
}

export const SEOProvider: React.FC<SEOProviderProps> = ({ children }) => {
  const [seoData, setSeoData] = useState<SEOData>(defaultSEOData);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Skip settings calls when no active session to avoid noisy logs
        const { session, error: sessionError } = await authHelpers.getSession();
        if (sessionError || !session) {
          return; // defaults will be used
        }

        const [siteTitle, companyName, appDescription] = await Promise.all([
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.SEO, 'site_title'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.GENERAL, 'company_name'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.GENERAL, 'app_description'),
        ]);
        if (!mounted) return;
        setSeoData(prev => ({
          ...prev,
          title: typeof siteTitle === 'string' && siteTitle.trim() ? siteTitle : prev.title,
          siteName: typeof companyName === 'string' && companyName.trim() ? companyName : (typeof siteTitle === 'string' && siteTitle.trim() ? siteTitle : prev.siteName),
          description: typeof appDescription === 'string' && appDescription.trim() ? appDescription : prev.description,
        }));
      } catch (e) {
        // Non-fatal; defaults will be used
        console.debug('SEOContext: settings fetch skipped or failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const updateSEO = (data: Partial<SEOData>) => {
    setSeoData(prev => ({ ...prev, ...data }));
  };

  const resetSEO = () => {
    setSeoData(defaultSEOData);
  };

  return (
    <SEOContext.Provider value={{ seoData, updateSEO, resetSEO }}>
      {children}
    </SEOContext.Provider>
  );
};

export { SEOContext };