import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Home, 
  Calendar, 
  History, 
  MessageCircle, 
  Settings, 
  LogOut,
  Bell,
  User,
  Phone
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const TravelerSidebar: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isMobile = useIsMobile();
  const { currentUser } = useApp();
  const { signOut } = useAuth();
  const { settings } = useApplicationSettings();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Determine which logo to show based on theme
  const currentLogo = theme === 'dark' && settings.darkLogo ? settings.darkLogo : settings.logo;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const mainMenuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      url: '/traveler/dashboard',
    },
    {
      title: 'My Itinerary',
      icon: Calendar,
      url: '/traveler/itinerary',
    },
    {
      title: 'Trip History',
      icon: History,
      url: '/traveler/history',
    },
    {
      title: 'Notifications',
      icon: Bell,
      url: '/traveler/notifications',
    },
    {
      title: 'Support',
      icon: MessageCircle,
      url: '/traveler/support',
    },
  ];

  const accountMenuItems = [
    {
      title: 'Profile',
      icon: User,
      url: '/traveler/profile',
    },
    {
      title: 'Settings',
      icon: Settings,
      url: '/traveler/settings',
    },
  ];

  const getLogoSizeClasses = () => {
    switch (settings.logoSize) {
      case 'small':
        return 'h-6 w-6';
      case 'large':
        return 'h-10 w-10';
      default:
        return 'h-8 w-8';
    }
  };

  const getImageSizeClasses = () => {
    switch (settings.logoSize) {
      case 'small':
        return 'h-6 w-auto';
      case 'large':
        return 'h-10 w-auto';
      default:
        return 'h-8 w-auto';
    }
  };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarContent className="bg-background">
        {/* Header - Show on desktop when expanded */}
        {!isCollapsed && !isMobile && (
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center space-x-3">
              {currentLogo ? (
                <div className={`${getLogoSizeClasses()} flex items-center justify-center flex-shrink-0`}>
                  <img 
                    src={currentLogo} 
                    alt={settings.companyDetails.name}
                    className={`logo-image ${getImageSizeClasses()} object-contain`}
                  />
                </div>
              ) : (
                <div className={`${getLogoSizeClasses()} bg-primary rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-primary-foreground font-semibold text-sm">
                    {settings.companyDetails.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-base truncate">
                  {currentUser?.name || 'Traveler'}
                </p>
                <p className="text-xs text-muted-foreground">Traveler</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground">Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={isCollapsed ? item.title : undefined}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                        ${isActive 
                          ? 'bg-primary/10 text-primary border-r-2 border-primary font-medium' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Settings */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground">Account</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={isCollapsed ? item.title : undefined}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                        ${isActive 
                          ? 'bg-primary/10 text-primary border-r-2 border-primary font-medium' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Emergency Contact */}
        <SidebarGroup className="mt-auto">
          {!isCollapsed && <SidebarGroupLabel className="text-xs text-muted-foreground">Emergency</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={isCollapsed ? "Emergency" : undefined}>
                  <a 
                    href="tel:+1234567890" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-destructive hover:bg-destructive/10"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span>Emergency</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default TravelerSidebar;
