import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Settings, Palette, Shield, Database, Mail, Bell, 
  Globe, Users, Building2, CreditCard, BarChart3,
  FileText, Zap, Code, Webhook, Key, Lock,
  ChevronDown, ChevronRight, Search, Filter,
  Wrench, Cog, Monitor, Smartphone, Tablet
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: string | number;
  children?: MenuItem[];
  description?: string;
}

const AppSettingsSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['general', 'appearance']);

  const menuItems: MenuItem[] = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Settings,
      children: [
        {
          id: 'app-info',
          title: 'Application Info',
          icon: Building2,
          path: '/settings/general?category=general&section=app-info',
          description: 'Basic app information and metadata'
        },
        {
          id: 'system-config',
          title: 'System Configuration',
          icon: Cog,
          path: '/settings/general?category=general&section=system-config',
          description: 'Core system settings and preferences'
        },
        {
          id: 'performance',
          title: 'Performance',
          icon: Zap,
          path: '/settings/general?category=general&section=performance',
          badge: 'New',
          description: 'Optimize app performance and caching'
        },
        {
          id: 'localization',
          title: 'Localization',
          icon: Globe,
          path: '/settings/general?category=general&section=localization',
          description: 'Language and regional settings'
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance & Branding',
      icon: Palette,
      children: [
        {
          id: 'themes',
          title: 'Themes',
          icon: Monitor,
          path: '/settings/general?category=branding&section=themes',
          description: 'Customize app themes and colors'
        },
        {
          id: 'logo-branding',
          title: 'Logo & Branding',
          icon: Building2,
          path: '/settings/general?category=branding&section=logo',
          description: 'Upload logos and brand assets'
        },
        {
          id: 'layout',
          title: 'Layout Settings',
          icon: Tablet,
          path: '/settings/general?category=branding&section=layout',
          description: 'Configure page layouts and navigation'
        },
        {
          id: 'mobile-responsive',
          title: 'Mobile & Responsive',
          icon: Smartphone,
          path: '/settings/general?category=branding&section=mobile',
          description: 'Mobile-specific appearance settings'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      children: [
        {
          id: 'authentication',
          title: 'Authentication',
          icon: Key,
          path: '/settings/general?category=security&section=auth',
          description: 'Login methods and security policies'
        },
        {
          id: 'permissions',
          title: 'Permissions',
          icon: Lock,
          path: '/settings/general?category=security&section=permissions',
          description: 'User roles and access control'
        },
        {
          id: 'data-privacy',
          title: 'Data Privacy',
          icon: Database,
          path: '/settings/general?category=security&section=privacy',
          badge: 3,
          description: 'Privacy settings and data protection'
        },
        {
          id: 'audit-logs',
          title: 'Audit Logs',
          icon: FileText,
          path: '/settings/general?category=security&section=audit',
          description: 'Security logs and monitoring'
        }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations & APIs',
      icon: Webhook,
      children: [
        {
          id: 'api-settings',
          title: 'API Configuration',
          icon: Code,
          path: '/settings/general?category=integrations&section=api',
          description: 'API keys and endpoint settings'
        },
        {
          id: 'webhooks',
          title: 'Webhooks',
          icon: Webhook,
          path: '/settings/general?category=integrations&section=webhooks',
          description: 'Configure webhook endpoints'
        },
        {
          id: 'third-party',
          title: 'Third-party Services',
          icon: Wrench,
          path: '/settings/general?category=integrations&section=third-party',
          badge: 'Beta',
          description: 'External service integrations'
        },
        {
          id: 'meta-whatsapp',
          title: 'Meta WhatsApp',
          icon: Smartphone,
          path: '/settings/app?category=integrations&section=meta-whatsapp',
          badge: 'New',
          description: 'WhatsApp Business API configuration'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      children: [
        {
          id: 'email-notifications',
          title: 'Email Notifications',
          icon: Mail,
          path: '/settings/general?category=notifications&section=email',
          description: 'Configure email notification settings'
        },
        {
          id: 'push-notifications',
          title: 'Push Notifications',
          icon: Bell,
          path: '/settings/general?category=notifications&section=push',
          description: 'Mobile and browser push notifications'
        },
        {
          id: 'notification-rules',
          title: 'Notification Rules',
          icon: Filter,
          path: '/settings/general?category=notifications&section=rules',
          description: 'Custom notification triggers and rules'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      icon: BarChart3,
      children: [
        {
          id: 'tracking',
          title: 'Usage Tracking',
          icon: BarChart3,
          path: '/settings/general?category=analytics&section=tracking',
          description: 'User behavior and app usage analytics'
        },
        {
          id: 'reports',
          title: 'Custom Reports',
          icon: FileText,
          path: '/settings/general?category=analytics&section=reports',
          description: 'Generate and schedule reports'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      icon: CreditCard,
      children: [
        {
          id: 'subscription',
          title: 'Subscription Plans',
          icon: CreditCard,
          path: '/settings/general?category=billing&section=subscription',
          description: 'Manage subscription and billing'
        },
        {
          id: 'usage-limits',
          title: 'Usage Limits',
          icon: BarChart3,
          path: '/settings/general?category=billing&section=limits',
          description: 'Set usage quotas and limits'
        }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname + location.search === path;
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(searchLower);
    const childrenMatch = item.children?.some(child => 
      child.title.toLowerCase().includes(searchLower) ||
      child.description?.toLowerCase().includes(searchLower)
    );
    
    return titleMatch || childrenMatch;
  });

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isItemActive = item.path ? isActive(item.path) : false;

    if (hasChildren) {
      return (
        <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleSection(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-3 font-normal",
                level > 0 && "ml-4",
                isExpanded && "bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 ml-2" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.id}
        variant={isItemActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start h-auto p-3 font-normal",
          level > 0 && "ml-6",
          isItemActive && "bg-secondary"
        )}
        onClick={() => item.path && navigate(item.path)}
      >
        <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <div className="flex-1 text-left">
          <div className="font-medium">{item.title}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground mt-1">
              {item.description}
            </div>
          )}
        </div>
        {item.badge && (
          <Badge 
            variant={typeof item.badge === 'number' ? "destructive" : "secondary"} 
            className="ml-2 text-xs"
          >
            {item.badge}
          </Badge>
        )}
      </Button>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r",
      isMobile ? "w-full" : "w-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-3">
          <Cog className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">App Settings</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Settings auto-save enabled</div>
          <div>Last updated: 2 minutes ago</div>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsSidebar;