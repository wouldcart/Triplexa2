
import { StaffNotification, NotificationPreferences, Query } from '@/types/query';

class StaffNotificationService {
  private notifications: StaffNotification[] = [];
  private preferences: Map<string, NotificationPreferences> = new Map();
  private notificationId = 1;

  // Generate a new notification ID
  private generateId(): string {
    return `notification_${this.notificationId++}_${Date.now()}`;
  }

  // Create a new notification
  createNotification(notification: Omit<StaffNotification, 'id' | 'timestamp'>): StaffNotification {
    const newNotification: StaffNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    return newNotification;
  }

  // Get notifications for a specific staff member
  async getNotificationsForStaff(staffId: string): Promise<StaffNotification[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.notifications
      .filter(n => n.staffId === staffId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    this.notifications.forEach(notification => {
      if (notificationIds.includes(notification.id)) {
        notification.read = true;
      }
    });
  }

  // Dismiss a notification
  async dismissNotification(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  // Get user notification preferences
  async getPreferences(staffId: string): Promise<NotificationPreferences> {
    let userPreferences = this.preferences.get(staffId);
    
    if (!userPreferences) {
      // Create default preferences
      userPreferences = {
        staffId,
        browserNotifications: true,
        emailNotifications: true,
        assignments: true,
        statusUpdates: true,
        followUpReminders: true,
        urgentOnly: false
      };
      this.preferences.set(staffId, userPreferences);
    }
    
    return userPreferences;
  }

  // Update user notification preferences
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    this.preferences.set(preferences.staffId, preferences);
  }

  // Show browser notification
  showBrowserNotification(notification: StaffNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low'
      });

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click to navigate to query
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    }
  }

  // Simulate email notification
  async sendEmailNotification(notification: StaffNotification, recipientEmail: string): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('📧 Email Notification Sent:', {
      to: recipientEmail,
      subject: notification.title,
      body: notification.message,
      priority: notification.priority,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, this would integrate with an email service
    // like SendGrid, AWS SES, or similar
  }

  // Create assignment notification with enhanced content
  createAssignmentNotification(query: Query, staffId: string, assignerName: string): StaffNotification {
    const priority = this.calculatePriority(query);
    const urgencyText = priority === 'urgent' ? ' [URGENT]' : '';
    
    const notification: Omit<StaffNotification, 'id' | 'timestamp'> = {
      staffId,
      queryId: query.id,
      type: 'assignment',
      title: `New Enquiry Assigned${urgencyText}`,
      message: `You have been assigned enquiry ${query.id} for ${query.destination.country} by ${assignerName}. Travel dates: ${new Date(query.travelDates.from).toLocaleDateString()} - ${new Date(query.travelDates.to).toLocaleDateString()}`,
      read: false,
      actionRequired: true,
      priority,
      actionUrl: `/queries/${query.id}`
    };

    return this.createNotification(notification);
  }

  // Create status change notification
  createStatusChangeNotification(query: Query, staffId: string, oldStatus: string, newStatus: string): StaffNotification {
    const notification: Omit<StaffNotification, 'id' | 'timestamp'> = {
      staffId,
      queryId: query.id,
      type: 'status_change',
      title: 'Enquiry Status Updated',
      message: `Enquiry ${query.id} status changed from ${oldStatus} to ${newStatus}`,
      read: false,
      actionRequired: newStatus === 'proposal-sent',
      priority: newStatus === 'cancelled' ? 'high' : 'normal',
      actionUrl: `/queries/${query.id}`
    };

    return this.createNotification(notification);
  }

  // Create follow-up reminder notification
  createFollowUpReminder(query: Query, staffId: string): StaffNotification {
    const notification: Omit<StaffNotification, 'id' | 'timestamp'> = {
      staffId,
      queryId: query.id,
      type: 'follow_up_due',
      title: 'Follow-up Due',
      message: `Follow-up required for enquiry ${query.id} - ${query.destination.country}`,
      read: false,
      actionRequired: true,
      priority: 'high',
      actionUrl: `/queries/${query.id}`
    };

    return this.createNotification(notification);
  }

  // Create urgent query notification
  createUrgentQueryNotification(query: Query, staffId: string, reason: string): StaffNotification {
    const notification: Omit<StaffNotification, 'id' | 'timestamp'> = {
      staffId,
      queryId: query.id,
      type: 'urgent_query',
      title: '🚨 URGENT: Immediate Action Required',
      message: `Enquiry ${query.id} requires immediate attention: ${reason}`,
      read: false,
      actionRequired: true,
      priority: 'urgent',
      actionUrl: `/queries/${query.id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    return this.createNotification(notification);
  }

  // Calculate notification priority based on query details
  private calculatePriority(query: Query): 'low' | 'normal' | 'high' | 'urgent' {
    const travelDate = new Date(query.travelDates.from);
    const daysUntilTravel = Math.floor((travelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;

    // Urgent: Travel within 7 days
    if (daysUntilTravel <= 7) return 'urgent';
    
    // High: Luxury packages, large groups, or travel within 30 days
    if (query.packageType === 'luxury' || totalPax >= 8 || daysUntilTravel <= 30) return 'high';
    
    // Normal: Standard enquiries
    if (totalPax >= 4 || daysUntilTravel <= 60) return 'normal';
    
    // Low: Small groups with distant travel dates
    return 'low';
  }

  // Process notification with preferences
  async processNotification(notification: StaffNotification, recipientEmail?: string): Promise<void> {
    const preferences = await this.getPreferences(notification.staffId);
    
    // Check if notification should be sent based on preferences
    if (preferences.urgentOnly && notification.priority !== 'urgent') {
      return;
    }

    // Check notification type preferences
    const typeEnabled = this.isNotificationTypeEnabled(notification.type, preferences);
    if (!typeEnabled) {
      return;
    }

    // Send browser notification
    if (preferences.browserNotifications) {
      this.showBrowserNotification(notification);
    }

    // Send email notification
    if (preferences.emailNotifications && recipientEmail) {
      await this.sendEmailNotification(notification, recipientEmail);
    }
  }

  // Check if notification type is enabled
  private isNotificationTypeEnabled(type: StaffNotification['type'], preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'assignment':
        return preferences.assignments;
      case 'status_change':
        return preferences.statusUpdates;
      case 'follow_up_due':
        return preferences.followUpReminders;
      case 'proposal_request':
      case 'urgent_query':
        return true; // Always enabled for critical notifications
      default:
        return true;
    }
  }

  // Get notification count by priority
  getNotificationCountByPriority(notifications: StaffNotification[]): Record<string, number> {
    return notifications.reduce((counts, notification) => {
      counts[notification.priority] = (counts[notification.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  // Clean up expired notifications
  cleanupExpiredNotifications(): void {
    const now = new Date().getTime();
    this.notifications = this.notifications.filter(notification => {
      if (notification.expiresAt) {
        return new Date(notification.expiresAt).getTime() > now;
      }
      return true;
    });
  }

  // Get notification statistics
  getNotificationStats(staffId: string): {
    total: number;
    unread: number;
    urgent: number;
    highPriority: number;
    actionRequired: number;
  } {
    const staffNotifications = this.notifications.filter(n => n.staffId === staffId);
    
    return {
      total: staffNotifications.length,
      unread: staffNotifications.filter(n => !n.read).length,
      urgent: staffNotifications.filter(n => n.priority === 'urgent').length,
      highPriority: staffNotifications.filter(n => n.priority === 'high').length,
      actionRequired: staffNotifications.filter(n => n.actionRequired && !n.read).length
    };
  }
}

export const staffNotificationService = new StaffNotificationService();
