
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  MapPin,
  Plus,
  Filter,
  BarChart3,
  Settings,
  Upload,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SightseeingSidebarProps {
  stats?: {
    total: number;
    valid: number;
    expiringSoon: number;
    expired: number;
  };
  onAddNew: () => void;
  onImportExport: () => void;
  onFilterExpired: () => void;
  onResetFilters: () => void;
}

const SightseeingSidebar: React.FC<SightseeingSidebarProps> = ({
  stats = { total: 0, valid: 0, expiringSoon: 0, expired: 0 },
  onAddNew,
  onImportExport,
  onFilterExpired,
  onResetFilters
}) => {
  const quickActions = [
    {
      title: "Add New Sightseeing",
      icon: Plus,
      onClick: onAddNew,
      description: "Create a new sightseeing experience"
    },
    {
      title: "Import/Export",
      icon: Upload,
      onClick: onImportExport,
      description: "Manage bulk data operations"
    },
    {
      title: "Show Expired Only",
      icon: AlertTriangle,
      onClick: onFilterExpired,
      description: "Filter expired sightseeings"
    },
    {
      title: "Reset Filters",
      icon: Filter,
      onClick: onResetFilters,
      description: "Clear all active filters"
    }
  ];

  const statsItems = [
    {
      title: "Total Sightseeings",
      icon: MapPin,
      value: stats.total,
      color: "text-blue-600"
    },
    {
      title: "Active",
      icon: CheckCircle,
      value: stats.valid,
      color: "text-green-600"
    },
    {
      title: "Expiring Soon",
      icon: Clock,
      value: stats.expiringSoon,
      color: "text-yellow-600"
    },
    {
      title: "Expired",
      icon: Calendar,
      value: stats.expired,
      color: "text-red-600"
    }
  ];

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Sightseeing</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((action) => (
                <SidebarMenuItem key={action.title}>
                  <SidebarMenuButton onClick={action.onClick}>
                    <action.icon className="h-4 w-4" />
                    <span>{action.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Statistics */}
        <SidebarGroup>
          <SidebarGroupLabel>Statistics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {statsItems.map((stat) => (
                <SidebarMenuItem key={stat.title}>
                  <SidebarMenuButton className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-sm">{stat.title}</span>
                    </div>
                    <span className={`text-sm font-medium ${stat.color}`}>
                      {stat.value}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          Manage your sightseeing inventory and experiences
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SightseeingSidebar;
