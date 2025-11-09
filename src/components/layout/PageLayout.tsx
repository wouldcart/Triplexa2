
import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import SEOHead from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { updateStaffActivity } from '@/services/loginRecordService';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string[];
  breadcrumbItems?: Array<{
    title: string;
    href: string;
  }>;
  hideGlobalSidebar?: boolean;
  headerVariant?: 'default' | 'hr';
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title,
  description,
  keywords,
  breadcrumbItems,
  hideGlobalSidebar = false,
  headerVariant = 'default'
}) => {
  const { sidebarOpen, setSidebarOpen, isFullscreen } = useApp();
  const { user } = useAuth();

  // Create a proper handler function for the overlay click
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  // Lightweight heartbeat to update staff activity every minute
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    const staffId = user.id;

    // Immediately send one heartbeat on mount
    try {
      updateStaffActivity(staffId);
    } catch {}

    const interval = setInterval(() => {
      try {
        updateStaffActivity(staffId);
      } catch {}
    }, 60 * 1000); // every 60 seconds

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  return (
    <>
      <SEOHead 
        title={title}
        description={description}
        keywords={keywords}
      />
      <div className={cn(
        "flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden",
        isFullscreen && "fixed inset-0 z-50"
      )}>
        {!hideGlobalSidebar && <Sidebar />}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden min-w-0",
          // Improved mobile responsiveness
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          <Header variant={headerVariant} />
          <ScrollArea className={cn(
            "flex-1 h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-800",
            isFullscreen && "h-[calc(100vh-64px)]"
          )}>
            <div className="p-2 sm:p-3 md:p-4 lg:p-6">
              {children}
            </div>
          </ScrollArea>
        </div>
        {/* Overlay for mobile */}
        {sidebarOpen && !hideGlobalSidebar && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden" 
            onClick={handleOverlayClick}
          />
        )}
      </div>
    </>
  );
};

export default PageLayout;
