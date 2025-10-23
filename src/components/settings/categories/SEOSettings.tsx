import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { appSettingsService, SETTING_CATEGORIES, AppSetting, AppSettingsService } from '@/services/appSettingsService';
import { Search, Save, RefreshCw, Globe, FileText, Tag } from 'lucide-react';

interface SEOSettingsState {
  site_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card_type: string;
  twitter_site: string;
  canonical_url: string;
  robots_txt: string;
  sitemap_enabled: string;
}

export const SEOSettings: React.FC = () => {
  const [settings, setSettings] = useState<SEOSettingsState>({
    site_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_card_type: 'summary_large_image',
    twitter_site: '',
    canonical_url: '',
    robots_txt: '',
    sitemap_enabled: 'true'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SEOSettingsState>({} as SEOSettingsState);
  
  const { toast } = useToast();

  const normalizeUrlInput = (value: string): string => {
    let v = String(value || '').trim();
    // Remove spaces inside
    v = v.replace(/\s+/g, '');
    // Fix common missing colon in protocol
    v = v.replace(/^http\/\//, 'http://');
    v = v.replace(/^https\/\//, 'https://');
    // If protocol missing but looks like a domain, assume https
    if (!/^https?:\/\//i.test(v) && /^(www\.|[a-z0-9.-]+\.[a-z]{2,})(\/.*)?$/i.test(v)) {
      v = `https://${v}`;
    }
    return v;
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await AppSettingsService.getSettingsByCategory(SETTING_CATEGORIES.SEO);
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
      console.error('Error loading SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SEO settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: keyof SEOSettingsState, value: string) => {
    const newValue = key === 'canonical_url' ? normalizeUrlInput(value) : value;
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Normalize canonical_url before saving
      const payload = { ...settings, canonical_url: normalizeUrlInput(settings.canonical_url) };

      // Basic validation: if canonical_url is present, ensure it is a valid URL
      if (payload.canonical_url) {
        try {
          // Throws if invalid
          new URL(payload.canonical_url);
        } catch {
          toast({
            title: "Invalid canonical URL",
            description: "Please enter a valid absolute URL (http:// or https://)",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      const promises = Object.entries(payload).map(([key, value]) => 
        AppSettingsService.createSetting({
          setting_key: key,
          setting_value: value,
          category: SETTING_CATEGORIES.SEO
        })
      );

      await Promise.all(promises);
      setOriginalSettings(payload);
      setSettings(payload);
      setHasChanges(false);
      
      toast({
        title: "Success",
        description: "SEO settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      site_title: 'Main title of the website displayed in search results',
      meta_description: 'Brief description of the website for search engines',
      meta_keywords: 'Comma-separated keywords for SEO',
      og_title: 'Title for Open Graph social media sharing',
      og_description: 'Description for Open Graph social media sharing',
      og_image: 'Image URL for Open Graph social media sharing',
      twitter_card_type: 'Type of Twitter card for social sharing',
      twitter_site: 'Twitter handle for the website',
      canonical_url: 'Canonical URL for the website',
      robots_txt: 'Content for robots.txt file',
      sitemap_enabled: 'Whether sitemap generation is enabled'
    };
    return descriptions[key] || '';
  };

  const isPublicSetting = (key: string): boolean => {
    const publicSettings = ['site_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description', 'og_image'];
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
          <span className="ml-2">Loading SEO settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <h2 className="text-lg font-semibold">SEO Settings</h2>
          <Badge variant="secondary">Search Engine Optimization</Badge>
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

      {/* Basic SEO Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Basic SEO</CardTitle>
          </div>
          <CardDescription>
            Configure basic search engine optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                value={settings.site_title}
                onChange={(e) => handleInputChange('site_title', e.target.value)}
                placeholder="Your Website Title"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 50-60 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={settings.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                placeholder="Brief description of your website"
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 150-160 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                value={settings.meta_keywords}
                onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated keywords (optional, most search engines ignore this)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <CardTitle>Social Media</CardTitle>
          </div>
          <CardDescription>
            Configure Open Graph and Twitter Card settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="og_title">Open Graph Title</Label>
              <Input
                id="og_title"
                value={settings.og_title}
                onChange={(e) => handleInputChange('og_title', e.target.value)}
                placeholder="Title for social sharing"
              />
            </div>
            
            <div>
              <Label htmlFor="og_image">Open Graph Image URL</Label>
              <Input
                id="og_image"
                value={settings.og_image}
                onChange={(e) => handleInputChange('og_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="og_description">Open Graph Description</Label>
            <Textarea
              id="og_description"
              value={settings.og_description}
              onChange={(e) => handleInputChange('og_description', e.target.value)}
              placeholder="Description for social sharing"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitter_card_type">Twitter Card Type</Label>
              <select
                id="twitter_card_type"
                value={settings.twitter_card_type}
                onChange={(e) => handleInputChange('twitter_card_type', e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="twitter_site">Twitter Site Handle</Label>
              <Input
                id="twitter_site"
                value={settings.twitter_site}
                onChange={(e) => handleInputChange('twitter_site', e.target.value)}
                placeholder="@yourhandle"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical SEO */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Technical SEO</CardTitle>
          </div>
          <CardDescription>
            Configure technical SEO settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              value={settings.canonical_url}
              onChange={(e) => handleInputChange('canonical_url', e.target.value)}
              placeholder="https://yourdomain.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The preferred URL for this page
            </p>
          </div>
          
          <div>
            <Label htmlFor="robots_txt">Robots.txt Content</Label>
            <Textarea
              id="robots_txt"
              value={settings.robots_txt}
              onChange={(e) => handleInputChange('robots_txt', e.target.value)}
              placeholder="User-agent: *&#10;Disallow: /admin/"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Content for your robots.txt file
            </p>
          </div>
          
          <div>
            <Label htmlFor="sitemap_enabled">Sitemap Generation</Label>
            <select
              id="sitemap_enabled"
              value={settings.sitemap_enabled}
              onChange={(e) => handleInputChange('sitemap_enabled', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically generate sitemap.xml
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};