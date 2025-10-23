
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Shield, Eye, Edit, Trash, Database, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { AgentPermissions } from '@/types/agentSettings';
import { appSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';

const mockAgentPermissions = [
  { agentId: 1, agentName: 'Travel Pro Agency', tier: 'premium' },
  { agentId: 2, agentName: 'Adventure Tours Ltd', tier: 'vip' },
  { agentId: 3, agentName: 'City Breaks Co', tier: 'basic' },
  { agentId: 4, agentName: 'Luxury Getaways', tier: 'vip' },
];

const defaultPermissions: AgentPermissions = {
  modules: {
    inventory: {
      access: false,
      permissions: [],
      showPricing: false,
    },
    bookings: {
      access: false,
      permissions: [],
    },
    queries: {
      access: false,
      permissions: [],
    },
    proposals: {
      access: false,
      permissions: [],
    },
    reports: {
      access: false,
      permissions: [],
    },
  },
  apiAccess: false,
  bulkOperations: false,
  adminAccess: false,
};

const PermissionsTab: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<AgentPermissions>(defaultPermissions);
  const [roleTemplate, setRoleTemplate] = useState<string>('');
  const [autoApproveSignup, setAutoApproveSignup] = useState<boolean>(false);
  const [loadingSetting, setLoadingSetting] = useState<boolean>(false);

  useEffect(() => {
    const loadAutoApproveSetting = async () => {
      try {
        setLoadingSetting(true);
        const result = await appSettingsService.getSetting(
          SETTING_CATEGORIES.PERMISSIONS,
          'agents.auto_approve_signup'
        );
        if (result.success && result.data) {
          const val = String(result.data.setting_value).toLowerCase() === 'true';
          setAutoApproveSignup(val);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingSetting(false);
      }
    };
    loadAutoApproveSetting();
  }, []);

  const handleToggleAutoApprove = async (checked: boolean) => {
    try {
      setAutoApproveSignup(checked);
      const existing = await appSettingsService.getSetting(
        SETTING_CATEGORIES.PERMISSIONS,
        'agents.auto_approve_signup'
      );
      if (existing.success && existing.data) {
        await appSettingsService.updateSetting(
          SETTING_CATEGORIES.PERMISSIONS,
          'agents.auto_approve_signup',
          {
            setting_value: String(checked),
            is_active: true,
            data_type: 'boolean',
            description: 'Auto-approve agent signup when enabled.'
          } as any
        );
      } else {
        await appSettingsService.createSetting({
          category: SETTING_CATEGORIES.PERMISSIONS,
          setting_key: 'agents.auto_approve_signup',
          setting_value: String(checked),
          data_type: 'boolean',
          description: 'Auto-approve agent signup when enabled.',
          is_active: true
        } as any);
      }
      toast.success('Auto-approval setting updated');
    } catch (err) {
      toast.error('Failed to update auto-approval setting');
    }
  };

  const modules = [
    { key: 'inventory', label: 'Inventory Management', icon: Database },
    { key: 'bookings', label: 'Booking Management', icon: Users },
    { key: 'queries', label: 'Query Management', icon: Eye },
    { key: 'proposals', label: 'Proposal Management', icon: Edit },
    { key: 'reports', label: 'Reports & Analytics', icon: Shield },
  ];

  const permissionTypes = ['read', 'write', 'edit', 'delete'] as const;

  const roleTemplates: Record<string, AgentPermissions> = {
    basic: {
      modules: {
        inventory: { access: true, permissions: ['read'] as ('read' | 'write' | 'edit' | 'delete')[], showPricing: false },
        bookings: { access: true, permissions: ['read', 'write'] as ('read' | 'write' | 'edit' | 'delete')[] },
        queries: { access: true, permissions: ['read', 'write'] as ('read' | 'write' | 'edit' | 'delete')[] },
        proposals: { access: true, permissions: ['read', 'write'] as ('read' | 'write' | 'edit' | 'delete')[] },
        reports: { access: true, permissions: ['read'] as ('read' | 'write' | 'edit' | 'delete')[] },
      },
      apiAccess: false,
      bulkOperations: false,
      adminAccess: false,
    },
    premium: {
      modules: {
        inventory: { access: true, permissions: ['read', 'write'] as ('read' | 'write' | 'edit' | 'delete')[], showPricing: true },
        bookings: { access: true, permissions: ['read', 'write', 'edit'] as ('read' | 'write' | 'edit' | 'delete')[] },
        queries: { access: true, permissions: ['read', 'write', 'edit'] as ('read' | 'write' | 'edit' | 'delete')[] },
        proposals: { access: true, permissions: ['read', 'write', 'edit'] as ('read' | 'write' | 'edit' | 'delete')[] },
        reports: { access: true, permissions: ['read', 'write'] as ('read' | 'write' | 'edit' | 'delete')[] },
      },
      apiAccess: true,
      bulkOperations: false,
      adminAccess: false,
    },
    vip: {
      modules: {
        inventory: { access: true, permissions: ['read', 'write', 'edit'] as ('read' | 'write' | 'edit' | 'delete')[], showPricing: true },
        bookings: { access: true, permissions: ['read', 'write', 'edit', 'delete'] as ('read' | 'write' | 'edit' | 'delete')[] },
        queries: { access: true, permissions: ['read', 'write', 'edit', 'delete'] as ('read' | 'write' | 'edit' | 'delete')[] },
        proposals: { access: true, permissions: ['read', 'write', 'edit', 'delete'] as ('read' | 'write' | 'edit' | 'delete')[] },
        reports: { access: true, permissions: ['read', 'write', 'edit'] as ('read' | 'write' | 'edit' | 'delete')[] },
      },
      apiAccess: true,
      bulkOperations: true,
      adminAccess: false,
    },
  };

  const handleAgentSelect = (agentId: number) => {
    setSelectedAgent(agentId);
    // Load permissions for selected agent (mock data)
    setPermissions(defaultPermissions);
  };

  const handleRoleTemplateApply = (template: string) => {
    if (template in roleTemplates) {
      setPermissions(roleTemplates[template]);
      toast.success(`${template} role template applied`);
    }
  };

  const handleModuleAccessChange = (moduleKey: string, access: boolean) => {
    setPermissions(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: {
          ...prev.modules[moduleKey as keyof typeof prev.modules],
          access,
          permissions: access ? prev.modules[moduleKey as keyof typeof prev.modules].permissions : [],
        }
      }
    }));
  };

  const handlePermissionChange = (moduleKey: string, permission: string, checked: boolean) => {
    setPermissions(prev => {
      const currentPermissions = prev.modules[moduleKey as keyof typeof prev.modules].permissions;
      const newPermissions = checked 
        ? [...currentPermissions, permission as 'read' | 'write' | 'edit' | 'delete']
        : currentPermissions.filter(p => p !== permission);
      
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleKey]: {
            ...prev.modules[moduleKey as keyof typeof prev.modules],
            permissions: newPermissions,
          }
        }
      };
    });
  };

  const handleShowPricingChange = (moduleKey: string, showPricing: boolean) => {
    setPermissions(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: {
          ...prev.modules[moduleKey as keyof typeof prev.modules],
          showPricing,
        }
      }
    }));
  };

  const handleSavePermissions = () => {
    if (!selectedAgent) {
      toast.error('Please select an agent first');
      return;
    }
    toast.success('Permissions saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Signup & Approval Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Signup & Approval Controls
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-approve agent signup</p>
              <p className="text-sm text-muted-foreground">When enabled, agents registering via public link are activated immediately.</p>
            </div>
            <Switch
              checked={autoApproveSignup}
              disabled={loadingSetting}
              onCheckedChange={handleToggleAutoApprove}
            />
          </div>
        </CardContent>
      </Card>
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Agent Permissions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Agent</label>
              <Select value={selectedAgent?.toString() || ''} onValueChange={(value) => handleAgentSelect(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {mockAgentPermissions.map((agent) => (
                    <SelectItem key={agent.agentId} value={agent.agentId.toString()}>
                      {agent.agentName} ({agent.tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role Template</label>
              <Select value={roleTemplate} onValueChange={setRoleTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Agent</SelectItem>
                  <SelectItem value="premium">Premium Agent</SelectItem>
                  <SelectItem value="vip">VIP Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => handleRoleTemplateApply(roleTemplate)} 
                disabled={!roleTemplate}
                className="w-full"
              >
                Apply Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Module Permissions Matrix
              </span>
              <Button onClick={handleSavePermissions}>
                <Save className="mr-2 h-4 w-4" />
                Save Permissions
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Write</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Delete</TableHead>
                  <TableHead>Show Pricing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const modulePermissions = permissions.modules[module.key as keyof typeof permissions.modules];
                  return (
                    <TableRow key={module.key}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <module.icon className="mr-2 h-4 w-4" />
                          {module.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={modulePermissions.access}
                          onCheckedChange={(checked) => handleModuleAccessChange(module.key, checked)}
                        />
                      </TableCell>
                      {permissionTypes.map((permType) => (
                        <TableCell key={permType}>
                          <Checkbox
                            checked={modulePermissions.permissions.includes(permType)}
                            onCheckedChange={(checked) => handlePermissionChange(module.key, permType, checked as boolean)}
                            disabled={!modulePermissions.access}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        {'showPricing' in modulePermissions && (
                          <Switch
                            checked={modulePermissions.showPricing || false}
                            onCheckedChange={(checked) => handleShowPricingChange(module.key, checked)}
                            disabled={!modulePermissions.access}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Global Permissions */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle>Global Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">API Access</h4>
                  <p className="text-sm text-gray-600">Allow agent to access platform APIs</p>
                </div>
                <Switch
                  checked={permissions.apiAccess}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, apiAccess: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Bulk Operations</h4>
                  <p className="text-sm text-gray-600">Allow bulk operations on data</p>
                </div>
                <Switch
                  checked={permissions.bulkOperations}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, bulkOperations: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Admin Access</h4>
                  <p className="text-sm text-gray-600">Grant administrative privileges</p>
                </div>
                <Switch
                  checked={permissions.adminAccess}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, adminAccess: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionsTab;
