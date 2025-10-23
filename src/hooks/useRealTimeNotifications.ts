import { useEffect, useCallback, useState, useRef } from 'react';
import { StaffNotification } from '@/types/query';
import { realTimeNotificationService, NotificationSubscriber } from '@/services/realTimeNotificationService';
import { useStaffNotifications } from '@/contexts/StaffNotificationContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface RealTimeNotificationSettings {
  enableWebSocket: boolean;
  enablePushNotifications: boolean;
  enableSoundNotifications: boolean;
  enableToastNotifications: boolean;
  autoConnect: boolean;
  simulationMode: boolean;
}

export interface UseRealTimeNotificationsReturn {
  isConnected: boolean;
  connectionStatus: any;
  settings: RealTimeNotificationSettings;
  updateSettings: (newSettings: Partial<RealTimeNotificationSettings>) => void;
  connect: () => void;
  disconnect: () => void;
  requestPermissions: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  sendTestNotification: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}

const defaultSettings: RealTimeNotificationSettings = {
  enableWebSocket: false, // Disabled by default since no WebSocket server is running
  enablePushNotifications: true,
  enableSoundNotifications: true,
  enableToastNotifications: true,
  autoConnect: true,
  simulationMode: false
};

export const useRealTimeNotifications = (): UseRealTimeNotificationsReturn => {
  const { currentUser } = useApp();
  const { addNotification } = useStaffNotifications();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(realTimeNotificationService.getConnectionStatus());
  const [settings, setSettings] = useState<RealTimeNotificationSettings>(() => {
    const saved = localStorage.getItem('realTimeNotificationSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  
  const subscriberRef = useRef<(() => void) | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('realTimeNotificationSettings', JSON.stringify(settings));
    realTimeNotificationService.updateConfig({
      enableWebSocket: settings.enableWebSocket,
      enablePushNotifications: settings.enablePushNotifications,
      enableSoundNotifications: settings.enableSoundNotifications
    });
  }, [settings]);

  // Auto-connect when user is available and settings allow
  useEffect(() => {
    if (currentUser && settings.autoConnect && settings.enableWebSocket) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [currentUser, settings.autoConnect, settings.enableWebSocket]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (currentUser) {
      const subscriber: NotificationSubscriber = {
        id: `user_${currentUser.id}`,
        callback: handleNewNotification,
        filters: {
          staffIds: [currentUser.id]
        }
      };

      subscriberRef.current = realTimeNotificationService.subscribe(subscriber);

      return () => {
        if (subscriberRef.current) {
          subscriberRef.current();
        }
      };
    }
  }, [currentUser]);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(realTimeNotificationService.getConnectionStatus());
      setIsConnected(realTimeNotificationService.getConnectionStatus().isConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((notification: StaffNotification) => {
    // Add to notification context
    addNotification(notification);

    // Show toast notification if enabled
    if (settings.enableToastNotifications) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'urgent' ? 'destructive' : 'default',
        duration: notification.priority === 'urgent' ? 0 : 5000, // Urgent notifications don't auto-dismiss
      });
    }
  }, [addNotification, toast, settings.enableToastNotifications]);

  // Connect to real-time service
  const connect = useCallback(() => {
    if (currentUser && settings.enableWebSocket) {
      realTimeNotificationService.connect(currentUser.id);
    }
  }, [currentUser, settings.enableWebSocket]);

  // Disconnect from real-time service
  const disconnect = useCallback(() => {
    realTimeNotificationService.disconnect();
    setIsConnected(false);
  }, []);

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await realTimeNotificationService.requestNotificationPermission();
      
      if (granted) {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive real-time notifications',
        });
      } else {
        toast({
          title: 'Notifications Disabled',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      toast({
        title: 'Permission Error',
        description: 'Failed to request notification permissions',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const subscription = await realTimeNotificationService.subscribeToPushNotifications(currentUser.id);
      
      if (subscription) {
        toast({
          title: 'Push Notifications Enabled',
          description: 'You will receive notifications even when the app is closed',
        });
        return true;
      } else {
        toast({
          title: 'Push Notifications Failed',
          description: 'Could not enable push notifications',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast({
        title: 'Push Subscription Error',
        description: 'Failed to enable push notifications',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentUser, toast]);

  // Send test notification
  const sendTestNotification = useCallback(() => {
    if (!currentUser) return;

    const testNotification: Omit<StaffNotification, 'id' | 'timestamp'> = {
      staffId: currentUser.id,
      queryId: 'test_query',
      type: 'assignment',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings are working correctly.',
      read: false,
      actionRequired: false,
      priority: 'normal',
      actionUrl: '/notifications'
    };

    realTimeNotificationService.sendNotification(testNotification);
    
    toast({
      title: 'Test Notification Sent',
      description: 'Check if you received the test notification',
    });
  }, [currentUser, toast]);

  // Start simulation mode
  const startSimulation = useCallback(() => {
    if (!currentUser) return;

    realTimeNotificationService.startSimulation(currentUser.id);
    setSettings(prev => ({ ...prev, simulationMode: true }));
    
    toast({
      title: 'Simulation Started',
      description: 'Demo notifications will be generated every 10 seconds',
    });
  }, [currentUser, toast]);

  // Stop simulation mode
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    setSettings(prev => ({ ...prev, simulationMode: false }));
    
    toast({
      title: 'Simulation Stopped',
      description: 'Demo notifications have been disabled',
    });
  }, [toast]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<RealTimeNotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
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
  };
};