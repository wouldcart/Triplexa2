
import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnquiryConfiguration, CountryEnquirySettings, DEFAULT_ENQUIRY_COUNTRIES } from '../types/enquiry';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';

interface CompanyDetails {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}

interface PDFSettings {
  headerEnabled: boolean;
  showLogo: boolean;
  showCompanyName: boolean;
  showContactDetails: boolean;
  headerBackgroundColor: string;
  headerTextColor: string;
  fontFamily: 'Arial' | 'Times' | 'Helvetica' | 'Georgia';
  fontSize: 'small' | 'medium' | 'large';
}

interface ApplicationSettings {
  logo: string | null;
  darkLogo: string | null;
  favicon: string | null;
  logoSize: 'small' | 'medium' | 'large';
  companyDetails: CompanyDetails;
  seoSettings: SEOSettings;
  pdfSettings: PDFSettings;
  enquirySettings: EnquiryConfiguration;
}

interface ApplicationSettingsContextType {
  settings: ApplicationSettings;
  updateSettings: (newSettings: Partial<ApplicationSettings>) => void;
  updateCompanyDetails: (details: Partial<CompanyDetails>) => void;
  updateSEOSettings: (seo: Partial<SEOSettings>) => void;
  updatePDFSettings: (pdf: Partial<PDFSettings>) => void;
  updateEnquirySettings: (enquirySettings: Partial<EnquiryConfiguration>) => void;
  addCountry: (country: CountryEnquirySettings) => void;
  updateCountry: (countryCode: string, updates: Partial<CountryEnquirySettings>) => void;
  removeCountry: (countryCode: string) => void;
  setDefaultCountry: (countryCode: string) => void;
}

const defaultSettings: ApplicationSettings = {
  logo: null,
  darkLogo: null,
  favicon: null,
  logoSize: 'medium',
  companyDetails: {
    name: 'TripOex',
    tagline: 'Travel Management System',
    description: 'Complete travel and tourism management solution',
    address: '',
    phone: '',
    email: '',
    website: ''
  },
  seoSettings: {
    title: 'TripOex - Travel Management System',
    description: 'Complete travel and tourism management solution for agencies and operators',
    keywords: 'travel, tourism, management, booking, itinerary',
    ogTitle: 'TripOex - Travel Management System',
    ogDescription: 'Complete travel and tourism management solution for agencies and operators'
  },
  pdfSettings: {
    headerEnabled: true,
    showLogo: true,
    showCompanyName: true,
    showContactDetails: true,
    headerBackgroundColor: '#ffffff',
    headerTextColor: '#000000',
    fontFamily: 'Arial',
    fontSize: 'medium'
  },
  enquirySettings: {
    countries: DEFAULT_ENQUIRY_COUNTRIES,
    defaultCountryCode: 'TH'
  }
};

const ApplicationSettingsContext = createContext<ApplicationSettingsContextType | undefined>(undefined);

export const ApplicationSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ApplicationSettings>(defaultSettings);

  useEffect(() => {
    // Hydrate settings from unified App Settings service (DB with localStorage fallback)
    (async () => {
      try {
        const [companyNameRes, taglineRes, logoRes, darkLogoRes, faviconRes, siteTitleRes] = await Promise.all([
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_name'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'brand_tagline'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_logo'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_logo_dark'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_favicon'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.GENERAL, 'site_title')
        ]);

        setSettings(prev => ({
          ...prev,
          logo: (logoRes as string) || prev.logo,
          darkLogo: (darkLogoRes as string) || prev.darkLogo,
          favicon: (faviconRes as string) || prev.favicon,
          companyDetails: {
            ...prev.companyDetails,
            name: (companyNameRes as string) || prev.companyDetails.name,
            tagline: (taglineRes as string) || prev.companyDetails.tagline
          },
          seoSettings: {
            ...prev.seoSettings,
            title: (siteTitleRes as string) || prev.seoSettings.title
          }
        }));
      } catch (error) {
        console.warn('ApplicationSettings: Failed to hydrate from AppSettingsService, using defaults', error);
      }
    })();
  }, []);

  const updateSettings = (newSettings: Partial<ApplicationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // Persist known branding keys via unified service
      (async () => {
        try {
          if (newSettings.logo !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.BRANDING, 'company_logo', { setting_value: newSettings.logo as any, is_active: true });
          }
          if (newSettings.darkLogo !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.BRANDING, 'company_logo_dark', { setting_value: newSettings.darkLogo as any, is_active: true });
          }
          if (newSettings.favicon !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.BRANDING, 'company_favicon', { setting_value: newSettings.favicon as any, is_active: true });
          }
          if (newSettings.seoSettings?.title !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.GENERAL, 'site_title', { setting_value: newSettings.seoSettings.title as any, is_active: true });
          }
        } catch (e) {
          console.warn('Failed to persist application settings via AppSettingsService', e);
        }
      })();

      return updated;
    });
  };

  const updateCompanyDetails = (details: Partial<CompanyDetails>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        companyDetails: { ...prev.companyDetails, ...details }
      };

      // Persist known company details to unified service
      (async () => {
        try {
          if (details.name !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.BRANDING, 'company_name', { setting_value: details.name as any, is_active: true });
          }
          if (details.tagline !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.BRANDING, 'brand_tagline', { setting_value: details.tagline as any, is_active: true });
          }
        } catch (e) {
          console.warn('Failed to persist company details via AppSettingsService', e);
        }
      })();

      return updated;
    });
  };

  const updateSEOSettings = (seo: Partial<SEOSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        seoSettings: { ...prev.seoSettings, ...seo }
      };

      (async () => {
        try {
          if (seo.title !== undefined) {
            await AppSettingsService.updateSetting(SETTING_CATEGORIES.GENERAL, 'site_title', { setting_value: seo.title as any, is_active: true });
          }
        } catch (e) {
          console.warn('Failed to persist SEO settings via AppSettingsService', e);
        }
      })();

      return updated;
    });
  };

  const updatePDFSettings = (pdf: Partial<PDFSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        pdfSettings: { ...prev.pdfSettings, ...pdf }
      };
      return updated;
    });
  };

  const updateEnquirySettings = (enquirySettings: Partial<EnquiryConfiguration>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        enquirySettings: { ...prev.enquirySettings, ...enquirySettings }
      };
      return updated;
    });
  };

  const addCountry = (country: CountryEnquirySettings) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        enquirySettings: {
          ...prev.enquirySettings,
          countries: [...prev.enquirySettings.countries, country]
        }
      };
      return updated;
    });
  };

  const updateCountry = (countryCode: string, updates: Partial<CountryEnquirySettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        enquirySettings: {
          ...prev.enquirySettings,
          countries: prev.enquirySettings.countries.map(country =>
            country.countryCode === countryCode
              ? { ...country, ...updates }
              : country
          )
        }
      };
      return updated;
    });
  };

  const removeCountry = (countryCode: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        enquirySettings: {
          ...prev.enquirySettings,
          countries: prev.enquirySettings.countries.filter(country => 
            country.countryCode !== countryCode
          )
        }
      };
      return updated;
    });
  };

  const setDefaultCountry = (countryCode: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        enquirySettings: {
          ...prev.enquirySettings,
          defaultCountryCode: countryCode,
          countries: prev.enquirySettings.countries.map(country => ({
            ...country,
            isDefault: country.countryCode === countryCode
          }))
        }
      };
      return updated;
    });
  };

  return (
    <ApplicationSettingsContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        updateCompanyDetails, 
        updateSEOSettings, 
        updatePDFSettings,
        updateEnquirySettings,
        addCountry,
        updateCountry,
        removeCountry,
        setDefaultCountry
      }}
    >
      {children}
    </ApplicationSettingsContext.Provider>
  );
};

export function useApplicationSettings() {
  const context = useContext(ApplicationSettingsContext);
  if (context === undefined) {
    throw new Error('useApplicationSettings must be used within an ApplicationSettingsProvider');
  }
  return context;
}
