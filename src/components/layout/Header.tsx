import React, { useState, useEffect } from 'react';
import { Menu, Bell, Search, Moon, Sun, Maximize, Minimize, Monitor, ChevronRight, ChevronLeft, X, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/settings/LanguageSwitcher';
import DateTimeDisplay from './DateTimeDisplay';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { LogoutButton } from '@/components/common/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import mockQueries from '@/data/queryData';
import { searchEnquiriesBySuffix } from '@/services/enquiriesService';

interface HeaderProps {
  variant?: 'default' | 'hr';
}

const Header: React.FC<HeaderProps> = ({ variant = 'default' }) => {
  const { sidebarOpen, setSidebarOpen, isFullscreen, toggleFullscreen, translate, currentUser } = useApp();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState<string>("");
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [enquiryMatches, setEnquiryMatches] = useState<Array<{ enquiry_id: string; country_name: string; cities: any[]; agent_id: string | null; agent_name: string; agency_name: string }>>([]);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  
  const normalizeEnquiryId = (s: string) => s.trim().toUpperCase();
  const isEnquiryId = (s: string) => /^ENQ\d{5,}$/.test(normalizeEnquiryId(s));
  const isLastFourDigits = (s: string) => /^\d{4}$/.test(s.trim());
  const findMatchingEnquiriesBySuffixFallback = (suffix: string) => {
    const last4 = suffix.trim();
    try {
      return mockQueries
        .filter(q => typeof q.id === 'string' && q.id.toUpperCase().startsWith('ENQ') && q.id.endsWith(last4))
        .map(q => ({
          enquiry_id: String(q.id),
          country_name: String(q.destination?.country || ''),
          cities: Array.isArray(q.destination?.cities) ? q.destination!.cities : [],
          agent_id: q.agentId != null ? String(q.agentId) : null,
          agent_name: String(q.agentName || ''),
          agency_name: ''
        }));
    } catch {
      return [] as Array<{ enquiry_id: string; country_name: string; cities: any[]; agent_id: string | null; agent_name: string; agency_name: string }>;
    }
  };
  const goToEnquiry = (id: string) => {
    const enq = normalizeEnquiryId(id);
    navigate(`/queries/${encodeURIComponent(enq)}`);
    setOpen(false);
    setCommandQuery("");
  };

  const formatCities = (cities: any[]) => {
    try {
      const arr = Array.isArray(cities) ? cities : [];
      return arr.map(String).filter(Boolean).slice(0, 4).join(', ');
    } catch {
      return '';
    }
  };
  
  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: translate('New Booking Request') || 'New Booking Request',
      description: translate('Thailand package booking request received') || 'Thailand package booking request received',
      read: false,
      time: '10 min ago'
    },
    {
      id: 2,
      title: translate('Follow-up Reminder') || 'Follow-up Reminder',
      description: translate('Call Agent Dream Tours about Dubai package') || 'Call Agent Dream Tours about Dubai package',
      read: false,
      time: '1 hour ago'
    },
    {
      id: 3,
      title: translate('Task Assignment') || 'Task Assignment',
      description: translate('New task assigned: Update hotel rates') || 'New task assigned: Update hotel rates',
      read: true,
      time: 'Yesterday'
    }
  ]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'light':
        return <Sun className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };
  
  // Function to mark a notification as read
  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  // Function to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast({
      title: translate('All notifications marked as read') || "All notifications marked as read",
      description: ""
    });
  };
  
  // Function to dismiss a notification
  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast({
      description: translate('Notification dismissed') || "Notification dismissed",
    });
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle keyboard shortcut for search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Handle actual fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        // Browser's fullscreen was exited, update our state
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, toggleFullscreen]);

  // Online/offline banner + lightweight Supabase connectivity check
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkSupabase = async () => {
      try {
        setSupabaseStatus('loading');
        const mod = await import('@/lib/supabaseClient');
        const { supabase } = mod;
        const { error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.warn('Supabase check error:', error.message);
          setSupabaseStatus('error');
        } else {
          setSupabaseStatus('ok');
        }
      } catch (e) {
        console.warn('Supabase client not available or failed:', e);
        if (mounted) setSupabaseStatus('error');
      }
    };
    if (isOnline) {
      checkSupabase();
    } else {
      setSupabaseStatus('error');
    }
    return () => { mounted = false; };
  }, [isOnline]);

  // Live suggestions for last-4-digit enquiry search with Supabase (fallback to mock data)
  useEffect(() => {
    const q = commandQuery.trim();
    if (!isLastFourDigits(q)) {
      setEnquiryMatches([]);
      setMatchesLoading(false);
      return;
    }

    let cancelled = false;
    setMatchesLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await searchEnquiriesBySuffix(q, 50);
        if (!cancelled) {
          if (error) {
            const fallback = findMatchingEnquiriesBySuffixFallback(q);
            setEnquiryMatches(fallback);
          } else {
            setEnquiryMatches(Array.isArray(data) ? data : []);
          }
        }
      } catch {
        const fallback = findMatchingEnquiriesBySuffixFallback(q);
        if (!cancelled) setEnquiryMatches(fallback);
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [commandQuery]);

  // Load company_name, site_title and company_logo from App Settings (DB-backed with localStorage fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cn, st, cl, cdl] = await Promise.all([
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.GENERAL, 'company_name'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.SEO, 'site_title'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_logo'),
          AppSettingsService.getSettingValue(SETTING_CATEGORIES.BRANDING, 'company_logo_dark'),
        ]);
        if (!mounted) return;
        setCompanyName(typeof cn === 'string' ? cn.trim() : null);
        setSiteTitle(typeof st === 'string' ? st.trim() : null);
        setLogoUrl(typeof cl === 'string' && cl.trim().length > 0 ? cl.trim() : null);
        setLogoDarkUrl(typeof cdl === 'string' && cdl.trim().length > 0 ? cdl.trim() : null);
      } catch (e) {
        // Non-fatal; header can function without branding text
        console.warn('Header branding load failed:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Enhanced fullscreen toggle handler
  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Request fullscreen when toggling to fullscreen mode
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        }
      } else {
        // Exit fullscreen when toggling off
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
      // Update our app state
      toggleFullscreen();
    } catch (error) {
      console.error("Fullscreen API error:", error);
      // Fallback to CSS-only fullscreen
      toggleFullscreen();
      toast({
        title: translate("Fullscreen API Error") || "Fullscreen API Error",
        description: translate("Using CSS fullscreen fallback instead") || "Using CSS fullscreen fallback instead"
      });
    }
  };

  // Enhanced search results with translated text and sightseeing items
  const searchResults = [
    {
      heading: translate('sightseeing') || 'sightseeing',
      items: [
        { id: 'SGT001', name: 'Phi Phi Island Tour', path: '/inventory/sightseeing' },
        { id: 'SGT002', name: 'Bangkok Temple Tour', path: '/inventory/sightseeing' },
        { id: 'SGT003', name: 'Floating Market Experience', path: '/inventory/sightseeing' },
      ]
    },
    {
      heading: translate('bookings'),
      items: [
        { id: 'BKG001', name: translate('Thailand Vacation') || 'Thailand Vacation', path: '/bookings' },
        { id: 'BKG002', name: translate('Dubai Getaway') || 'Dubai Getaway', path: '/bookings' },
      ]
    },
    {
      heading: translate('hotels'),
      items: [
        { id: 'HTL001', name: 'Grand Hyatt Bangkok', path: '/inventory/hotels' },
        { id: 'HTL002', name: 'Burj Al Arab', path: '/inventory/hotels' },
      ]
    },
    {
      heading: translate('agents'),
      items: [
        { id: 'AGT001', name: 'Dream Tours', path: '/management/agents' },
        { id: 'AGT002', name: 'Horizon Travel', path: '/management/agents' },
      ]
    },
    {
      heading: translate('queries'),
      items: [
        { id: 'ENQ001', name: `${translate('Enquiry')} #001` || 'Enquiry #001', path: '/queries' },
        { id: 'ENQ002', name: `${translate('Enquiry')} #002` || 'Enquiry #002', path: '/queries' },
        { id: 'ENQ123', name: `${translate('Enquiry')} #123` || 'Enquiry #123', path: '/queries' },
        { id: 'ENQ456', name: `${translate('Enquiry')} #456` || 'Enquiry #456', path: '/queries' },
      ]
    },
  ];

  // HR-specific quick search actions
  const hrSearchResults = [
    {
      heading: translate('HR Actions') || 'HR Actions',
      items: [
        { id: 'HR001', name: translate('Payroll Management') || 'Payroll Management', path: '/management/hr/payroll' },
        { id: 'HR002', name: translate('Attendance Management') || 'Attendance Management', path: '/management/hr/attendance' },
        { id: 'HR003', name: translate('Leave Management') || 'Leave Management', path: '/management/hr/leave' },
        { id: 'HR004', name: translate('Salary Structure') || 'Salary Structure', path: '/management/hr/salary-structure' },
        { id: 'HR005', name: translate('Staff Profiles') || 'Staff Profiles', path: '/management/staff/profile' },
      ]
    }
  ];

  return (
    <header className={cn(
      "h-14 sm:h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 bg-white dark:bg-gray-800",
      isFullscreen ? "sticky top-0 z-50" : ""
    )}>
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden h-8 w-8 sm:h-10 sm:w-10">
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        {/* Desktop sidebar toggle (hidden on HR pages) */}
        {variant !== 'hr' && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="hidden lg:flex h-8 w-8 sm:h-10 sm:w-10"
            title={sidebarOpen ? translate('Hide Sidebar') || 'Hide Sidebar' : translate('Show Sidebar') || 'Show Sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        )}
        
        {variant === 'hr' ? (
          <>
            {(theme === 'dark' ? logoDarkUrl : logoUrl) ? (
              <img
                src={theme === 'dark' && logoDarkUrl ? logoDarkUrl : logoUrl}
                alt="Logo"
                className="hidden md:block h-6 sm:h-8 w-auto mr-2"
              />
            ) : (
              <div className="hidden md:block max-w-[240px] truncate text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mr-2">
                {companyName || siteTitle || translate('HR Center') || 'HR Center'}
              </div>
            )}
            <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
              <Search className="absolute left-2 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                id="hr-search"
                name="hrSearch"
                placeholder={isMobile ? `${translate('Search HR actions')}...` : `${translate('Search HR actions')}... (Ctrl+K)`}
                className="pl-7 sm:pl-8 h-8 sm:h-9 w-full rounded-md border border-input bg-transparent px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
                readOnly
              />
            </div>
          </>
        ) : (
          <>
            {/* Removed header brand text to clean up header */}
            <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
              <Search className="absolute left-2 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                id="global-search"
                name="globalSearch"
                placeholder={isMobile ? `${translate('search')}...` : `${translate('search')}... (Ctrl+K)`}
                className="pl-7 sm:pl-8 h-8 sm:h-9 w-full rounded-md border border-input bg-transparent px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
                readOnly
              />
            </div>
          </>
        )}
      </div>
      
      {variant === 'hr' ? (
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white mr-1">
            {currentUser?.name ? `${currentUser.name}` : translate('HR') || 'HR'}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-gray-900 dark:text-white">
                <User className="h-4 w-4 mr-1" />
                {translate('Actions') || 'Actions'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{translate('Profile') || 'Profile'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>{translate('Settings') || 'Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4" />
                <span>{translate('Logout') || 'Logout'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
      <div className="flex items-center gap-1 sm:gap-2">
        {/* DateTime Display - only show on large screens */}
        {!isMobile && (
          <div className="mr-1 sm:mr-2 hidden md:block">
            <DateTimeDisplay />
          </div>
        )}
      
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              {getThemeIcon()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>{translate('light')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>{translate('dark')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>{translate('system')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleToggleFullscreen}
          className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
          title={isFullscreen ? translate('Exit Fullscreen') || 'Exit Fullscreen' : translate('Enter Fullscreen') || 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
        
        {/* Notification Bell Button with Popover */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className={cn("p-0", isMobile ? "w-[280px]" : "w-[320px]")}>
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-sm font-medium">{translate('Notifications') || 'Notifications'}</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-7 sm:h-8 px-2"
                >
                  {isMobile ? translate('Mark all') || 'Mark all' : translate('Mark all as read') || 'Mark all as read'}
                </Button>
              )}
            </div>
            
            <div className={cn("overflow-y-auto", isMobile ? "max-h-[250px]" : "max-h-[300px]")}>
              {notifications.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-muted-foreground text-sm">
                  {translate('No notifications yet') || 'No notifications yet'}
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-2 sm:p-3 border-b last:border-0 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800",
                      !notification.read && "bg-slate-50 dark:bg-slate-900"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className={cn(
                          "text-xs sm:text-sm font-medium truncate",
                          !notification.read && "font-bold"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.description}</p>
                      <span className="text-xs text-slate-500 mt-1 sm:mt-2 block">{notification.time}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-7 sm:h-8"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate('/settings/notifications');
                }}
              >
                {translate('View all notifications') || 'View all notifications'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        {/* Small connectivity warnings */}
        {!isOnline && (
          <div className="hidden sm:flex items-center px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">
            {translate('Offline') || 'Offline'}
          </div>
        )}
        {isOnline && supabaseStatus === 'loading' && (
          <div className="hidden sm:flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-700">
            {translate('Checking Supabase...') || 'Checking Supabase...'}
          </div>
        )}
        {isOnline && supabaseStatus === 'error' && (
          <div className="hidden sm:flex items-center px-2 py-1 rounded text-xs bg-rose-100 text-rose-800">
            {translate('Supabase connection issue') || 'Supabase connection issue'}
          </div>
        )}
      </div>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        {variant === 'hr' ? (
          <CommandInput 
            placeholder={`${translate('Search HR actions')}...` || `Search HR actions...`} 
            value={commandQuery}
            onValueChange={setCommandQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (isEnquiryId(commandQuery)) {
                  e.preventDefault();
                  goToEnquiry(commandQuery);
                } else if (isLastFourDigits(commandQuery)) {
                  if (enquiryMatches.length === 1) {
                    e.preventDefault();
                    goToEnquiry(enquiryMatches[0].enquiry_id);
                  }
                }
              }
            }}
          />
        ) : (
          <CommandInput 
            placeholder={`${translate('search')} ${translate('for sightseeings, bookings, agents, hotels or enquiry numbers')}...` || `${translate('search')} for sightseeings, bookings, agents, hotels or enquiry numbers...`} 
            value={commandQuery}
            onValueChange={setCommandQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (isEnquiryId(commandQuery)) {
                  e.preventDefault();
                  goToEnquiry(commandQuery);
                } else if (isLastFourDigits(commandQuery)) {
                  if (enquiryMatches.length === 1) {
                    e.preventDefault();
                    goToEnquiry(enquiryMatches[0].enquiry_id);
                  }
                }
              }
            }}
          />
        )}
        <CommandList>
          <CommandEmpty>{translate('No results found') || 'No results found'}.</CommandEmpty>
          {isEnquiryId(commandQuery) && (
            <CommandGroup heading={translate('Direct Navigation') || 'Direct Navigation'}>
              <CommandItem onSelect={() => goToEnquiry(commandQuery)}>
                <span className="font-medium mr-2">{translate('Go to Enquiry') || 'Go to Enquiry'}</span>
                <span>{normalizeEnquiryId(commandQuery)}</span>
              </CommandItem>
            </CommandGroup>
          )}
          {isLastFourDigits(commandQuery) && (
            <>
              {matchesLoading && (
                <CommandGroup heading={translate('Matching Enquiries') || 'Matching Enquiries'}>
                  <CommandItem disabled>
                    <span className="text-xs text-muted-foreground">{translate('Searching...') || 'Searching...'}</span>
                  </CommandItem>
                </CommandGroup>
              )}
              {!matchesLoading && enquiryMatches.length > 0 && (
                <CommandGroup heading={translate('Matching Enquiries') || 'Matching Enquiries'}>
                  {enquiryMatches.map((m) => (
                    <CommandItem key={m.enquiry_id} onSelect={() => goToEnquiry(m.enquiry_id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.enquiry_id}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.country_name || ''}
                          {formatCities(m.cities) ? ` • ${formatCities(m.cities)}` : ''}
                          {(m.agent_name || m.agency_name) ? ` • ${m.agent_name || m.agency_name}` : ''}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
          {(variant === 'hr' ? hrSearchResults : searchResults).map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem 
                  key={item.id} 
                  onSelect={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium mr-2">{item.id}:</span>
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  );
};

export default Header;
