import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SETTING_CATEGORIES, AppSettingsService } from '@/services/appSettingsService_database';
import { AppSettingsHelpers } from '@/services/appSettingsService_database';
import FaviconUpload from '@/components/settings/FaviconUpload';
import AppLogoUpload from '@/components/settings/AppLogoUpload';
import { useApp } from '@/contexts/AppContext';
import { Save, RefreshCw, Globe, Clock, MapPin } from 'lucide-react';

interface GeneralSettingsProps {
  className?: string;
}

interface GeneralSettingValues {
  app_name: string;
  app_description: string;
  company_name: string;
  company_address: string;
  contact_email: string;
  contact_phone: string;
  default_timezone: string;
  default_currency: string;
  default_language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_file_upload_size: string;
}

// Additional SEO/Identity settings managed within General
interface IdentitySettings {
  site_title: string;
}

// Dynamic lists are provided by AppContext (timezone, currency, language)

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ className }) => {
  const {
    timezone,
    setTimezone,
    availableTimezones,
    currency,
    setCurrency,
    availableCurrencies,
    language,
    setLanguage,
    availableLanguages,
    languageNames
  } = useApp();

  const [settings, setSettings] = useState<GeneralSettingValues>({
    app_name: '',
    app_description: '',
    company_name: '',
    company_address: '',
    contact_email: '',
    contact_phone: '',
    default_timezone: 'UTC',
    default_currency: 'USD',
    default_language: 'en',
    maintenance_mode: false,
    registration_enabled: true,
    max_file_upload_size: '10',
  });
  const [identity, setIdentity] = useState<IdentitySettings>({ site_title: '' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const [currencyOptions, setCurrencyOptions] = useState<{ code: string; symbol?: string }[]>([]);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [geocodingEnabled, setGeocodingEnabled] = useState(false);
  const [isSavingGeocoding, setIsSavingGeocoding] = useState(false);

  useEffect(() => {
    loadSettings();
    // Load site title from SEO settings
    (async () => {
      try {
        const val = await AppSettingsService.getSettingValue(SETTING_CATEGORIES.SEO, 'site_title');
        setIdentity({ site_title: (val as string) || '' });
      } catch (e) {
        console.warn('Failed to load site title:', e);
      }
    })();
    // Load geocoding toggle from Integrations settings
    (async () => {
      try {
        const existing = await AppSettingsService.getSetting(SETTING_CATEGORIES.INTEGRATIONS, 'nominatim_geocoding_enabled');
        if (existing.success && existing.data) {
          const raw = existing.data.setting_value ?? (existing.data.setting_json as any);
          setGeocodingEnabled(String(raw) === 'true');
        } else {
          // Ensure default exists
          await AppSettingsHelpers.ensureSettingValue(SETTING_CATEGORIES.INTEGRATIONS, 'nominatim_geocoding_enabled', 'false');
          setGeocodingEnabled(false);
        }
      } catch (e) {
        console.warn('Failed to load geocoding toggle:', e);
        setGeocodingEnabled(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Build comprehensive currency list from Supabase countries data
    (async () => {
      try {
        const { CountriesService } = await import('@/services/countriesService');
        const res = await CountriesService.getAllCountries();
        if (res.success && res.data) {
          const unique = new Map<string, string | undefined>();
          for (const c of res.data) {
            if (c.currency) unique.set(c.currency, (c as any).currency_symbol);
            if ((c as any).pricing_currency) unique.set((c as any).pricing_currency, (c as any).pricing_currency_symbol);
          }
          const list = Array.from(unique.entries()).map(([code, symbol]) => ({ code, symbol })).sort((a, b) => a.code.localeCompare(b.code));
          setCurrencyOptions(list);
        } else {
          // Fallback to context currencies if Supabase fails
          setCurrencyOptions(availableCurrencies.map(ci => ({ code: ci.code, symbol: ci.symbol })));
        }
      } catch (err) {
        setCurrencyOptions(availableCurrencies.map(ci => ({ code: ci.code, symbol: ci.symbol })));
      }
    })();
  }, [availableCurrencies]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await AppSettingsService.getSettingsByCategory(SETTING_CATEGORIES.GENERAL);
      if (response.success && response.data) {
        const settingsMap: Partial<GeneralSettingValues> = {};
        response.data.forEach(setting => {
          const key = setting.setting_key as keyof GeneralSettingValues;
          if (key in settings) {
            if (typeof settings[key] === 'boolean') {
              (settingsMap as any)[key] = setting.setting_value === 'true';
            } else {
              (settingsMap as any)[key] = setting.setting_value;
            }
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error loading general settings:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load general settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: keyof GeneralSettingValues, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert settings to individual setting objects
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
        category: SETTING_CATEGORIES.GENERAL,
        description: getSettingDescription(key),
      }));

      // Try to update each setting first; if not found, create it
      for (const setting of settingsToSave) {
        const updateRes = await AppSettingsService.updateSetting(SETTING_CATEGORIES.GENERAL, setting.setting_key, {
          setting_value: setting.setting_value,
          description: setting.description,
          is_active: true
        });
        if (!updateRes.success) {
          await AppSettingsService.createSetting({
            category: SETTING_CATEGORIES.GENERAL,
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            description: setting.description,
            is_active: true
          });
        }
      }

      toast({
        title: "Settings Saved",
        description: "General settings have been saved successfully",
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving general settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save general settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      app_name: 'The name of your application',
      app_description: 'A brief description of your application',
      company_name: 'Your company or organization name',
      company_address: 'Your company address',
      contact_email: 'Primary contact email address',
      contact_phone: 'Primary contact phone number',
      default_timezone: 'Default timezone for the application',
      default_currency: 'Default currency for pricing',
      default_language: 'Default language for the interface',
      maintenance_mode: 'Enable maintenance mode to restrict access',
      registration_enabled: 'Allow new user registrations',
      max_file_upload_size: 'Maximum file upload size in MB',
    };
    return descriptions[key] || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading general settings...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Site Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Site Identity</span>
          </CardTitle>
          <CardDescription>
            Global site title and favicon used across the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                value={identity.site_title}
                onChange={(e) => setIdentity({ site_title: e.target.value })}
                placeholder="Your Site Title"
              />
              <p className="text-xs text-muted-foreground">Shown in browser tab and header</p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              onClick={async () => {
                setIsSavingIdentity(true);
                try {
                  const res = await AppSettingsHelpers.upsertSetting({
                    category: SETTING_CATEGORIES.GENERAL,
                    setting_key: 'site_title',
                    setting_value: identity.site_title.trim()
                  });
                  if (!res.success) throw new Error(res.error || 'Failed to save site title');
                  toast({ title: 'Saved', description: 'Site title updated' });
                } catch (err: any) {
                  toast({ title: 'Save failed', description: err?.message || 'Could not save site title', variant: 'destructive' });
                } finally {
                  setIsSavingIdentity(false);
                }
              }}
              disabled={isSavingIdentity || !identity.site_title.trim()}
            >
              {isSavingIdentity ? 'Saving...' : 'Save Title'}
            </Button>
          </div>

          {/* Favicon Upload */}
          <div className="pt-2">
            <FaviconUpload />
          </div>

          {/* Application Logo Upload */}
          <div className="pt-2">
            <AppLogoUpload />
          </div>
        </CardContent>
      </Card>
      {/* Application Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Application Information</span>
          </CardTitle>
          <CardDescription>
            Basic information about your application and company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={settings.app_name}
                onChange={(e) => handleInputChange('app_name', e.target.value)}
                placeholder="My Travel App"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Travel Company Inc."
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app_description">Application Description</Label>
            <Textarea
              id="app_description"
              value={settings.app_description}
              onChange={(e) => handleInputChange('app_description', e.target.value)}
              placeholder="A comprehensive travel management system..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company_address">Company Address</Label>
            <Textarea
              id="company_address"
              value={settings.company_address}
              onChange={(e) => handleInputChange('company_address', e.target.value)}
              placeholder="123 Main St, City, Country"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
          <CardDescription>
            Primary contact details for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Regional Settings</span>
          </CardTitle>
          <CardDescription>
            Default timezone, currency, and language settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_timezone">Default Timezone</Label>
              <Select
                value={settings.default_timezone}
                onValueChange={(value) => {
                  handleInputChange('default_timezone', value);
                  setTimezone(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {(availableTimezones.length ? availableTimezones : ['UTC']).map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_currency">Default Currency</Label>
              <Select
                value={settings.default_currency}
                onValueChange={(value) => {
                  handleInputChange('default_currency', value);
                  setCurrency(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {(currencyOptions.length ? currencyOptions : availableCurrencies.map(ci => ({ code: ci.code, symbol: ci.symbol }))).map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol ? `${c.code} (${c.symbol})` : c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default_language">Default Language</Label>
              <Select
                value={settings.default_language}
                onValueChange={(value) => {
                  handleInputChange('default_language', value);
                  setLanguage(value as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {(availableLanguages.length ? availableLanguages : ['en']).map((code) => (
                    <SelectItem key={code} value={code}>
                      {languageNames[code as keyof typeof languageNames] || code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Application behavior and system configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable to restrict access during maintenance
              </p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="nominatim_geocoding_enabled">Nominatim Geocoding</Label>
              <p className="text-sm text-muted-foreground">
                Enable free location search and reverse geocoding (OpenStreetMap)
              </p>
            </div>
            <Switch
              id="nominatim_geocoding_enabled"
              checked={geocodingEnabled}
              onCheckedChange={async (checked) => {
                setGeocodingEnabled(checked);
                setIsSavingGeocoding(true);
                try {
                  const res = await AppSettingsHelpers.upsertSetting({
                    category: SETTING_CATEGORIES.INTEGRATIONS,
                    setting_key: 'nominatim_geocoding_enabled',
                    setting_value: checked ? 'true' : 'false',
                    description: 'Toggle to enable Nominatim geocoding features'
                  });
                  if (!res.success) throw new Error(res.error || 'Failed to save geocoding toggle');
                  toast({ title: 'Saved', description: `Nominatim geocoding ${checked ? 'enabled' : 'disabled'}` });
                } catch (err: any) {
                  toast({ title: 'Save failed', description: err?.message || 'Could not save geocoding toggle', variant: 'destructive' });
                  // revert UI on failure
                  setGeocodingEnabled(!checked);
                } finally {
                  setIsSavingGeocoding(false);
                }
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="registration_enabled">User Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register accounts
              </p>
            </div>
            <Switch
              id="registration_enabled"
              checked={settings.registration_enabled}
              onCheckedChange={(checked) => handleInputChange('registration_enabled', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_file_upload_size">Max File Upload Size (MB)</Label>
            <Input
              id="max_file_upload_size"
              type="number"
              value={settings.max_file_upload_size}
              onChange={(e) => handleInputChange('max_file_upload_size', e.target.value)}
              placeholder="10"
              min="1"
              max="100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={loadSettings}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </div>
  );
};