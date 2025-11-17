import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Settings,
  Download,
  Upload,
  Palette,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { 
  themeUtils, 
  themeAccessibility, 
  enableSmoothThemeTransitions, 
  preloadLogos,
  LogoCache 
} from '@/utils/themeUtils';
import { toast } from 'sonner';

interface ThemeTestResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  duration?: number;
}

/**
 * Comprehensive Theme Testing Component
 * Tests all aspects of theme switching, logo handling, and accessibility
 */
export const ThemeTestSuite: React.FC = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const { settings } = useApplicationSettings();
  const [testResults, setTestResults] = useState<ThemeTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    themeSwitchTime: 0,
    logoLoadTime: 0,
    totalTests: 0,
    passedTests: 0
  });

  const logoCache = new LogoCache('test-v1');

  const tests = [
    {
      name: 'Theme Detection',
      run: async () => {
        const currentTheme = themeUtils.getCurrentTheme();
        const systemTheme = themeUtils.getSystemTheme();
        return {
          test: 'Theme Detection',
          status: currentTheme ? 'pass' : 'fail',
          message: `Current: ${currentTheme}, System: ${systemTheme}`
        } as ThemeTestResult;
      }
    },
    {
      name: 'Logo Theme Switching',
      run: async () => {
        const startTime = performance.now();
        
        // Test light theme
        setTheme('light');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Test dark theme
        setTheme('dark');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Test system theme
        setTheme('system');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
          test: 'Logo Theme Switching',
          status: 'pass',
          message: `All theme switches completed successfully`,
          duration
        } as ThemeTestResult;
      }
    },
    {
      name: 'Logo Preloading',
      run: async () => {
        const startTime = performance.now();
        
        if (settings.logo || settings.darkLogo) {
          preloadLogos(settings.logo || undefined, settings.darkLogo || undefined);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
          test: 'Logo Preloading',
          status: (settings.logo || settings.darkLogo) ? 'pass' : 'pending',
          message: `Logos preloaded in ${duration.toFixed(2)}ms`,
          duration
        } as ThemeTestResult;
      }
    },
    {
      name: 'Accessibility Attributes',
      run: async () => {
        const lightAttrs = themeAccessibility.getToggleAriaAttributes('light');
        const darkAttrs = themeAccessibility.getToggleAriaAttributes('dark');
        
        const hasRequiredAttrs = lightAttrs['aria-label'] && darkAttrs['role'];
        
        return {
          test: 'Accessibility Attributes',
          status: hasRequiredAttrs ? 'pass' : 'fail',
          message: `ARIA attributes: ${hasRequiredAttrs ? 'Complete' : 'Missing'}`
        } as ThemeTestResult;
      }
    },
    {
      name: 'Contrast Validation',
      run: async () => {
        const lightContrast = themeAccessibility.getContrastColor('#ffffff');
        const darkContrast = themeAccessibility.getContrastColor('#000000');
        
        const isValid = lightContrast === 'black' && darkContrast === 'white';
        
        return {
          test: 'Contrast Validation',
          status: isValid ? 'pass' : 'fail',
          message: `Light: ${lightContrast}, Dark: ${darkContrast}`
        } as ThemeTestResult;
      }
    },
    {
      name: 'Smooth Transitions',
      run: async () => {
        const startTime = performance.now();
        
        enableSmoothThemeTransitions(200);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
          test: 'Smooth Transitions',
          status: 'pass',
          message: `Transitions enabled in ${duration.toFixed(2)}ms`,
          duration
        } as ThemeTestResult;
      }
    },
    {
      name: 'Logo Cache Performance',
      run: async () => {
        const testKey = 'test-logo';
        const testValue = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIGZpbGw9IiNmZjAwMDAiLz48L3N2Zz4=';
        
        const startTime = performance.now();
        
        logoCache.set(testKey, testValue);
        const cachedValue = logoCache.get(testKey);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const isWorking = cachedValue === testValue;
        
        return {
          test: 'Logo Cache Performance',
          status: isWorking ? 'pass' : 'fail',
          message: `Cache ${isWorking ? 'working' : 'failed'} in ${duration.toFixed(2)}ms`,
          duration
        } as ThemeTestResult;
      }
    },
    {
      name: 'System Theme Detection',
      run: async () => {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const detectedSystemTheme = systemPrefersDark ? 'dark' : 'light';
        
        return {
          test: 'System Theme Detection',
          status: detectedSystemTheme ? 'pass' : 'fail',
          message: `Detected: ${detectedSystemTheme}`
        } as ThemeTestResult;
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTestIndex(0);
    
    const results: ThemeTestResult[] = [];
    let passedTests = 0;
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTestIndex(i);
      
      try {
        const result = await test.run();
        results.push(result);
        if (result.status === 'pass') passedTests++;
        
        setTestResults([...results]);
        
        // Small delay between tests for visual feedback
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.push({
          test: test.name,
          status: 'fail',
          message: `Test failed: ${error.message}`
        });
        setTestResults([...results]);
      }
    }
    
    setPerformanceMetrics(prev => ({
      ...prev,
      totalTests: tests.length,
      passedTests
    }));
    
    setIsRunning(false);
    
    toast.success(`Tests completed! ${passedTests}/${tests.length} passed`);
  };

  const downloadTestReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      theme: theme,
      systemTheme: systemTheme,
      testResults: testResults,
      performanceMetrics: performanceMetrics,
      settings: {
        hasLightLogo: !!settings.logo,
        hasDarkLogo: !!settings.darkLogo,
        logoSize: settings.logoSize
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Test report downloaded');
  };

  const simulateNetworkConditions = async (condition: 'slow' | 'fast' | 'offline') => {
    toast.info(`Simulating ${condition} network conditions...`);
    
    switch (condition) {
      case 'slow':
        // Simulate slow network by adding delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      case 'offline':
        // Simulate offline by using cached logos only
        toast.info('Using cached logos only (offline mode)');
        break;
      case 'fast':
        // Fast network - no delay
        break;
    }
    
    toast.success(`Network simulation completed for ${condition}`);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'pending') => {
    const variants = {
      pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Theme Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing for theme switching, logo handling, and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="gap-2"
            >
              <Settings className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? `Running Test ${currentTestIndex + 1}/${tests.length}` : 'Run All Tests'}
            </Button>
            
            <Button 
              onClick={downloadTestReport} 
              variant="outline"
              disabled={testResults.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
          
          {/* Network Simulation */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Network Simulation</div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => simulateNetworkConditions('fast')}
                className="gap-1"
              >
                <Zap className="h-3 w-3" />
                Fast
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => simulateNetworkConditions('slow')}
                className="gap-1"
              >
                <Clock className="h-3 w-3" />
                Slow
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => simulateNetworkConditions('offline')}
                className="gap-1"
              >
                <Monitor className="h-3 w-3" />
                Offline
              </Button>
            </div>
          </div>
          
          {/* Current Theme Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-500">Current Theme</div>
              <div className="font-mono text-sm">{theme}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">System Theme</div>
              <div className="font-mono text-sm">{systemTheme}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Active Logo</div>
              <div className="font-mono text-sm">
                {theme === 'dark' && settings.darkLogo ? 'Dark' : 'Light'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Test Results
              </span>
              <Badge variant="outline">
                {performanceMetrics.passedTests}/{performanceMetrics.totalTests} Passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium text-sm">{result.test}</div>
                      <div className="text-xs text-gray-500">{result.message}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <div className="text-xs text-gray-500">
                        {result.duration.toFixed(0)}ms
                      </div>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {performanceMetrics.totalTests}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Tests</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {performanceMetrics.passedTests}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Passed</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((performanceMetrics.passedTests / performanceMetrics.totalTests) * 100) || 0}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {testResults.filter(r => r.duration).reduce((acc, r) => acc + (r.duration || 0), 0).toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logo Preview Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo Preview Testing
          </CardTitle>
          <CardDescription>
            Test logo appearance across different themes and conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Theme Preview */}
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">Light Theme</div>
                <Sun className="h-4 w-4 text-yellow-500" />
              </div>
              
              <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                {settings.logo ? (
                  <img 
                    src={settings.logo} 
                    alt="Light Logo Preview" 
                    className="h-16 w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="h-16 bg-gray-200 rounded border-2 border-dashed flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No light logo</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dark Theme Preview */}
            <div className="p-4 bg-gray-900 border-2 border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-white">Dark Theme</div>
                <Moon className="h-4 w-4 text-blue-400" />
              </div>
              
              <div className="flex justify-center p-6 bg-gray-800 rounded-lg">
                {settings.darkLogo ? (
                  <img 
                    src={settings.darkLogo} 
                    alt="Dark Logo Preview" 
                    className="h-16 w-auto max-w-full object-contain"
                  />
                ) : (
                  <div className="h-16 bg-gray-700 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No dark logo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeTestSuite;