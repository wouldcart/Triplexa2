import React, { useState, useEffect } from 'react';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createDarkLogo, invertLogoColors } from '@/utils/logoDarkMode';
import { Image as ImageIcon, Sun, Moon } from 'lucide-react';

/**
 * Demo component to show dark logo functionality
 * This component demonstrates how the logo switches between light and dark themes
 */
export const DarkLogoDemo: React.FC = () => {
  const { settings, updateSettings } = useApplicationSettings();
  const { theme, setTheme } = useTheme();
  const [isGeneratingDarkLogo, setIsGeneratingDarkLogo] = useState(false);

  const generateDarkLogo = async () => {
    if (!settings.logo) {
      alert('Please upload a light logo first');
      return;
    }

    setIsGeneratingDarkLogo(true);
    try {
      // Try to invert the current logo colors
      const invertedLogo = await invertLogoColors(settings.logo);
      updateSettings({ darkLogo: invertedLogo });
      alert('Dark logo generated successfully! Switch to dark mode to see it.');
    } catch (error) {
      console.error('Failed to invert logo colors:', error);
      // Fallback to placeholder dark logo
      const darkLogo = createDarkLogo(settings.logo);
      updateSettings({ darkLogo: darkLogo });
      alert('Dark logo generated using placeholder! Switch to dark mode to see it.');
    } finally {
      setIsGeneratingDarkLogo(false);
    }
  };

  const removeDarkLogo = () => {
    updateSettings({ darkLogo: null });
    alert('Dark logo removed');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Dark Logo Demo
        </CardTitle>
        <CardDescription>
          Test the dark logo functionality. Upload a light logo and generate a dark version.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Theme Display */}
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm font-medium">Current Theme:</span>
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="text-sm capitalize">{theme}</span>
          </div>
        </div>

        {/* Logo Preview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Light Logo</h4>
            <div className="p-4 bg-white dark:bg-gray-700 border rounded-lg flex items-center justify-center h-20">
              {settings.logo ? (
                <img 
                  src={settings.logo} 
                  alt="Light Logo" 
                  className="h-10 w-auto max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm">No light logo</div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Dark Logo</h4>
            <div className="p-4 bg-gray-900 dark:bg-gray-800 border rounded-lg flex items-center justify-center h-20">
              {settings.darkLogo ? (
                <img 
                  src={settings.darkLogo} 
                  alt="Dark Logo" 
                  className="h-10 w-auto max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm">No dark logo</div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Switch Theme:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 mr-1" />
                Switch to Light
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-1" />
                Switch to Dark
              </>
            )}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={generateDarkLogo}
            disabled={isGeneratingDarkLogo || !settings.logo}
          >
            {isGeneratingDarkLogo ? 'Generating...' : 'Generate Dark Logo'}
          </Button>
          
          {settings.darkLogo && (
            <Button
              size="sm"
              variant="outline"
              onClick={removeDarkLogo}
            >
              Remove Dark Logo
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Light logo: {settings.logo ? '✓ Configured' : '✗ Not set'}</p>
          <p>• Dark logo: {settings.darkLogo ? '✓ Configured' : '✗ Not set'}</p>
          <p>• Current theme: {theme}</p>
          <p>• Logo shown: {theme === 'dark' && settings.darkLogo ? 'Dark Logo' : 'Light Logo'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DarkLogoDemo;