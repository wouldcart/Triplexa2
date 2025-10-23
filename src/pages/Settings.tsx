
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { Shield, Users, Languages, DollarSign, Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  const { translate, currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the active tab from the URL or default to general
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/settings') return 'general';
    return path.split('/settings/')[1];
  };
  
  const activeTab = getActiveTab();
  
  // Navigate to the correct settings page if on /settings route
  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/general', { replace: true });
    }
  }, [location.pathname, navigate]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    navigate(`/settings/${value}`);
  };
  
  // Check if user has admin privileges (super_admin or manager)
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'manager';
  
  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">{translate('settings')}</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="flex overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="languages">{translate('languages')}</TabsTrigger>
            <TabsTrigger value="translation-tool" className="flex items-center">
              <Languages className="mr-1.5 h-4 w-4" />
              {translate('Translation Tool') || 'Translation Tool'}
            </TabsTrigger>
            <TabsTrigger value="currency-converter" className="flex items-center">
              <DollarSign className="mr-1.5 h-4 w-4" />
              Currency Converter
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="flex items-center">
              📧 Email Templates
            </TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="access-control" className="flex items-center">
                  <Shield className="mr-1.5 h-4 w-4" />
                  Access Control
                </TabsTrigger>
                <TabsTrigger value="agent-management" className="flex items-center">
                  <Users className="mr-1.5 h-4 w-4" />
                  Agent Management
                </TabsTrigger>
                <TabsTrigger value="app-settings" className="flex items-center">
                  <SettingsIcon className="mr-1.5 h-4 w-4" />
                  App Settings
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Settings;
