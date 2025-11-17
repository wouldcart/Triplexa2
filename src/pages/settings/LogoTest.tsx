import React from 'react';
import { LogoDebug } from '@/components/settings/LogoDebug';
import { ThemeTestSuite } from '@/components/settings/ThemeTestSuite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Sun, Moon, ArrowLeft, Settings, TestTube } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Logo Test Page - Helps verify dark/light logo functionality
 * This page provides a comprehensive test of the logo switching functionality
 */
const LogoTestPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Switch to Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Switch to Dark
                </>
              )}
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <TestTube className="h-6 w-6" />
                Logo & Theme Test Suite
              </CardTitle>
              <CardDescription>
                Comprehensive testing for dark/light logo switching, theme management, and accessibility features
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Logo Debug Component */}
        <LogoDebug />

        {/* Comprehensive Theme Test Suite */}
        <ThemeTestSuite />

        {/* Enhanced Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Testing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">1</span>
                    Upload Logo Assets
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to Settings → Branding → Application Logo to upload both light and dark versions of your logo. 
                    The system supports PNG, JPG, and SVG formats.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">2</span>
                    Test Theme Switching
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use the theme toggle buttons above or the system theme switcher to test automatic logo transitions. 
                    The system detects OS-level theme changes in real-time.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">3</span>
                    Run Automated Tests
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use the "Run All Tests" button in the Theme Test Suite above to validate theme switching, 
                    logo caching, accessibility features, and performance metrics.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold">4</span>
                    Monitor Performance
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Check the performance metrics to ensure smooth theme transitions, fast logo loading, 
                    and optimal caching behavior across different network conditions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Enhanced Features:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Real-time theme detection with system preference monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Smooth CSS transitions between themes (300ms duration)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Supabase Storage integration for logo asset management
                  </li>
                </ul>
                <ul className="space-y-2 text-purple-700 dark:text-purple-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Intelligent logo caching with cache busting
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Comprehensive accessibility attributes (ARIA)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Network condition simulation for testing
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Expected Behavior Summary:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700 dark:text-yellow-300">
                <div>
                  <div className="font-medium mb-2">Light Mode:</div>
                  <ul className="space-y-1">
                    <li>• Displays light logo (if uploaded)</li>
                    <li>• Shows company initial fallback if no logo</li>
                    <li>• Smooth transition from dark mode</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium mb-2">Dark Mode:</div>
                  <ul className="space-y-1">
                    <li>• Displays dark logo (if configured)</li>
                    <li>• Falls back to light logo if no dark version</li>
                    <li>• Automatic system preference detection</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoTestPage;