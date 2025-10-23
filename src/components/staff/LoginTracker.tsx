
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Activity } from 'lucide-react';
import { 
  getActiveStaffSessions, 
  getStaffLoginHistory, 
  recordStaffLogin, 
  recordStaffLogout,
  isStaffCurrentlyActive,
  getTotalWorkingHours,
  ActiveSession,
  LoginRecord 
} from '@/services/loginRecordService';
import { format } from 'date-fns';

interface LoginTrackerProps {
  staffId: string;
  staffName: string;
  onStatusChange?: (isActive: boolean) => void;
}

const LoginTracker: React.FC<LoginTrackerProps> = ({ 
  staffId, 
  staffName, 
  onStatusChange 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [todayHours, setTodayHours] = useState(0);

  useEffect(() => {
    checkActiveStatus();
    loadLoginHistory();
    calculateTodayHours();
    
    // Update activity every minute
    const interval = setInterval(() => {
      checkActiveStatus();
      calculateTodayHours();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [staffId]);

  const checkActiveStatus = () => {
    const active = isStaffCurrentlyActive(staffId);
    setIsActive(active);
    setActiveSessions(getActiveStaffSessions());
    onStatusChange?.(active);
  };

  const loadLoginHistory = () => {
    const history = getStaffLoginHistory(staffId, 7); // Last 7 days
    setLoginHistory(history);
  };

  const calculateTodayHours = () => {
    const today = new Date().toISOString().split('T')[0];
    const hours = getTotalWorkingHours(staffId, today);
    setTodayHours(hours);
  };

  const handleLogin = () => {
    recordStaffLogin(staffId, staffName);
    checkActiveStatus();
    loadLoginHistory();
  };

  const handleLogout = () => {
    recordStaffLogout(staffId);
    checkActiveStatus();
    loadLoginHistory();
    calculateTodayHours();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const currentSession = activeSessions.find(s => s.staffId === staffId);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Clock className="h-5 w-5" />
          Login & Working Hours Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {isActive ? 'Currently Active' : 'Logged Out'}
              </div>
              {currentSession && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Logged in at {format(new Date(currentSession.loginTime), 'HH:mm')}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={handleLogin} size="sm" className="bg-green-600 hover:bg-green-700">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            ) : (
              <Button onClick={handleLogout} size="sm" variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Today's Working Hours */}
        <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Today's Hours</span>
          </div>
          <Badge variant="secondary">
            {formatDuration(todayHours)}
          </Badge>
        </div>

        {/* Recent Login History */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recent Login History</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {loginHistory.length > 0 ? (
              loginHistory.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-2 text-sm border border-gray-200 dark:border-gray-600 rounded">
                  <div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {format(new Date(record.loginTime), 'MMM dd, HH:mm')}
                    </div>
                    {record.logoutTime && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        Logout: {format(new Date(record.logoutTime), 'HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
                      {record.status === 'active' ? 'Active' : 'Completed'}
                    </Badge>
                    {record.duration && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDuration(record.duration)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No login history available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginTracker;
