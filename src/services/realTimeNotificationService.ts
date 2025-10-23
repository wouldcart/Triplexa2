import { StaffNotification } from '@/types/query';
import { staffNotificationService } from './staffNotificationService';

export interface RealTimeNotificationConfig {
  enableWebSocket: boolean;
  enablePushNotifications: boolean;
  enableSoundNotifications: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface NotificationSubscriber {
  id: string;
  callback: (notification: StaffNotification) => void;
  filters?: {
    types?: StaffNotification['type'][];
    priorities?: StaffNotification['priority'][];
    staffIds?: string[];
  };
}

class RealTimeNotificationService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, NotificationSubscriber> = new Map();
  private config: RealTimeNotificationConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;

  constructor() {
    this.config = {
      enableWebSocket: false, // Disabled by default since no WebSocket server is running
      enablePushNotifications: true,
      enableSoundNotifications: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10
    };

    this.initializeAudioContext();
    this.setupServiceWorker();
  }

  // Initialize audio context for notification sounds
  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple notification sound
      const buffer = this.audioContext.createBuffer(1, 44100 * 0.1, 44100);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 800 * i / 44100) * 0.1;
      }
      
      this.notificationSound = buffer;
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  // Setup service worker for push notifications
  private async setupServiceWorker() {
    // Only register service worker in production when explicitly enabled
    const enableSw = (import.meta as any).env?.VITE_ENABLE_SW === 'true';
    const isProd = (import.meta as any).env?.PROD;
    if (!enableSw || !isProd) {
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  // Connect to WebSocket server
  connect(userId: string, wsUrl?: string) {
    if (!this.config.enableWebSocket) return;

    const url = wsUrl || `ws://localhost:8080/notifications/${userId}`;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send authentication message
        this.ws?.send(JSON.stringify({
          type: 'auth',
          userId: userId,
          timestamp: new Date().toISOString()
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingNotification(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect(userId, wsUrl);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.attemptReconnect(userId, wsUrl);
    }
  }

  // Attempt to reconnect to WebSocket
  private attemptReconnect(userId: string, wsUrl?: string) {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(userId, wsUrl);
    }, this.config.reconnectInterval);
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
  }

  // Handle incoming notification from WebSocket
  private handleIncomingNotification(data: any) {
    if (data.type === 'notification') {
      const notification: StaffNotification = data.notification;
      
      // Add to local notification service
      staffNotificationService.createNotification(notification);
      
      // Notify subscribers
      this.notifySubscribers(notification);
      
      // Play sound if enabled
      if (this.config.enableSoundNotifications) {
        this.playNotificationSound();
      }
      
      // Show browser notification
      this.showBrowserNotification(notification);
    }
  }

  // Subscribe to real-time notifications
  subscribe(subscriber: NotificationSubscriber): () => void {
    this.subscribers.set(subscriber.id, subscriber);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber.id);
    };
  }

  // Notify all subscribers
  private notifySubscribers(notification: StaffNotification) {
    this.subscribers.forEach((subscriber) => {
      if (this.shouldNotifySubscriber(subscriber, notification)) {
        try {
          subscriber.callback(notification);
        } catch (error) {
          console.error('Error in notification subscriber callback:', error);
        }
      }
    });
  }

  // Check if subscriber should be notified based on filters
  private shouldNotifySubscriber(subscriber: NotificationSubscriber, notification: StaffNotification): boolean {
    const { filters } = subscriber;
    
    if (!filters) return true;
    
    if (filters.types && !filters.types.includes(notification.type)) {
      return false;
    }
    
    if (filters.priorities && !filters.priorities.includes(notification.priority)) {
      return false;
    }
    
    if (filters.staffIds && !filters.staffIds.includes(notification.staffId)) {
      return false;
    }
    
    return true;
  }

  // Play notification sound
  private playNotificationSound() {
    if (!this.audioContext || !this.notificationSound) return;
    
    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.notificationSound;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Show browser notification
  private showBrowserNotification(notification: StaffNotification) {
    if (!this.config.enablePushNotifications) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low',
        data: {
          notificationId: notification.id,
          actionUrl: notification.actionUrl
        }
      });

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click to navigate
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIHSUHVInYiGAaFwxlQwD8NUhmuLLyBSt1-NjpJI5bDNrxUo5oOjw' // Replace with your VAPID public key
        )
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription, userId: string) {
    // In a real implementation, send this to your backend
    console.log('Push subscription for user', userId, ':', subscription);
    
    // Store locally for demo purposes
    localStorage.setItem(`pushSubscription_${userId}`, JSON.stringify(subscription));
  }

  // Send notification through WebSocket
  sendNotification(notification: Omit<StaffNotification, 'id' | 'timestamp'>) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'send_notification',
        notification,
        timestamp: new Date().toISOString()
      }));
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<RealTimeNotificationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      hasWebSocketSupport: 'WebSocket' in window,
      hasPushSupport: 'serviceWorker' in navigator && 'PushManager' in window,
      hasNotificationSupport: 'Notification' in window,
      notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported'
    };
  }

  // Simulate real-time notifications for demo
  startSimulation(userId: string) {
    const simulationTypes: StaffNotification['type'][] = [
      'assignment', 'status_change', 'follow_up_due', 'proposal_request', 'urgent_query'
    ];
    
    const priorities: StaffNotification['priority'][] = ['low', 'normal', 'high', 'urgent'];
    
    const messages = [
      'New enquiry assigned to you',
      'Client has responded to proposal',
      'Follow-up reminder for pending enquiry',
      'Urgent: Client requesting immediate response',
      'Booking confirmation received',
      'Payment reminder due',
      'New message from client'
    ];

    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const notification: Omit<StaffNotification, 'id' | 'timestamp'> = {
          staffId: userId,
          queryId: `query_${Math.random().toString(36).substr(2, 9)}`,
          type: simulationTypes[Math.floor(Math.random() * simulationTypes.length)],
          title: 'New Activity',
          message: messages[Math.floor(Math.random() * messages.length)],
          read: false,
          actionRequired: Math.random() > 0.5,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          actionUrl: `/queries/demo-${Date.now()}`
        };

        this.handleIncomingNotification({
          type: 'notification',
          notification: {
            ...notification,
            id: `sim_${Date.now()}`,
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 10000);
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();