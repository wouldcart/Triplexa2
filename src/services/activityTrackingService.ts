export interface ActivityEvent {
  id: string;
  staffId: string;
  timestamp: string;
  type: 'page_view' | 'action' | 'idle' | 'active' | 'break' | 'login' | 'logout';
  details: {
    page?: string;
    action?: string;
    duration?: number;
    url?: string;
    element?: string;
    coordinates?: { x: number; y: number };
  };
}

export interface ProductivityMetrics {
  totalActiveTime: number;
  totalIdleTime: number;
  pageViews: number;
  actionsPerformed: number;
  averageSessionDuration: number;
  productivityScore: number;
  breakTime: number;
  focusTime: number;
  mostVisitedPages: Array<{ page: string; count: number; duration: number }>;
  hourlyActivity: Array<{ hour: number; activity: number }>;
}

export class ActivityTrackingService {
  private idleTimer: NodeJS.Timeout | null = null;
  private isTracking = false;
  private currentStaffId: string | null = null;
  private lastActivity: Date = new Date();
  private idleThreshold = 5 * 60 * 1000; // 5 minutes
  private currentSession: string | null = null;
  private activities: ActivityEvent[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadActivities();
  }

  private loadActivities(): void {
    try {
      const stored = localStorage.getItem('activity_tracking_data');
      if (stored) {
        this.activities = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      this.activities = [];
    }
  }

  private saveActivities(): void {
    try {
      localStorage.setItem('activity_tracking_data', JSON.stringify(this.activities));
    } catch (error) {
      console.error('Error saving activity data:', error);
    }
  }

  startTracking(staffId: string): void {
    if (this.isTracking) {
      this.stopTracking();
    }

    this.isTracking = true;
    this.currentStaffId = staffId;
    this.currentSession = `session_${Date.now()}`;
    this.lastActivity = new Date();

    // Record login activity
    this.recordActivity(staffId, {
      type: 'login',
      details: {
        page: window.location.pathname,
        url: window.location.href
      }
    });

    // Set up activity listeners
    this.setupActivityListeners();
    this.startIdleMonitoring();

    console.log(`Activity tracking started for staff: ${staffId}`);
  }

  stopTracking(): void {
    if (!this.isTracking || !this.currentStaffId) return;

    // Record logout activity
    this.recordActivity(this.currentStaffId, {
      type: 'logout',
      details: {
        page: window.location.pathname,
        duration: Date.now() - new Date(this.lastActivity).getTime()
      }
    });

    this.isTracking = false;
    this.removeActivityListeners();
    this.stopIdleMonitoring();
    this.currentStaffId = null;
    this.currentSession = null;

    console.log('Activity tracking stopped');
  }

  private setupActivityListeners(): void {
    // Mouse movement tracking
    const handleMouseMove = (event: MouseEvent) => {
      this.updateLastActivity();
      this.recordActivity(this.currentStaffId!, {
        type: 'active',
        details: {
          action: 'mouse_move',
          coordinates: { x: event.clientX, y: event.clientY },
          page: window.location.pathname
        }
      });
    };

    // Keyboard activity tracking
    const handleKeyPress = (event: KeyboardEvent) => {
      this.updateLastActivity();
      this.recordActivity(this.currentStaffId!, {
        type: 'active',
        details: {
          action: 'key_press',
          element: (event.target as HTMLElement)?.tagName || 'unknown',
          page: window.location.pathname
        }
      });
    };

    // Click tracking
    const handleClick = (event: MouseEvent) => {
      this.updateLastActivity();
      const target = event.target as HTMLElement;
      this.recordActivity(this.currentStaffId!, {
        type: 'action',
        details: {
          action: 'click',
          element: target.tagName,
          coordinates: { x: event.clientX, y: event.clientY },
          page: window.location.pathname
        }
      });
    };

    // Page navigation tracking
    const handlePageChange = () => {
      this.recordActivity(this.currentStaffId!, {
        type: 'page_view',
        details: {
          page: window.location.pathname,
          url: window.location.href
        }
      });
    };

    // Scroll tracking
    const handleScroll = () => {
      this.updateLastActivity();
      this.recordActivity(this.currentStaffId!, {
        type: 'active',
        details: {
          action: 'scroll',
          page: window.location.pathname
        }
      });
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('keypress', handleKeyPress, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('popstate', handlePageChange);

    // Store listeners for cleanup
    this.listeners = [
      () => document.removeEventListener('mousemove', handleMouseMove),
      () => document.removeEventListener('keypress', handleKeyPress),
      () => document.removeEventListener('click', handleClick),
      () => document.removeEventListener('scroll', handleScroll),
      () => window.removeEventListener('popstate', handlePageChange)
    ];

    // Track initial page view
    handlePageChange();
  }

  private removeActivityListeners(): void {
    this.listeners.forEach(removeListener => removeListener());
    this.listeners = [];
  }

  private updateLastActivity(): void {
    this.lastActivity = new Date();
    
    // Reset idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.startIdleMonitoring();
  }

  private startIdleMonitoring(): void {
    this.idleTimer = setTimeout(() => {
      if (this.isTracking && this.currentStaffId) {
        this.recordActivity(this.currentStaffId, {
          type: 'idle',
          details: {
            duration: this.idleThreshold,
            page: window.location.pathname
          }
        });
      }
    }, this.idleThreshold);
  }

  private stopIdleMonitoring(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  recordActivity(staffId: string, activity: Partial<ActivityEvent>): void {
    if (!this.isTracking && activity.type !== 'login' && activity.type !== 'logout') {
      return;
    }

    const activityEvent: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      staffId,
      timestamp: new Date().toISOString(),
      type: activity.type || 'action',
      details: activity.details || {}
    };

    this.activities.push(activityEvent);
    this.saveActivities();

    // Limit stored activities to prevent memory issues
    if (this.activities.length > 10000) {
      this.activities = this.activities.slice(-5000);
      this.saveActivities();
    }
  }

  recordBreak(staffId: string, duration: number): void {
    this.recordActivity(staffId, {
      type: 'break',
      details: {
        duration,
        page: window.location.pathname
      }
    });
  }

  getActivities(staffId: string, dateRange?: [Date, Date]): ActivityEvent[] {
    let filtered = this.activities.filter(activity => activity.staffId === staffId);

    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= start && activityDate <= end;
      });
    }

    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  generateProductivityReport(staffId: string, dateRange: [Date, Date]): ProductivityMetrics {
    const activities = this.getActivities(staffId, dateRange);
    
    if (activities.length === 0) {
      return {
        totalActiveTime: 0,
        totalIdleTime: 0,
        pageViews: 0,
        actionsPerformed: 0,
        averageSessionDuration: 0,
        productivityScore: 0,
        breakTime: 0,
        focusTime: 0,
        mostVisitedPages: [],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({ hour: i, activity: 0 }))
      };
    }

    // Calculate metrics
    const activeActivities = activities.filter(a => a.type === 'active' || a.type === 'action');
    const idleActivities = activities.filter(a => a.type === 'idle');
    const pageViews = activities.filter(a => a.type === 'page_view');
    const breakActivities = activities.filter(a => a.type === 'break');

    const totalActiveTime = activeActivities.length * 1000; // Approximate active time
    const totalIdleTime = idleActivities.reduce((sum, activity) => 
      sum + (activity.details.duration || 0), 0);
    const breakTime = breakActivities.reduce((sum, activity) => 
      sum + (activity.details.duration || 0), 0);

    // Calculate page visit statistics
    const pageStats = new Map<string, { count: number; duration: number }>();
    pageViews.forEach(activity => {
      const page = activity.details.page || 'unknown';
      const current = pageStats.get(page) || { count: 0, duration: 0 };
      pageStats.set(page, {
        count: current.count + 1,
        duration: current.duration + 60000 // Approximate 1 minute per page view
      });
    });

    const mostVisitedPages = Array.from(pageStats.entries())
      .map(([page, stats]) => ({ page, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate hourly activity
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourActivities = activities.filter(activity => {
        const activityHour = new Date(activity.timestamp).getHours();
        return activityHour === hour;
      });
      return { hour, activity: hourActivities.length };
    });

    // Calculate productivity score (0-100)
    const totalTime = totalActiveTime + totalIdleTime;
    const productivityScore = totalTime > 0 
      ? Math.round((totalActiveTime / totalTime) * 100) 
      : 0;

    // Calculate focus time (active time without breaks)
    const focusTime = Math.max(0, totalActiveTime - breakTime);

    // Calculate average session duration
    const sessions = this.groupActivitiesBySessions(activities);
    const averageSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length
      : 0;

    return {
      totalActiveTime,
      totalIdleTime,
      pageViews: pageViews.length,
      actionsPerformed: activeActivities.length,
      averageSessionDuration,
      productivityScore,
      breakTime,
      focusTime,
      mostVisitedPages,
      hourlyActivity
    };
  }

  private groupActivitiesBySessions(activities: ActivityEvent[]): Array<{ start: Date; end: Date; duration: number }> {
    const sessions: Array<{ start: Date; end: Date; duration: number }> = [];
    let currentSession: { start: Date; end: Date } | null = null;

    activities.forEach(activity => {
      const activityTime = new Date(activity.timestamp);

      if (activity.type === 'login' || !currentSession) {
        currentSession = { start: activityTime, end: activityTime };
      } else if (activity.type === 'logout') {
        if (currentSession) {
          sessions.push({
            ...currentSession,
            end: activityTime,
            duration: activityTime.getTime() - currentSession.start.getTime()
          });
          currentSession = null;
        }
      } else {
        if (currentSession) {
          currentSession.end = activityTime;
        }
      }
    });

    // Handle unclosed sessions
    if (currentSession) {
      sessions.push({
        ...currentSession,
        duration: currentSession.end.getTime() - currentSession.start.getTime()
      });
    }

    return sessions;
  }

  getDailyProductivityTrend(staffId: string, days: number = 30): Array<{ date: string; score: number }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const trend: Array<{ date: string; score: number }> = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMetrics = this.generateProductivityReport(staffId, [dayStart, dayEnd]);
      trend.push({
        date: d.toISOString().split('T')[0],
        score: dayMetrics.productivityScore
      });
    }

    return trend;
  }

  clearActivityData(staffId?: string): void {
    if (staffId) {
      this.activities = this.activities.filter(activity => activity.staffId !== staffId);
    } else {
      this.activities = [];
    }
    this.saveActivities();
  }

  exportActivityData(staffId: string, dateRange?: [Date, Date]): string {
    const activities = this.getActivities(staffId, dateRange);
    return JSON.stringify(activities, null, 2);
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  getCurrentStaffId(): string | null {
    return this.currentStaffId;
  }
}

// Singleton instance
export const activityTracker = new ActivityTrackingService();