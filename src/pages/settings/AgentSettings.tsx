
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Users, FileText, DollarSign, Shield } from 'lucide-react';

// Import components that we'll create
import AgentOperationsTab from '@/components/settings/agent/AgentOperationsTab';
import DocumentManagementTab from '@/components/settings/agent/DocumentManagementTab';
import PermissionsTab from '@/components/settings/agent/PermissionsTab';
import CommissionManagementTab from '@/components/settings/agent/CommissionManagementTab';
import PlatformIntegrationTab from '@/components/settings/agent/PlatformIntegrationTab';

const AgentSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('operations');

  return (
    <PageLayout
      title="Agent Settings Management"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Settings", href: "/settings" },
        { title: "Agent Management", href: "/settings/agents" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Agent Settings Management</h1>
              <p className="text-gray-600">Manage agent operations, permissions, and configurations</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center">
            <Shield className="mr-1 h-3 w-3" />
            Admin Only
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="operations" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="commission" className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Commission
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Platform
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operations">
            <AgentOperationsTab />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagementTab />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsTab />
          </TabsContent>

          <TabsContent value="commission">
            <CommissionManagementTab />
          </TabsContent>

          <TabsContent value="platform">
            <PlatformIntegrationTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AgentSettings;
