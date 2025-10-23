import { useMemo } from 'react';
import { 
  mockTravelerTrips, 
  mockTripActivities, 
  mockTravelerNotifications,
  getCurrentTrip,
  getActivitiesForTrip,
  getTodayActivities
} from '@/data/mockTravelerData';
import { TravelerTrip, TripActivity, TravelerNotification, TodayActivity } from '@/types/travelerTypes';

export const useTravelerData = () => {
  // Get current trip
  const currentTrip = useMemo(() => getCurrentTrip(), []);
  
  // Get activities for current trip
  const currentTripActivities = useMemo(() => {
    if (!currentTrip) return [];
    return getActivitiesForTrip(currentTrip.id);
  }, [currentTrip]);

  // Get today's activities
  const todayActivities = useMemo(() => {
    return getTodayActivities(currentTripActivities);
  }, [currentTripActivities]);

  // Get upcoming activities (next 3 days)
  const upcomingActivities = useMemo(() => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return currentTripActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= today && activityDate <= threeDaysFromNow;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentTripActivities]);

  // Get trip history (completed trips)
  const tripHistory = useMemo(() => {
    return mockTravelerTrips.filter(trip => trip.status === 'completed');
  }, []);

  // Get unread notifications count
  const unreadNotificationsCount = useMemo(() => {
    return mockTravelerNotifications.filter(notif => !notif.isRead).length;
  }, []);

  // Get notifications requiring action
  const actionRequiredNotifications = useMemo(() => {
    return mockTravelerNotifications.filter(notif => notif.actionRequired && !notif.isRead);
  }, []);

  // Get trip progress percentage
  const tripProgress = useMemo(() => {
    if (!currentTrip) return 0;
    
    const tripStart = new Date(currentTrip.startDate);
    const tripEnd = new Date(currentTrip.endDate);
    const now = new Date();
    
    if (now < tripStart) return 0;
    if (now > tripEnd) return 100;
    
    const totalDuration = tripEnd.getTime() - tripStart.getTime();
    const elapsed = now.getTime() - tripStart.getTime();
    
    return Math.round((elapsed / totalDuration) * 100);
  }, [currentTrip]);

  // Get completed activities count for current trip
  const completedActivitiesCount = useMemo(() => {
    return currentTripActivities.filter(activity => activity.status === 'completed').length;
  }, [currentTripActivities]);

  return {
    currentTrip,
    currentTripActivities,
    todayActivities,
    upcomingActivities,
    tripHistory,
    notifications: mockTravelerNotifications,
    unreadNotificationsCount,
    actionRequiredNotifications,
    tripProgress,
    completedActivitiesCount,
    totalActivitiesCount: currentTripActivities.length,
    isLoading: false
  };
};