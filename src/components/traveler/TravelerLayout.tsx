
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import TravelerSidebar from './TravelerSidebar';
import SEOHead from '@/components/seo/SEOHead';

interface TravelerLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string[];
}

const TravelerLayout: React.FC<TravelerLayoutProps> = ({ 
  children, 
  title, 
  description, 
  keywords 
}) => {
  const isMobile = useIsMobile();
  const { settings } = useApplicationSettings();
  const { theme } = useTheme();

  // Determine which logo to show based on theme
  const currentLogo = theme === 'dark' && settings.darkLogo ? settings.darkLogo : settings.logo;

  return (
    <>
      <SEOHead 
        title={title}
        description={description}
        keywords={keywords}
      />
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-background">
          <TravelerSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Enhanced header with logo/app name */}
            <header className={`h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center sticky top-0 z-40 ${isMobile ? 'px-3' : 'px-4'}`}>
              <div className="flex items-center gap-3 flex-1">
                <SidebarTrigger className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground" />
                
                {/* Logo or App Name */}
                <div className="flex items-center gap-3">
                  {currentLogo ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={currentLogo} 
                        alt="Tour Manager"
                        className="logo-image h-8 w-auto object-contain"
                      />
                      <span className="text-lg font-semibold text-foreground hidden sm:block">
                        Tour Manager
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary-foreground text-sm">TM</span>
                      </div>
                      <span className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                        Tour Manager
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </header>
            
            {/* Main content */}
            <main className="flex-1 overflow-auto bg-background">
              <div className={`min-h-full ${isMobile ? 'p-3' : 'p-4 lg:p-6'}`}>
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default TravelerLayout;
