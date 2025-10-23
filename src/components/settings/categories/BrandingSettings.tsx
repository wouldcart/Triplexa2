import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { appSettingsService, SETTING_CATEGORIES, AppSetting, AppSettingsService } from '@/services/appSettingsService';
import { Palette, Save, RefreshCw, Type, Eye } from 'lucide-react';

interface BrandingSettingsState {
  company_name: string;
  company_logo: string;
  company_favicon: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css: string;
  footer_text: string;
  copyright_text: string;
  brand_tagline: string;
  login_background: string;
}

export const BrandingSettings: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettingsState>({
    company_name: '',
    company_logo: '',
    company_favicon: '',
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    font_family: 'Inter',
    custom_css: '',
    footer_text: '',
    copyright_text: '',
    brand_tagline: '',
    login_background: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<BrandingSettingsState>({} as BrandingSettingsState);
  
  const { toast } = useToast();

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await AppSettingsService.getSettingsByCategory(SETTING_CATEGORIES.BRANDING);
      if (response.success && response.data) {
        const settingsMap = response.data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value || '';
          return acc;
        }, {} as Record<string, string>);
        
        const loadedSettings = { ...settings, ...settingsMap };
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to load branding settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: keyof BrandingSettingsState, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(settings).map(([key, value]) => 
        AppSettingsService.createSetting({
          setting_key: key,
          setting_value: value,
          category: SETTING_CATEGORIES.BRANDING
        })
      );

      await Promise.all(promises);
      setOriginalSettings(settings);
      setHasChanges(false);
      
      toast({
        title: "Success",
        description: "Branding settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      company_name: 'Name of the company or organization',
      company_logo: 'URL to the company logo image',
      company_favicon: 'URL to the favicon image',
      primary_color: 'Primary brand color (hex code)',
      secondary_color: 'Secondary brand color (hex code)',
      accent_color: 'Accent brand color (hex code)',
      font_family: 'Primary font family for the application',
      custom_css: 'Custom CSS styles to apply globally',
      footer_text: 'Text to display in the footer',
      copyright_text: 'Copyright notice text',
      brand_tagline: 'Company tagline or slogan',
      login_background: 'Background image URL for login page'
    };
    return descriptions[key] || '';
  };

  const isPublicSetting = (key: string): boolean => {
    const publicSettings = ['company_name', 'company_logo', 'company_favicon', 'primary_color', 'secondary_color', 'accent_color', 'font_family', 'footer_text', 'copyright_text', 'brand_tagline'];
    return publicSettings.includes(key);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading branding settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Branding Settings</h2>
          <Badge variant="secondary">Visual Identity</Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
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
              size="sm"
            >
              <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Company Information section removed to avoid duplication with General Settings */}

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Color Scheme</CardTitle>
          </div>
          <CardDescription>
            Define your brand colors and visual theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={settings.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  placeholder="#10b981"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography & Styling */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <CardTitle>Typography & Styling</CardTitle>
          </div>
          <CardDescription>
            Configure fonts and custom styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="font_family">Primary Font Family</Label>
            <select
              id="font_family"
              value={settings.font_family}
              onChange={(e) => handleInputChange('font_family', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="system-ui">System UI</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="custom_css">Custom CSS</Label>
            <Textarea
              id="custom_css"
              value={settings.custom_css}
              onChange={(e) => handleInputChange('custom_css', e.target.value)}
              placeholder="/* Add your custom CSS here */"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Custom CSS will be applied globally to the application
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content & Footer */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Content & Footer</CardTitle>
          </div>
          <CardDescription>
            Configure footer and copyright information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="footer_text">Footer Text</Label>
            <Textarea
              id="footer_text"
              value={settings.footer_text}
              onChange={(e) => handleInputChange('footer_text', e.target.value)}
              placeholder="Additional footer information"
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="copyright_text">Copyright Text</Label>
            <Input
              id="copyright_text"
              value={settings.copyright_text}
              onChange={(e) => handleInputChange('copyright_text', e.target.value)}
              placeholder="© 2024 Your Company Name. All rights reserved."
            />
          </div>
          
          <div>
            <Label htmlFor="login_background">Login Background Image URL</Label>
            <Input
              id="login_background"
              value={settings.login_background}
              onChange={(e) => handleInputChange('login_background', e.target.value)}
              placeholder="https://example.com/background.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Background image for the login page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};