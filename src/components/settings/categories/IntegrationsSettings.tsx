import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plug, 
  Smartphone, 
  Code, 
  Webhook, 
  Mail, 
  Database,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MetaWhatsAppSettings } from './MetaWhatsAppSettings';
import {
  getMetaSettings,
  testWhatsAppConnection,
  getConnectionStatus
} from '@/services/metaSettingsService';

export function IntegrationsSettings() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [whatsAppStatus, setWhatsAppStatus] = useState<'connected' | 'disconnected' | 'error' | 'checking'>('checking');
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);

  // Handle URL parameter for auto-navigation
  useEffect(() => {
    const section = document.documentElement.getAttribute('data-settings-section');
    if (section === 'meta-whatsapp') {
      setActiveSection('meta-whatsapp');
      // Clear the attribute after use
      document.documentElement.removeAttribute('data-settings-section');
    }
  }, []);

  const checkWhatsAppStatus = async () => {
    setWhatsAppStatus('checking');
    try {
      const statusResponse = await getConnectionStatus();
      if (statusResponse.success) {
        setWhatsAppStatus(statusResponse.data?.status === 'connected' ? 'connected' : 'disconnected');
      } else {
        setWhatsAppStatus('disconnected');
      }
    } catch (error) {
      setWhatsAppStatus('error');
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const handleTestWhatsApp = async () => {
    setIsTestingWhatsApp(true);
    try {
      const response = await testWhatsAppConnection();
      if (response.success) {
        setWhatsAppStatus('connected');
        toast({
          title: "Connection successful",
          description: "WhatsApp Business API is working correctly",
        });
      } else {
        setWhatsAppStatus('error');
        toast({
          title: "Connection failed",
          description: response.error || "Failed to connect to WhatsApp Business API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setWhatsAppStatus('error');
      toast({
        title: "Connection error",
        description: "An error occurred while testing WhatsApp connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const integrationCards = [
    {
      id: 'meta-whatsapp',
      title: 'Meta WhatsApp Business',
      description: 'WhatsApp Business API for OTP authentication and messaging',
      icon: Smartphone,
      status: whatsAppStatus,
      badge: 'Active',
      action: () => setActiveSection('meta-whatsapp')
    },
    {
      id: 'email-smtp',
      title: 'Email SMTP',
      description: 'Email delivery service configuration',
      icon: Mail,
      status: 'connected' as const,
      badge: 'Configured',
      action: () => setActiveSection('email')
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      description: 'External webhook endpoints and notifications',
      icon: Webhook,
      status: 'disconnected' as const,
      badge: 'Setup Required',
      action: () => setActiveSection('webhooks')
    },
    {
      id: 'database',
      title: 'Database Connections',
      description: 'External database and API integrations',
      icon: Database,
      status: 'disconnected' as const,
      badge: 'Coming Soon',
      action: () => setActiveSection('database')
    },
    {
      id: 'custom-api',
      title: 'Custom API Endpoints',
      description: 'REST API and third-party service integrations',
      icon: Code,
      status: 'disconnected' as const,
      badge: 'Coming Soon',
      action: () => setActiveSection('api')
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Not Configured</Badge>;
    }
  };

  if (activeSection === 'meta-whatsapp') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSection('overview')}
          >
            ← Back to Integrations
          </Button>
          <h2 className="text-lg font-semibold">Meta WhatsApp Business</h2>
        </div>
        <MetaWhatsAppSettings />
      </div>
    );
  }

  if (activeSection === 'email') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSection('overview')}
          >
            ← Back to Integrations
          </Button>
          <h2 className="text-lg font-semibold">Email SMTP Configuration</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>
              Configure your email delivery service for notifications and authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Configuration</h3>
              <p className="text-muted-foreground mb-4">
                Email settings are managed through the system configuration
              </p>
              <Button variant="outline">
                Configure Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === 'webhooks') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSection('overview')}
          >
            ← Back to Integrations
          </Button>
          <h2 className="text-lg font-semibold">Webhook Configuration</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Settings
            </CardTitle>
            <CardDescription>
              Configure webhook endpoints for external notifications and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Webhook Management</h3>
              <p className="text-muted-foreground mb-4">
                Set up webhook endpoints for real-time notifications and data synchronization
              </p>
              <Button variant="outline">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6" />
          Integrations & APIs
        </h2>
        <p className="text-muted-foreground">
          Configure external service integrations and API connections
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={checkWhatsAppStatus}
          disabled={whatsAppStatus === 'checking'}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${whatsAppStatus === 'checking' ? 'animate-spin' : ''}`} />
          Refresh All Status
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestWhatsApp}
          disabled={isTestingWhatsApp}
        >
          {isTestingWhatsApp ? (
            <>
              <TestTube className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Test WhatsApp
            </>
          )}
        </Button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrationCards.map((integration) => (
          <Card key={integration.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <integration.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{integration.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(integration.status)}
                  {integration.badge && (
                    <Badge variant="outline" className="text-xs">
                      {integration.badge}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={integration.action}
                >
                  Configure
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Documentation
          </CardTitle>
          <CardDescription>
            Reference documentation for available API endpoints and integration guides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Authentication API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• POST /auth/login - Email/password login</li>
                <li>• POST /auth/google - Google OAuth</li>
                <li>• POST /auth/send-otp - Send WhatsApp OTP</li>
                <li>• POST /auth/verify-otp - Verify WhatsApp OTP</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">User Management API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• GET /users - List users</li>
                <li>• POST /users - Create user</li>
                <li>• PUT /users/:id - Update user</li>
                <li>• DELETE /users/:id - Delete user</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full API Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}