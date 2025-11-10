import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface UserProfileProps {
  sidebarOpen: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ sidebarOpen }) => {
  const { currentUser } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'agent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (sidebarOpen) {
    return (
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
          {/* Left: Avatar (links to profile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleProfileClick}
            className="h-8 w-8 p-0 relative rounded-full"
            title="View Profile"
            aria-label="View Profile"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser?.name || 'User'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {currentUser?.status === 'active' && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
            )}
          </Button>

          {/* Middle: Name, Email, Role */}
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {currentUser?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentUser?.email || 'user@example.com'}
            </p>
            {currentUser?.role && (
              <Badge className={`text-[10px] mt-0.5 px-1 py-0 ${getRoleColor(currentUser.role)}`}>
                {formatRole(currentUser.role)}
              </Badge>
            )}
          </div>

          {/* Right: Logout icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1.5 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center space-y-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleProfileClick}
        className="h-7 w-7 relative"
        title={`${currentUser?.name || 'User'} - ${formatRole(currentUser?.role || 'user')}`}
      >
        <div className="h-5 w-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
          {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        title="Logout"
      >
        <LogOut className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default UserProfile;
