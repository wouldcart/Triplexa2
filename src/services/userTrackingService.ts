import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types/User';

export interface UserTrackingData {
  createdBy?: string;
  updatedBy?: string;
  createdByUser?: string;  // Database field name
  updatedByUser?: string;  // Database field name
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export class UserTrackingService {
  private static instance: UserTrackingService;
  private currentUser: User | null = null;

  static getInstance(): UserTrackingService {
    if (!UserTrackingService.instance) {
      UserTrackingService.instance = new UserTrackingService();
    }
    return UserTrackingService.instance;
  }

  /**
   * Set the current user for tracking purposes
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user ID for database operations
   */
  getCurrentUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Get user tracking data for creating new records
   */
  getCreateTrackingData(): UserTrackingData {
    const userId = this.getCurrentUserId();
    const now = new Date().toISOString();

    return {
      createdBy: userId || undefined,
      updatedBy: userId || undefined,
      createdByUser: userId || undefined,
      updatedByUser: userId || undefined,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Get user tracking data for updating existing records
   */
  getUpdateTrackingData(): UserTrackingData {
    const userId = this.getCurrentUserId();
    const now = new Date().toISOString();

    return {
      updatedBy: userId || undefined,
      updatedByUser: userId || undefined,
      updatedAt: now
    };
  }

  /**
   * Get user information by ID from the database
   */
  async getUserInfo(userId: string): Promise<UserInfo | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, department')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn(`Failed to fetch user info for ${userId}:`, error);
        return null;
      }

      return {
        id: data.id,
        name: data.name || 'Unknown User',
        email: data.email || '',
        role: data.role || 'user',
        department: data.department || 'General'
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Get multiple users' information by IDs
   */
  async getUsersInfo(userIds: string[]): Promise<Record<string, UserInfo>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, department')
        .in('id', userIds);

      if (error || !data) {
        console.warn('Failed to fetch users info:', error);
        return {};
      }

      const usersMap: Record<string, UserInfo> = {};
      data.forEach(user => {
        usersMap[user.id] = {
          id: user.id,
          name: user.name || 'Unknown User',
          email: user.email || '',
          role: user.role || 'user',
          department: user.department || 'General'
        };
      });

      return usersMap;
    } catch (error) {
      console.error('Error fetching users info:', error);
      return {};
    }
  }

  /**
   * Format user display name
   */
  formatUserDisplay(userInfo: UserInfo | null): string {
    if (!userInfo) return 'Unknown User';
    return `${userInfo.name} (${userInfo.role})`;
  }

  /**
   * Format user display with department
   */
  formatUserDisplayWithDepartment(userInfo: UserInfo | null): string {
    if (!userInfo) return 'Unknown User';
    return `${userInfo.name} - ${userInfo.department} (${userInfo.role})`;
  }

  /**
   * Check if current user can edit a record based on creation/ownership
   */
  canEditRecord(recordCreatedBy?: string): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;

    // Super admin can edit anything
    if (this.currentUser?.role === 'super_admin') return true;

    // Managers can edit records in their department
    if (this.currentUser?.role === 'manager') return true;

    // Users can edit their own records
    return recordCreatedBy === currentUserId;
  }

  /**
   * Check if current user can delete a record
   */
  canDeleteRecord(recordCreatedBy?: string): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;

    // Super admin can delete anything
    if (this.currentUser?.role === 'super_admin') return true;

    // Managers can delete records in their department
    if (this.currentUser?.role === 'manager') return true;

    // Regular users cannot delete records (even their own)
    return false;
  }

  /**
   * Get audit trail for a record
   */
  async getAuditTrail(tableName: string, recordId: string): Promise<any[]> {
    try {
      // This would require an audit log table to be implemented
      // For now, return empty array
      console.log(`Audit trail requested for ${tableName}:${recordId}`);
      return [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }

  /**
   * Log an action for audit purposes
   */
  async logAction(action: string, tableName: string, recordId: string, details?: any): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      // This would log to an audit table
      console.log('Action logged:', {
        userId,
        action,
        tableName,
        recordId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }
}

// Export singleton instance
export const userTrackingService = UserTrackingService.getInstance();