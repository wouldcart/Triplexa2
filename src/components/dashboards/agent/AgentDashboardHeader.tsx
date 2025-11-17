import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import { LogoutButton } from '@/components/common/LogoutButton';
import { 
  Bell, ChevronDown, Globe, User, Settings, 
  LogOut, Building2, Menu, X, Search, Clock, MessageSquare
} from 'lucide-react';
import { useAgentHeader } from '@/contexts/AgentHeaderContext';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import AgentChatWindow from '@/components/chat/AgentChatWindow';

const AgentDashboardHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentUser } = useApp();
  // Use ApplicationSettings with fallback for potential context issues
  let settings = { 
    logo: '', 
    darkLogo: '',
    companyDetails: { 
      name: 'Travel App', 
      tagline: 'Your Travel Partner' 
    } 
  };
  
  try {
    const { settings: appSettings } = useApplicationSettings();
    settings = appSettings || settings;
  } catch (error) {
    // Fallback for when ApplicationSettingsProvider is not available
    console.warn('ApplicationSettingsProvider not available in AgentDashboardHeader, using fallback settings');
  }
  const { theme } = useTheme();
  // Remove local agentHeader state and effect; use context instead
  const { agentHeader, loading, error, refresh } = useAgentHeader();
  const { toast } = useToast();

  // IMMEDIATE DEBUG LOG ON MOUNT
  console.log('=== AGENT DASHBOARD HEADER MOUNTED ===', {
    theme,
    settings: {
      hasLogo: !!settings.logo,
      hasDarkLogo: !!settings.darkLogo,
      logo: settings.logo,
      darkLogo: settings.darkLogo
    },
    currentUser: !!currentUser,
    agentHeader: !!agentHeader,
    timestamp: new Date().toISOString()
  });

  const parseStoragePublicUrl = (url?: string | null): { bucket: string; path: string } | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const publicIndex = parts.indexOf('public');
      if (publicIndex === -1 || parts.length < publicIndex + 2) return null;
      const bucket = parts[publicIndex + 1];
      const path = parts.slice(publicIndex + 2).join('/');
      return bucket && path ? { bucket, path } : null;
    } catch {
      if (url.includes('/')) {
        const [bucket, ...rest] = url.split('/').filter(Boolean);
        const path = rest.join('/');
        return bucket && path ? { bucket, path } : null;
      }
      return null;
    }
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [manager, setManager] = useState<{ name: string; email?: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Best-effort manager resolution from local storage
    try {
      const raw = localStorage.getItem('agents');
      const list = raw ? JSON.parse(raw) : [];
      const meId = currentUser?.id ? String(currentUser.id) : null;
      const meEmail = (currentUser as any)?.email || null;
      const mine = (list || []).find((a: any) => {
        const byId = a && (String(a.id) === String(meId) || String(a.user_id) === String(meId));
        const byEmail = a && meEmail && String(a.email || '').toLowerCase() === String(meEmail).toLowerCase();
        return byId || byEmail;
      });
      const assignments = Array.isArray(mine?.staffAssignments) ? mine.staffAssignments : [];
      const primary = assignments.find((as: any) => as?.isPrimary) || assignments[0];
      if (primary && primary.staffName) {
        setManager({ name: primary.staffName });
      }
    } catch (_) {
      // ignore
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Agent Header Error',
        description: typeof error === 'string' ? error : 'Failed to load agent header data',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Simple and direct theme detection based on document class
  const getCurrentTheme = () => {
    // Check if dark mode is active by looking at document class
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Always log theme detection for debugging
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('=== THEME DETECTION DEBUG ===', {
      documentHasDarkClass: isDarkMode,
      systemPrefersDark: systemPrefersDark,
      documentClasses: document.documentElement.className,
      currentThemeSetting: theme,
      result: isDarkMode ? 'dark' : 'light',
      timestamp: new Date().toISOString(),
      // Check if we're actually in dark mode
      bodyClasses: document.body.className,
      allDarkClasses: document.querySelectorAll('.dark').length,
      systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    });
    
    return isDarkMode ? 'dark' : 'light';
  };
  
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getCurrentTheme());
  
  // Update theme when it changes
  useEffect(() => {
    const updateTheme = () => {
      const detectedTheme = getCurrentTheme();
      setCurrentTheme(detectedTheme);
      
      // Debug log for system theme detection
      console.log('Theme update:', {
        themeSetting: theme,
        detectedTheme: detectedTheme,
        documentClasses: document.documentElement.className,
        systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      });
    };
    
    // Initial check
    updateTheme();
    
    // For system theme, add multiple delayed checks to ensure proper detection
    if (theme === 'system') {
      const timeouts = [
        setTimeout(updateTheme, 100),
        setTimeout(updateTheme, 500),
        setTimeout(updateTheme, 1000)
      ];
      
      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
    
    // Monitor document class changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Force update when theme context changes (especially for system theme)
    const timeoutId = setTimeout(updateTheme, 100);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [theme]);
  
  // Use the detected theme to select logo - prioritize theme-based selection over agent profile image
  const currentLogo = (currentTheme === 'dark' && settings.darkLogo ? settings.darkLogo : settings.logo) || null;
  
  // DEBUG: Log logo selection logic
  console.log('=== LOGO SELECTION CALCULATION ===', {
    currentTheme,
    hasDarkLogo: !!settings.darkLogo,
    hasLightLogo: !!settings.logo,
    darkLogoUrl: settings.darkLogo,
    lightLogoUrl: settings.logo,
    currentLogo: currentLogo,
    selectionLogic: {
      themeIsDark: currentTheme === 'dark',
      condition1: currentTheme === 'dark',
      condition2: !!settings.darkLogo,
      result: currentTheme === 'dark' && settings.darkLogo ? 'DARK LOGO' : 'LIGHT LOGO'
    }
  });
  
  // Special handling for system theme - directly check what theme provider would apply
  useEffect(() => {
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const expectedTheme = systemPrefersDark ? 'dark' : 'light';
      
      console.log('=== SYSTEM THEME ANALYSIS ===', {
        systemPrefersDark,
        expectedTheme,
        currentDocumentClass: document.documentElement.className,
        currentDetectedTheme: currentTheme,
        shouldUseDarkLogo: expectedTheme === 'dark' && settings.darkLogo,
        documentHasDarkClass: document.documentElement.classList.contains('dark'),
        documentHasLightClass: document.documentElement.classList.contains('light'),
        timestamp: new Date().toISOString()
      });
      
      // Force the correct theme based on system preference
      if (currentTheme !== expectedTheme) {
        console.log('!!! FORCING THEME CORRECTION FOR SYSTEM MODE !!!', {
          from: currentTheme,
          to: expectedTheme
        });
        setCurrentTheme(expectedTheme);
      }
      
      // Ensure the document has the correct class (this is the key fix)
      const hasExpectedClass = document.documentElement.classList.contains(expectedTheme);
      const hasWrongClass = document.documentElement.classList.contains(expectedTheme === 'dark' ? 'light' : 'dark');
      
      if (!hasExpectedClass || hasWrongClass) {
        console.log('!!! CORRECTING DOCUMENT CLASSES FOR SYSTEM THEME !!!', {
          expectedClass: expectedTheme,
          hasExpectedClass,
          hasWrongClass,
          currentClasses: document.documentElement.className
        });
        
        // Remove wrong class
        if (hasWrongClass) {
          document.documentElement.classList.remove(expectedTheme === 'dark' ? 'light' : 'dark');
        }
        
        // Add correct class
        if (!hasExpectedClass) {
          document.documentElement.classList.add(expectedTheme);
        }
        
        // Force re-detection
        setCurrentTheme(expectedTheme);
      }
    }
  }, [theme, currentTheme, settings.darkLogo]);
  
  // Define agentLogo before using it in the useEffect dependency array
  const agentLogo = currentLogo || agentHeader?.profile_image;
  
  // Debug theme detection
  useEffect(() => {
    console.log('=== LOGO SELECTION DEBUG ===', {
      currentTheme,
      documentClass: document.documentElement.className,
      darkLogo: settings.darkLogo,
      lightLogo: settings.logo,
      currentLogo: currentLogo,
      agentHeaderProfileImage: agentHeader?.profile_image,
      finalAgentLogo: agentLogo,
      isDarkMode: document.documentElement.classList.contains('dark'),
      themeContext: theme,
      systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      logoSelectionLogic: {
        themeIsDark: currentTheme === 'dark',
        hasDarkLogo: !!settings.darkLogo,
        hasLightLogo: !!settings.logo,
        shouldUseDarkLogo: currentTheme === 'dark' && settings.darkLogo,
        finalSelection: currentTheme === 'dark' && settings.darkLogo ? 'DARK LOGO' : 'LIGHT LOGO'
      }
    });
  }, [currentTheme, settings, currentLogo, agentLogo, theme, agentHeader?.profile_image]);
  
  // Force theme check on mount and periodically
  useEffect(() => {
    const forceThemeCheck = () => {
      const detectedTheme = getCurrentTheme();
      setCurrentTheme(detectedTheme);
      
      // Special debug for system theme
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('=== FORCE THEME CHECK (SYSTEM) ===', {
          detectedTheme,
          systemPrefersDark,
          documentClasses: document.documentElement.className,
          expectedClass: systemPrefersDark ? 'dark' : 'light',
          shouldBeDark: systemPrefersDark,
          currentLogo: systemPrefersDark && settings.darkLogo ? 'DARK LOGO' : 'LIGHT LOGO'
        });
        
        // Force correct theme for system mode
        const correctTheme = systemPrefersDark ? 'dark' : 'light';
        if (detectedTheme !== correctTheme) {
          console.log('!!! SYSTEM THEME MISMATCH - CORRECTING !!!', {
            detected: detectedTheme,
            correct: correctTheme
          });
          setCurrentTheme(correctTheme);
        }
      }
    };
    
    // Check immediately
    forceThemeCheck();
    
    // Check again after a delay to ensure everything is loaded
    const timeoutId = setTimeout(forceThemeCheck, 500);
    
    // Check periodically while component is mounted
    const intervalId = setInterval(forceThemeCheck, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);
  const companyName = (agentHeader?.agency_name?.trim() || currentUser?.companyInfo?.companyName?.trim() || settings?.companyDetails?.name?.trim() || '—');
  
  useEffect(() => {
    setLogoUrl(agentLogo || null);
  }, [agentLogo]);

  const agentData = {
    name: currentUser?.name || 'Agent',
    agency: currentUser?.companyInfo?.companyName || '—',
    commission: 0,
    notifications: 0
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const MobileMenu = () => (
    <div className="space-y-4 p-4">
      {/* Quick Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Search className="h-4 w-4 mr-3" />
          Search
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Bell className="h-4 w-4 mr-3" />
          Notifications
          {agentData.notifications > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {agentData.notifications}
            </Badge>
          )}
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => { navigate('/dashboards/agent/profile'); setIsMenuOpen(false); }}>
          <User className="h-4 w-4 mr-3" />
          Profile
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span className="text-sm font-medium">Dark Mode</span>
        <ThemeToggle />
      </div>

      {/* Manager quick connect */}
      {manager && (
        <div className="p-3 border rounded-lg">
          <div className="text-sm text-muted-foreground">Assigned Manager</div>
          <div className="mt-1 font-medium">{manager.name}</div>
          <Button className="mt-2 w-full" size="sm" onClick={() => setIsChatOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" /> Chat
          </Button>
        </div>
      )}

      {/* Logout (single place for mobile) */}
      <LogoutButton 
        variant="destructive" 
        className="w-full" 
        size="lg"
        showIcon={true}
        showText={true}
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left: Logo and Company */}
        <div className="flex items-center gap-3">
          {logoUrl || agentLogo ? (
            <div className="relative">
              <img
                src={logoUrl || agentLogo || ''}
                alt="Company Logo"
                className="h-8 w-8 object-contain rounded-full bg-white p-1 border cursor-pointer"
                onClick={() => navigate('/dashboards/agent')}
                onError={async () => {
                  if (!agentLogo) return;
                  const parsed = parseStoragePublicUrl(agentLogo);
                  if (!parsed) return;
                  const { data } = await supabase.storage
                    .from(parsed.bucket)
                    .createSignedUrl(parsed.path, 60 * 60);
                  if (data?.signedUrl) {
                    setLogoUrl(data.signedUrl);
                  }
                }}
              />
              {/* Debug indicator - remove after testing */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold border border-white" 
                   style={{ backgroundColor: currentTheme === 'dark' ? '#ef4444' : '#22c55e', 
                            fontSize: '10px' }}>
                {currentTheme === 'dark' ? 'D' : 'L'}
              </div>
              {/* System theme indicator */}
              {theme === 'system' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border border-white">
                  S
                </div>
              )}
            </div>
          ) : (
            <div
              className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center cursor-pointer"
              onClick={() => navigate('/dashboards/agent')}
            >
              <span className="font-bold text-white text-lg">
                {(companyName && companyName.trim()[0]) || 'T'}
              </span>
            </div>
          )}
          {!isMobile && (
            <div className="min-w-0">
              <div className="font-semibold truncate">{companyName}</div>
              {currentUser?.name && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  <span className="truncate">{currentUser.name}</span>
                  {error && (
                    <Badge variant="destructive" className="ml-2">Using defaults</Badge>
                  )}
                </div>
              )}
              {/* Manager inline on desktop */}
              {manager && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>Manager: </span>
                  <Button variant="link" size="sm" className="px-1 text-blue-600" onClick={() => setIsChatOpen(true)}>
                    {manager.name}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Time + Status */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>{currentTime}</span>
            </div>
            <Badge 
              variant={isOnline ? 'default' : 'secondary'} 
              className="cursor-pointer" 
              onClick={() => setIsChatOpen(true)}
            >
              {isOnline ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {agentData.notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {agentData.notifications}
                </Badge>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/dashboards/agent/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            {/* Remove direct logout to avoid duplicates; keep menu-only logout */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {agentData.notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                >
                  {agentData.notifications}
                </Badge>
              )}
            </Button>
            <Badge 
              variant={isOnline ? 'default' : 'secondary'} 
              className="cursor-pointer" 
              onClick={() => setIsChatOpen(true)}
            >
              {isOnline ? 'Active' : 'Inactive'}
            </Badge>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background text-foreground">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <MobileMenu />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <AgentChatWindow 
        open={isChatOpen} 
        onOpenChange={setIsChatOpen} 
        managerName={manager?.name || 'Support Team'}
      />
    </header>
  );
};

export default AgentDashboardHeader;
