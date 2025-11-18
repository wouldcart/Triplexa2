import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { getModuleCategories } from '@/config/moduleAccess';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  BarChart3,
  Mail,
  Lock,
  ChevronRight,
  Package,
  Briefcase,
  CreditCard
} from 'lucide-react';

interface ModuleAccessPanelProps {
  className?: string;
  showCategories?: string[];
  hideCategories?: string[];
  layout?: 'grid' | 'list' | 'category';
  onModuleClick?: (moduleId: string) => void;
}

const categoryIcons = {
  'Dashboard': LayoutDashboard,
  'Queries': Users,
  'Proposals': FileText,
  'Bookings': Calendar,
  'Inventory': Package,
  'Sales': BarChart3,
  'Management': Briefcase,
  'HR': Users,
  'Settings': Settings,
  'Reports': BarChart3,
  'Communications': Mail,
  'Traveler': Users,
  'AI & Automation': Settings
};

export const ModuleAccessPanel: React.FC<ModuleAccessPanelProps> = ({
  className = '',
  showCategories = [],
  hideCategories = [],
  layout = 'category',
  onModuleClick
}) => {
  const { accessibleModules, getAccessibleModulesByCategory } = useModuleAccess();
  const navigate = useNavigate();

  // Filter categories based on show/hide props
  const categories = getModuleCategories().filter(category => {
    if (showCategories.length > 0 && !showCategories.includes(category)) return false;
    if (hideCategories.includes(category)) return false;
    return true;
  });

  const getModuleRoute = (moduleId: string): string => {
    const routeMap = {
      'dashboard': '/dashboard',
      'agent-dashboard': '/dashboards/agent',
      'manager-dashboard': '/dashboards/manager',
      'operations-dashboard': '/dashboards/operations',
      'sales-dashboard': '/dashboards/sales',
      'queries': '/queries',
      'create-query': '/queries/create',
      'query-details': '/queries',
      'assign-queries': '/queries/assign',
      'proposals': '/queries',
      'advanced-proposal': '/queries',
      'bookings': '/bookings',
      'itinerary-builder': '/itinerary',
      'inventory': '/inventory',
      'hotels': '/inventory/hotels',
      'transport': '/inventory/transport',
      'restaurants': '/inventory/restaurants',
      'sales-enquiries': '/sales/enquiries',
      'sales-bookings': '/sales/bookings',
      'sales-agents': '/sales/agents',
      'sales-reports': '/sales/reports',
      'agent-management': '/management/agents',
      'staff-management': '/management/staff',
      'departments': '/management/staff/departments',
      'hr-management': '/management/hr',
      'payroll': '/management/hr/payroll',
      'leaves': '/management/hr/leaves',
      'attendance': '/management/hr/attendance',
      'salary-structure': '/management/hr/salary',
      'settings': '/settings',
      'general-settings': '/settings/general',
      'account-settings': '/settings/account',
      'api-settings': '/settings/api',
      'access-control': '/settings/access-control',
      'pricing-settings': '/settings/pricing',
      'email-templates': '/settings/email-templates',
      'sms-settings': '/settings/sms-otp',
      'language-manager': '/settings/language',
      'translation-tool': '/settings/translation',
      'reports': '/reports',
      'universal-reports': '/reports',
      'email-communications': '/settings/email-communications',
      'followups': '/followups',
      'traveler-portal': '/traveler',
      'traveler-dashboard': '/traveler/dashboard',
      'traveler-itinerary': '/traveler/itinerary',
      'traveler-history': '/traveler/history',
      'ai-assistant': '#ai-assistant',
      'ai-settings': '/settings/api'
    };
    return routeMap[moduleId] || '/dashboard';
  };

  const handleModuleClick = (moduleId: string) => {
    if (onModuleClick) {
      onModuleClick(moduleId);
    } else {
      const route = getModuleRoute(moduleId);
      if (route === '#ai-assistant') {
        // Handle AI assistant special case
        const event = new CustomEvent('toggleAIChat');
        window.dispatchEvent(event);
      } else {
        navigate(route);
      }
    }
  };

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {accessibleModules.map((module) => {
        const IconComponent = categoryIcons[module.category] || Lock;
        return (
          <Card 
            key={module.moduleId} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleModuleClick(module.moduleId)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className="w-6 h-6 text-blue-600" />
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{module.moduleName}</h3>
              <p className="text-xs text-gray-600 mb-2">{module.description}</p>
              <Badge variant="outline" className="text-xs">
                {module.category}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-2">
      {accessibleModules.map((module) => {
        const IconComponent = categoryIcons[module.category] || Lock;
        return (
          <div
            key={module.moduleId}
            className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
            onClick={() => handleModuleClick(module.moduleId)}
          >
            <div className="flex items-center space-x-3">
              <IconComponent className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-sm">{module.moduleName}</h3>
                <p className="text-xs text-gray-600">{module.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {module.category}
              </Badge>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCategoryLayout = () => (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryModules = getAccessibleModulesByCategory(category);
        if (categoryModules.length === 0) return null;
        
        const IconComponent = categoryIcons[category] || Lock;
        
        return (
          <div key={category}>
            <div className="flex items-center mb-3">
              <IconComponent className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">{category}</h3>
              <Badge variant="secondary" className="ml-2">
                {categoryModules.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryModules.map((module) => (
                <Card 
                  key={module.moduleId} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleModuleClick(module.moduleId)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{module.moduleName}</h4>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">{module.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (accessibleModules.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Module Access</h3>
          <p className="text-gray-600">You don't have access to any modules. Contact your administrator.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {layout === 'grid' && renderGridLayout()}
      {layout === 'list' && renderListLayout()}
      {layout === 'category' && renderCategoryLayout()}
    </div>
  );
};

export default ModuleAccessPanel;