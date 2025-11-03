import React from 'react';
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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/use-access-control';

export const SalesNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useApp();
  const { signOut } = useAuth();
  const { canAccessModule, isStaff } = useAccessControl();

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
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Sales Hub</h2>
            <p className="text-xs text-muted-foreground">Executive Dashboard</p>
          </div>
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
          </div>
        )}
      </div>

      {/* Footer with User Info and Logout */}
      <div className="relative bg-gradient-to-br from-muted/30 to-muted/50 border-t border-border/50 backdrop-blur-sm">
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md ring-2 ring-primary/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:ring-primary/20">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors duration-200">
                {currentUser?.name || 'Sales Executive'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
              <Badge variant="secondary" className="mt-1.5 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-200">
                {currentUser?.department || 'Sales'}
              </Badge>
            </div>
          </div>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg border border-transparent hover:border-destructive/20 group"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none rounded-b-lg"></div>
      </div>
    </div>
  );
};