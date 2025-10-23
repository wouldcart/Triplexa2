
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Globe, 
  Palette, 
  Shield, 
  Bell, 
  Database, 
  Smartphone, 
  Monitor,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
  User,
  Lock,
  Sparkles,
  Zap
} from 'lucide-react';
import { GeneralSettings as GeneralSettingsComponent } from '@/components/settings/categories/GeneralSettings';
import { SEOSettings } from '@/components/settings/categories/SEOSettings';
import { BrandingSettings } from '@/components/settings/categories/BrandingSettings';
// Note: These components may need to be created if they don't exist
// import { SecuritySettings } from '@/components/settings/SecuritySettings';
// import { NotificationSettings } from '@/components/settings/NotificationSettings';
// import { DatabaseSettings } from '@/components/settings/DatabaseSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService';
import { useAppSettingsAccess } from '@/hooks/useAppSettingsAccess';
import PageLayout from '@/components/layout/PageLayout';

// Translation helper function
const getTranslation = (key: string): string => {
  const translations: Record<string, string> = {
    'settings.title': 'Settings',
    'settings.description': 'Manage your application settings and preferences',
    'settings.access_denied': 'Access Denied',
    'settings.admin_required': 'You need administrator privileges to access this page.',
    'common.go_back': 'Go Back',
    'settings.categories.general': 'General',
    'settings.categories.seo': 'SEO',
    'settings.categories.branding': 'Branding',
    'settings.categories.security': 'Security',
    'settings.categories.notifications': 'Notifications',
    'settings.categories.database': 'Database',
  };
  return translations[key] || key;
};

// Available categories - only include those with existing components
const categories = [
  { 
    key: 'general', 
    icon: Settings, 
    description: 'Basic application settings and preferences',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  { 
    key: 'seo', 
    icon: Globe, 
    description: 'Search engine optimization settings',
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  { 
    key: 'branding', 
    icon: Palette, 
    description: 'Customize your brand appearance',
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
];

const ThemeInfo = () => {
  const { theme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setIsAnimating(true);
    setTheme(newTheme);
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <div className="p-4 border-t border-border/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Theme</span>
        <Badge variant="outline" className="text-xs">
          {getThemeLabel()}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: 'light', icon: Sun, label: 'Light' },
          { value: 'dark', icon: Moon, label: 'Dark' },
          { value: 'system', icon: Laptop, label: 'System' }
        ].map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant={theme === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange(value as 'light' | 'dark' | 'system')}
            className={`h-8 text-xs transition-all duration-200 ${
              isAnimating && theme === value ? 'scale-95' : ''
            }`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

const SidebarMenu = ({ 
  activeCategory, 
  onCategoryChange, 
  isMobileSidebarOpen, 
  setIsMobileSidebarOpen 
}: {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}) => {
  const handleCategoryClick = (categoryKey: string) => {
    onCategoryChange(categoryKey);
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm sticky top-4">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{getTranslation('settings.title')}</h2>
              <p className="text-xs text-muted-foreground">
                {getTranslation('settings.description')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.key;
            
            return (
              <Button
                key={category.key}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start mb-1 h-auto p-3 transition-all duration-200 ${
                  isActive 
                    ? `${category.bgColor} ${category.borderColor} border shadow-sm` 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleCategoryClick(category.key)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-1.5 rounded-md ${isActive ? 'bg-background/50' : 'bg-muted/30'}`}>
                    <Icon className={`h-4 w-4 ${isActive ? category.color : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {getTranslation(`settings.categories.${category.key}`)}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">
                      {category.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>
        
        <ThemeInfo />
      </CardContent>
    </Card>
  );
};

const PlaceholderSettings = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 rounded-full bg-muted/50 mb-4">
      <Settings className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title} Settings</h3>
    <p className="text-muted-foreground mb-4">
      This settings section is coming soon.
    </p>
    <Badge variant="secondary">Under Development</Badge>
  </div>
);

export default function GeneralSettings() {
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { hasAccess } = useAppSettingsAccess();

  useEffect(() => {
    // Simulate loading time for smooth transition
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{getTranslation('settings.access_denied')}</h2>
            <p className="text-muted-foreground mb-4">
              {getTranslation('settings.admin_required')}
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              {getTranslation('common.go_back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSettingsComponent = () => {
    switch (activeCategory) {
      case 'general':
        return <GeneralSettingsComponent />;
      case 'seo':
        return <SEOSettings />;
      case 'branding':
        return <BrandingSettings />;
      case 'security':
        return <PlaceholderSettings title="Security" />;
      case 'notifications':
        return <PlaceholderSettings title="Notifications" />;
      case 'database':
        return <PlaceholderSettings title="Database" />;
      default:
        return <GeneralSettingsComponent />;
    }
  };

  return (
    <PageLayout
      title="General Settings - Tour Management System"
      description="Manage your application settings and preferences. Configure general settings, SEO, branding, and more."
      keywords={['settings', 'configuration', 'preferences', 'general settings', 'SEO', 'branding']}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <SidebarMenu
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              isMobileSidebarOpen={isMobileSidebarOpen}
              setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobile && isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r shadow-2xl">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{getTranslation('settings.title')}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-80px)]">
                  <SidebarMenu
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    isMobileSidebarOpen={isMobileSidebarOpen}
                    setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{getTranslation('settings.title')}</h1>
                    <p className="text-muted-foreground">
                      {getTranslation('settings.description')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="transition-all duration-300 ease-in-out">
                  {renderSettingsComponent()}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
