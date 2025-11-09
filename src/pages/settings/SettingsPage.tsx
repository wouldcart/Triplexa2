import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Globe,
  Palette,
  Bell,
  Users,
  Shield,
  Code,
  Languages,
  Mail,
  DollarSign,
  CreditCard,
  FileText,
} from 'lucide-react';

type SubLink = { label: string; icon: React.ElementType; path: string };
type ModuleItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  subLinks?: SubLink[];
  adminOnly?: boolean;
};

const modules: ModuleItem[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Core app configuration and preferences',
    icon: Settings,
    path: '/settings/general',
    subLinks: [
      { label: 'General', icon: Settings, path: '/settings/general?category=general' },
      { label: 'SEO', icon: Globe, path: '/settings/general?category=seo' },
      { label: 'Branding', icon: Palette, path: '/settings/general?category=branding' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    description: 'User account and profile settings',
    icon: Users,
    path: '/settings/account',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email and push notifications preferences',
    icon: Bell,
    path: '/settings/notifications',
  },
  {
    id: 'appearance',
    title: 'Appearance & Branding',
    description: 'Themes, colors, logos and layout',
    icon: Palette,
    path: '/settings/appearance',
  },
  {
    id: 'language',
    title: 'Language',
    description: 'Localization and language packs',
    icon: Languages,
    path: '/settings/language',
  },
  {
    id: 'api',
    title: 'API & Integrations',
    description: 'API keys and platform integrations',
    icon: Code,
    path: '/settings/api',
    subLinks: [
      { label: 'API', icon: Code, path: '/settings/api' },
      { label: 'Integrations', icon: Code, path: '/settings/general?category=integrations' },
    ],
  },
  {
    id: 'access',
    title: 'Access Control',
    description: 'Roles, permissions and policies',
    icon: Shield,
    path: '/settings/access',
  },
  {
    id: 'agents',
    title: 'Agent Management',
    description: 'Manage field agents and access',
    icon: Users,
    path: '/settings/agents',
  },
  {
    id: 'translation',
    title: 'Translation Tool',
    description: 'Translate and localize templates',
    icon: Languages,
    path: '/settings/translation',
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Configure pricing rules and taxes',
    icon: DollarSign,
    path: '/settings/pricing',
  },
  {
    id: 'currency',
    title: 'Currency Converter',
    description: 'Exchange rates and currencies',
    icon: CreditCard,
    path: '/settings/currency-converter',
  },
  {
    id: 'emails',
    title: 'Email Templates',
    description: 'Design and manage email templates',
    icon: Mail,
    path: '/settings/email-templates',
    subLinks: [
      { label: 'Manage Templates', icon: FileText, path: '/email-templates' },
    ],
  },
  {
    id: 'app',
    title: 'App Settings',
    description: 'Administrative app configuration',
    icon: Settings,
    path: '/settings/app',
    subLinks: [
      { label: 'General', icon: Settings, path: '/settings/app' },
    ],
    adminOnly: true,
  },
];

const SettingsPage: React.FC = () => {
  return (
    <PageLayout title="Settings" description="System Configuration">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {m.title}
                        {m.adminOnly && <Badge variant="secondary">Admin</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <Link to={m.path}>
                        <Button size="sm">Open {m.title}</Button>
                      </Link>
                    </div>
                    {m.subLinks && m.subLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {m.subLinks.map((s) => {
                          const SIcon = s.icon;
                          return (
                            <Link to={s.path} key={s.path}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <SIcon className="h-4 w-4" />
                                {s.label}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </PageLayout>
  );
};

export default SettingsPage;