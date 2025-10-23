
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { sidebarItems } from '@/data/mockData';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';

// Import our new components
import SidebarSection from './sidebar/SidebarSection';
import UserProfile from './sidebar/UserProfile';
import SidebarLogo from './sidebar/SidebarLogo';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, isFullscreen } = useApp();
  const isMobile = useIsMobile();

  // Close sidebar on navigation if on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, setSidebarOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!sidebarOpen && isMobile) {
    return null;
  }

  return (
    <div className={cn(
      "h-screen border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800",
      "fixed lg:relative z-40", // Changed to relative on desktop to ensure proper layout
      sidebarOpen ? "w-64" : "w-0 lg:w-14",
      isFullscreen ? "top-0" : "",
      "transition-all duration-300 ease-in-out overflow-hidden"
    )}>
      {/* Logo and Close Button */}
      <SidebarLogo 
        sidebarOpen={sidebarOpen} 
        isMobile={isMobile} 
        onClose={closeSidebar} 
      />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5 no-scrollbar">
        <TooltipProvider>
          {sidebarItems.map((item, index) => (
            <SidebarSection key={index} section={item} sidebarOpen={sidebarOpen} />
          ))}
        </TooltipProvider>
      </div>

      {/* User profile */}
      <UserProfile sidebarOpen={sidebarOpen} />
    </div>
  );
};

export default Sidebar;
