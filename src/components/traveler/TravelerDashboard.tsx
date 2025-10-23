
import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useTravelerData } from '@/hooks/useTravelerData';
import { useIsMobile } from '@/hooks/use-mobile';
import TripSummaryCard from './TripSummaryCard';
import TodayActivities from './TodayActivities';
import QuickActions from './QuickActions';
import AgentDetails from './AgentDetails';
import { Sun, Moon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const TravelerDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const isMobile = useIsMobile();
  const {
    currentTrip,
    todayActivities,
    tripProgress,
    completedActivitiesCount,
    totalActivitiesCount,
    unreadNotificationsCount
  } = useTravelerData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
    if (hour < 17) return <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />;
    return <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
        {getGreetingIcon()}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
            {getGreeting()}, {currentUser?.name || 'Traveler'}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome to your travel dashboard
          </p>
        </div>
      </div>

      <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'col-span-1' : 'lg:col-span-2'}`}>
          {/* Current Trip Summary */}
          {currentTrip ? (
            <TripSummaryCard
              trip={currentTrip}
              progress={tripProgress}
              completedActivities={completedActivitiesCount}
              totalActivities={totalActivitiesCount}
            />
          ) : (
            <div className="bg-card rounded-lg shadow-sm border p-6 sm:p-8 text-center">
              <div className="text-3xl sm:text-4xl mb-4">✈️</div>
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2">
                No Active Trip
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                You don't have any active trips at the moment.
              </p>
              <Link
                to="/traveler/history"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
              >
                View Trip History
              </Link>
            </div>
          )}

          {/* Today's Activities */}
          <TodayActivities activities={todayActivities} />
        </div>

        <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'col-span-1' : 'col-span-1'}`}>
          {/* Agent Details */}
          {currentTrip?.agentDetails && (
            <AgentDetails agent={currentTrip.agentDetails} />
          )}

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default TravelerDashboard;
