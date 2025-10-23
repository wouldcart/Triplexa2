import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Calendar, Users, Upload, 
  BookOpen, Settings, Home
} from 'lucide-react';

interface MobileBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  onTabChange,
  notificationCount = 0
}) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Home',
      icon: Home,
      shortLabel: 'Home'
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: FileText,
      shortLabel: 'Proposals'
    },
    {
      id: 'departures',
      label: 'Departures',
      icon: Calendar,
      shortLabel: 'Trips'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      shortLabel: 'Clients'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 border-t">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                {tab.id === 'proposals' && notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 truncate w-full text-center ${
                isActive ? 'font-medium text-primary' : ''
              }`}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNavigation;