
import React, { useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import QueriesTable from '@/components/dashboard/QueriesTable';
import TaskList from '@/components/dashboard/TaskList';
import AlertsList from '@/components/dashboard/AlertsList';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
import CurrentActivities from '@/components/dashboard/CurrentActivities';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSalesEnquiries } from '@/hooks/useSalesEnquiries';
import { useSalesBookings } from '@/hooks/useSalesBookings';
import { metrics, recentQueries, currentActivities, upcomingTasks, alerts, upcomingBookings } from '@/data/mockData';

const Dashboard: React.FC = () => {
  const isMobile = useIsMobile();
  // Keep the hooks for future integration but use mock data for now
  const { stats, loading } = useDashboardData();
  
  // Create mock Alert format for compatibility
  const formattedAlerts = alerts.map(alert => ({
    ...alert,
    timestamp: alert.timestamp
  }));
  
  useEffect(() => {
    console.log('Dashboard component mounted with data');
    console.log('Stats:', stats);
    console.log('Mock data loaded');
  }, [stats]);

  // Wrap each section in error boundaries to isolate issues
  const renderSafely = (component: React.ReactNode, name: string) => {
    try {
      return component;
    } catch (error) {
      console.error(`Error rendering ${name}:`, error);
      return <div className="p-2 text-red-500">Error loading {name}</div>;
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-4 md:p-6 max-w-full">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Dashboard - Tour Management System"
      description="Comprehensive dashboard for managing tours, bookings, queries, and business analytics. Monitor key metrics, track activities, and manage your travel business efficiently."
      keywords={['dashboard', 'tour management', 'travel business', 'bookings', 'analytics', 'metrics']}
    >
      <div className="p-4 md:p-6 max-w-full">
        {/* Metrics Row - Improved responsiveness for smaller screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          {metrics.map((metric, index) => 
            renderSafely(
              <MetricCard key={index} metric={metric} />,
              `MetricCard-${index}`
            )
          )}
        </div>
        
        {/* Current Activities - Optimized spacing */}
        <div className="mb-4 md:mb-6">
          {renderSafely(
            <CurrentActivities activities={currentActivities} />, 
            'CurrentActivities'
          )}
        </div>
        
        {/* Main Content - Improved grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Column - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-4">
            {renderSafely(<QueriesTable queries={recentQueries} />, "QueriesTable")}
            {renderSafely(<UpcomingBookings bookings={upcomingBookings} />, "UpcomingBookings")}
          </div>
          
          {/* Side Column - 1/3 width on desktop */}
          <div className="space-y-4">
            {renderSafely(<TaskList tasks={upcomingTasks} />, "TaskList")}
            {renderSafely(<AlertsList alerts={formattedAlerts} />, "AlertsList")}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
