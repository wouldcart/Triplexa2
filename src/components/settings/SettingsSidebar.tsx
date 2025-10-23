import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Settings, 
  Users, 
  Bell, 
  Lock, 
  Palette,
  Database,
  Mail,
  Smartphone,
  ChevronRight,
  Cog
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAccessControl } from '@/hooks/use-access-control';

const settingsItems = [
  { title: 'PDF Templates', url: '/settings', icon: FileText },
  // Restrict Email Templates visibility to admin roles
  { title: 'Email Templates', url: '/email-templates', icon: Mail, adminOnly: true },
  { title: 'Team Management', url: '/settings/team', icon: Users },
  { title: 'Notifications', url: '/settings/notifications', icon: Bell },
  { title: 'Security', url: '/settings/security', icon: Lock },
  { title: 'Appearance', url: '/settings/appearance', icon: Palette },
  { title: 'Integrations', url: '/settings/integrations', icon: Smartphone },
  { title: 'Data Management', url: '/settings/data', icon: Database },
] as const;

export function SettingsSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const { isAdmin } = useAccessControl();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">{/* Fixed */}
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {!collapsed && 'Settings'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems
                .filter((item) => !(item as any).adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}