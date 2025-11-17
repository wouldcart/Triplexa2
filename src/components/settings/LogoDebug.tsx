import React, { useEffect, useState, useCallback } from 'react';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Image as ImageIcon, CheckCircle, XCircle, RefreshCw, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Enhanced Logo Debug Component - Real-time theme and logo management
 */
export const LogoDebug: React.FC = () => {
  const { settings, updateSettings } = useApplicationSettings();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [logoCache, setLogoCache] = useState<Record<string, string>>({});

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time theme detection with system preference monitoring
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setLastUpdated(new Date());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const shouldShowDarkLogo = currentTheme === 'dark' && settings.darkLogo;
  const activeLogo = shouldShowDarkLogo ? settings.darkLogo : settings.logo;

  // Enhanced refresh function with caching
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate logo refresh with cache busting
      const cacheBuster = Date.now();
      if (settings.logo) {
        const lightLogoUrl = `${settings.logo}${settings.logo.includes('?') ? '&' : '?'}_t=${cacheBuster}`;
        setLogoCache(prev => ({ ...prev, light: lightLogoUrl }));
      }
      if (settings.darkLogo) {
        const darkLogoUrl = `${settings.darkLogo}${settings.darkLogo.includes('?') ? '&' : '?'}_t=${cacheBuster}`;
        setLogoCache(prev => ({ ...prev, dark: darkLogoUrl }));
      }
      setLastUpdated(new Date());
      toast.success('Logo cache refreshed');
    } catch (error) {
      toast.error('Failed to refresh logos');
    } finally {
      setIsRefreshing(false);
    }
  }, [settings.logo, settings.darkLogo]);

  // Logo upload handler with Supabase integration
  const handleLogoUpload = async (type: 'light' | 'dark', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `logo-${type}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Update settings
      if (type === 'light') {
        updateSettings({ logo: publicUrl });
      } else {
        updateSettings({ darkLogo: publicUrl });
      }

      toast.success(`${type === 'light' ? 'Light' : 'Dark'} logo uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${type} logo: ${error.message}`);
    }
  };

  // Download logo handler
  const handleLogoDownload = (type: 'light' | 'dark') => {
    const logoUrl = type === 'light' ? settings.logo : settings.darkLogo;
    if (!logoUrl) {
      toast.error(`No ${type} logo configured`);
      return;
    }

    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = `logo-${type}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logo Debug (Loading...)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Initializing theme detection...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time Status Bar */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentTheme === 'dark' ? 'bg-blue-500' : 'bg-yellow-500'} animate-pulse`} />
              <div>
                <div className="text-sm font-medium">Real-time Theme Status</div>
                <div className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()} | 
                  Active: {shouldShowDarkLogo ? 'Dark Logo' : 'Light Logo'}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Enhanced Logo Management
          </CardTitle>
          <CardDescription>
            Real-time theme detection with Supabase storage integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Theme Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border">
              <div className="text-sm font-medium mb-2">Current Theme</div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTheme === 'dark' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                  {currentTheme === 'dark' ? (
                    <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold capitalize">{currentTheme}</div>
                  <div className="text-xs text-gray-500">Active theme</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border">
              <div className="text-sm font-medium mb-2">System Theme</div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${systemTheme === 'dark' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                  {systemTheme === 'dark' ? (
                    <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold capitalize">{systemTheme}</div>
                  <div className="text-xs text-gray-500">OS preference</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border">
              <div className="text-sm font-medium mb-2">Active Logo</div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${shouldShowDarkLogo ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                  <ImageIcon className={`h-5 w-5 ${shouldShowDarkLogo ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                </div>
                <div>
                  <div className="text-lg font-semibold">{shouldShowDarkLogo ? 'Dark' : 'Light'}</div>
                  <div className="text-xs text-gray-500">Currently displayed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Configuration with Upload/Download */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Logo */}
            <div className="p-4 bg-white dark:bg-gray-900 border-2 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">Light Logo</div>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleLogoDownload('light')}
                    disabled={!settings.logo}
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('light', e)}
                      className="hidden"
                    />
                    <Button size="xs" variant="ghost" className="gap-1">
                      <Upload className="h-3 w-3" />
                    </Button>
                  </label>
                </div>
              </div>
              
              {settings.logo ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">✓ Configured</span>
                  </div>
                  <div className="relative group">
                    <img 
                      src={logoCache.light || settings.logo} 
                      alt="Light Logo" 
                      className="h-16 w-auto max-w-full object-contain border rounded-lg bg-gray-50 p-2 transition-all duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Not configured</span>
                  </div>
                  <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed flex items-center justify-center">
                    <span className="text-xs text-gray-500">No light logo</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Dark Logo */}
            <div className="p-4 bg-gray-900 border-2 border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-white">Dark Logo</div>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleLogoDownload('dark')}
                    disabled={!settings.darkLogo}
                    className="gap-1 text-gray-300 hover:text-white"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('dark', e)}
                      className="hidden"
                    />
                    <Button size="xs" variant="ghost" className="gap-1 text-gray-300 hover:text-white">
                      <Upload className="h-3 w-3" />
                    </Button>
                  </label>
                </div>
              </div>
              
              {settings.darkLogo ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">✓ Configured</span>
                  </div>
                  <div className="relative group">
                    <img 
                      src={logoCache.dark || settings.darkLogo} 
                      alt="Dark Logo" 
                      className="h-16 w-auto max-w-full object-contain border rounded-lg bg-white p-2 transition-all duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Not configured</span>
                  </div>
                  <div className="h-16 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <span className="text-xs text-gray-400">No dark logo</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Logo Preview */}
          <div className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold mb-1">Currently Active Logo</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                This is what users see right now
              </div>
            </div>
            
            <div className="flex justify-center">
              {activeLogo ? (
                <div className="text-center space-y-3">
                  <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <img 
                      src={activeLogo} 
                      alt="Active Logo" 
                      className="h-20 w-auto max-w-md object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {shouldShowDarkLogo ? 'Dark Logo (Active)' : 'Light Logo (Active)'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {shouldShowDarkLogo 
                        ? 'Using dark logo because theme is dark' 
                        : 'Using light logo (theme is light or no dark logo configured)'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="inline-block p-8 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">No logo configured</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Upload logos above to get started
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Logic Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium mb-3">Logo Selection Logic</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>If theme is <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded font-mono">dark</code> AND dark logo exists → Use dark logo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Otherwise → Use light logo (or fallback to text)</span>
              </div>
              <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded border">
                <div className="font-medium text-xs mb-1">Current State:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>Theme: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{currentTheme}</code></div>
                  <div>Dark Logo: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{settings.darkLogo ? 'yes' : 'no'}</code></div>
                  <div>Result: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded font-medium">{shouldShowDarkLogo ? 'dark' : 'light'}</code></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Theme Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border">
            <div>
              <div className="font-medium mb-1">Theme Controls</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Switch themes to test logo transitions
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                size="sm"
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                size="sm"
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoDebug;