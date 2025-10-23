
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Globe, Smartphone, Mail, MessageSquare, Key, Palette } from 'lucide-react';
import { toast } from 'sonner';

const mockIntegrationSettings = {
  apiAccess: {
    enabled: true,
    rateLimit: 1000,
    allowedEndpoints: ['bookings', 'inventory', 'queries'],
  },
  whiteLabel: {
    enabled: false,
    logoUrl: '',
    primaryColor: '#3b82f6',
    companyName: '',
  },
  communications: {
    email: true,
    sms: false,
    whatsapp: true,
    pushNotifications: true,
  },
  thirdPartyIntegrations: [
    { name: 'Booking.com', status: 'connected', agents: 12 },
    { name: 'Expedia', status: 'disconnected', agents: 0 },
    { name: 'Amadeus GDS', status: 'connected', agents: 8 },
  ],
};

const PlatformIntegrationTab: React.FC = () => {
  const [settings, setSettings] = useState(mockIntegrationSettings);

  const handleApiSettingChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      apiAccess: { ...prev.apiAccess, [field]: value }
    }));
  };

  const handleWhiteLabelChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      whiteLabel: { ...prev.whiteLabel, [field]: value }
    }));
  };

  const handleCommunicationChange = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      communications: { ...prev.communications, [field]: value }
    }));
  };

  const handleSaveSettings = () => {
    toast.success('Platform integration settings saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* API Access Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            API Access Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable API Access</h4>
              <p className="text-sm text-gray-600">Allow agents to access platform APIs</p>
            </div>
            <Switch
              checked={settings.apiAccess.enabled}
              onCheckedChange={(checked) => handleApiSettingChange('enabled', checked)}
            />
          </div>
          
          <div>
            <Label htmlFor="rateLimit">Rate Limit (requests per hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              value={settings.apiAccess.rateLimit}
              onChange={(e) => handleApiSettingChange('rateLimit', parseInt(e.target.value))}
              className="w-48 mt-1"
            />
          </div>

          <div>
            <Label>Allowed Endpoints</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['bookings', 'inventory', 'queries', 'proposals', 'reports'].map((endpoint) => (
                <Badge 
                  key={endpoint}
                  variant={settings.apiAccess.allowedEndpoints.includes(endpoint) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const current = settings.apiAccess.allowedEndpoints;
                    const updated = current.includes(endpoint)
                      ? current.filter(e => e !== endpoint)
                      : [...current, endpoint];
                    handleApiSettingChange('allowedEndpoints', updated);
                  }}
                >
                  {endpoint}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* White Label Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            White Label Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable White Label</h4>
              <p className="text-sm text-gray-600">Allow agents to use custom branding</p>
            </div>
            <Switch
              checked={settings.whiteLabel.enabled}
              onCheckedChange={(checked) => handleWhiteLabelChange('enabled', checked)}
            />
          </div>

          {settings.whiteLabel.enabled && (
            <>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.whiteLabel.companyName}
                  onChange={(e) => handleWhiteLabelChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.whiteLabel.logoUrl}
                  onChange={(e) => handleWhiteLabelChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.whiteLabel.primaryColor}
                    onChange={(e) => handleWhiteLabelChange('primaryColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <span className="text-sm text-gray-600">{settings.whiteLabel.primaryColor}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <span>Email Notifications</span>
              </div>
              <Switch
                checked={settings.communications.email}
                onCheckedChange={(checked) => handleCommunicationChange('email', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="mr-2 h-4 w-4" />
                <span>SMS Notifications</span>
              </div>
              <Switch
                checked={settings.communications.sms}
                onCheckedChange={(checked) => handleCommunicationChange('sms', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>WhatsApp</span>
              </div>
              <Switch
                checked={settings.communications.whatsapp}
                onCheckedChange={(checked) => handleCommunicationChange('whatsapp', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                <span>Push Notifications</span>
              </div>
              <Switch
                checked={settings.communications.pushNotifications}
                onCheckedChange={(checked) => handleCommunicationChange('pushNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Third-party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Third-party Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connected Agents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.thirdPartyIntegrations.map((integration, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{integration.name}</TableCell>
                  <TableCell>
                    <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                      {integration.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{integration.agents}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default PlatformIntegrationTab;
