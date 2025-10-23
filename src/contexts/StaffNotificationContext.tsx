
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StaffNotification, NotificationPreferences } from '@/types/query';
import { useApp } from '@/contexts/AppContext';
import { staffNotificationService } from '@/services/staffNotificationService';

interface StaffNotificationContextType {
  notifications: StaffNotification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  addNotification: (notification: Omit<StaffNotification, 'id' | 'timestamp'>) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  requestBrowserPermission: () => Promise<boolean>;
  hasBrowserPermission: boolean;
  notificationStats: {
    total: number;
    unread: number;
    urgent: number;
    highPriority: number;
    actionRequired: number;
  };
}

const StaffNotificationContext = createContext<StaffNotificationContextType | undefined>(undefined);

export const useStaffNotifications = () => {
  const context = useContext(StaffNotificationContext);
  if (context === undefined) {
    throw new Error('useStaffNotifications must be used within a StaffNotificationProvider');
  }
  return context;
};

interface StaffNotificationProviderProps {
  children: React.ReactNode;
}

export const StaffNotificationProvider: React.FC<StaffNotificationProviderProps> = ({ children }) => {
  const { currentUser } = useApp();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasBrowserPermission, setHasBrowserPermission] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setHasBrowserPermission(Notification.permission === 'granted');
    }
  }, []);

  // Load notifications and preferences for current staff user
  useEffect(() => {
    if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'manager')) {
      loadNotifications();
      loadPreferences();
    }
  }, [currentUser]);

  // Cleanup expired notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      staffNotificationService.cleanupExpiredNotifications();
      if (currentUser) {
        loadNotifications();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const staffNotifications = await staffNotificationService.getNotificationsForStaff(currentUser.id);
      setNotifications(staffNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!currentUser) return;
    
    try {
      const userPreferences = await staffNotificationService.getPreferences(currentUser.id);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    staffNotificationService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    staffNotificationService.markMultipleAsRead(unreadIds);
  }, [notifications]);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    staffNotificationService.dismissNotification(notificationId);
  }, []);

  const addNotification = useCallback(async (notification: Omit<StaffNotification, 'id' | 'timestamp'>) => {
    const newNotification = staffNotificationService.createNotification(notification);
    setNotifications(prev => [newNotification, ...prev]);
    
    // Process notification with preferences (browser/email)
    if (currentUser?.email) {
      await staffNotificationService.processNotification(newNotification, currentUser.email);
    }
  }, [hasBrowserPermission, preferences, currentUser]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!currentUser || !preferences) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    await staffNotificationService.updatePreferences(updatedPreferences);
  }, [currentUser, preferences]);

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasBrowserPermission(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasBrowserPermission(granted);
      return granted;
    }

    return false;
  }, []);

  // Calculate notification statistics
  const notificationStats = currentUser 
    ? staffNotificationService.getNotificationStats(currentUser.id)
    : {
        total: 0,
        unread: 0,
        urgent: 0,
        highPriority: 0,
        actionRequired: 0
      };

  const value: StaffNotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    addNotification,
    updatePreferences,
    requestBrowserPermission,
    hasBrowserPermission,
    notificationStats
  };

  return (
    <StaffNotificationContext.Provider value={value}>
      {children}
    </StaffNotificationContext.Provider>
  );
};
