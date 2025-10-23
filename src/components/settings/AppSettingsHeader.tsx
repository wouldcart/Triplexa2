import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutButton } from '@/components/common/LogoutButton';
import { 
  Bell, ChevronDown, Globe, User, Settings, 
  LogOut, Building2, Menu, X, Search, Cog,
  Shield, Database, Palette
} from 'lucide-react';

interface AppSettingsHeaderProps {
  title?: string;
  subtitle?: string;
}

const AppSettingsHeader: React.FC<AppSettingsHeaderProps> = ({ title, subtitle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const settingsData = {
    name: user?.name || "Administrator",
    role: user?.role || "Super Admin",
    notifications: 2,
    lastSaved: "2 minutes ago"
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const quickActions = [
    { icon: Settings, label: 'General Settings', path: '/settings/general?category=general' },
  { icon: Palette, label: 'Branding', path: '/settings/general?category=branding' },
    { icon: Shield, label: 'Security', path: '/settings/security' },
    { icon: Database, label: 'Data Management', path: '/settings/data' },
  ];

  const MobileMenu = () => (
    <div className="space-y-4 p-4">
      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</div>
        {quickActions.map((action, index) => (
          <Button 
            key={index}
            variant="outline" 
            className="w-full justify-start" 
            size="lg"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-4 w-4 mr-3" />
            {action.label}
          </Button>
        ))}
        
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Search className="h-4 w-4 mr-3" />
          Search Settings
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Bell className="h-4 w-4 mr-3" />
          Notifications
          {settingsData.notifications > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {settingsData.notifications}
            </Badge>
          )}
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Globe className="h-4 w-4 mr-3" />
          Language
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <User className="h-4 w-4 mr-3" />
          Profile
        </Button>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span className="text-sm font-medium">Dark Mode</span>
        <ThemeToggle />
      </div>

      {/* Logout */}
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
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Settings Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cog className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`font-semibold truncate ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  {title || 'App Settings'}
                </h1>
                {!isMobile && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{subtitle || 'System Configuration'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Last Saved Info (Desktop only) */}
          {!isMobile && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Auto-saved {settingsData.lastSaved}</span>
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {!isMobile ? (
              <>
                {/* Quick Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Quick Actions
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {quickActions.map((action, index) => (
                      <DropdownMenuItem 
                        key={index}
                        onClick={() => navigate(action.path)}
                        className="cursor-pointer"
                      >
                        <action.icon className="h-4 w-4 mr-2" />
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <Button variant="outline" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {settingsData.notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {settingsData.notifications}
                    </Badge>
                  )}
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={settingsData.name} />
                        <AvatarFallback>
                          {settingsData.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">{settingsData.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {settingsData.role}
                      </p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Mobile Menu */
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Settings Menu</h2>
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppSettingsHeader;