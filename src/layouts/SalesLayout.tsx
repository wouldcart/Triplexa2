import React from 'react';
import { Outlet } from 'react-router-dom';
import { SalesNavigation } from '@/components/sales/SalesNavigation';
import Header from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const SalesLayout: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, isFullscreen } = useApp();

  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={cn(
      'flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden',
      isFullscreen && 'fixed inset-0 z-50'
    )}>
      {/* Collapsible Sales Navigation controlled by global sidebar state */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-14'
        )}
      >
        <SalesNavigation />
      </div>

      {/* Main content area with shared Header and scrollable content */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden min-w-0">
        <Header />
        <ScrollArea className={cn(
          'flex-1 h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-800',
          isFullscreen && 'h-[calc(100vh-64px)]'
        )}>
          <div className="p-2 sm:p-3 md:p-4 lg:p-6">
            <Outlet />
          </div>
        </ScrollArea>
      </div>

      {/* Mobile overlay when nav is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}
    </div>
  );
};

export default SalesLayout;