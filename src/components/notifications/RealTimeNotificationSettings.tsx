import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Smartphone, 
  Volume2, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  TestTube,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useToast } from '@/hooks/use-toast';

interface RealTimeNotificationSettingsProps {
  className?: string;
}

export const RealTimeNotificationSettings: React.FC<RealTimeNotificationSettingsProps> = ({ 
  className 
}) => {
  const {
    isConnected,
    connectionStatus,
    settings,
    updateSettings,
    connect,
    disconnect,
    requestPermissions,
    subscribeToPush,
    sendTestNotification,
    startSimulation,
    stopSimulation
  } = useRealTimeNotifications();
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    try {
      await requestPermissions();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushSubscription = async () => {
    setIsLoading(true);
    try {
      await subscribeToPush();
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getPermissionStatusIcon = (permission: string) => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getConnectionStatusIcon()}
            Connection Status
          </CardTitle>
          <CardDescription>
            Real-time notification connection and system status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">WebSocket Connection</Label>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                {connectionStatus.reconnectAttempts > 0 && (
                  <Badge variant="outline">
                    Retry {connectionStatus.reconnectAttempts}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Browser Support</Label>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  {getPermissionStatusIcon(connectionStatus.hasWebSocketSupport ? 'granted' : 'denied')}
                  WebSocket: {connectionStatus.hasWebSocketSupport ? 'Supported' : 'Not Supported'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getPermissionStatusIcon(connectionStatus.hasPushSupport ? 'granted' : 'denied')}
                  Push: {connectionStatus.hasPushSupport ? 'Supported' : 'Not Supported'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {getPermissionStatusIcon(connectionStatus.hasNotificationSupport ? 'granted' : 'denied')}
                  Notifications: {connectionStatus.hasNotificationSupport ? 'Supported' : 'Not Supported'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isConnected ? 'destructive' : 'default'}
              size="sm"
              onClick={isConnected ? disconnect : connect}
              disabled={!settings.enableWebSocket}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestNotification}
              disabled={!isConnected}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how you receive real-time notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WebSocket Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="websocket">Real-time Connection</Label>
                <p className="text-sm text-muted-foreground">
                  Enable WebSocket connection for instant notifications
                </p>
              </div>
              <Switch
                id="websocket"
                checked={settings.enableWebSocket}
                onCheckedChange={(checked) => 
                  updateSettings({ enableWebSocket: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-connect">Auto Connect</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically connect when the app starts
                </p>
              </div>
              <Switch
                id="auto-connect"
                checked={settings.autoConnect}
                onCheckedChange={(checked) => 
                  updateSettings({ autoConnect: checked })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in your browser
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionStatusIcon(connectionStatus.notificationPermission)}
                <Switch
                  id="browser-notifications"
                  checked={settings.enablePushNotifications}
                  onCheckedChange={(checked) => 
                    updateSettings({ enablePushNotifications: checked })
                  }
                />
              </div>
            </div>

            {connectionStatus.notificationPermission !== 'granted' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Browser notifications are not enabled. 
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-1"
                    onClick={handlePermissionRequest}
                    disabled={isLoading}
                  >
                    Click here to enable them.
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications even when the app is closed
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.enablePushNotifications}
                onCheckedChange={(checked) => 
                  updateSettings({ enablePushNotifications: checked })
                }
                disabled={!connectionStatus.hasPushSupport}
              />
            </div>

            {connectionStatus.hasPushSupport && settings.enablePushNotifications && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePushSubscription}
                disabled={isLoading}
                className="w-full"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                {isLoading ? 'Setting up...' : 'Setup Push Notifications'}
              </Button>
            )}

            {!connectionStatus.hasPushSupport && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Push notifications are not supported in this browser.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Sound and Toast Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-notifications">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play a sound when notifications arrive
                </p>
              </div>
              <Switch
                id="sound-notifications"
                checked={settings.enableSoundNotifications}
                onCheckedChange={(checked) => 
                  updateSettings({ enableSoundNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="toast-notifications">Toast Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show in-app notification toasts
                </p>
              </div>
              <Switch
                id="toast-notifications"
                checked={settings.enableToastNotifications}
                onCheckedChange={(checked) => 
                  updateSettings({ enableToastNotifications: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Demo Mode
          </CardTitle>
          <CardDescription>
            Test the notification system with simulated notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="simulation-mode">Simulation Mode</Label>
              <p className="text-sm text-muted-foreground">
                Generate demo notifications every 10 seconds
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings.simulationMode && (
                <Badge variant="secondary">Active</Badge>
              )}
              <Switch
                id="simulation-mode"
                checked={settings.simulationMode}
                onCheckedChange={(checked) => {
                  if (checked) {
                    startSimulation();
                  } else {
                    stopSimulation();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={settings.simulationMode ? stopSimulation : startSimulation}
            >
              {settings.simulationMode ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Demo
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Demo
                </>
              )}
            </Button>
          </div>

          {settings.simulationMode && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Demo mode is active. You will receive test notifications every 10 seconds.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};