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
  const { settings } = useApplicationSettings();
  const { theme } = useTheme();
  // Remove local agentHeader state and effect; use context instead
  const { agentHeader, loading, error, refresh } = useAgentHeader();
  const { toast } = useToast();

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

  const currentLogo = (theme === 'dark' && settings.darkLogo ? settings.darkLogo : settings.logo) || null;
  const companyName = (agentHeader?.agency_name?.trim() || currentUser?.companyInfo?.companyName?.trim() || settings?.companyDetails?.name?.trim() || '—');
  const agentLogo = agentHeader?.profile_image || currentLogo;
  
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
          <img
            src={logoUrl || agentLogo || '/placeholder.svg'}
            alt="Company Logo"
            className="h-8 w-8 object-contain rounded-full bg-white p-1 border cursor-pointer"
            onClick={() => navigate('/dashboards/agent')}
            onError={async () => {
              if (!agentLogo) return;
              const parsed = parseStoragePublicUrl(agentLogo);
              if (!parsed) return;
              const { data, error: signErr } = await supabase.storage
                .from(parsed.bucket)
                .createSignedUrl(parsed.path, 60 * 60);
              if (data?.signedUrl) {
                setLogoUrl(data.signedUrl);
              }
            }}
          />
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