
import { useMemo } from 'react';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { useAgentData } from '@/hooks/useAgentData';
import { useEnhancedStaffData } from '@/hooks/useEnhancedStaffData';
import { mockQueries } from '@/data/queryData';

export interface ManagerDashboardStats {
  totalStaff: number;
  activeQueries: number;
  totalHotels: number;
  revenue: string;
  pendingApprovals: number;
  activeAgents: number;
  completedBookings: number;
  conversionRate: number;
}

export interface QuickAction {
  title: string;
  description: string;
  path: string;
  count?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface ActivityItem {
  id: string;
  type: 'query' | 'booking' | 'staff' | 'system';
  message: string;
  user: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export const useManagerDashboardData = () => {
  const { hotels } = useSupabaseHotelsData();
  const { activeAgents, totalAgents } = useAgentData();
  const { enhancedStaffMembers } = useEnhancedStaffData();

  // Calculate real-time stats
  const stats: ManagerDashboardStats = useMemo(() => {
    const activeStaff = enhancedStaffMembers.filter(s => s.active);
    const activeQueriesList = mockQueries.filter(q => 
      q.status === 'new' || q.status === 'assigned' || q.status === 'in-progress'
    );
    const confirmedBookings = mockQueries.filter(q => 
      q.status === 'confirmed' || q.status === 'converted'
    );
    const pendingProposals = mockQueries.filter(q => q.status === 'proposal-sent');
    
    // Calculate revenue from confirmed bookings
    const totalRevenue = confirmedBookings.reduce((sum, query) => {
      const basePrice = query.packageType === 'luxury' ? 2000 : 
                       query.packageType === 'business' ? 1500 : 1000;
      return sum + (basePrice * query.paxDetails.adults * query.tripDuration.nights);
    }, 0);

    const conversionRate = mockQueries.length > 0 ? 
      (confirmedBookings.length / mockQueries.length) * 100 : 0;

    return {
      totalStaff: activeStaff.length,
      activeQueries: activeQueriesList.length,
      totalHotels: hotels.filter(h => h.status === 'active').length,
      revenue: `$${(totalRevenue / 1000).toFixed(0)}K`,
      pendingApprovals: pendingProposals.length + 5, // Include other approvals
      activeAgents: activeAgents.length,
      completedBookings: confirmedBookings.length,
      conversionRate: Math.round(conversionRate)
    };
  }, [hotels, activeAgents, enhancedStaffMembers]);

  // Generate quick actions with real counts
  const quickActions: QuickAction[] = useMemo(() => [
    {
      title: 'Assign Queries',
      description: 'Assign pending queries to staff',
      path: '/queries/assign',
      count: mockQueries.filter(q => q.status === 'new').length,
      priority: 'high'
    },
    {
      title: 'Staff Management',
      description: 'Manage employees and departments',
      path: '/management/staff',
      count: enhancedStaffMembers.length
    },
    {
      title: 'Proposal Management',
      description: 'Review and approve proposals',
      path: '/queries?status=proposal-sent',
      count: mockQueries.filter(q => q.status === 'proposal-sent').length,
      priority: 'medium'
    },
    {
      title: 'Agent Management',
      description: 'Manage travel agents',
      path: '/management/agents',
      count: totalAgents
    },
    {
      title: 'Booking Management',
      description: 'Monitor active bookings',
      path: '/bookings',
      count: mockQueries.filter(q => q.status === 'confirmed').length
    },
    {
      title: 'HR Dashboard',
      description: 'View HR analytics and reports',
      path: '/management/staff/hr-dashboard'
    }
  ], [enhancedStaffMembers, totalAgents]);

  // Generate recent activities from real data
  const recentActivities: ActivityItem[] = useMemo(() => {
    const activities: ActivityItem[] = [];
    
    // Add query-based activities
    mockQueries.slice(0, 3).forEach(query => {
      if (query.status === 'new') {
        activities.push({
          id: `query-${query.id}`,
          type: 'query',
          message: `New query received for ${query.destination.country}`,
          user: query.agentName,
          timestamp: query.createdAt.split('T')[0],
          priority: 'high'
        });
      } else if (query.status === 'confirmed') {
        activities.push({
          id: `booking-${query.id}`,
          type: 'booking',
          message: `Booking confirmed for ${query.destination.country}`,
          user: query.agentName,
          timestamp: query.createdAt.split('T')[0],
          priority: 'medium'
        });
      }
    });

    // Add staff activities
    enhancedStaffMembers.slice(0, 2).forEach(staff => {
      activities.push({
        id: `staff-${staff.id}`,
        type: 'staff',
        message: `${staff.name} ${staff.active ? 'logged in' : 'went offline'}`,
        user: staff.name,
        timestamp: new Date().toISOString().split('T')[0],
        priority: 'low'
      });
    });

    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 6);
  }, [enhancedStaffMembers]);

  return {
    stats,
    quickActions,
    recentActivities,
    isLoading: false
  };
};
