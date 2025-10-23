
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import SEOHead from '@/components/seo/SEOHead';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string[];
  breadcrumbItems?: Array<{
    title: string;
    href: string;
  }>;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title,
  description,
  keywords,
  breadcrumbItems 
}) => {
  const { sidebarOpen, setSidebarOpen, isFullscreen } = useApp();

  // Create a proper handler function for the overlay click
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

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
        <Sidebar />
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden min-w-0",
          // Improved mobile responsiveness
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          <Header />
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
        {sidebarOpen && (
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
