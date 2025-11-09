import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Target,
  DollarSign,
  BarChart3,
  Settings,
  Home,
  LogOut,
  User,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/use-access-control';
import { useTheme } from 'next-themes';
import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';

export const SalesNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useApp();
  const { signOut } = useAuth();
  const { canAccessModule, isStaff } = useAccessControl();
  const { theme } = useTheme();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null);

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
        console.warn('SalesNavigation branding load failed:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuDashboardPath = '/dashboards/sales';
  const salesMenuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      path: menuDashboardPath,
      permission: 'sales-dashboard'
    },
    {
      id: 'enquiries',
      title: 'Enquiries',
      icon: MessageSquare,
      path: '/sales/enquiries',
      permission: 'sales-dashboard',
      count: 15
    },
    {
      id: 'bookings',
      title: 'Bookings',
      icon: Calendar,
      path: '/sales/bookings',
      permission: 'sales-dashboard',
      count: 8
    },
    {
      id: 'quotes',
      title: 'Quote Generator',
      icon: FileText,
      path: '/sales/quotes',
      permission: 'sales-dashboard'
    },
    {
      id: 'leads',
      title: 'Lead Management',
      icon: Target,
      path: '/sales/leads',
      permission: 'sales-dashboard'
    },
    {
      id: 'agents',
      title: 'Agent Management',
      icon: Users,
      path: '/sales/agents',
      permission: 'agents'
    },
    {
      id: 'reports',
      title: 'Sales Reports',
      icon: BarChart3,
      path: '/sales/reports',
      permission: 'reports'
    }
  ];

  const getActiveClass = (path: string) => {
    return location.pathname === path 
      ? 'bg-primary text-primary-foreground' 
      : 'hover:bg-muted';
  };

  return (
    <div className="w-64 h-screen bg-background border-r flex flex-col">
      {/* Header: logo only */}
      <div className="p-4 border-b">
        <div className="flex items-center">
          {((theme === 'dark' ? logoDarkUrl : logoUrl) || logoUrl || logoDarkUrl) ? (
            <img
              src={(theme === 'dark' ? logoDarkUrl : logoUrl) || logoUrl || logoDarkUrl || undefined}
              alt={(companyName || siteTitle || 'Company') + ' logo'}
              className="h-8 w-auto rounded-sm"
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>


      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {salesMenuItems.map((item) => {
            if (!canAccessModule(item.permission)) return null;
            // Hide admin-only items for staff explicitly
            if (isStaff && item.id === 'reports') return null;

            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start ${getActiveClass(item.path)}`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-3 h-4 w-4" />
                <span className="flex-1 text-left">{item.title}</span>
                {item.count && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Quick Actions - staff only */}
        {isStaff && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2">Quick Actions</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/sales/quotes/new')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Quote
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/sales/enquiries/new')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              New Enquiry
            </Button>
            <Separator className="my-3" />
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2">My</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/management/hr/leaves')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              My Leaves
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/management/hr/payroll')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              My Payroll
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => {
                const id = (currentUser as any)?.id;
                if (id) navigate(`/management/staff/profile/${id}`);
                else navigate('/management/staff');
              }}
            >
              <Target className="mr-2 h-4 w-4" />
              My Targets
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => navigate('/settings/account')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Footer with User Info and Logout */}
      <div className="relative bg-gradient-to-br from-muted/30 to-muted/50 border-t border-border/50 backdrop-blur-sm">
        <div className="p-4">
          {/* User Info + Inline Logout */}
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md ring-2 ring-primary/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:ring-primary/20">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors duration-200">
                {currentUser?.name || 'Sales Executive'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none rounded-b-lg"></div>
      </div>
    </div>
  );
};